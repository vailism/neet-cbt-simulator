'use client';

import React, { useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Target,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollegeTier {
  id: string;
  name: string;
  badge: string;
  minScore: number;
  maxScore: number;
  airRange: string;
  percentile: string;
  badgeBg: string;
  colleges: string[];
  description: string;
}

const COLLEGE_TIERS: CollegeTier[] = [
  {
    id: 'tier0',
    name: 'Apex Central Institutes (Tier 0)',
    badge: 'AIIMS New Delhi & Top Apex',
    minScore: 705,
    maxScore: 720,
    airRange: 'AIR 1 – 60',
    percentile: '99.99%',
    badgeBg: 'bg-slate-900 text-white border-slate-900',
    colleges: [
      'AIIMS New Delhi',
      'JIPMER Puducherry',
      'Maulana Azad Medical College (MAMC) Delhi',
    ],
    description: 'National apex medical institutions with premier clinical training and subsidized tuition.',
  },
  {
    id: 'tier1',
    name: 'Premier Central Institutes (Tier 1)',
    badge: 'Premier AIIMS & Central',
    minScore: 680,
    maxScore: 704,
    airRange: 'AIR 61 – 1,500',
    percentile: '99.85%',
    badgeBg: 'bg-blue-900 text-white border-blue-900',
    colleges: [
      'AIIMS Bhopal',
      'AIIMS Bhubaneswar',
      'AIIMS Rishikesh',
      'VMMC & Safdarjung Hospital Delhi',
      'Lady Hardinge Medical College (LHMC)',
      'University College of Medical Sciences (UCMS)',
    ],
    description: 'Central university seats providing internal institutional PG preference and high-volume clinical cases.',
  },
  {
    id: 'tier2',
    name: 'Top State Government Medical Colleges (Tier 2)',
    badge: 'Top State Govt Medical',
    minScore: 650,
    maxScore: 679,
    airRange: 'AIR 1,501 – 5,500',
    percentile: '99.40%',
    badgeBg: 'bg-slate-800 text-white border-slate-800',
    colleges: [
      'King George Medical University (KGMU) Lucknow',
      'Seth GS Medical College (KEM) Mumbai',
      'Madras Medical College (MMC) Chennai',
      'SMS Medical College Jaipur',
      'Bangalore Medical College (BMCRI)',
      'Medical College Kolkata',
    ],
    description: 'State capital government medical colleges established with extensive clinical specialty departments.',
  },
  {
    id: 'tier3',
    name: 'All India Quota (AIQ 15%) Govt MBBS',
    badge: 'AIQ 15% Open Merit',
    minScore: 615,
    maxScore: 649,
    airRange: 'AIR 5,501 – 18,000',
    percentile: '98.20%',
    badgeBg: 'bg-slate-700 text-white border-slate-700',
    colleges: [
      'Government Medical College Chandigarh',
      'BJ Medical College Ahmedabad/Pune',
      'GMC Kozhikode',
      'Indira Gandhi Medical College Shimla',
      'RIMS Ranchi',
      'GMC Patiala',
    ],
    description: 'All India Quota merit seats across government medical colleges nationwide via MCC centralized counseling.',
  },
  {
    id: 'tier4',
    name: 'State Quota Govt Medical Colleges (85%)',
    badge: 'State Domicile MBBS',
    minScore: 580,
    maxScore: 614,
    airRange: 'AIR 18,001 – 45,000',
    percentile: '95.80%',
    badgeBg: 'bg-slate-600 text-white border-slate-600',
    colleges: [
      'State District Government Medical Colleges',
      'State Government Society & Grant-in-Aid Medical Colleges',
      'State Employees State Insurance (ESI) Medical Colleges',
    ],
    description: 'State quota seats allocated via respective state counseling authorities based on domicile criteria.',
  },
];

interface CollegePredictorCardProps {
  score: number;
  maxScore?: number;
}

export function CollegePredictorCard({ score, maxScore = 720 }: CollegePredictorCardProps) {
  const currentScore = Math.max(0, Math.min(score, maxScore));
  const [simulatedScore, setSimulatedScore] = useState<number>(currentScore);

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
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold tracking-wide uppercase mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>NTA & MCC Cutoff Calibration</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Government Medical College & AIR Predictor
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated to Round 1 & Round 2 cutoffs across 15% All India Quota and 85% State Domicile counseling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Current Score</div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {currentScore} <span className="text-xs text-slate-400 font-normal">/ {maxScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Milestone Callout */}
      <AnimatePresence mode="wait">
        {nextHigherTier && marksNeededForNextTier > 0 ? (
          <motion.div
            key="milestone"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 rounded-lg bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border border-slate-800 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-white text-slate-900 flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-2xs">
                +{marksNeededForNextTier}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                  Target Milestone
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{nextHigherTier.badge}</span>
                  <span className="text-slate-400 font-normal">({nextHigherTier.minScore}+ marks)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                Target Delta: <strong>+{questionsNeeded} questions</strong> (+{questionsNeeded * 4} marks)
              </span>
            </div>
          </motion.div>
        ) : currentScore >= 705 ? (
          <motion.div
            key="apex"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 rounded-lg bg-slate-100 text-slate-900 border border-slate-200 flex items-center gap-3 text-xs shadow-2xs"
          >
            <Award className="w-5 h-5 text-slate-700 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">AIIMS New Delhi Qualifying Score Range</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Projected within top 0.01% All India Rank based on historical closing ranks.
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Interactive Score Simulator Slider */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            Score Simulation:
          </span>
          <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300 tabular-nums">
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
          className="w-full accent-slate-800 cursor-pointer h-1.5 bg-slate-200 rounded transition-all"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>400</span>
          <span>580 (State Govt)</span>
          <span>615 (AIQ 15%)</span>
          <span>650 (Top State)</span>
          <span>680 (AIIMS)</span>
          <span>720 (AIR 1)</span>
        </div>
      </div>

      {/* Active Projected Tier Card with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTier.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="p-4 rounded-lg border border-slate-200 bg-white space-y-3 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${activeTier.badgeBg}`}>
                {activeTier.badge}
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {activeTier.airRange}
              </span>
            </div>

            <span className="text-xs font-mono text-slate-500">
              Percentile: <strong className="text-slate-800">{activeTier.percentile}</strong>
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {activeTier.description}
          </p>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Representative Institutions in this Score Bracket:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {activeTier.colleges.map((col, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded text-xs font-medium text-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{col}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* All 5 Tiers Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-2.5">Admission Tier</th>
              <th className="p-2.5">Score Threshold</th>
              <th className="p-2.5">Projected Rank</th>
              <th className="p-2.5">Example Institutions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {COLLEGE_TIERS.map((tier) => {
              const isCurrent = activeTier.id === tier.id;
              return (
                <tr
                  key={tier.id}
                  className={`transition-colors cursor-pointer ${
                    isCurrent ? 'bg-slate-100/80 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  onClick={() => setSimulatedScore(tier.minScore)}
                >
                  <td className="p-2.5 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-slate-900' : 'bg-slate-300'}`} />
                    <span>{tier.name}</span>
                  </td>
                  <td className="p-2.5 font-mono font-semibold">{tier.minScore}+</td>
                  <td className="p-2.5 font-mono text-slate-500">{tier.airRange}</td>
                  <td className="p-2.5 text-[11px] text-slate-500 truncate max-w-xs">
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
