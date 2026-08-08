"""In-memory interview session store keyed by sessionId."""

from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
from typing import Any


@dataclass
class InterviewSession:
    session_id: str
    candidate: dict[str, Any]
    messages: list[dict[str, str]] = field(default_factory=list)
    planned_days: list[int] = field(default_factory=list)
    questions_asked: int = 0
    covered_days: list[int] = field(default_factory=list)
    done: bool = False
    feedback: dict[str, Any] | None = None


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, InterviewSession] = {}
        self._lock = Lock()

    def create(self, session_id: str, candidate: dict[str, Any]) -> InterviewSession:
        with self._lock:
            session = InterviewSession(session_id=session_id, candidate=candidate)
            self._sessions[session_id] = session
            return session

    def get(self, session_id: str) -> InterviewSession | None:
        with self._lock:
            return self._sessions.get(session_id)

    def upsert(self, session: InterviewSession) -> None:
        with self._lock:
            self._sessions[session.session_id] = session


session_store = SessionStore()
