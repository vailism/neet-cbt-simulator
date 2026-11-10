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
  Bookmark,
  MinusCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Target,
  Flame,
  Play,
  Printer,
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
  LineChart,
  Line,
} from 'recharts';
import confetti from 'canvas-confetti';
import { MathRenderer } from '@/components/MathRenderer';
import { calculateNeetPrediction } from '@/lib/neetPredictor';

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
  negativeMarking: {
    grossScore: number;
    marksLost: number;
    netScore: number;
    penaltyPercentage: number;
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
  previousMockComparison?: Array<{
    mockIndex: number;
    attemptId: string;
    title: string;
    mode: string;
    date: string;
    score: number;
    maxScore: number;
    accuracy: number;
    negatives: number;
    isCurrent: boolean;
  }>;
  incorrectNotebook?: Array<{
    id: string;
    order: number;
    subject: string;
    chapter: string;
    statement: string;
    selectedOption: number | null;
    selectedOptionText: string;
    correctAnswer: number;
    correctOptionText: string;
    explanation: string;
    timeSpent: number;
  }>;
  timing: {
    averageTimePerQuestion: number;
    slowestQuestions: Array<{ order: number; subject: string; timeSpent: number; isCorrect: boolean | null }>;
    fastestQuestions: Array<{ order: number; subject: string; timeSpent: number; isCorrect: boolean | null }>;
  };
  questions?: Array<{
    id: string;
    questionOrder: number;
    subjectCode: string;
    timeSpentSeconds: number;
    isCorrect: boolean | null;
    status: string;
  }>;
}

