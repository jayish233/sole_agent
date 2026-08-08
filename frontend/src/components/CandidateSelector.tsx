'use client';

import React, { useState } from 'react';
import { Search, UserCheck, Flame, CheckCircle2, AlertTriangle, ArrowRight, Award, Shield, Cpu, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Candidate } from '@/lib/types';
import candidatesData from '@/data/candidates.json';

interface CandidateSelectorProps {
  onSelectCandidate: (candidate: Candidate) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  }
};

export const CandidateSelector: React.FC<CandidateSelectorProps> = ({ onSelectCandidate }) => {
  const candidates: Candidate[] = (candidatesData as any).candidates;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.member.jobRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRoleFilter === 'ALL' || c.member.jobRole.toLowerCase().includes(selectedRoleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const getFirstTryPercentage = (c: Candidate) => {
    const total = Math.max(1, c.signals.missionsCompleted);
    return Math.round((c.signals.missionsFirstTry / total) * 100);
  };

  const getCandidateTag = (c: Candidate) => {
    const rate = getFirstTryPercentage(c);
    if (rate >= 80) return { label: 'HIGH PERFORMER', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30' };
    if (rate >= 40) return { label: 'BALANCED TECHNICAL', color: 'bg-blue-500/10 dark:bg-indigo-500/10 text-blue-600 dark:text-indigo-400 border-blue-500/20 dark:border-indigo-500/30' };
    return { label: 'SCAFFOLDING NEEDED', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30' };
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn relative z-10">
      {/* Banner / Title */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20 text-blue-600 dark:text-cyan-400 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5" />
          <span>STEP 1: SELECT COHORT CANDIDATE FOR EVALUATION</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          Candidate Intelligence Hub
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          Select a candidate profile from the 31-day AI Cohort to launch an adaptive technical interview.
          The interviewer will calibrate question depth based on cohort signals and mission performance.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 dark:bg-slate-900/30 border border-white/10 dark:border-slate-800/80 backdrop-blur-md p-4 rounded-2xl shadow-lg shadow-black/5">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-cyan-500 font-sans transition-all"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'AI Engineer', 'Software Engineer', 'Data Engineer', 'Specialist'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                selectedRoleFilter === role
                  ? 'bg-blue-600/10 dark:bg-cyan-500/20 border border-blue-600/30 dark:border-cyan-500/50 text-blue-600 dark:text-cyan-300 font-semibold'
                  : 'bg-white/5 dark:bg-slate-900/30 border border-white/5 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredCandidates.map((candidate) => {
          const firstTryPct = getFirstTryPercentage(candidate);
          const tag = getCandidateTag(candidate);

          return (
            <motion.div
              key={candidate.member.id}
              onClick={() => onSelectCandidate(candidate)}
              variants={cardVariants}
              whileHover={{
                scale: 1.04,
                y: -6,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer relative bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/50 dark:hover:border-cyan-500/50 flex flex-col justify-between overflow-hidden"
            >
              {/* Radial light glow effect on hover */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 dark:to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              {/* Light sweep highlight line */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/25 dark:via-cyan-500/35 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {candidate.member.id}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                      {candidate.member.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{candidate.member.jobRole}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded-full border shrink-0 ${tag.color}`}>
                    {tag.label}
                  </span>
                </div>

                {/* Signals Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-white/5 dark:bg-slate-950/40 border border-white/5 dark:border-slate-850 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">EXPR</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{candidate.member.yearsExperience} yrs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">MISSIONS</div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-cyan-400">{candidate.signals.missionsCompleted}/31</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">1ST TRY</div>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{firstTryPct}%</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>Missions Completed</span>
                    <span className="font-semibold">{Math.round((candidate.signals.missionsCompleted / 31) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 dark:bg-slate-950/50 border border-white/5 dark:border-slate-850/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-cyan-500 dark:to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="pt-4 mt-4 border-t border-white/10 dark:border-slate-800/40 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono group-hover:text-slate-700 dark:group-hover:text-slate-200 truncate pr-2">
                  {candidate.member.education}
                </span>
                <div className="flex items-center space-x-1 text-xs font-mono font-medium text-blue-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0">
                  <span>INSPECT DNA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
