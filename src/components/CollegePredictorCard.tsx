'use client';

import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  Building2,
  ChevronRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Target,
} from 'lucide-react';

interface CollegeTier {
  id: string;
  name: string;
  badge: string;
  minScore: number;
  maxScore: number;
  airRange: string;
  percentile: string;
  color: string;
  badgeBg: string;
  colleges: string[];
  description: string;
}

const COLLEGE_TIERS: CollegeTier[] = [
  {
    id: 'tier0',
    name: 'Top Central Institute (Tier 0)',
    badge: 'AIIMS New Delhi Tier 🏆',
    minScore: 705,
    maxScore: 720,
    airRange: 'AIR 1 – 60',
    percentile: '99.99%',
    color: 'border-amber-400 bg-amber-50/30 text-amber-950',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black',
    colleges: [
      'AIIMS New Delhi',
      'JIPMER Puducherry',
      'Maulana Azad Medical College (MAMC) Delhi',
    ],
    description: 'National apex institutions with world-renowned clinical training and zero tuition fee.',
  },
  {
    id: 'tier1',
    name: 'Premier AIIMS & Central (Tier 1)',
    badge: 'Premier AIIMS / VMMC 🌟',
    minScore: 680,
    maxScore: 704,
    airRange: 'AIR 61 – 1,500',
    percentile: '99.85%',
    color: 'border-emerald-300 bg-emerald-50/20 text-emerald-950',
    badgeBg: 'bg-emerald-600 text-white font-bold',
    colleges: [
      'AIIMS Bhopal',
      'AIIMS Bhubaneswar',
      'AIIMS Rishikesh',
      'VMMC & Safdarjung Hospital Delhi',
      'Lady Hardinge (LHMC) Delhi',
      'UCMS Delhi',
    ],
    description: 'Premier central university seats offering 100% internal PG quota benefits and elite clinical exposure.',
  },
  {
    id: 'tier2',
    name: 'Top State Govt Medical Colleges (Tier 2)',
    badge: 'Top State Govt MBBS 🎖️',
    minScore: 650,
    maxScore: 679,
    airRange: 'AIR 1,501 – 5,500',
    percentile: '99.4%',
    color: 'border-blue-300 bg-blue-50/20 text-blue-950',
    badgeBg: 'bg-blue-700 text-white font-bold',
    colleges: [
      'King George Medical University (KGMU) Lucknow',
      'Seth GS Medical College (KEM) Mumbai',
      'Madras Medical College (MMC) Chennai',
      'SMS Medical College Jaipur',
      'Bangalore Medical College (BMCRI)',
      'Medical College Kolkata',
    ],
    description: 'Historic state capital medical colleges with massive patient inflows and stellar academic reputations.',
  },
  {
    id: 'tier3',
    name: 'All India Quota (AIQ 15%) Govt MBBS',
    badge: 'Govt Medical College (AIQ 15%)',
    minScore: 615,
    maxScore: 649,
    airRange: 'AIR 5,501 – 18,000',
    percentile: '98.2%',
    color: 'border-indigo-300 bg-indigo-50/20 text-indigo-950',
    badgeBg: 'bg-indigo-700 text-white font-bold',
    colleges: [
      'GMC Chandigarh',
      'BJ Medical College Ahmedabad/Pune',
      'GMC Kozhikode',
      'Indira Gandhi Medical College Shimla',
      'RIMS Ranchi',
      'GMC Patiala',
    ],
    description: 'Secure open merit seats available in government institutions across India through MCC centralized counseling.',
  },
  {
    id: 'tier4',
    name: 'State Quota Govt Medical Colleges (85%)',
    badge: 'State Govt MBBS Seat',
    minScore: 580,
    maxScore: 614,
    airRange: 'AIR 18,001 – 45,000',
    percentile: '95.8%',
    color: 'border-teal-300 bg-teal-50/20 text-teal-950',
    badgeBg: 'bg-teal-700 text-white font-bold',
    colleges: [
      'State District Govt Medical Colleges',
      'Semi-Government & Grant-in-Aid Medical Colleges',
      'State ESI Medical Colleges',
    ],
    description: 'Admissions governed by state domicile reservations and regional counseling authority cutoffs.',
  },
];

interface CollegePredictorCardProps {
  score: number;
  maxScore?: number;
}

