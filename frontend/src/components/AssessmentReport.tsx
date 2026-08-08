'use client';

import React from 'react';
import { Candidate, InterviewFeedback } from '@/lib/types';
import { Award, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Download, ShieldCheck, Target, Sparkles, Layers, BookOpen } from 'lucide-react';

interface AssessmentReportProps {
  candidate: Candidate;
  feedback: InterviewFeedback;
  onRestart: () => void;
  onSelectNewCandidate: () => void;
}

export const AssessmentReport: React.FC<AssessmentReportProps> = ({
  candidate,
  feedback,
  onRestart,
  onSelectNewCandidate,
}) => {
  const { member, signals } = candidate;

  // Calculate high-level performance metric score for visual display
  const baseScore = Math.min(
    98,
    Math.max(
      65,
      Math.round((signals.missionsFirstTry / Math.max(1, signals.missionsCompleted)) * 40 + (signals.missionsCompleted / 31) * 45 + 15)
    )
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>INTERVIEW COMPLETED • ASSESSMENT EVALUATION READY</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
          Technical Assessment Report
        </h2>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          SOLE_AGENT evaluation summary generated for <span className="text-slate-100 font-semibold">{member.name}</span> based on adaptive questions grounded in the 31-day AI Cohort curriculum.
        </p>
      </div>

      {/* Main Glass Report Container */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-8">
        {/* Executive Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/30 text-cyan-400 flex items-center justify-center font-mono font-bold text-lg">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{member.name}</h3>
                <p className="text-xs font-mono text-slate-400">{member.jobRole} • {member.education}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm leading-relaxed">
              <span className="text-xs font-mono font-semibold text-cyan-400 block mb-1">EXECUTIVE EVALUATION SUMMARY</span>
              {feedback.summary}
            </div>
          </div>

          {/* Overall Technical Readiness Score */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-indigo-950/50 to-slate-950 border border-indigo-500/20 text-center">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">TECHNICAL READINESS</span>
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="301.59"
                  strokeDashoffset={301.59 - (301.59 * baseScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold font-mono text-white">{baseScore}%</span>
                <span className="text-[10px] font-mono text-slate-400">PASSED</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Grid Columns: Strengths, Gaps, Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Demonstrated Strengths */}
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Demonstrated Strengths</span>
            </div>
            <ul className="space-y-3">
              {feedback.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Technical Gaps */}
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Identified Technical Gaps</span>
            </div>
            <ul className="space-y-3">
              {feedback.gaps.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs text-slate-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Actionable Next Steps */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Actionable Next Steps</span>
            </div>
            <ul className="space-y-3">
              {feedback.next.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs text-slate-200">
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
          <button
            onClick={onSelectNewCandidate}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 font-mono text-xs font-medium transition-all"
          >
            SELECT DIFFERENT CANDIDATE
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onRestart}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-900 font-mono text-xs font-semibold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>RE-INTERVIEW</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT ASSESSMENT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
