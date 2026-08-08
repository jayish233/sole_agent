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
}

export interface MessageItem {
  id: string;
  sender: 'SOLE_AGENT' | 'CANDIDATE';
  text: string;
  timestamp: string;
  topic?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
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
