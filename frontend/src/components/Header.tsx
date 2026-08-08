'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Terminal, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { BackendHealth, Candidate } from '@/lib/types';
import { checkBackendHealth } from '@/lib/api';

interface HeaderProps {
  activeCandidate: Candidate | null;
  onResetSession: () => void;
  sessionState: 'SELECT' | 'INTERVIEW' | 'REPORT';
}

export const Header: React.FC<HeaderProps> = ({ activeCandidate, onResetSession, sessionState }) => {
  const [backendStatus, setBackendStatus] = useState<BackendHealth>({ healthy: false });
  const [isChecking, setIsChecking] = useState(false);

  const pingBackend = async () => {
    setIsChecking(true);
    const status = await checkBackendHealth();
    setBackendStatus(status);
    setIsChecking(false);
  };

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Cpu className="w-5 h-5 animate-pulse text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-mono text-base font-bold tracking-wider text-slate-100 uppercase">
                SOLE<span className="text-cyan-400">_AGENT</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                VICODATHON 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Adaptive Technical Interviewer & RAG Curriculum Evaluator
            </p>
          </div>
        </div>

        {/* Middle: Active Candidate Indicator */}
        {activeCandidate && sessionState !== 'SELECT' && (
          <div className="hidden md:flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-mono">EVALUATING:</span>
            <span className="font-semibold text-slate-100">{activeCandidate.member.name}</span>
            <span className="text-slate-400">({activeCandidate.member.jobRole})</span>
          </div>
        )}

        {/* Right: Backend Health Status & Reset Action */}
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-mono"
            title={
              backendStatus.healthy
                ? `Model: ${backendStatus.model} · ${backendStatus.activeSessions ?? 0} active session(s)`
                : backendStatus.error
            }
          >
            {!backendStatus.healthy ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 font-medium">BACKEND OFFLINE</span>
              </>
            ) : backendStatus.status === 'degraded' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-medium">
                  {!backendStatus.llmReady ? 'NO GEMINI KEY' : 'INDEX MISSING'}
                </span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">BACKEND LIVE</span>
                {!!backendStatus.ragChunks && backendStatus.ragChunks > 0 && (
                  <span className="hidden lg:inline text-slate-400 border-l border-slate-700 pl-2">
                    {backendStatus.ragChunks} RAG Chunks
                  </span>
                )}
              </>
            )}
            <button
              onClick={pingBackend}
              title="Refresh connection"
              className="text-slate-500 hover:text-slate-300 transition-colors ml-1"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {sessionState !== 'SELECT' && (
            <button
              onClick={onResetSession}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 transition-all shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT SESSION</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
