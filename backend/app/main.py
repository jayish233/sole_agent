"""FastAPI entrypoint — POST /api/interview."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.agent.interviewer import interview_agent
from app.agent.session import session_store
from app.config import settings
from app.rag.store import get_vector_store

app = FastAPI(
    title="AI Interview Agent",
    description="Personalized technical interviews grounded in AI Cohort curriculum via RAG",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InterviewRequest(BaseModel):
    sessionId: str = Field(..., min_length=1)
    candidate: dict[str, Any] | None = None
    message: str | None = None


class FeedbackModel(BaseModel):
    summary: str
    strengths: list[str]
    gaps: list[str]
    next: list[str]


class InterviewResponse(BaseModel):
    reply: str
    done: bool
    feedback: FeedbackModel | None = None


@app.get("/health")
def health() -> dict[str, Any]:
    store_count = 0
    try:
        store_count = get_vector_store().count()
    except Exception:
        store_count = -1
    return {
        "status": "ok",
        "rag_chunks": store_count,
        "model": settings.gemini_model,
    }


@app.post("/api/interview", response_model=InterviewResponse)
def interview(body: InterviewRequest) -> dict[str, Any]:
    session_id = body.sessionId.strip()

    # Start: candidate present, no message required
    if body.candidate is not None and not body.message:
        try:
            return interview_agent.start(session_id, body.candidate)
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to start interview: {exc}") from exc

    # Turn: message present
    if body.message is not None:
        existing = session_store.get(session_id)
        if existing is None and body.candidate is not None:
            # Allow start+first-message style by initializing first
            interview_agent.start(session_id, body.candidate)
        try:
            return interview_agent.turn(session_id, body.message)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Interview turn failed: {exc}") from exc

    raise HTTPException(
        status_code=400,
        detail="Provide `candidate` to start, or `message` for a conversation turn.",
    )


@app.post("/api/rag/ingest")
def reingest() -> dict[str, Any]:
    """Optional helper to (re)build the vector index at runtime."""
    from app.rag.ingest import ingest

    try:
        get_vector_store.cache_clear()  # type: ignore[attr-defined]
    except Exception:
        pass
    return ingest(reset=True)
