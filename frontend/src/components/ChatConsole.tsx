'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ApiErrorShape, InterviewProgress, MessageItem, Candidate } from '@/lib/types';
import { Terminal, Send, Cpu, Clock, CheckCircle2 } from 'lucide-react';
import { ErrorBanner } from './ErrorBanner';

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

  return (
    <div className="flex-1 flex flex-col glass-panel-glow rounded-3xl overflow-hidden h-[680px] border border-slate-800/90 shadow-2xl">
      {/* Terminal chrome */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-5 py-3.5 flex items-center justify-between font-mono text-xs select-none">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-px bg-slate-800 shrink-0" />
          <span className="text-slate-400 flex items-center space-x-1.5 truncate">
            <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">CONSOLE // {sessionId || 'no-session'}</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-400 shrink-0">
          {lastLatency !== undefined && (
            <span className="hidden sm:flex items-center space-x-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{lastLatency >= 1000 ? `${(lastLatency / 1000).toFixed(1)}s` : `${lastLatency}ms`}</span>
            </span>
          )}
          {progress.done ? (
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              COMPLETE
            </span>
          ) : error ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
              ERROR
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SESSION ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 terminal-scroll bg-slate-950/50">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'SOLE_AGENT';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isAgent ? '' : 'items-end'}`}>
                <div
                  className={`flex items-center space-x-2 text-[10px] font-mono ${
                    isAgent ? 'text-cyan-400' : 'justify-end text-slate-400'
                  }`}
                >
                  <span className="font-bold">
                    {isAgent ? 'SOLE_AGENT' : activeCandidate.member.name}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isAgent
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-100 font-sans shadow-lg'
                      : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-sans shadow-lg font-medium'
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {!isAgent && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  {activeCandidate.member.name.charAt(0)}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/40 text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs font-mono text-cyan-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span>SOLE_AGENT is analyzing your response…</span>
            </div>
          </div>
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
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-100">
              Interview complete — {progress.questionsAsked} questions across{' '}
              {progress.daysCovered} curriculum days. Generating your report…
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="bg-slate-950 p-4 border-t border-slate-800/80">
        <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
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
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans disabled:cursor-not-allowed"
            disabled={isBlocked}
          />

          <div className="pr-3 flex items-center shrink-0">
            <button
              type="submit"
              disabled={!inputText.trim() || isBlocked}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
