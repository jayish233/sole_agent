export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface CandidateMission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface Candidate {
  member: CandidateMember;
  missions: CandidateMission[];
  signals: CandidateSignals;
}

export interface InterviewFeedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

/** Live coverage stats reported by the backend after every turn. */
export interface InterviewProgress {
  questionsAsked: number;
  minQuestions: number;
  coveredDays: number[];
  plannedDays: number[];
  daysCovered: number;
  minDays: number;
  done: boolean;
}

export interface InterviewStartRequest {
  sessionId: string;
  candidate: Candidate;
}

export interface InterviewTurnRequest {
  sessionId: string;
  message: string;
}

export interface InterviewResponse {
  reply: string;
  done: boolean;
  feedback?: InterviewFeedback;
  progress?: InterviewProgress;
}

/** Stable codes the backend returns so the UI can react per failure type. */
export type ApiErrorCode =
  | 'network_unreachable'
  | 'session_not_found'
  | 'invalid_request'
  | 'llm_not_configured'
  | 'llm_auth_failed'
  | 'llm_rate_limited'
  | 'llm_unavailable'
  | 'llm_bad_response'
  | 'retrieval_unavailable'
  | 'interview_error';

export interface ApiErrorShape {
  code: ApiErrorCode;
  message: string;
  hint?: string;
  status?: number;
  retryable: boolean;
}

export interface BackendHealth {
  healthy: boolean;
  status?: 'ok' | 'degraded';
  ragChunks?: number;
  ragReady?: boolean;
  llmReady?: boolean;
  model?: string;
  activeSessions?: number;
  minQuestions?: number;
  minDays?: number;
  error?: string;
}

export interface MessageItem {
  id: string;
  sender: 'SOLE_AGENT' | 'CANDIDATE';
  text: string;
  timestamp: string;
  topic?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
  /** Round-trip time in ms for agent replies. */
  latencyMs?: number;
}

export interface CurriculumModule {
  n: number;
  title: string;
  days: number[];
}

export interface CurriculumDay {
  day: number;
  title: string;
  type: string;
  tools: string[];
  objectives: string[];
}

export interface CurriculumData {
  cohort: string;
  modules: CurriculumModule[];
  days: CurriculumDay[];
}
