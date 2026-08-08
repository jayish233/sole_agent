import { ApiErrorCode, ApiErrorShape, BackendHealth, Candidate, InterviewResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const REQUEST_TIMEOUT_MS = 90_000;

/** Failures the user can meaningfully retry without changing anything. */
const RETRYABLE_CODES: ApiErrorCode[] = [
  'network_unreachable',
  'llm_rate_limited',
  'llm_unavailable',
  'llm_bad_response',
];

export class ApiError extends Error implements ApiErrorShape {
  code: ApiErrorCode;
  hint?: string;
  status?: number;
  retryable: boolean;

  constructor(shape: Omit<ApiErrorShape, 'retryable'> & { retryable?: boolean }) {
    super(shape.message);
    this.name = 'ApiError';
    this.code = shape.code;
    this.hint = shape.hint;
    this.status = shape.status;
    this.retryable = shape.retryable ?? RETRYABLE_CODES.includes(shape.code);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    throw new ApiError({
      code: 'network_unreachable',
      message: aborted
        ? 'The backend took too long to respond.'
        : 'Cannot reach the interview backend.',
      hint: aborted
        ? 'The model may be overloaded. Try sending your answer again.'
        : `Start it with: cd backend && uvicorn app.main:app --reload --port 8000 (expected at ${API_BASE_URL})`,
    });
  } finally {
    clearTimeout(timeout);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = body?.error;
    throw new ApiError({
      code: (detail?.code as ApiErrorCode) || 'interview_error',
      message: detail?.message || `Request failed with status ${res.status}.`,
      hint: detail?.hint,
      status: res.status,
    });
  }

  return body as T;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  try {
    const data = await request<any>('/health');
    return {
      healthy: true,
      status: data.status,
      ragChunks: data.rag_chunks,
      ragReady: data.rag_ready,
      llmReady: data.llm_ready,
      model: data.model,
      activeSessions: data.active_sessions,
      minQuestions: data.min_questions,
      minDays: data.min_days,
    };
  } catch (err) {
    return {
      healthy: false,
      error: err instanceof ApiError ? err.message : 'Backend unreachable',
    };
  }
}

export async function startInterviewAPI(
  sessionId: string,
  candidate: Candidate
): Promise<InterviewResponse> {
  return request<InterviewResponse>('/api/interview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, candidate }),
  });
}

export async function sendTurnAPI(
  sessionId: string,
  message: string
): Promise<InterviewResponse> {
  return request<InterviewResponse>('/api/interview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });
}

export async function endSessionAPI(sessionId: string): Promise<void> {
  try {
    await request(`/api/interview/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  } catch {
    // Releasing the session is best-effort; the interview is over either way.
  }
}