export default function ExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Incorrect Notebook Filter & Bookmarking
  const [notebookFilter, setNotebookFilter] = useState<'ALL' | 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY'>('ALL');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [chapterSearch, setChapterSearch] = useState('');

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch(`/api/exam/${attemptId}/result`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch result.');
        setData(json);

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

  const [drillLoading, setDrillLoading] = useState(false);

  const handleLaunchMistakeDrill = async () => {
    if (!data?.candidate?.rollNumber) return;
    setDrillLoading(true);
    try {
      const res = await fetch('/api/exam/mistake-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: data.candidate.rollNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start remedial drill.');
      router.push(`/exam/${json.attemptId}`);
    } catch (e: any) {
      alert(e.message || 'Error launching drill.');
      setDrillLoading(false);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const {
    overall,
    negativeMarking,
    subjectWise,
    chapterWise,
    difficultyWise,
    weakChapters,
    strongChapters,
    previousMockComparison,
    incorrectNotebook = [],
    timing,
  } = data;

  const pieData = [
    { name: 'Correct', value: overall.correctCount, color: '#16a34a' },
    { name: 'Incorrect', value: overall.incorrectCount, color: '#dc2626' },
    { name: 'Unattempted', value: overall.unattemptedCount, color: '#94a3b8' },
  ];

  const subjectChartData = subjectWise.map((s) => ({
    name: s.name,
    score: s.score,
    maxScore: s.maxScore,
    accuracy: s.accuracy,
  }));

  const filteredNotebook = incorrectNotebook.filter((item) => {
    if (notebookFilter === 'ALL') return true;
    return item.subject === notebookFilter;
  });

  const filteredChapters = chapterWise.filter((c) => {
    if (!chapterSearch) return true;
    const q = chapterSearch.toLowerCase();
    return c.chapter.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q);
  });

  const prediction = calculateNeetPrediction(overall.totalScore, overall.maxScore);

  const timeTraps = (data.questions || []).filter(
    (q: any) => (q.timeSpentSeconds || 0) >= 150 && q.isCorrect !== true
  );
  const totalTimeTrapSeconds = timeTraps.reduce(
    (acc: number, q: any) => acc + (q.timeSpentSeconds || 0),
    0
  );

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* TOP SCORECARD BANNER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-800/80 border border-blue-400/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full mb-2">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>Official NEET UG Performance Scorecard • {data.mode}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{data.title}</h1>
              <div className="text-xs text-blue-200 mt-1 flex flex-wrap items-center gap-3">
                <span>Candidate: <strong>{data.candidate.name}</strong></span>
                <span>•</span>
                <span className="font-mono">Roll: {data.candidate.rollNumber}</span>
                <span>•</span>
                <span>Submitted: {new Date(data.submittedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Total Marks Hero Badge */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-4 text-center min-w-[170px]">
              <div className="text-xs uppercase tracking-wider text-blue-200 font-bold">Total Score</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono my-0.5">
                {overall.totalScore}
                <span className="text-sm text-blue-200 font-normal"> / {overall.maxScore}</span>
              </div>
              <div className="text-xs text-emerald-300 font-bold">
                Accuracy: {overall.accuracy}%
              </div>
            </div>
          </div>

          {/* Quick Mistake Drill Trigger */}
          {overall.incorrectCount > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-blue-200">
                You have <strong>{overall.incorrectCount} mistakes</strong> in this exam. Turn mistakes into mastery with an immediate remedial drill.
              </div>
              <button
                onClick={handleLaunchMistakeDrill}
                disabled={drillLoading}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-blue-950 font-black text-xs px-4 py-2 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Target className="w-4 h-4 text-red-700" />
                <span>{drillLoading ? 'Building Drill...' : `Re-Test My ${overall.incorrectCount} Mistakes`}</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          )}

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-lg p-2.5">
              <span className="text-blue-200 block text-[11px]">Correct Answers (+4)</span>
              <strong className="text-base text-green-300 font-mono font-bold">
                {overall.correctCount} <span className="text-xs font-normal text-blue-200">/ 180</span>
              </strong>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5">
              <span className="text-blue-200 block text-[11px]">Incorrect Answers (-1)</span>
              <strong className="text-base text-red-300 font-mono font-bold">
                {overall.incorrectCount} <span className="text-xs font-normal text-blue-200">questions</span>
              </strong>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5">
              <span className="text-blue-200 block text-[11px]">Unattempted (0)</span>
              <strong className="text-base text-slate-300 font-mono font-bold">
                {overall.unattemptedCount} <span className="text-xs font-normal text-blue-200">questions</span>
              </strong>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5">
              <span className="text-blue-200 block text-[11px]">Total Time Spent</span>
              <strong className="text-base text-amber-300 font-mono font-bold">
                {formatSeconds(overall.totalTimeSpentSeconds)}
              </strong>
            </div>
          </div>
        </div>

        {/* NEET UG PREDICTED ALL INDIA RANK & COLLEGE TIER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>NTA Official Score vs Rank Calibration (NEET UG Standard)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">
                Projected Standing: <span className="text-blue-900 font-mono">{prediction.estimatedAirRange}</span>
              </h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${prediction.tierColor}`}>
              <Award className="w-3.5 h-3.5" />
              <span>{prediction.badge}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Estimated Percentile</span>
              <div className="text-2xl font-black text-blue-950 font-mono mt-1">
                {prediction.estimatedPercentile}%ile
              </div>
              <p className="text-[10px] text-blue-700 mt-0.5">
                Top {Math.max(0.01, Math.round((100 - prediction.estimatedPercentile) * 100) / 100)}% of candidates nationwide
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl md:col-span-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Admission & College Outlook</span>
              <div className="text-sm font-bold text-emerald-950 mt-1">
                {prediction.admissionOutlook}
              </div>
              <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed font-medium">
                💡 <strong>Strategy:</strong> {prediction.guidance}
              </p>
            </div>
          </div>
        </div>

        {/* 1. NEGATIVE MARKING DEEP-DIVE ANALYSIS */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <MinusCircle className="w-4 h-4 text-red-600" />
              Negative Marking Analysis & Score Deduction Impact
            </h3>
            <span className="bg-red-50 text-red-700 font-mono font-bold text-xs px-2 py-0.5 rounded border border-red-200">
              Loss Penalty: -{negativeMarking.marksLost} Marks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-[11px] text-emerald-800 font-semibold">Gross Earned Score</div>
              <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                +{negativeMarking.grossScore}
              </div>
              <div className="text-[10px] text-emerald-700">From {overall.correctCount} correct questions</div>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-[11px] text-red-800 font-semibold">Negative Marking Loss</div>
              <div className="text-xl font-black text-red-700 font-mono mt-0.5">
                -{negativeMarking.marksLost}
              </div>
              <div className="text-[10px] text-red-600">From {overall.incorrectCount} incorrect deductions</div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-[11px] text-blue-800 font-semibold">Official Net Score</div>
              <div className="text-xl font-black text-blue-950 font-mono mt-0.5">
                {negativeMarking.netScore}
              </div>
              <div className="text-[10px] text-blue-700">Gross Score minus Negative Marks</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-[11px] text-amber-800 font-semibold">Score Drag Ratio</div>
              <div className="text-xl font-black text-amber-900 font-mono mt-0.5">
                {negativeMarking.penaltyPercentage}%
              </div>
              <div className="text-[10px] text-amber-700">Percentage of earned score lost</div>
            </div>
          </div>
        </div>

        {/* 1b. TIME-MANAGEMENT & TIME-TRAP ANALYZER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-100 gap-2 mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Time-Management & Pace Analyzer (Time Traps)
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Average Pace: <strong>{overall.averageTimePerQuestion}s / Question</strong>
            </span>
          </div>

          {/* Subject Speed Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              {
                sub: 'Physics',
                target: '80–90s',
                actual: Math.round(
                  (subjectWise.find((s) => s.subject === 'PHYSICS')?.timeSpentSeconds || 0) / 45
                ),
                color: 'text-blue-700',
              },
              {
                sub: 'Chemistry',
                target: '50–60s',
                actual: Math.round(
                  (subjectWise.find((s) => s.subject === 'CHEMISTRY')?.timeSpentSeconds || 0) / 45
                ),
                color: 'text-purple-700',
              },
              {
                sub: 'Botany',
                target: '35–45s',
                actual: Math.round(
                  (subjectWise.find((s) => s.subject === 'BOTANY')?.timeSpentSeconds || 0) / 45
                ),
                color: 'text-emerald-700',
              },
              {
                sub: 'Zoology',
                target: '35–45s',
                actual: Math.round(
                  (subjectWise.find((s) => s.subject === 'ZOOLOGY')?.timeSpentSeconds || 0) / 45
                ),
                color: 'text-amber-700',
              },
            ].map((item) => (
              <div key={item.sub} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <div className="font-bold text-gray-800">{item.sub}</div>
                <div className={`text-lg font-black font-mono mt-0.5 ${item.color}`}>
                  {item.actual}s <span className="text-[10px] text-gray-500 font-normal">/ Q</span>
                </div>
                <div className="text-[10px] text-gray-500">Target Pace: {item.target}</div>
              </div>
            ))}
          </div>

          {/* Time Trap Summary Banner */}
          {timeTraps.length > 0 ? (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>
                  {timeTraps.length} Time Trap Questions Identified ({formatSeconds(totalTimeTrapSeconds)} Wasted)
                </span>
              </div>
              <p className="text-red-800 text-[11px] leading-relaxed">
                You spent over 2.5 minutes on these questions and still got negative or zero marks. In NEET, avoiding these time traps frees up 10–15 minutes for scoring questions in Biology and Chemistry:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {timeTraps.slice(0, 8).map((trap: any) => (
                  <span
                    key={trap.id}
                    className="bg-white border border-red-300 text-red-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  >
                    Q{trap.questionOrder} ({trap.subjectCode}) • {trap.timeSpentSeconds}s ({trap.status === 'NOT_ANSWERED' ? 'Skipped' : 'Incorrect'})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>Flawless Time Discipline! Zero time traps (&gt; 2.5 mins on wrong answers) detected in this exam.</span>
            </div>
          )}
        </div>

        {/* 2. PREVIOUS MOCK COMPARISON (HISTORICAL TIMELINE) */}
        {previousMockComparison && previousMockComparison.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                Previous Mock Comparison & Score Progression
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                {previousMockComparison.length} Examinations Completed
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={previousMockComparison} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="title" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis domain={[0, 720]} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Marks`, 'Score']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1e3a8a"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#1e3a8a' }}
                    activeDot={{ r: 8 }}
                    name="Score (/720)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. CHARTS ROW: SUBJECT MARKS & ATTEMPT DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Subject Performance */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              Subject-Wise Performance (Out of 180 Each)
            </h3>

            <div className="h-60 w-full">
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
              {subjectWise.map((s) => (
                <div key={s.subject} className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                  <div className="font-bold text-gray-800">{s.name}</div>
                  <div className="font-black text-blue-900 text-sm">{s.score} / {s.maxScore}</div>
                  <div className="text-[10px] text-gray-500">Accuracy: {s.accuracy}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Distribution */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Attempt Breakdown & Difficulty Analysis
            </h3>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any, name: any) => [`${val} Questions`, name]} />
                  <Legend verticalAlign="bottom" height={30} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
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

        {/* 4. CHAPTER-WISE ACCURACY BREAKDOWN TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              Chapter-Wise Accuracy & Mastery Matrix ({filteredChapters.length} Chapters)
            </h3>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search chapter or subject..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-56 focus:ring-1 focus:ring-blue-600 outline-hidden"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="p-3">Chapter</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">Correct</th>
                  <th className="p-3 text-center">Incorrect</th>
                  <th className="p-3 text-center">Skipped</th>
                  <th className="p-3 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredChapters.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 font-semibold text-gray-900">{ch.chapter}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {ch.subject}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">{ch.total}</td>
                    <td className="p-3 text-center text-green-700 font-bold font-mono">{ch.correct}</td>
                    <td className="p-3 text-center text-red-600 font-bold font-mono">{ch.incorrect}</td>
                    <td className="p-3 text-center text-gray-400 font-mono">{ch.unattempted}</td>
                    <td className="p-3 text-right font-black text-xs font-mono">
                      <span
                        className={
                          ch.accuracy >= 75
                            ? 'text-emerald-700'
                            : ch.accuracy >= 50
                            ? 'text-amber-700'
                            : 'text-red-600'
                        }
                      >
                        {ch.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. INCORRECT QUESTION NOTEBOOK ("MISTAKE NOTEBOOK") */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-base text-red-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Incorrect Question Notebook & Targeted Revision ({incorrectNotebook.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review questions answered incorrectly, understand conceptual traps, and bookmark them for your revision journal.
              </p>
            </div>

            {/* Subject Filters */}
            <div className="flex items-center gap-1">
              {(['ALL', 'PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setNotebookFilter(filterKey)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    notebookFilter === filterKey
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {filteredNotebook.length > 0 ? (
            <div className="space-y-4">
              {filteredNotebook.map((item) => {
                const isBookmarked = bookmarkedIds.has(item.id);
                return (
                  <div key={item.id} className="border border-red-200 rounded-xl p-4 bg-red-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-red-900 bg-red-100 px-2 py-0.5 rounded text-xs">
                          Q.{item.order}
                        </span>
                        <span className="font-bold text-gray-800 text-xs">
                          {item.subject} • {item.chapter}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleBookmark(item.id)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          isBookmarked
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                        <span>{isBookmarked ? 'Bookmarked' : 'Save for Revision'}</span>
                      </button>
                    </div>

                    <div className="text-xs font-medium text-gray-900">
                      <MathRenderer text={item.statement} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-red-50 border border-red-200 p-2.5 rounded-lg text-red-900">
                        <div className="text-[10px] font-bold text-red-700 uppercase">Your Selection (Incorrect)</div>
                        <div className="font-semibold mt-0.5">
                          Option ({item.selectedOption}): <MathRenderer text={item.selectedOptionText} />
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900">
                        <div className="text-[10px] font-bold text-emerald-700 uppercase">Correct Answer</div>
                        <div className="font-semibold mt-0.5">
                          Option ({item.correctAnswer}): <MathRenderer text={item.correctOptionText} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-3 rounded-lg text-xs text-gray-800 space-y-1">
                      <div className="font-bold text-blue-900">NCERT Solution & Explanation:</div>
                      <MathRenderer text={item.explanation} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-gray-500 italic">
              No incorrect questions found in this category! Outstanding performance.
            </div>
          )}
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

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push(`/exam/${attemptId}/print`)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print official NEET question paper booklet and solutions"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Print Booklet / PDF</span>
            </button>

            {overall.incorrectCount > 0 && (
              <button
                onClick={handleLaunchMistakeDrill}
                disabled={drillLoading}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-blue-950 text-xs font-black px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Target className="w-4 h-4 text-red-900" />
                <span>{drillLoading ? 'Preparing Drill...' : `Mistake Drill (${overall.incorrectCount} Qs)`}</span>
              </button>
            )}
            <button
              onClick={() => router.push('/instructions')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Take Another Mock Exam
            </button>
            <button
              onClick={() => router.push(`/exam/${attemptId}/solutions`)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-5 py-2 rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Review All 180 Solutions
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
