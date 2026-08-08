"""LLM-powered interview orchestration with RAG context."""

from __future__ import annotations

import json
import re
from typing import Any

from google import genai
from google.genai import types

from app.agent.planner import plan_interview_days
from app.agent.session import InterviewSession, session_store
from app.config import settings
from app.rag.retriever import PersonalizedRetriever


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
        self.retriever = retriever or PersonalizedRetriever()
        self._client: genai.Client | None = None

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            if not settings.gemini_api_key:
                raise RuntimeError(
                    "GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env"
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
            raise KeyError(f"Unknown sessionId: {session_id}")
        if session.done:
            return {
                "reply": session.feedback and "Interview already completed." or "Interview already completed.",
                "done": True,
                "feedback": session.feedback,
            }

        hits = self.retriever.retrieve_for_candidate(
            session.candidate,
            query=message,
            focus_days=session.planned_days,
        )
        context = self.retriever.format_context(hits)

        should_wrap = (
            session.questions_asked >= settings.min_questions
            and len(set(session.covered_days)) >= settings.min_curriculum_days
        )

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

        response = self.client.models.generate_content(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.4,
                response_mime_type="application/json",
            ),
        )
        raw = response.text or "{}"
        return self._parse_json(raw)

    def _parse_json(self, raw: str) -> dict[str, Any]:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return {
                "reply": raw.strip() or "Let's continue. Can you walk me through your approach?",
                "done": False,
                "question_increment": 1,
                "day_touched": None,
                "feedback": None,
            }

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

        if bool(result.get("done")):
            session.done = True
            feedback = result.get("feedback") or {}
            session.feedback = {
                "summary": str(feedback.get("summary") or "Interview completed."),
                "strengths": list(feedback.get("strengths") or []),
                "gaps": list(feedback.get("gaps") or []),
                "next": list(feedback.get("next") or []),
            }

    def _response(self, session: InterviewSession, result: dict[str, Any]) -> dict[str, Any]:
        reply = str(result.get("reply") or "").strip()
        payload: dict[str, Any] = {"reply": reply, "done": session.done}
        if session.done and session.feedback:
            payload["feedback"] = session.feedback
        return payload


interview_agent = InterviewAgent()
