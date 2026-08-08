"""LLM-powered interview orchestration with RAG context."""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

from google import genai
from google.genai import types

from app.agent.errors import (
    LLMAuthError,
    LLMNotConfiguredError,
    LLMRateLimitError,
    LLMResponseError,
    LLMUnavailableError,
    RetrievalUnavailableError,
    SessionNotFoundError,
)
from app.agent.planner import plan_interview_days
from app.agent.session import InterviewSession, session_store
from app.config import settings
from app.rag.retriever import PersonalizedRetriever

logger = logging.getLogger(__name__)

MAX_LLM_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 1.5

# Stops a runaway interview if the model never chooses to conclude.
HARD_QUESTION_CAP = 16


SYSTEM_PROMPT = """You are a senior AI engineering interviewer for the AI Cohort (31 days, 8 modules).

Goals:
- Run a realistic technical interview (not a quiz script).
- Assess understanding of concepts the candidate completed.
- Ask intelligent follow-ups based on their answers.
- Cover at least {min_days} different curriculum days and ask at least {min_questions} questions before ending.
- Stay conversational, concise, and professional.

Rules:
1. Use the retrieved curriculum context and candidate mission history.
2. Prefer depth on high-attempt or core topics (RAG, vectors, prompting, agents, MCP, deployment).
3. For skipped topics, ask light conceptual questions only.
4. After each candidate answer, either ask a follow-up OR move to a new topic.
5. Track coverage mentally using planned_days and questions_asked.
6. When questions_asked >= {min_questions} AND at least {min_days} days are covered, end the interview.
7. When ending, set done=true and provide structured feedback.

Always respond with a single JSON object (no markdown fences):
{{
  "reply": "what you say to the candidate",
  "done": false,
  "question_increment": 1,
  "day_touched": 11,
  "feedback": null
}}

When finished:
{{
  "reply": "Interview completed. ...short closing...",
  "done": true,
  "question_increment": 0,
  "day_touched": null,
  "feedback": {{
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  }}
}}
"""


