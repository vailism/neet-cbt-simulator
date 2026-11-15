'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle,
  TrendingUp,
  User,
  XCircle,
  Zap,
  RotateCcw,
  Edit2,
  Target,
  Play,
  Layers,
  Flame,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import {
  getClientCandidate,
  CandidateInfo,
  DEFAULT_CANDIDATE,
} from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';
import { calculateNeetPrediction } from '@/lib/neetPredictor';
import { CollegePredictorCard } from '@/components/CollegePredictorCard';

interface DashboardData {
  candidate: {
    id: string;
    rollNumber: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  };
  stats: {
    totalAttempts: number;
    highestScore: number;
    averageScore: number;
    averageAccuracy: number;
    subjectAverages: {
      physics: number;
      chemistry: number;
      botany: number;
      zoology: number;
    };
  };
  trends: Array<{
    index: number;
    date: string;
    score: number;
    maxScore: number;
    accuracy: number;
  }>;
  recentAttempts: Array<{
    id: string;
    title: string;
    mode: string;
    startedAt: string;
    submittedAt: string | null;
    totalScore: number | null;
    maxScore: number;
    correctCount: number | null;
    incorrectCount: number | null;
    unattemptedCount: number | null;
    accuracy: number | null;
    timeSpentSeconds: number | null;
    physicsScore: number | null;
    chemistryScore: number | null;
    botanyScore: number | null;
    zoologyScore: number | null;
  }>;
  chapterHeatmap?: Array<{
    chapterId: string;
    chapterName: string;
    subjectCode: string;
    subjectName: string;
    totalAttempted: number;
    correct: number;
    incorrect: number;
    accuracy: number | null;
    status: 'MASTERED' | 'PRACTICE' | 'CRITICAL' | 'UNATTEMPTED';
  }>;
}

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [drillLoading, setDrillLoading] = useState(false);
  const [remedialLoading, setRemedialLoading] = useState(false);
  const [activeHeatmapSubject, setActiveHeatmapSubject] = useState<'ALL' | 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY'>('ALL');

  const fetchDashboard = useCallback(async (roll: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/candidate/${encodeURIComponent(roll)}/dashboard`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch dashboard data.');
      setData(json);

      // Also check mistake drill count
      const mistakeRes = await fetch(`/api/exam/mistake-drill?rollNumber=${encodeURIComponent(roll)}`);
      const mistakeJson = await mistakeRes.json();
      if (mistakeJson.success) {
        setMistakeCount(mistakeJson.mistakeCount || 0);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLaunchMistakeDrill = async () => {
    const current = getClientCandidate();
    setDrillLoading(true);
    try {
      const res = await fetch('/api/exam/mistake-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: current.rollNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start remedial drill.');
      router.push(`/exam/${json.attemptId}`);
    } catch (e: any) {
      alert(e.message || 'Failed to start mistake drill.');
    } finally {
      setDrillLoading(false);
    }
  };

  const handleLaunchRemedialMock = async () => {
    const current = getClientCandidate();
    setRemedialLoading(true);
    try {
      const res = await fetch('/api/exam/remedial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: current.rollNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate remedial mock test.');
      router.push(`/exam/${json.attemptId}`);
    } catch (e: any) {
      alert(e.message || 'Error generating remedial mock test.');
    } finally {
      setRemedialLoading(false);
    }
  };

  useEffect(() => {
    const current = getClientCandidate();
    fetchDashboard(current.rollNumber);

    const handleUpdate = (e: any) => {
      const c = e.detail || getClientCandidate();
      fetchDashboard(c.rollNumber);
    };

    window.addEventListener('neet_candidate_updated', handleUpdate);
    return () => window.removeEventListener('neet_candidate_updated', handleUpdate);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 min-h-[60vh]">
        <div className="w-12 h-12 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-bold text-slate-800">Loading Student Analytics & Records...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl border border-slate-200 max-w-md w-full text-center shadow-card">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">No Profile Found</h2>
          <p className="text-xs text-slate-500 mb-5">
            Please register your candidate details to access your performance dashboard.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
          >
            Go to Candidate Portal
          </button>
        </div>
      </div>
    );
  }

  const { candidate, stats, trends, recentAttempts } = data;
  const prediction = calculateNeetPrediction(stats.highestScore || stats.averageScore);

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Candidate Profile Strip */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Vailism CBT Exam Center • Candidate Record
              </div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {candidate.name}
              </h1>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Roll Number: {candidate.rollNumber} {candidate.email && `• ${candidate.email}`}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mistakeCount > 0 && (
              <button
                onClick={handleLaunchMistakeDrill}
                disabled={drillLoading}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs px-3 py-1.5 rounded transition cursor-pointer disabled:opacity-50"
                title="Launch a test of past mistake questions"
              >
                <span>{drillLoading ? 'Loading...' : `Retest Mistakes (${mistakeCount})`}</span>
              </button>
            )}
            <button
              onClick={handleLaunchRemedialMock}
              disabled={remedialLoading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs px-3 py-1.5 rounded transition cursor-pointer disabled:opacity-50"
              title="Target weak NCERT chapters with an automated 45-question diagnostic exam"
            >
              <span>{remedialLoading ? 'Building Test...' : 'Targeted Practice (45 Qs)'}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> Rename
            </button>
            <button
              onClick={() => router.push('/instructions')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded shadow-xs transition cursor-pointer"
            >
              New Mock CBT
            </button>
          </div>
        </div>

        {/* AIIMS & GOVERNMENT MEDICAL COLLEGE CUTOFF PREDICTOR (INTERACTIVE) */}
        <CollegePredictorCard
          score={stats.highestScore || stats.averageScore || 0}
          maxScore={720}
        />

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Attempts */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs premium-card"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Attempts
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {stats.totalAttempts}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Completed mock sessions</div>
          </motion.div>

          {/* Highest Score */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs premium-card"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Highest Score
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {stats.highestScore} <span className="text-xs text-slate-400 font-normal">/ 720</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Peak performance</div>
          </motion.div>

          {/* Average Score */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs premium-card"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Score
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {stats.averageScore} <span className="text-xs text-slate-400 font-normal">/ 720</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Mean overall score</div>
          </motion.div>

          {/* Overall Accuracy */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs premium-card"
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Accuracy
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
              {stats.averageAccuracy}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Precision rate</div>
          </motion.div>
        </div>

        {/* NCERT CHAPTER MASTER HEATMAP */}
        {data.chapterHeatmap && data.chapterHeatmap.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-700" />
                  <span>NCERT Chapter Mastery Matrix ({data.chapterHeatmap.length} Chapters)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accuracy and historical performance distribution across official mock attempts.
                </p>
              </div>

              {/* Status Pills Summary */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'MASTERED').length} Mastered (≥75%)
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'PRACTICE').length} Review (50–74%)
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'CRITICAL').length} Critical (&lt;50%)
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium border border-slate-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'UNATTEMPTED').length} Unattempted
                </span>
              </div>
            </div>

            {/* Remedial Mock Trigger for Critical Gaps */}
            {data.chapterHeatmap.some((c) => c.status === 'CRITICAL') && (
              <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-700 font-medium">
                  Identified <strong>{data.chapterHeatmap.filter((c) => c.status === 'CRITICAL').length} chapters</strong> with &lt;50% accuracy.
                </span>
                <button
                  onClick={handleLaunchRemedialMock}
                  disabled={remedialLoading}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-3 py-1 rounded transition cursor-pointer"
                >
                  <span>{remedialLoading ? 'Preparing...' : 'Target Weak Chapters (45 Qs)'}</span>
                </button>
              </div>
            )}

            {/* Subject Tabs */}
            <div className="flex flex-wrap items-center gap-2 mt-4 mb-4">
              {(['ALL', 'PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveHeatmapSubject(sub)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeHeatmapSubject === sub
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sub === 'ALL' ? 'All 4 Subjects' : sub}
                </button>
              ))}
            </div>

            {/* Chapters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {data.chapterHeatmap
                .filter((ch) => activeHeatmapSubject === 'ALL' || ch.subjectCode === activeHeatmapSubject)
                .map((ch) => {
                  const badgeConfig = {
                    MASTERED: {
                      bg: 'bg-emerald-50/80 border-emerald-200',
                      badge: 'bg-emerald-600 text-white',
                      text: 'text-emerald-950',
                      label: `${ch.accuracy}% Mastered`,
                    },
                    PRACTICE: {
                      bg: 'bg-amber-50/80 border-amber-200',
                      badge: 'bg-amber-500 text-white',
                      text: 'text-amber-950',
                      label: `${ch.accuracy}% Review`,
                    },
                    CRITICAL: {
                      bg: 'bg-rose-50/80 border-rose-200',
                      badge: 'bg-rose-600 text-white',
                      text: 'text-rose-950',
                      label: `${ch.accuracy}% Critical`,
                    },
                    UNATTEMPTED: {
                      bg: 'bg-slate-50 border-slate-200',
                      badge: 'bg-slate-300 text-slate-700',
                      text: 'text-slate-700',
                      label: 'Unattempted',
                    },
                  }[ch.status];

                  return (
                    <div
                      key={ch.chapterId}
                      className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${badgeConfig.bg}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {ch.subjectName}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${badgeConfig.badge}`}>
                            {badgeConfig.label}
                          </span>
                        </div>
                        <div className={`text-xs font-bold line-clamp-2 ${badgeConfig.text}`} title={ch.chapterName}>
                          {ch.chapterName}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono text-[10px]">
                          {ch.totalAttempted > 0 ? `${ch.correct}/${ch.totalAttempted} Qs` : '0 Qs taken'}
                        </span>
                        <button
                          onClick={() => router.push('/practice')}
                          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer"
                        >
                          Practice
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* RECENT ATTEMPTS & HISTORY */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Examination History & Attempt Records</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Showing {recentAttempts.length} of {stats.totalAttempts} attempts
            </span>
          </div>

          {recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Examination</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Accuracy</th>
                    <th className="p-3.5">Correct / Wrong</th>
                    <th className="p-3.5">Phy • Chem • Bot • Zoo</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {att.title}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {att.mode}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {new Date(att.startedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-900 text-sm">
                        {att.totalScore ?? 0} / {att.maxScore}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{att.accuracy ?? 0}%</span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        <span className="text-emerald-700 font-bold">+{att.correctCount ?? 0}</span> /{' '}
                        <span className="text-rose-600 font-bold">-{att.incorrectCount ?? 0}</span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {att.physicsScore ?? 0} • {att.chemistryScore ?? 0} • {att.botanyScore ?? 0} •{' '}
                        {att.zoologyScore ?? 0}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => router.push(`/exam/${att.id}/result`)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Result
                        </button>
                        <button
                          onClick={() => router.push(`/exam/${att.id}/solutions`)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Solutions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-xs text-slate-500">
              No examination attempts completed yet. Click &quot;Start New Mock CBT&quot; to begin!
            </div>
          )}
        </div>
      </div>

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Rename Student"
        subtitle="Update the candidate name and roll number for tracking analytics and test records."
        confirmLabel="Save Profile"
      />
    </div>
  );
}
