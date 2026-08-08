'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageItem, Candidate } from '@/lib/types';
import { Terminal, Send, Cpu, User, CornerDownLeft, Sparkles, Check, Clock } from 'lucide-react';

interface ChatConsoleProps {
  messages: MessageItem[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeCandidate: Candidate;
  sessionId: string;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activeCandidate,
  sessionId,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Preset prompt chips for quick demo interaction
  const quickPrompts = [
    "Let me break down the trade-offs in vector indexing...",
    "I would use a ReAct agent loop with fallback tools...",
    "Here is how I structure prompt guardrails against jailbreaks..."
  ];

  return (
    <div className="flex-1 flex flex-col glass-panel-glow rounded-3xl overflow-hidden h-[680px] border border-slate-800/90 shadow-2xl">
      {/* 1. Terminal Top Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-5 py-3.5 flex items-center justify-between font-mono text-xs select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-slate-400 flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>CONSOLE // {sessionId.substring(0, 12)}...</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span className="hidden sm:flex items-center space-x-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>LATENCY: 42ms</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            SESSION ACTIVE
          </span>
        </div>
      </div>

      {/* 2. Messages List Area */}
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
                  <Cpu className="w-4 h-4 animate-pulse" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isAgent ? '' : 'items-end'}`}>
                {/* Bubble metadata header */}
                <div
                  className={`flex items-center space-x-2 text-[10px] font-mono ${
                    isAgent ? 'text-cyan-400' : 'justify-end text-slate-400'
                  }`}
                >
                  <span className="font-bold">{isAgent ? 'SOLE_AGENT' : activeCandidate.member.name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">{msg.timestamp}</span>
                </div>

                {/* Bubble Body */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isAgent
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-100 font-sans shadow-lg font-normal whitespace-pre-wrap'
                      : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-sans shadow-lg font-medium whitespace-pre-wrap'
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

        {/* Loading / Thinking state */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/40 text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs font-mono text-cyan-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>SOLE_AGENT is analyzing technical reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Action Chips */}
      <div className="bg-slate-950/80 px-5 py-2 border-t border-slate-800/60 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-slate-500 shrink-0">SUGGESTIONS:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInputText(prompt)}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all whitespace-nowrap shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 4. Input Controls */}
      <form onSubmit={handleSubmit} className="bg-slate-950 p-4 border-t border-slate-800/80">
        <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your technical response... (Press Enter to submit, Shift + Enter for new line)"
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
            disabled={isLoading}
          />

          <div className="pr-3 flex items-center space-x-2 shrink-0">
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
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
