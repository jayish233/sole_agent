'use client';

import React, { useState } from 'react';
import { Search, UserCheck, Flame, CheckCircle2, AlertTriangle, ArrowRight, Award, Shield, Cpu, BookOpen } from 'lucide-react';
import { Candidate } from '@/lib/types';
import candidatesData from '@/data/candidates.json';

interface CandidateSelectorProps {
  onSelectCandidate: (candidate: Candidate) => void;
}

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
    if (rate >= 80) return { label: 'HIGH PERFORMER', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    if (rate >= 40) return { label: 'BALANCED TECHNICAL', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
    return { label: 'SCAFFOLDING NEEDED', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Banner / Title */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>STEP 1: SELECT COHORT CANDIDATE FOR EVALUATION</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
          Candidate Intelligence Hub
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Select a candidate profile from the 31-day AI Cohort to launch an adaptive technical interview.
          The interviewer will calibrate question depth based on cohort signals and mission performance.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
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
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-semibold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Scenario Prompting Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase text-emerald-400 font-semibold">Demo Scenario A: Expert Candidate</h4>
            <p className="text-xs text-slate-300 mt-1">
              Select <span className="text-emerald-300 font-medium">Emily Chen</span> (AI Engineer, 30/31 first-try rate) to test aggressive technical depth in RAG & Multi-Agent systems.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/20 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase text-amber-400 font-semibold">Demo Scenario B: Growth Candidate</h4>
            <p className="text-xs text-slate-300 mt-1">
              Select <span className="text-amber-300 font-medium">Gerald Combs</span> (IT Specialist, 1/23 first-try rate) to test guided scaffolding & foundational probes.
            </p>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => {
          const firstTryPct = getFirstTryPercentage(candidate);
          const tag = getCandidateTag(candidate);

          return (
            <div
              key={candidate.member.id}
              onClick={() => onSelectCandidate(candidate)}
              className="group cursor-pointer relative glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      {candidate.member.id}
                    </span>
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {candidate.member.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{candidate.member.jobRole}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded-full border ${tag.color}`}>
                    {tag.label}
                  </span>
                </div>

                {/* Signals Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">EXPR</div>
                    <div className="text-sm font-semibold text-slate-200">{candidate.member.yearsExperience} yrs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">MISSIONS</div>
                    <div className="text-sm font-semibold text-cyan-400">{candidate.signals.missionsCompleted}/31</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">1ST TRY</div>
                    <div className="text-sm font-semibold text-emerald-400">{firstTryPct}%</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Missions Completed</span>
                    <span>{Math.round((candidate.signals.missionsCompleted / 31) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(candidate.signals.missionsCompleted / 31) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono group-hover:text-slate-200">
                  {candidate.member.education}
                </span>
                <div className="flex items-center space-x-1 text-xs font-mono font-medium text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span>INSPECT DNA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
