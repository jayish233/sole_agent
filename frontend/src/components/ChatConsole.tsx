'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiErrorShape, InterviewProgress, MessageItem, Candidate } from '@/lib/types';
import { Terminal, Send, Cpu, Clock, CheckCircle2 } from 'lucide-react';
import { ErrorBanner } from './ErrorBanner';

interface TypewriterContainerProps {
  text: string;
  onComplete: () => void;
  formatText: (t: string) => React.ReactNode;
}

const TypewriterContainer: React.FC<TypewriterContainerProps> = ({ text, onComplete, formatText }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const words = text.split(/(\s+)/);
    let index = 0;
    setDisplayedText('');

    const container = document.querySelector('.terminal-scroll');
    const interval = setInterval(() => {
      if (index >= words.length) {
        clearInterval(interval);
        onComplete();
        return;
      }
      setDisplayedText((prev) => prev + words[index]);
      index++;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <>{formatText(displayedText)}</>;
};

interface ChatConsoleProps {
  messages: MessageItem[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeCandidate: Candidate;
  sessionId: string;
  error: ApiErrorShape | null;
  onRetry: () => void;
  onDismissError: () => void;
  progress: InterviewProgress;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activeCandidate,
  sessionId,
  error,
  onRetry,
  onDismissError,
  progress,
}) => {
  const [inputText, setInputText] = useState('');
  const [lastTypedId, setLastTypedId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  // Return focus to the input as soon as the agent finishes replying.
  useEffect(() => {
    if (!isLoading && !progress.done) textareaRef.current?.focus();
  }, [isLoading, progress.done]);

  const isBlocked = isLoading || progress.done;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isBlocked) return;
    onSendMessage(text);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const lastLatency = [...messages].reverse().find((m) => m.latencyMs)?.latencyMs;

  // Custom parser to format and highlight code/architectural markdown blocks
  const formatMessageText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3).trim();
        // Remove optional language identifier line
        const lines = content.split('\n');
        const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : content;

        return (
          <div key={i} className="my-3 font-mono text-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900 dark:bg-slate-950 text-slate-100">
            <div className="bg-slate-800 dark:bg-slate-900 text-slate-400 px-3 py-1.5 border-b border-slate-700 dark:border-slate-800 flex justify-between items-center text-[10px] uppercase font-bold select-none">
              <span>{language || 'code'}</span>
            </div>
            <pre className="p-3 overflow-x-auto text-slate-200 selection:bg-indigo-500/50">
              <code>{code}</code>
            </pre>
          </div>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={i} className="px-1.5 py-0.5 rounded font-mono text-xs bg-slate-150 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700">
            {code}
          </code>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-9rem)] flex flex-col bg-transparent border-0 shadow-none z-10">
      {/* Terminal chrome */}
      <div className="relative z-10 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 rounded-t-2xl px-5 py-3.5 flex items-center justify-between font-mono text-xs select-none transition-colors">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 shrink-0" />
          <span className="text-slate-600 dark:text-slate-400 flex items-center space-x-1.5 truncate">
            <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">CONSOLE // {sessionId || 'no-session'}</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          {lastLatency !== undefined && (
            <span className="hidden sm:flex items-center space-x-1">
              <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{lastLatency >= 1000 ? `${(lastLatency / 1000).toFixed(1)}s` : `${lastLatency}ms`}</span>
            </span>
          )}
          {progress.done ? (
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
              COMPLETE
            </span>
          ) : error ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30">
              ERROR
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30">
              SESSION ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Telemetry HUD Bar */}
      <div className="relative z-10 bg-slate-100/35 dark:bg-slate-950/35 border-x border-b border-slate-200/50 dark:border-slate-800/50 px-5 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs select-none transition-all">
        {/* Left: Questions Count & Progress */}
        <div className="flex items-center space-x-3">
          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Telemetry:</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-650 dark:text-slate-450">Questions:</span>
            <span className="font-bold text-blue-600 dark:text-cyan-400">{progress.questionsAsked}/{progress.minQuestions}</span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" style={{ width: `${Math.min(100, (progress.questionsAsked / progress.minQuestions) * 100)}%` }} />
          </div>
        </div>

        {/* Middle: Days Count & Progress */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-650 dark:text-slate-450">Curriculum Coverage:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress.daysCovered}/{progress.minDays} days</span>
          </div>
          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style={{ width: `${Math.min(100, (progress.daysCovered / progress.minDays) * 100)}%` }} />
          </div>
        </div>

        {/* Right: Covered Days Badges */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-slate-500 dark:text-slate-400 mr-1">Agenda:</span>
          {(progress.plannedDays.length ? progress.plannedDays : progress.coveredDays).map((day) => {
            const isCovered = progress.coveredDays.includes(day);
            return (
              <span
                key={day}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  isCovered
                    ? 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'bg-slate-200/50 dark:bg-slate-900/30 border-slate-300 dark:border-slate-850 text-slate-500 dark:text-slate-600'
                }`}
                title={`Day ${day}`}
              >
                D{day}
              </span>
            );
          })}
        </div>
      </div>

      {/* Transcript */}
      <div className="relative z-10 flex-1 overflow-y-auto p-5 space-y-6 terminal-scroll bg-white/10 dark:bg-slate-950/10 border-x border-slate-200/50 dark:border-slate-800/50 transition-colors animate-fadeIn">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isAgent = msg.sender === 'SOLE_AGENT';
            const isLast = index === messages.length - 1;
            const shouldType = isAgent && isLast && msg.id !== lastTypedId;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start space-x-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
              >
                {isAgent && (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-indigo-950 border border-blue-200 dark:border-indigo-500/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-sm dark:shadow-indigo-500/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isAgent ? '' : 'items-end flex flex-col'}`}>
                  <div
                    className={`flex items-center space-x-2 text-[10px] font-mono ${
                      isAgent ? 'text-blue-600 dark:text-cyan-400' : 'justify-end text-slate-555 dark:text-slate-455'
                    }`}
                  >
                    <span className="font-bold">
                      {isAgent ? 'SOLE_AGENT' : activeCandidate.member.name}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-slate-400 dark:text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isAgent
                        ? 'bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-sans shadow-sm dark:shadow-lg backdrop-blur-sm'
                        : 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white font-sans shadow-md dark:shadow-lg font-medium backdrop-blur-sm'
                    }`}
                  >
                    {shouldType ? (
                      <TypewriterContainer
                        text={msg.text}
                        onComplete={() => setLastTypedId(msg.id)}
                        formatText={formatMessageText}
                      />
                    ) : (
                      formatMessageText(msg.text)
                    )}
                  </div>
                </div>

                {!isAgent && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-indigo-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {activeCandidate.member.name.charAt(0)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-indigo-950 border border-blue-200 dark:border-indigo-500/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white/85 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs font-mono text-blue-600 dark:text-cyan-400 shadow-sm backdrop-blur-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-555 dark:bg-cyan-500" />
              </span>
              <span>SOLE_AGENT is analyzing your response…</span>
            </div>
          </motion.div>
        )}

        {error && (
          <ErrorBanner
            error={error}
            onRetry={onRetry}
            onDismiss={onDismissError}
            isRetrying={isLoading}
          />
        )}

        {progress.done && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 p-4 flex items-center gap-3 backdrop-blur-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-800 dark:text-emerald-100">
              Interview complete — {progress.questionsAsked} questions across{' '}
              {progress.daysCovered} curriculum days. Generating your report…
            </p>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="relative z-10 bg-slate-100/50 dark:bg-slate-950/50 p-4 border border-slate-200 dark:border-slate-800/50 rounded-b-2xl transition-colors">
        <div className="relative flex items-center bg-white/90 dark:bg-slate-900/90 border border-slate-350 dark:border-slate-800 rounded-2xl focus-within:border-blue-500 dark:focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-cyan-500 transition-all shadow-sm backdrop-blur-sm">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              progress.done
                ? 'Interview complete.'
                : error
                ? 'Resolve the error above, or retry your last answer.'
                : 'Type your technical response… (Enter to submit, Shift + Enter for a new line)'
            }
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none resize-none font-sans disabled:cursor-not-allowed"
            disabled={isBlocked}
          />

          <div className="pr-3 flex items-center shrink-0">
            <button
              type="submit"
              disabled={!inputText.trim() || isBlocked}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500 dark:to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 dark:hover:from-cyan-400 dark:hover:to-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10 dark:shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
