'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Sparkles,
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
        <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-md w-full text-center shadow-card">
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
    <div className="flex-1 bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Candidate Profile Strip */}
        <div className="bg-white rounded-3xl shadow-card border border-slate-200 p-6 sm:p-7 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Student Performance Analytics
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {candidate.name}
              </h1>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Roll Number: {candidate.rollNumber} {candidate.email && `• ${candidate.email}`}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {mistakeCount > 0 && (
              <button
                onClick={handleLaunchMistakeDrill}
                disabled={drillLoading}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Launch a personalized test of past mistake questions"
              >
                <Target className="w-4 h-4 text-red-700" />
                <span>{drillLoading ? 'Loading...' : `Mistake Drill (${mistakeCount} Qs)`}</span>
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" /> Rename Student
            </button>
            <button
              onClick={() => router.push('/instructions')}
              className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Start New Mock CBT
            </button>
          </div>
        </div>

        {/* PROJECTED NEET UG STANDING & COLLEGE TARGET */}
        {stats.totalAttempts > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-elevated border border-blue-900/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
              <div className="max-w-2xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-amber-300" />
                  <span>NTA Percentile & Cutoff Projection (Based on Best Score: {stats.highestScore}/720)</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1 flex items-center gap-2.5 font-mono">
                  <span>{prediction.estimatedAirRange}</span>
                  <span className="text-sm font-semibold text-emerald-300">({prediction.estimatedPercentile}%ile)</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {prediction.admissionOutlook}
                </p>
              </div>

              <div className={`px-4 py-2.5 rounded-2xl text-xs font-bold border backdrop-blur-md shadow-xs ${prediction.tierColor}`}>
                {prediction.badge}
              </div>
            </div>
          </div>
        )}

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Attempts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Attempts
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1.5 font-mono">
              {stats.totalAttempts}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Full mocks & practice</div>
          </div>

          {/* Highest Score */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-card">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Highest Score
            </div>
            <div className="text-3xl font-black text-emerald-700 mt-1.5 font-mono">
              {stats.highestScore} <span className="text-xs text-slate-500 font-normal">/ 720</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Best performance</div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-card">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Average Score
            </div>
            <div className="text-3xl font-black text-blue-900 mt-1.5 font-mono">
              {stats.averageScore} <span className="text-xs text-slate-500 font-normal">/ 720</span>
            </div>
            <div className="text-[11px] text-blue-600 mt-1">Across all completed</div>
          </div>

          {/* Overall Accuracy */}
          <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-card">
            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Average Accuracy
            </div>
            <div className="text-3xl font-black text-purple-900 mt-1.5 font-mono">
              {stats.averageAccuracy}%
            </div>
            <div className="text-[11px] text-purple-600 mt-1">Precision rate</div>
          </div>
        </div>

        {/* NCERT CHAPTER MASTER HEATMAP */}
        {data.chapterHeatmap && data.chapterHeatmap.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>NCERT Chapter Master Heatmap ({data.chapterHeatmap.length} Chapters)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time accuracy and mastery distribution tracked across all your official mock exam attempts.
                </p>
              </div>

              {/* Status Pills Summary */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'MASTERED').length} Mastered (≥75%)
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'PRACTICE').length} Needs Practice (50–74%)
                </span>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'CRITICAL').length} Critical Gap (&lt;50%)
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  {data.chapterHeatmap.filter((c) => c.status === 'UNATTEMPTED').length} Unattempted
                </span>
              </div>
            </div>

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
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${badgeConfig.bg}`}
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
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
