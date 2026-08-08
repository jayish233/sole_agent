'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Candidate, CurriculumData, InterviewProgress } from '@/lib/types';
import { Target, BookOpen, CheckCircle2, Layers, Activity } from 'lucide-react';
import curriculumData from '@/data/curriculum.json';

interface HUDProps {
  candidate: Candidate;
  progress: InterviewProgress;
  isLoading?: boolean;
}

export const HUD: React.FC<HUDProps> = ({ candidate, progress, isLoading = false }) => {
  const curriculum: CurriculumData = curriculumData as any;

  const { questionsAsked, minQuestions, coveredDays, plannedDays, daysCovered, minDays } = progress;

  const questionPct = Math.min(100, (questionsAsked / Math.max(1, minQuestions)) * 100);
  const dayPct = Math.min(100, (daysCovered / Math.max(1, minDays)) * 100);
  const requirementsMet = questionsAsked >= minQuestions && daysCovered >= minDays;

  // Show the days the backend actually planned for this candidate.
  const dayLookup = new Map(curriculum.days.map((d) => [d.day, d]));
  const agenda = plannedDays.length ? plannedDays : coveredDays;

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-5 shrink-0">
      {/* Candidate identity */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel rounded-2xl p-5 space-y-3 shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-indigo-500 dark:to-cyan-500 flex items-center justify-center text-white font-mono font-bold text-base shadow-lg shadow-blue-500/10 dark:shadow-cyan-500/20">
            {candidate.member.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug truncate">
              {candidate.member.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{candidate.member.jobRole}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800 rounded-lg p-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">EXPERIENCE</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{candidate.member.yearsExperience} Yrs</span>
          </div>
          <div className="bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800 rounded-lg p-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">MISSIONS</span>
            <span className="font-bold text-blue-600 dark:text-cyan-400">{candidate.signals.missionsCompleted}/31</span>
          </div>
        </div>
      </motion.div>

      {/* Live requirement tracking straight from the backend */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="glass-panel rounded-2xl p-5 space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
            <Activity className={`w-4 h-4 text-blue-600 dark:text-cyan-400 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>LIVE COVERAGE</span>
          </span>
          {requirementsMet && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              BAR MET
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>QUESTIONS</span>
            </span>
            <span className="font-bold text-blue-600 dark:text-cyan-300">
              {String(questionsAsked).padStart(2, '0')} / {String(minQuestions).padStart(2, '0')}
              <span className="text-slate-400 dark:text-slate-500 font-normal"> min</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-cyan-500 dark:to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${questionPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>CURRICULUM DAYS</span>
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-300">
              {String(daysCovered).padStart(2, '0')} / {String(minDays).padStart(2, '0')}
              <span className="text-slate-400 dark:text-slate-500 font-normal"> min</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${dayPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Planned agenda with per-day completion state */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-panel rounded-2xl p-5 space-y-4 shadow-sm"
      >
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          <span>EVALUATION AGENDA</span>
        </div>

        {agenda.length === 0 ? (
          <p className="text-xs text-slate-550 dark:text-slate-500 font-mono leading-relaxed">
            Waiting for the agent to plan this candidate&apos;s agenda…
          </p>
        ) : (
          <div className="space-y-2">
            {agenda.map((day) => {
              const info = dayLookup.get(day);
              const isCovered = coveredDays.includes(day);

              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.01 }}
                  className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between gap-2 shadow-sm ${
                    isCovered
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 text-slate-550 dark:text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isCovered
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-600'
                      }`}
                    >
                      {isCovered ? <CheckCircle2 className="w-3.5 h-3.5" /> : day}
                    </div>
                    <span className="truncate">{info?.title || `Day ${day}`}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </aside>
  );
};
