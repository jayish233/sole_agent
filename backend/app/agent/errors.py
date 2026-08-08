"""Typed errors so the API can map failures to meaningful HTTP responses."""

from __future__ import annotations


class InterviewError(Exception):
    """Base class for interview failures.

    `code` is a stable machine-readable identifier the frontend can branch on;
    `status` is the HTTP status the API layer should return.
    """

    code = "interview_error"
    status = 500

    def __init__(self, message: str, *, hint: str | None = None):
        super().__init__(message)
        self.message = message
        self.hint = hint

    def to_payload(self) -> dict[str, str]:
        payload = {"code": self.code, "message": self.message}
        if self.hint:
            payload["hint"] = self.hint
        return payload


class SessionNotFoundError(InterviewError):
    """The sessionId has no interview state (e.g. server restarted)."""

    code = "session_not_found"
    status = 404


class InvalidRequestError(InterviewError):
    """Caller sent neither a candidate to start nor a message to continue."""

    code = "invalid_request"
    status = 400


class LLMNotConfiguredError(InterviewError):
    """No API key configured for the model provider."""

    code = "llm_not_configured"
    status = 503


class LLMAuthError(InterviewError):
    """Provider rejected our credentials."""

    code = "llm_auth_failed"
    status = 502


class LLMRateLimitError(InterviewError):
    """Provider is throttling us."""

    code = "llm_rate_limited"
    status = 429


class LLMUnavailableError(InterviewError):
    """Provider is unreachable or failing after retries."""

    code = "llm_unavailable"
    status = 502


class LLMResponseError(InterviewError):
    """Provider responded, but not with usable interview content."""

    code = "llm_bad_response"
    status = 502


class RetrievalUnavailableError(InterviewError):
    """The curriculum vector store could not be opened or queried."""

    code = "retrieval_unavailable"
    status = 503