class InterviewAgent:
    def __init__(self, retriever: PersonalizedRetriever | None = None):
        # Built on first use: the embedding model loads from disk/network, which
        # must not happen at import time or the whole API fails to boot.
        self._retriever = retriever
        self._client: genai.Client | None = None

    @property
    def retriever(self) -> PersonalizedRetriever:
        if self._retriever is None:
            try:
                self._retriever = PersonalizedRetriever()
            except Exception as exc:
                raise RetrievalUnavailableError(
                    f"Could not open the curriculum vector store: {exc}",
                    hint="Run `python -m app.rag.ingest` from backend/ to build the index.",
                ) from exc
        return self._retriever

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not settings.gemini_api_key:
                raise LLMNotConfiguredError(
                    "No Gemini API key configured, so the interviewer cannot generate questions.",
                    hint="Set GEMINI_API_KEY in .env (get one at https://aistudio.google.com/apikey), then restart the server.",
                )
            self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    def start(self, session_id: str, candidate: dict[str, Any]) -> dict[str, Any]:
        session = session_store.create(session_id, candidate)
        session.planned_days = plan_interview_days(candidate)
        hits = self.retriever.retrieve_for_candidate(
            candidate, focus_days=session.planned_days
        )
        context = self.retriever.format_context(hits)

        user_payload = {
            "phase": "start",
            "candidate": candidate,
            "planned_days": session.planned_days,
            "questions_asked": 0,
            "min_questions": settings.min_questions,
            "min_curriculum_days": settings.min_curriculum_days,
            "retrieved_context": context,
            "instruction": (
                "Welcome the candidate by name, briefly state you will interview them "
                "on their cohort journey, then ask the first technical question tied to "
                "one of the planned days."
            ),
        }
        result = self._call_llm(session, user_payload)
        self._apply_result(session, result, candidate_message=None)
        session_store.upsert(session)
        return self._response(session, result)

    def turn(self, session_id: str, message: str) -> dict[str, Any]:
        session = session_store.get(session_id)
        if session is None:
            raise SessionNotFoundError(
                f"No active interview for session '{session_id}'.",
                hint="The server may have restarted. Start a new interview to continue.",
            )
        if session.done:
            return {
                "reply": "This interview is already complete.",
                "done": True,
                "feedback": session.feedback,
                "progress": session.progress(),
            }

        hits = self.retriever.retrieve_for_candidate(
            session.candidate,
            query=message,
            focus_days=session.planned_days,
        )
        context = self.retriever.format_context(hits)

        should_wrap = session.meets_completion_bar()

        user_payload = {
            "phase": "turn",
            "candidate_message": message,
            "candidate": session.candidate,
            "planned_days": session.planned_days,
            "covered_days": session.covered_days,
            "questions_asked": session.questions_asked,
            "min_questions": settings.min_questions,
            "min_curriculum_days": settings.min_curriculum_days,
            "should_conclude": should_wrap,
            "retrieved_context": context,
            "instruction": (
                "Evaluate the answer. Ask a sharp follow-up OR next topic question. "
                "If should_conclude is true, end with done=true and structured feedback."
            ),
        }
        result = self._call_llm(session, user_payload)
        self._apply_result(session, result, candidate_message=message)
        session_store.upsert(session)
        return self._response(session, result)

    def _call_llm(self, session: InterviewSession, payload: dict[str, Any]) -> dict[str, Any]:
        system = SYSTEM_PROMPT.format(
            min_days=settings.min_curriculum_days,
            min_questions=settings.min_questions,
        )
        contents: list[types.Content] = []
        for msg in session.messages[-12:]:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])],
                )
            )
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=json.dumps(payload, ensure_ascii=False))],
            )
        )

        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.4,
            response_mime_type="application/json",
        )

        raw = self._generate_with_retries(contents, config)
        result = self._parse_json(raw)

        if not str(result.get("reply") or "").strip():
            raise LLMResponseError(
                "The model returned an empty interview reply.",
                hint="Retry the turn; if it persists, try a different GEMINI_MODEL.",
            )
        return result

    def _generate_with_retries(
        self,
        contents: list[types.Content],
        config: types.GenerateContentConfig,
    ) -> str:
        """Call Gemini, retrying only failures that are plausibly transient."""
        last_error: Exception | None = None

        for attempt in range(1, MAX_LLM_ATTEMPTS + 1):
            try:
                response = self.client.models.generate_content(
                    model=settings.gemini_model,
                    contents=contents,
                    config=config,
                )
                text = (response.text or "").strip()
                if text:
                    return text
                last_error = LLMResponseError("Model returned no content.")
            except Exception as exc:
                mapped = self._classify_provider_error(exc)
                # Auth and config problems will not fix themselves on retry.
                if isinstance(mapped, (LLMAuthError, LLMNotConfiguredError)):
                    raise mapped from exc
                last_error = mapped

            if attempt < MAX_LLM_ATTEMPTS:
                delay = RETRY_BACKOFF_SECONDS * attempt
                logger.warning(
                    "Gemini call failed (attempt %s/%s), retrying in %.1fs: %s",
                    attempt,
                    MAX_LLM_ATTEMPTS,
                    delay,
                    last_error,
                )
                time.sleep(delay)

        if isinstance(last_error, (LLMRateLimitError, LLMResponseError)):
            raise last_error
        raise LLMUnavailableError(
            f"Gemini did not respond successfully after {MAX_LLM_ATTEMPTS} attempts.",
            hint="Check your network connection and the Gemini service status, then retry.",
        )

    def _classify_provider_error(self, exc: Exception) -> Exception:
        """Turn an opaque SDK exception into an actionable typed error."""
        text = str(exc).lower()

        if "api key not valid" in text or "api_key_invalid" in text:
            return LLMAuthError(
                "Gemini rejected the configured API key.",
                hint="GEMINI_API_KEY looks invalid. Generate a key at https://aistudio.google.com/apikey (it starts with 'AIza') and restart the server.",
            )
        if "permission" in text or "403" in text:
            return LLMAuthError(
                "Gemini denied access for this API key.",
                hint="Confirm the Generative Language API is enabled for your key.",
            )
        if "quota" in text or "rate limit" in text or "429" in text or "resource_exhausted" in text:
            return LLMRateLimitError(
                "Gemini rate limit reached.",
                hint="Wait a few seconds before sending the next answer, or use a model with a higher quota.",
            )
        if "not found" in text and "model" in text:
            return LLMResponseError(
                f"Model '{settings.gemini_model}' is not available for this key.",
                hint="Set GEMINI_MODEL to a model you have access to, such as gemini-2.0-flash.",
            )
        return LLMUnavailableError(f"Gemini request failed: {exc}")

    def _parse_json(self, raw: str) -> dict[str, Any]:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Models occasionally wrap JSON in prose or fences; salvage the object.
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        # Plain prose is still a usable interviewer turn.
        if raw.strip():
            return {
                "reply": raw.strip(),
                "done": False,
                "question_increment": 1,
                "day_touched": None,
                "feedback": None,
            }

        raise LLMResponseError("Could not parse a reply from the model response.")

    def _apply_result(
        self,
        session: InterviewSession,
        result: dict[str, Any],
        candidate_message: str | None,
    ) -> None:
        if candidate_message is not None:
            session.messages.append({"role": "user", "content": candidate_message})

        reply = str(result.get("reply") or "").strip()
        if reply:
            session.messages.append({"role": "assistant", "content": reply})

        inc = int(result.get("question_increment") or 0)
        if inc > 0:
            session.questions_asked += inc

        day = result.get("day_touched")
        if day is not None:
            try:
                day_i = int(day)
                if day_i not in session.covered_days:
                    session.covered_days.append(day_i)
            except (TypeError, ValueError):
                pass

        model_wants_to_end = bool(result.get("done"))
        at_hard_cap = session.questions_asked >= HARD_QUESTION_CAP

        # The spec sets a floor on coverage, so a premature wrap-up is ignored
        # unless we have hit the cap that stops runaway interviews.
        if model_wants_to_end and not (session.meets_completion_bar() or at_hard_cap):
            logger.info(
                "Ignoring early completion for %s (%s questions, %s days covered)",
                session.session_id,
                session.questions_asked,
                len(set(session.covered_days)),
            )
            return

        if model_wants_to_end or at_hard_cap:
            session.done = True
            feedback = result.get("feedback") or {}
            session.feedback = {
                "summary": str(feedback.get("summary") or "Interview completed."),
                "strengths": [str(s) for s in (feedback.get("strengths") or [])],
                "gaps": [str(g) for g in (feedback.get("gaps") or [])],
                "next": [str(n) for n in (feedback.get("next") or [])],
            }

    def _response(self, session: InterviewSession, result: dict[str, Any]) -> dict[str, Any]:
        reply = str(result.get("reply") or "").strip()
        payload: dict[str, Any] = {
            "reply": reply,
            "done": session.done,
            "progress": session.progress(),
        }
        if session.done and session.feedback:
            payload["feedback"] = session.feedback
        return payload


interview_agent = InterviewAgent()
