'use client';

import React from 'react';
import { Candidate } from '@/lib/types';
import { Cpu, ShieldCheck, Zap, Activity, CheckCircle2, XCircle, ArrowLeft, Play, Target, BookOpen, Layers } from 'lucide-react';

interface CandidateDNAProps {
  candidate: Candidate;
  onBack: () => void;
  onStartInterview: () => void;
  isStarting: boolean;
}

export const CandidateDNA: React.FC<CandidateDNAProps> = ({
  candidate,
  onBack,
  onStartInterview,
  isStarting,
}) => {
  const { member, missions, signals } = candidate;

  const firstTryRate = Math.round((signals.missionsFirstTry / Math.max(1, signals.missionsCompleted)) * 100);
  const completionRate = Math.round((signals.missionsCompleted / 31) * 100);

  // Compute adaptive strategy parameters based on candidate metrics
  const getAdaptiveStrategy = () => {
    if (firstTryRate >= 80 && signals.missionsCompleted >= 28) {
      return {
        strategyMode: 'AGGRESSIVE AGENTIC REASONING',
        initialDifficulty: 'HARD',
        difficultyColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        focusTopics: ['Multi-Agent State Orchestration (Day 22)', 'MCP Tool Defs (Day 23)', 'Vector Search at Scale (Day 9)'],
        description: 'Candidate exhibits top 5% first-try accuracy. The interviewer will bypass preliminary definitions and challenge candidate on distributed agent failure recovery and custom tool schemas.'
      };
    } else if (firstTryRate >= 40) {
      return {
        strategyMode: 'BALANCED SYSTEM DESIGN & IMPLEMENTATION',
        initialDifficulty: 'MEDIUM',
        difficultyColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
        focusTopics: ['RAG Pipeline End-to-End (Day 11)', 'Prompt Engineering & Tools (Day 13)', 'Docker Deployment (Day 28)'],
        description: 'Candidate shows solid practical completion with standard iteration. Interview will probe core architectural trade-offs with progressive complexity.'
      };
    } else {
      return {
        strategyMode: 'GUIDED SCAFFOLDING & FOUNDATIONAL PROBE',
        initialDifficulty: 'EASY',
        difficultyColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        focusTopics: ['Vector Embeddings Basics (Day 7)', 'FastAPI Chat Backend (Day 16)', 'Structured Data Processing (Day 4)'],
        description: 'Candidate required multiple attempts across missions. Interviewer will utilize structured hints, evaluating fundamental comprehension before advancing.'
      };
    }
  };

  const strategy = getAdaptiveStrategy();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO CANDIDATE SELECTOR</span>
      </button>

      {/* Main Glass Dashboard */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                ID: {member.id}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
                STATUS: {member.status}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">{member.name}</h2>
            <p className="text-sm text-slate-400 font-mono">
              {member.jobRole} • {member.yearsExperience} Years Exp • {member.education}
            </p>
          </div>

          <button
            onClick={onStartInterview}
            disabled={isStarting}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-mono font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl hover:from-cyan-400 hover:to-indigo-500 transition-all duration-300 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 disabled:opacity-50 shrink-0"
          >
            {isStarting ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>INITIALIZING ENGINE...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-3">
                <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                <span>BEGIN ADAPTIVE INTERVIEW</span>
              </span>
            )}
          </button>
        </div>

        {/* 31-Day Cohort Signals & Analytics */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="uppercase tracking-wider">Cohort Signal Telemetry (31-Day Curriculum)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-mono text-slate-500">COMMIT DAYS</div>
              <div className="text-2xl font-bold text-slate-100 font-mono">{signals.commitDays} / 31</div>
              <div className="text-[11px] text-slate-400">Active participation days</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-mono text-slate-500">MISSIONS PASSED</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">{signals.missionsCompleted} / 31</div>
              <div className="text-[11px] text-slate-400">{completionRate}% curriculum completion</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-mono text-slate-500">FIRST-TRY ACCURACY</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{firstTryRate}%</div>
              <div className="text-[11px] text-slate-400">{signals.missionsFirstTry} missions passed 1st attempt</div>
            </div>
          </div>
        </div>

        {/* AI Synthesized Interview Strategy */}
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-indigo-500/10 pointer-events-none">
            <Cpu className="w-32 h-32" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-indigo-300 font-semibold">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>AI SYNTHESIZED INTERVIEW STRATEGY</span>
            </div>

            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-slate-400">STARTING DIFFICULTY:</span>
              <span className={`px-2.5 py-1 rounded font-bold border ${strategy.difficultyColor}`}>
                {strategy.initialDifficulty}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-mono font-bold text-white">{strategy.strategyMode}</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{strategy.description}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-mono text-slate-400 uppercase">Target Curriculum Modules:</span>
            <div className="flex flex-wrap gap-2">
              {strategy.focusTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Timeline Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase">Recent Mission Attempt Log</span>
            <span>SHOWING {Math.min(8, missions.length)} MISSIONS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {missions.slice(0, 8).map((m, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">DAY {m.day}</span>
                  {m.passed ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PASSED ({m.attempts || 1}x)</span>
                    </span>
                  ) : m.skipped ? (
                    <span className="text-slate-500">SKIPPED</span>
                  ) : (
                    <span className="text-rose-400 flex items-center space-x-1">
                      <XCircle className="w-3 h-3" />
                      <span>FAILED</span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-200 line-clamp-1">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
