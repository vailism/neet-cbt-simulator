'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  FileCheck,
  User,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import confetti from 'canvas-confetti';

interface ResultData {
  attemptId: string;
  title: string;
  mode: string;
  candidate: {
    name: string;
    rollNumber: string;
  };
  startedAt: string;
  submittedAt: string;
  overall: {
    totalScore: number;
    maxScore: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    accuracy: number;
    totalTimeSpentSeconds: number;
    averageTimePerQuestion: number;
  };
  subjectWise: Array<{
    subject: string;
    name: string;
    score: number;
    maxScore: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
    timeSpentSeconds: number;
  }>;
  chapterWise: Array<{
    chapter: string;
    subject: string;
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
  }>;
  difficultyWise: Record<
    string,
    {
      total: number;
      correct: number;
      incorrect: number;
      accuracy: number;
    }
  >;
  weakChapters: string[];
  strongChapters: string[];
  timing: {
    averageTimePerQuestion: number;
    slowestQuestions: Array<{ order: number; subject: string; timeSpent: number; isCorrect: boolean | null }>;
    fastestQuestions: Array<{ order: number; subject: string; timeSpent: number; isCorrect: boolean | null }>;
  };
}

export default function ExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch(`/api/exam/${attemptId}/result`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch result.');
        setData(json);

        // Fire celebratory confetti if score is solid
        if (json.overall.totalScore >= 300) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (e: any) {
        setError(e.message || 'Error loading examination result.');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
        <div className="text-base font-bold text-gray-800">Calculating Official Exam Result...</div>
        <div className="text-xs text-gray-500 mt-1">Applying NEET marking scheme (+4 / -1 / 0)</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-xl border border-red-200 max-w-md w-full text-center shadow">
          <XCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Result Error</h2>
          <p className="text-xs text-red-600 mb-4">{error || 'Unable to display result.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-700 text-white text-xs font-bold py-2 rounded-md"
          >
            Return to Examination Portal
          </button>
        </div>
      </div>
    );
  }

  const { overall, subjectWise, difficultyWise, weakChapters, strongChapters, timing } = data;

  // Pie chart data for breakdown
  const pieData = [
    { name: 'Correct', value: overall.correctCount, color: '#16a34a' },
    { name: 'Incorrect', value: overall.incorrectCount, color: '#dc2626' },
    { name: 'Unattempted', value: overall.unattemptedCount, color: '#94a3b8' },
  ];

  // Subject bar chart data
  const subjectChartData = subjectWise.map((s) => ({
    name: s.name,
    score: s.score,
    maxScore: s.maxScore,
    accuracy: s.accuracy,
  }));

  // Score percent
  const scorePercent = overall.maxScore > 0 ? Math.round((overall.totalScore / overall.maxScore) * 100) : 0;

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-wrap items-center justify-between gap-4 border-t-4 border-t-blue-700">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              National Testing Agency (NTA) • Examination Scorecard
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{data.title}</h1>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
              <span>Candidate: <strong className="text-gray-800">{data.candidate.name}</strong></span>
              <span>• Roll No: <strong className="font-mono text-gray-800">{data.candidate.rollNumber}</strong></span>
              <span>• Submitted: {new Date(data.submittedAt).toLocaleTimeString('en-IN')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/exam/${attemptId}/solutions`)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              Review Step-by-Step Solutions
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-bold px-3 py-2.5 rounded-lg transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* OVERALL PERFORMANCE CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Score */}
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">
              Total Score
            </div>
            <div className="text-3xl font-black tracking-tight mt-1">
              {overall.totalScore} <span className="text-xs font-normal text-blue-200">/ {overall.maxScore}</span>
            </div>
            <div className="text-[10px] text-blue-200 mt-1">
              Score Percentage: {scorePercent}%
            </div>
          </div>

          {/* Correct Answers */}
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-green-700">
              <span className="text-xs font-bold">Correct</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-green-700 mt-1">
              {overall.correctCount}
            </div>
            <div className="text-[10px] text-green-600 font-semibold">
              +{overall.correctCount * 4} Marks
            </div>
          </div>

          {/* Incorrect Answers */}
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-red-600">
              <span className="text-xs font-bold">Incorrect</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-red-600 mt-1">
              {overall.incorrectCount}
            </div>
            <div className="text-[10px] text-red-500 font-semibold">
              -{overall.incorrectCount * 1} Negative Marks
            </div>
          </div>

          {/* Unattempted */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span className="text-xs font-bold">Unattempted</span>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-black text-gray-700 mt-1">
              {overall.unattemptedCount}
            </div>
            <div className="text-[10px] text-gray-500 font-semibold">
              0 Marks
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold">Accuracy</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-blue-800 mt-1">
              {overall.accuracy}%
            </div>
            <div className="text-[10px] text-blue-600 font-semibold">
              Attempt Accuracy
            </div>
          </div>

          {/* Time Taken */}
          <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-xs font-bold">Time Taken</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-purple-800 mt-1">
              {Math.floor(overall.totalTimeSpentSeconds / 60)}m
            </div>
            <div className="text-[10px] text-purple-600 font-semibold">
              ~{overall.averageTimePerQuestion}s / question
            </div>
          </div>
        </div>

        {/* VISUAL CHARTS ROW: SUBJECT PERFORMANCE & ATTEMPT DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Subject-Wise Performance Bar Chart */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700" />
                Subject-Wise Marks Breakdown (Out of 180 Each)
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis domain={[-45, 180]} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Marks`, 'Score']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill="#1e3a8a" radius={[4, 4, 0, 0]} name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subject details table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
              {subjectWise.map((s) => (
                <div key={s.subject} className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                  <div className="font-bold text-gray-800">{s.name}</div>
                  <div className="font-black text-blue-900 text-sm">{s.score} / {s.maxScore}</div>
                  <div className="text-[10px] text-gray-500">Acc: {s.accuracy}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Breakdown Donut Chart */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                Attempt & Response Distribution
              </h3>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Questions`, name]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Difficulty Analysis Box */}
            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-green-50 border border-green-200">
                <div className="text-[10px] text-green-800 font-bold">EASY</div>
                <div className="font-black text-green-900">{difficultyWise.EASY?.accuracy || 0}%</div>
                <div className="text-[9px] text-green-700">{difficultyWise.EASY?.correct || 0} / {difficultyWise.EASY?.total || 0}</div>
              </div>
              <div className="p-2 rounded bg-blue-50 border border-blue-200">
                <div className="text-[10px] text-blue-800 font-bold">MODERATE</div>
                <div className="font-black text-blue-900">{difficultyWise.MODERATE?.accuracy || 0}%</div>
                <div className="text-[9px] text-blue-700">{difficultyWise.MODERATE?.correct || 0} / {difficultyWise.MODERATE?.total || 0}</div>
              </div>
              <div className="p-2 rounded bg-purple-50 border border-purple-200">
                <div className="text-[10px] text-purple-800 font-bold">DIFFICULT</div>
                <div className="font-black text-purple-900">{difficultyWise.DIFFICULT?.accuracy || 0}%</div>
                <div className="text-[9px] text-purple-700">{difficultyWise.DIFFICULT?.correct || 0} / {difficultyWise.DIFFICULT?.total || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* WEAK & STRONG CHAPTERS DIAGNOSTIC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weak Chapters (Priority for Revision) */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5">
            <h3 className="font-bold text-red-900 text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Focus Areas & Weak Chapters ({weakChapters.length})
            </h3>
            {weakChapters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weakChapters.map((ch, idx) => (
                  <span
                    key={idx}
                    className="bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded text-xs font-medium"
                  >
                    ⚠️ {ch}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                No weak chapters flagged! Excellent conceptual clarity across attempted chapters.
              </div>
            )}
          </div>

          {/* Strong Chapters */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-5">
            <h3 className="font-bold text-emerald-900 text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Strong Areas & High Accuracy Chapters ({strongChapters.length})
            </h3>
            {strongChapters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {strongChapters.map((ch, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded text-xs font-medium"
                  >
                    ✨ {ch}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Complete more mock exams to solidify strong chapters.
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Back to Home Portal
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/instructions')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Take Another Mock Exam
            </button>
            <button
              onClick={() => router.push(`/exam/${attemptId}/solutions`)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-5 py-2 rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              Review All Solutions & Explanations
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