export function CollegePredictorCard({ score, maxScore = 720 }: CollegePredictorCardProps) {
  const currentScore = Math.max(0, Math.min(score, maxScore));
  const [simulatedScore, setSimulatedScore] = useState<number>(currentScore);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  // Find active tier for simulated score
  const activeTier =
    COLLEGE_TIERS.find((t) => simulatedScore >= t.minScore && simulatedScore <= t.maxScore) ||
    COLLEGE_TIERS[COLLEGE_TIERS.length - 1];

  // Find next higher tier
  const activeTierIndex = COLLEGE_TIERS.findIndex((t) => t.id === activeTier.id);
  const nextHigherTier = activeTierIndex > 0 ? COLLEGE_TIERS[activeTierIndex - 1] : null;

  const marksNeededForNextTier = nextHigherTier
    ? Math.max(0, nextHigherTier.minScore - currentScore)
    : 0;

  const questionsNeeded = Math.ceil(marksNeededForNextTier / 4);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3 h-3" />
            <span>MCC / AIQ Admission Predictor</span>
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>AIIMS & Government Medical College Cutoff Predictor</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated against real Round 1 & Round 2 cutoffs of All India 15% Quota and State Domicile quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Your Exam Score</div>
            <div className="text-base sm:text-lg font-black text-blue-950 font-mono">
              {currentScore} <span className="text-xs text-slate-400 font-normal">/ {maxScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Milestone Callout */}
      {nextHigherTier && marksNeededForNextTier > 0 ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shrink-0 shadow-xs">
              +{marksNeededForNextTier}
            </div>
            <div>
              <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                Next Medical College Tier Target
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{nextHigherTier.badge}</span>
                <span className="text-blue-300 font-normal">({nextHigherTier.minScore}+ marks)</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              Just <strong>+{questionsNeeded} correct questions</strong> (+{questionsNeeded * 4} marks) needed!
            </span>
          </div>
        </div>
      ) : currentScore >= 705 ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex items-center gap-3 shadow-md font-bold text-xs">
          <Award className="w-6 h-6 text-slate-950 shrink-0" />
          <div>
            <div className="text-sm font-black">AIIMS New Delhi Direct Admission Category! 🏆</div>
            <div className="text-[11px] font-medium text-slate-900">
              You are in the top 0.01% percentile across all India. Maintain consistency in CBT pacing.
            </div>
          </div>
        </div>
      ) : null}

      {/* Interactive Score Simulator Slider */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Simulate Target Score:
          </span>
          <span className="font-mono font-black text-sm text-blue-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-300">
            {simulatedScore} / 720
          </span>
        </div>

        <input
          type="range"
          min={400}
          max={720}
          step={5}
          value={simulatedScore}
          onChange={(e) => setSimulatedScore(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>400 (Cutoff)</span>
          <span>580 (State Govt)</span>
          <span>615 (AIQ 15%)</span>
          <span>650 (Top State)</span>
          <span>680 (AIIMS)</span>
          <span>720 (AIR 1)</span>
        </div>
      </div>

      {/* Active Projected Tier Card */}
      <div className={`p-5 rounded-2xl border-2 transition-all ${activeTier.color} shadow-xs`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs ${activeTier.badgeBg}`}>
              {activeTier.badge}
            </span>
            <span className="text-xs font-bold font-mono text-slate-700">
              {activeTier.airRange}
            </span>
          </div>

          <span className="text-xs font-mono font-semibold text-slate-600">
            Percentile: <strong>{activeTier.percentile}</strong>
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed mb-4">
          {activeTier.description}
        </p>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-blue-700" />
            Reachable Institutions at this score range:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {activeTier.colleges.map((col, idx) => (
              <div
                key={idx}
                className="bg-white/90 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-800 flex items-center gap-2 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{col}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All 5 Tiers Comparison Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">Admission Tier</th>
              <th className="p-3">Score Cutoff</th>
              <th className="p-3">Estimated Rank</th>
              <th className="p-3">Key Medical Colleges</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {COLLEGE_TIERS.map((tier) => {
              const isCurrent = activeTier.id === tier.id;
              return (
                <tr
                  key={tier.id}
                  className={`transition-colors cursor-pointer ${
                    isCurrent ? 'bg-blue-50/70 font-bold text-blue-950' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  onClick={() => setSimulatedScore(tier.minScore)}
                >
                  <td className="p-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{tier.name}</span>
                  </td>
                  <td className="p-3 font-mono font-bold">{tier.minScore}+</td>
                  <td className="p-3 font-mono text-slate-500">{tier.airRange}</td>
                  <td className="p-3 text-[11px] text-slate-600 truncate max-w-xs">
                    {tier.colleges.slice(0, 2).join(', ')}...
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

