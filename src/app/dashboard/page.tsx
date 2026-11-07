'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  CheckCircle,
  Clock,
  TrendingUp,
  FileCheck,
  User,
  RotateCcw,
  BookOpen,
  Calendar,
  Zap,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardData {
  candidate: {
    id: string;
    rollNumber: string;
    name: string;
    email?: string | null;
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
    submittedAt?: string;
    totalScore: number;
    maxScore: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    accuracy: number;
    timeSpentSeconds: number;
    physicsScore: number;
    chemistryScore: number;
    botanyScore: number;
    zoologyScore: number;
  }>;
}

export default function StudentDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const roll = localStorage.getItem('neet_candidate_roll') || '240410012345';

    fetch(`/api/candidate/${roll}/dashboard`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message || 'Failed to fetch dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
        <div className="text-base font-bold text-gray-800">Loading Candidate Dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 max-w-md w-full text-center shadow">
          <User className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">No Profile Found</h2>
          <p className="text-xs text-gray-500 mb-4">
            Please register your candidate details to access your performance dashboard.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-700 text-white text-xs font-bold py-2 rounded-md"
          >
            Go to Candidate Login
          </button>
        </div>
      </div>
    );
  }

  const { candidate, stats, trends, recentAttempts } = data;

  const subjectChartData = [
    { subject: 'Physics', avgScore: stats.subjectAverages.physics, max: 180 },
    { subject: 'Chemistry', avgScore: stats.subjectAverages.chemistry, max: 180 },
    { subject: 'Botany', avgScore: stats.subjectAverages.botany, max: 180 },
    { subject: 'Zoology', avgScore: stats.subjectAverages.zoology, max: 180 },
  ];

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Candidate Profile Strip */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-700 text-white font-black text-xl flex items-center justify-center shadow-sm">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-blue-600">Candidate Dashboard</div>
              <h1 className="text-xl font-black text-gray-900">{candidate.name}</h1>
              <div className="text-xs text-gray-500 font-mono mt-0.5">
                Roll Number: {candidate.rollNumber} {candidate.email && `• ${candidate.email}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/instructions')}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" /> Start New Mock CBT
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Attempts */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Attempts
            </div>
            <div className="text-3xl font-black text-gray-900 mt-1">
              {stats.totalAttempts}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Full mocks & practice</div>
          </div>

          {/* Highest Score */}
          <div className="bg-white rounded-xl border border-green-200 p-4 shadow-xs">
            <div className="text-xs font-bold text-green-700 uppercase tracking-wider">
              Highest Score
            </div>
            <div className="text-3xl font-black text-green-700 mt-1">
              {stats.highestScore} <span className="text-xs text-gray-500 font-normal">/ 720</span>
            </div>
            <div className="text-[11px] text-green-600 mt-1">Best performance</div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Average Score
            </div>
            <div className="text-3xl font-black text-blue-900 mt-1">
              {stats.averageScore} <span className="text-xs text-gray-500 font-normal">/ 720</span>
            </div>
            <div className="text-[11px] text-blue-600 mt-1">Overall average</div>
          </div>

          {/* Average Accuracy */}
          <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs">
            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Overall Accuracy
            </div>
            <div className="text-3xl font-black text-purple-900 mt-1">
              {stats.averageAccuracy}%
            </div>
            <div className="text-[11px] text-purple-600 mt-1">Attempt precision</div>
          </div>
        </div>

        {/* TRENDS & PROGRESS CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Score Trend Line Chart */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-700" />
              Score Progress Over Recent Attempts
            </h3>

            {trends.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 720]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} Marks`, 'Score']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#1e3a8a"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#1e3a8a' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-gray-400">
                Complete your first examination to view progress trends.
              </div>
            )}
          </div>

          {/* Subject-Wise Average Performance */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              Subject-Wise Average Score
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 180]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} / 180 Marks`, 'Average']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="avgScore" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RECENT ATTEMPTS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              Historical Examination Attempts ({recentAttempts.length})
            </h3>
          </div>

          {recentAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Examination</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-center">Accuracy</th>
                    <th className="p-3 text-center">Physics</th>
                    <th className="p-3 text-center">Chemistry</th>
                    <th className="p-3 text-center">Botany</th>
                    <th className="p-3 text-center">Zoology</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {recentAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 font-bold text-blue-950">{att.title}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.mode === 'FULL_MOCK'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {att.mode}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Date(att.startedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-center font-black text-blue-900 text-sm">
                        {att.totalScore} <span className="text-[10px] text-gray-400 font-normal">/ {att.maxScore}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-purple-800">
                        {att.accuracy}%
                      </td>
                      <td className="p-3 text-center font-mono">{att.physicsScore ?? '-'}</td>
                      <td className="p-3 text-center font-mono">{att.chemistryScore ?? '-'}</td>
                      <td className="p-3 text-center font-mono">{att.botanyScore ?? '-'}</td>
                      <td className="p-3 text-center font-mono">{att.zoologyScore ?? '-'}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => router.push(`/exam/${att.id}/result`)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                        >
                          Result
                        </button>
                        <button
                          onClick={() => router.push(`/exam/${att.id}/solutions`)}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-bold border border-blue-200"
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
            <div className="p-8 text-center text-xs text-gray-500">
              No examination attempts recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

