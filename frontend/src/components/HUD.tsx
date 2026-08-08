'use client';

import React from 'react';
import { Candidate, CurriculumData } from '@/lib/types';
import { Target, Gauge, BookOpen, Layers, CheckCircle2, ChevronRight, User, Award, Shield } from 'lucide-react';
import curriculumData from '@/data/curriculum.json';

interface HUDProps {
  candidate: Candidate;
  questionCount: number;
  maxQuestions?: number;
  currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
  currentTopicIndex: number;
}

export const HUD: React.FC<HUDProps> = ({
  candidate,
  questionCount,
  maxQuestions = 8,
  currentDifficulty,
  currentTopicIndex,
}) => {
  const curriculum: CurriculumData = curriculumData as any;
  const modules = curriculum.modules;

  // Map difficulty level to numeric percentage & color styling
  const difficultyMap = {
    EASY: { percentage: 25, color: 'from-emerald-500 to-teal-400', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    MEDIUM: { percentage: 50, color: 'from-cyan-500 to-blue-500', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
    HARD: { percentage: 75, color: 'from-indigo-500 to-purple-500', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    EXTREME: { percentage: 100, color: 'from-rose-500 to-amber-500', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  };

  const diffConfig = difficultyMap[currentDifficulty] || difficultyMap.MEDIUM;
  const activeModule = modules[Math.min(currentTopicIndex, modules.length - 1)];

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-5 shrink-0 animate-fadeIn">
      {/* 1. Candidate Info Card */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-mono font-bold text-base shadow-lg shadow-cyan-500/20">
            {candidate.member.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm leading-snug">{candidate.member.name}</h3>
            <p className="text-xs text-slate-400 font-mono">{candidate.member.jobRole}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs pt-2 border-t border-slate-800">
          <div className="bg-slate-900/90 rounded-lg p-2">
            <span className="text-[10px] text-slate-500 block">EXPERIENCE</span>
            <span className="font-bold text-slate-200">{candidate.member.yearsExperience} Yrs</span>
          </div>
          <div className="bg-slate-900/90 rounded-lg p-2">
            <span className="text-[10px] text-slate-500 block">COHORT MISSIONS</span>
            <span className="font-bold text-cyan-400">{candidate.signals.missionsCompleted}/31</span>
          </div>
        </div>
      </div>

      {/* 2. Live Question Counter & Difficulty Gauge */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        {/* Question Counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>QUESTION COUNT</span>
            </span>
            <span className="font-bold text-cyan-300">
              {String(questionCount).padStart(2, '0')} / {String(maxQuestions).padStart(2, '0')}+
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (questionCount / maxQuestions) * 100)}%` }}
            />
          </div>
        </div>

        {/* Dynamic Difficulty Meter */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span>DYNAMIC DIFFICULTY</span>
            </span>
            <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${diffConfig.badgeColor}`}>
              {currentDifficulty}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full bg-gradient-to-r ${diffConfig.color} transition-all duration-500 rounded-full`}
              style={{ width: `${diffConfig.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Curriculum Journey Path */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-300 font-semibold">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>CURRICULUM EVALUATION PATH</span>
        </div>

        <div className="space-y-2">
          {modules.map((mod, idx) => {
            const isCompleted = idx < currentTopicIndex;
            const isActive = idx === currentTopicIndex;

            return (
              <div
                key={mod.n}
                className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200 shadow-md shadow-indigo-500/10'
                    : isCompleted
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : mod.n}
                  </div>
                  <span className="truncate">{mod.title}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
