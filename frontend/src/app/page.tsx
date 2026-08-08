'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { CandidateSelector } from '@/components/CandidateSelector';
import { CandidateDNA } from '@/components/CandidateDNA';
import { HUD } from '@/components/HUD';
import { ChatConsole } from '@/components/ChatConsole';
import { AssessmentReport } from '@/components/AssessmentReport';
import { Candidate, MessageItem, InterviewFeedback } from '@/lib/types';
import { startInterviewAPI, sendTurnAPI } from '@/lib/api';

type ApplicationState = 'SELECT_CANDIDATE' | 'CANDIDATE_DNA' | 'INTERVIEWING' | 'REPORT';

export default function Home() {
  const [appState, setAppState] = useState<ApplicationState>('SELECT_CANDIDATE');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  // HUD live metrics
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [currentDifficulty, setCurrentDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME'>('MEDIUM');
  const [currentTopicIndex, setCurrentTopicIndex] = useState<number>(2);

  // Action: Select candidate in browser
  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setAppState('CANDIDATE_DNA');

    // Calibrate starting difficulty based on candidate signals
    const firstTryRate = (candidate.signals.missionsFirstTry / Math.max(1, candidate.signals.missionsCompleted)) * 100;
    if (firstTryRate >= 80) {
      setCurrentDifficulty('HARD');
    } else if (firstTryRate >= 40) {
      setCurrentDifficulty('MEDIUM');
    } else {
      setCurrentDifficulty('EASY');
    }
  };

  // Action: Start Interview (Turn 1)
  const handleStartInterview = async () => {
    if (!selectedCandidate) return;

    setIsLoading(true);
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([]);
    setQuestionCount(1);
    setAppState('INTERVIEWING');

    const response = await startInterviewAPI(newSessionId, selectedCandidate);

    setIsLoading(false);

    const initialMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'SOLE_AGENT',
      text: response.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([initialMsg]);
  };

  // Action: Conversation Turn
  const handleSendMessage = async (text: string) => {
    if (!selectedCandidate || !sessionId || isLoading) return;

    // Append candidate message
    const userMsg: MessageItem = {
      id: `msg-user-${Date.now()}`,
      sender: 'CANDIDATE',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);

    // Dynamically adjust topic & difficulty meter as turns progress
    if (nextCount === 2) {
      setCurrentTopicIndex(5);
    } else if (nextCount === 3) {
      setCurrentTopicIndex(6);
      if (currentDifficulty === 'MEDIUM') setCurrentDifficulty('HARD');
    } else if (nextCount >= 4) {
      setCurrentTopicIndex(7);
      if (currentDifficulty === 'HARD') setCurrentDifficulty('EXTREME');
    }

    const response = await sendTurnAPI(sessionId, text, nextCount, selectedCandidate);
    setIsLoading(false);

    const agentMsg: MessageItem = {
      id: `msg-agent-${Date.now()}`,
      sender: 'SOLE_AGENT',
      text: response.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, agentMsg]);

    if (response.done && response.feedback) {
      setFeedback(response.feedback);
      setTimeout(() => {
        setAppState('REPORT');
      }, 1800);
    }
  };

  // Reset to Candidate Selection
  const handleReset = () => {
    setAppState('SELECT_CANDIDATE');
    setSelectedCandidate(null);
    setMessages([]);
    setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col cyber-grid relative">
      {/* Background ambient lighting effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Global Header */}
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

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* State 1: Candidate Selector */}
        {appState === 'SELECT_CANDIDATE' && (
          <CandidateSelector onSelectCandidate={handleSelectCandidate} />
        )}

        {/* State 2: Candidate DNA Inspection */}
        {appState === 'CANDIDATE_DNA' && selectedCandidate && (
          <CandidateDNA
            candidate={selectedCandidate}
            onBack={() => setAppState('SELECT_CANDIDATE')}
            onStartInterview={handleStartInterview}
            isStarting={isLoading}
          />
        )}

        {/* State 3: Active Interview Workspace */}
        {appState === 'INTERVIEWING' && selectedCandidate && (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Left HUD Sidebar */}
            <HUD
              candidate={selectedCandidate}
              questionCount={questionCount}
              maxQuestions={4}
              currentDifficulty={currentDifficulty}
              currentTopicIndex={currentTopicIndex}
            />

            {/* Main Terminal Console */}
            <ChatConsole
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeCandidate={selectedCandidate}
              sessionId={sessionId}
            />
          </div>
        )}

        {/* State 4: Final Assessment Report */}
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
