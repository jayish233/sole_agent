'use client';

import React, { useCallback, useState } from 'react';
import { Header } from '@/components/Header';
import { CandidateSelector } from '@/components/CandidateSelector';
import { CandidateDNA } from '@/components/CandidateDNA';
import { HUD } from '@/components/HUD';
import { ChatConsole } from '@/components/ChatConsole';
import { AssessmentReport } from '@/components/AssessmentReport';
import { ErrorBanner } from '@/components/ErrorBanner';
import { StarfieldBackground } from '@/components/StarfieldBackground';

import {
  ApiErrorShape,
  Candidate,
  InterviewProgress,
  MessageItem,
  InterviewFeedback,
} from '@/lib/types';
import { ApiError, endSessionAPI, startInterviewAPI, sendTurnAPI } from '@/lib/api';

type ApplicationState = 'SELECT_CANDIDATE' | 'CANDIDATE_DNA' | 'INTERVIEWING' | 'REPORT';

const EMPTY_PROGRESS: InterviewProgress = {
  questionsAsked: 0,
  minQuestions: 8,
  coveredDays: [],
  plannedDays: [],
  daysCovered: 0,
  minDays: 4,
  done: false,
};

function toApiErrorShape(err: unknown): ApiErrorShape {
  if (err instanceof ApiError) {
    return {
      code: err.code,
      message: err.message,
      hint: err.hint,
      status: err.status,
      retryable: err.retryable,
    };
  }
  return {
    code: 'interview_error',
    message: err instanceof Error ? err.message : 'Unexpected error.',
    retryable: true,
  };
}

function timestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function InterviewPage() {
  const [appState, setAppState] = useState<ApplicationState>('SELECT_CANDIDATE');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  // Coverage reported by the backend, never guessed client-side.
  const [progress, setProgress] = useState<InterviewProgress>(EMPTY_PROGRESS);

  const [error, setError] = useState<ApiErrorShape | null>(null);
  // Answer held back by a failed turn, so Retry can resend it.
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const appendMessage = useCallback((msg: MessageItem) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setAppState('CANDIDATE_DNA');
    setError(null);
  };

  const startInterview = useCallback(
    async (candidate: Candidate) => {
      setIsLoading(true);
      setError(null);
      setPendingMessage(null);
      setMessages([]);
      setFeedback(null);
      setProgress(EMPTY_PROGRESS);

      const newSessionId = `session-${Date.now()}`;
      setSessionId(newSessionId);
      setAppState('INTERVIEWING');

      const startedAt = performance.now();
      try {
        const response = await startInterviewAPI(newSessionId, candidate);
        appendMessage({
          id: `msg-${Date.now()}`,
          sender: 'SOLE_AGENT',
          text: response.reply,
          timestamp: timestamp(),
          latencyMs: Math.round(performance.now() - startedAt),
        });
        if (response.progress) setProgress(response.progress);
      } catch (err) {
        setError(toApiErrorShape(err));
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage]
  );

  const handleStartInterview = () => {
    if (selectedCandidate) void startInterview(selectedCandidate);
  };

  const submitAnswer = useCallback(
    async (text: string) => {
      if (!selectedCandidate || !sessionId) return;

      setIsLoading(true);
      setError(null);

      const startedAt = performance.now();
      try {
        const response = await sendTurnAPI(sessionId, text);

        appendMessage({
          id: `msg-agent-${Date.now()}`,
          sender: 'SOLE_AGENT',
          text: response.reply,
          timestamp: timestamp(),
          latencyMs: Math.round(performance.now() - startedAt),
        });

        if (response.progress) setProgress(response.progress);
        setPendingMessage(null);

        if (response.done && response.feedback) {
          setFeedback(response.feedback);
          void endSessionAPI(sessionId);
          setTimeout(() => setAppState('REPORT'), 1500);
        }
      } catch (err) {
        // Keep the answer so Retry can resend it rather than losing the text.
        setPendingMessage(text);
        setError(toApiErrorShape(err));
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, selectedCandidate, sessionId]
  );

  const handleSendMessage = (text: string) => {
    if (isLoading) return;

    appendMessage({
      id: `msg-user-${Date.now()}`,
      sender: 'CANDIDATE',
      text,
      timestamp: timestamp(),
    });

    void submitAnswer(text);
  };

  const handleRetry = () => {
    if (!error) return;

    // A dead session cannot be resumed, so rebuild it from the same candidate.
    if (error.code === 'session_not_found' && selectedCandidate) {
      void startInterview(selectedCandidate);
      return;
    }

    if (pendingMessage) {
      void submitAnswer(pendingMessage);
      return;
    }

    if (selectedCandidate) void startInterview(selectedCandidate);
  };

  const handleReset = () => {
    if (sessionId) void endSessionAPI(sessionId);
    setAppState('SELECT_CANDIDATE');
    setSelectedCandidate(null);
    setMessages([]);
    setFeedback(null);
    setError(null);
    setPendingMessage(null);
    setProgress(EMPTY_PROGRESS);
    setSessionId('');
  };

  const showInterviewBg = appState === 'INTERVIEWING';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative transition-colors duration-300 overflow-hidden">
      {/* Dynamic Background: Fullscreen Video for Interviewing, Interactive Starfield for Selection */}
      {showInterviewBg ? (
        <video
          key="purple-desert"
          autoPlay
          muted
          playsInline
          loop
          className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-500"
        >
          <source src="/purple-desert.mp4" type="video/mp4" />
        </video>
      ) : (
        <StarfieldBackground />
      )}

      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      <Header
        activeCandidate={selectedCandidate}
        onResetSession={handleReset}
        sessionState={
          appState === 'SELECT_CANDIDATE' || appState === 'CANDIDATE_DNA'
            ? 'SELECT'
            : appState === 'INTERVIEWING'
            ? 'INTERVIEW'
            : 'REPORT'
        }
      />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center gap-4">
        {/* Errors outside the interview surface at the top of the page. */}
        {error && appState !== 'INTERVIEWING' && (
          <ErrorBanner
            error={error}
            onRetry={handleRetry}
            onDismiss={() => setError(null)}
            isRetrying={isLoading}
          />
        )}

        {appState === 'SELECT_CANDIDATE' && (
          <CandidateSelector onSelectCandidate={handleSelectCandidate} />
        )}

        {appState === 'CANDIDATE_DNA' && selectedCandidate && (
          <CandidateDNA
            candidate={selectedCandidate}
            onBack={() => setAppState('SELECT_CANDIDATE')}
            onStartInterview={handleStartInterview}
            isStarting={isLoading}
          />
        )}

        {appState === 'INTERVIEWING' && selectedCandidate && (
          <div className="w-full flex-1 flex flex-col items-stretch">
            <ChatConsole
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeCandidate={selectedCandidate}
              sessionId={sessionId}
              error={error}
              onRetry={handleRetry}
              onDismissError={() => setError(null)}
              progress={progress}
            />
          </div>
        )}

        {appState === 'REPORT' && selectedCandidate && feedback && (
          <AssessmentReport
            candidate={selectedCandidate}
            feedback={feedback}
            onRestart={handleStartInterview}
            onSelectNewCandidate={handleReset}
          />
        )}
      </main>
    </div>
  );
}
