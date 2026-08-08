'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Terminal, RefreshCw, Wifi, WifiOff, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { BackendHealth, Candidate } from '@/lib/types';
import { checkBackendHealth } from '@/lib/api';

interface HeaderProps {
  activeCandidate: Candidate | null;
  onResetSession: () => void;
  sessionState: 'SELECT' | 'INTERVIEW' | 'REPORT';
}

export const Header: React.FC<HeaderProps> = ({ activeCandidate, onResetSession, sessionState }) => {
  const [backendStatus, setBackendStatus] = useState<BackendHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const pingBackend = async () => {
    setIsChecking(true);
    const status = await checkBackendHealth();
    setBackendStatus(status);
    setIsChecking(false);
  };

  useEffect(() => {
    setMounted(true);
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/5 dark:shadow-indigo-500/10">
            <Cpu className="w-5 h-5 animate-pulse text-blue-600 dark:text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 dark:bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-mono text-base font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase">
                SOLE<span className="text-blue-600 dark:text-cyan-400">_AGENT</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
                VICODATHON 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Adaptive Technical Interviewer & RAG Curriculum Evaluator
            </p>
          </div>
        </div>

        {/* Middle: Active Candidate Indicator */}
        {activeCandidate && sessionState !== 'SELECT' && (
          <div className="hidden md:flex items-center space-x-2.5 bg-blue-50/80 dark:bg-slate-900/90 border border-blue-100 dark:border-slate-850 px-4 py-1.5 rounded-full text-xs transition-all shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-450 dark:text-slate-500 font-mono uppercase tracking-wider text-[10px]">
              CANDIDATE:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {activeCandidate.member.name}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] hidden lg:inline">
              [{activeCandidate.member.jobRole}]
            </span>
          </div>
        )}

        {/* Right: Backend Health Status, Theme Selector & Reset Action */}
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 transition-all"
            title={
              backendStatus === null
                ? 'Connecting to backend...'
                : backendStatus.healthy
                ? `Model: ${backendStatus.model} · ${backendStatus.activeSessions ?? 0} active session(s)`
                : backendStatus.error
            }
          >
            {backendStatus === null ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 animate-spin" />
                <span className="text-slate-400 dark:text-slate-500 font-medium">CONNECTING...</span>
              </>
            ) : !backendStatus.healthy ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="text-rose-500 dark:text-rose-400 font-medium">BACKEND OFFLINE</span>
              </>
            ) : backendStatus.status === 'degraded' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-amber-500 dark:text-amber-400 font-medium">
                  {!backendStatus.llmReady ? 'NO DEEPSEEK KEY' : 'INDEX MISSING'}
                </span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-500 dark:text-emerald-400 font-medium">BACKEND LIVE</span>
                {!!backendStatus.ragChunks && backendStatus.ragChunks > 0 && (
                  <span className="hidden lg:inline text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                    {backendStatus.ragChunks} RAG Chunks
                  </span>
                )}
              </>
            )}
            <button
              onClick={pingBackend}
              title="Refresh connection"
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-1"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-blue-600 dark:text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all shadow-sm shrink-0"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {mounted && (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme === 'dark' ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-600" />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </button>

          {sessionState !== 'SELECT' && (
            <button
              onClick={onResetSession}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
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
