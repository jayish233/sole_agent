'use client';

import React from 'react';
import { Candidate } from '@/lib/types';
import { motion } from 'framer-motion';
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
        difficultyColor: 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10',
        focusTopics: ['Multi-Agent State Orchestration (Day 22)', 'MCP Tool Defs (Day 23)', 'Vector Search at Scale (Day 9)'],
        description: 'Candidate exhibits top 5% first-try accuracy. The interviewer will bypass preliminary definitions and challenge candidate on distributed agent failure recovery and custom tool schemas.'
      };
    } else if (firstTryRate >= 40) {
      return {
        strategyMode: 'BALANCED SYSTEM DESIGN & IMPLEMENTATION',
        initialDifficulty: 'MEDIUM',
        difficultyColor: 'text-blue-600 dark:text-cyan-400 border-blue-300 dark:border-cyan-500/30 bg-blue-50 dark:bg-cyan-500/10',
        focusTopics: ['RAG Pipeline End-to-End (Day 11)', 'Prompt Engineering & Tools (Day 13)', 'Docker Deployment (Day 28)'],
        description: 'Candidate shows solid practical completion with standard iteration. Interview will probe core architectural trade-offs with progressive complexity.'
      };
    } else {
      return {
        strategyMode: 'GUIDED SCAFFOLDING & FOUNDATIONAL PROBE',
        initialDifficulty: 'EASY',
        difficultyColor: 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10',
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
        className="inline-flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>BACK TO CANDIDATE SELECTOR</span>
      </button>

      {/* Main Glass Dashboard */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-500/30 uppercase">
                ID: {member.id}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30 uppercase">
                STATUS: {member.status}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{member.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              {member.jobRole} • {member.yearsExperience} Years Exp • {member.education}
            </p>
          </div>

          <motion.button
            onClick={onStartInterview}
            disabled={isStarting}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-mono font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500 dark:to-indigo-600 rounded-2xl hover:from-blue-500 hover:to-indigo-500 dark:hover:from-cyan-400 dark:hover:to-indigo-500 transition-all duration-300 shadow-xl shadow-blue-500/10 dark:shadow-cyan-500/25 hover:shadow-blue-500/20 dark:hover:shadow-cyan-500/40 disabled:opacity-50 shrink-0 font-semibold"
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
          </motion.button>
        </div>

        {/* AI Synthesized Interview Strategy */}
        <div className="bg-blue-50/50 dark:bg-slate-900/80 border border-blue-200 dark:border-indigo-500/30 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 text-blue-500/5 dark:text-indigo-500/10 pointer-events-none">
            <Cpu className="w-32 h-32" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-blue-700 dark:text-indigo-300 font-semibold">
              <Target className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>AI SYNTHESIZED INTERVIEW STRATEGY</span>
            </div>

            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-slate-500 dark:text-slate-400">STARTING DIFFICULTY:</span>
              <span className={`px-2.5 py-1 rounded font-bold border ${strategy.difficultyColor}`}>
                {strategy.initialDifficulty}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-mono font-bold text-slate-900 dark:text-white">{strategy.strategyMode}</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{strategy.description}</p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Target Curriculum Modules:</span>
            <div className="flex flex-wrap gap-2">
              {strategy.focusTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-xs font-mono rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Timeline Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="uppercase">Recent Mission Attempt Log</span>
            <span>SHOWING {Math.min(8, missions.length)} MISSIONS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {missions.slice(0, 8).map((m, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 dark:text-slate-500">DAY {m.day}</span>
                  {m.passed ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PASSED ({m.attempts || 1}x)</span>
                    </span>
                  ) : m.skipped ? (
                    <span className="text-slate-400 dark:text-slate-500">SKIPPED</span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>FAILED</span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{m.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
