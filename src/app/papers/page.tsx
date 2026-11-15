'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  Search,
  Filter,
  FileCheck,
  User,
  Edit2,
  Award,
  Layers,
  ChevronRight,
  Flame,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  Target,
  BarChart2,
  X,
} from 'lucide-react';
import {
  getClientCandidate,
  CandidateInfo,
  DEFAULT_CANDIDATE,
} from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';

function getAcademicFocus(paperNum: number): { label: string; badgeClass: string } {
  const mod = paperNum % 6;
  switch (mod) {
    case 0:
      return { label: 'Assertion-Reason Intensive', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
    case 1:
      return { label: 'NCERT Core Syllabus', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
    case 2:
      return { label: 'Multi-Statement & Match', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
    case 3:
      return { label: 'High-Yield Numericals', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
    case 4:
      return { label: 'Comprehensive Simulation', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
    case 5:
    default:
      return { label: 'All-India Mock Examination', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

interface MockPaperSummary {
  id: string;
  paperNumber: number;
  code: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalQuestions: number;
  physicsCount: number;
  chemistryCount: number;
  botanyCount: number;
  zoologyCount: number;
  easyCount: number;
  moderateCount: number;
  difficultCount: number;
  syllabusVersion: string;
  createdAt: string;
  attemptStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  totalAttempts: number;
  latestAttemptId: string | null;
  bestScore: number | null;
  bestAccuracy: number | null;
  lastAttemptDate: string | null;
}

export default function MockPapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<MockPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNATTEMPTED' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'OFFICIAL_PYQS' | 'MODERN_MOCKS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [candidate, setCandidate] = useState<CandidateInfo>(DEFAULT_CANDIDATE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingLaunch, setPendingLaunch] = useState<{ paperId: string; forceNew: boolean } | null>(null);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [genNotification, setGenNotification] = useState<string | null>(null);

  const loadPapers = useCallback(async (roll: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/papers?rollNumber=${encodeURIComponent(roll)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch mock papers.');
      setPapers(json.papers || []);
    } catch (e: any) {
      setError(e.message || 'Error loading mock papers.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerateNextBatch = async () => {
    setGeneratingBatch(true);
    setGenNotification(null);
    try {
      const res = await fetch('/api/papers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate mock papers.');
      setGenNotification(`Successfully generated 10 new unique mock papers (Papers ${json.startNumber} – ${json.endNumber})!`);
      await loadPapers(candidate.rollNumber);
    } catch (err: any) {
      alert(err.message || 'Error generating mock papers.');
    } finally {
      setGeneratingBatch(false);
    }
  };

  useEffect(() => {
    const current = getClientCandidate();
    setCandidate(current);
    loadPapers(current.rollNumber);

    const handleUpdate = (e: any) => {
      const c = e.detail || getClientCandidate();
      setCandidate(c);
      loadPapers(c.rollNumber);
    };

    window.addEventListener('neet_candidate_updated', handleUpdate);
    return () => window.removeEventListener('neet_candidate_updated', handleUpdate);
  }, [loadPapers]);

  const triggerLaunchPaper = (paperId: string, forceNew = false) => {
    setPendingLaunch({ paperId, forceNew });
    setIsModalOpen(true);
  };

  const handleConfirmedLaunch = async (c: CandidateInfo) => {
    if (!pendingLaunch) return;
    const { paperId, forceNew } = pendingLaunch;

    try {
      const res = await fetch(`/api/papers/${paperId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: c.rollNumber,
          candidateName: c.name,
          forceNewAttempt: forceNew,
          mode: 'FULL_MOCK',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to launch examination.');

      router.push(`/exam/${json.attemptId}`);
    } catch (e: any) {
      alert(e.message || 'Failed to launch paper.');
    } finally {
      setPendingLaunch(null);
    }
  };

  const filteredPapers = papers.filter((p) => {
    if (categoryFilter === 'OFFICIAL_PYQS' && p.paperNumber > 17) return false;
    if (categoryFilter === 'MODERN_MOCKS' && p.paperNumber <= 17) return false;
    if (statusFilter === 'UNATTEMPTED' && p.attemptStatus !== 'NOT_STARTED') return false;
    if (statusFilter === 'COMPLETED' && p.attemptStatus !== 'COMPLETED') return false;
    if (statusFilter === 'IN_PROGRESS' && p.attemptStatus !== 'IN_PROGRESS') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Hero Banner */}
        <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 border border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-semibold tracking-wide uppercase mb-2">
                <span>Vailism CBT Exam Center • NEET (UG) Examination Series</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                Examination Papers Catalog (100 Mocks)
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                100 full-length 180-question NEET CBT examinations strictly adhering to modern curriculum standards (2015–2026). Includes official past-year question papers and thematic full-length mock examinations with zero duplicate questions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded">
                <span>100 Full Papers Ready</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateNextBatch}
                disabled={generatingBatch}
                className="bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-semibold px-3.5 py-2 rounded flex items-center gap-2 transition cursor-pointer text-xs"
                title="Generate 10 more unique full-length mock examinations"
              >
                <PlusCircle className={`w-3.5 h-3.5 ${generatingBatch ? 'animate-spin' : ''}`} />
                <span>{generatingBatch ? 'Generating 10 Papers...' : 'Generate Next 10 Papers'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generation Notification Toast */}
        {genNotification && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{genNotification}</span>
            </div>
            <button
              onClick={() => setGenNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 100-PAPER COMPLETION HUD */}
        {(() => {
          const completedPapers = papers.filter((p) => p.attemptStatus === 'COMPLETED');
          const completedCount = completedPapers.length;
          const totalPapersCount = papers.length || 100;
          const completionPercentage = Math.round((completedCount / totalPapersCount) * 100);

          const averageScore =
            completedCount > 0
              ? Math.round(
                  completedPapers.reduce((acc, p) => acc + (p.bestScore || 0), 0) / completedCount
                )
              : null;

          const averageAccuracy =
            completedCount > 0
              ? Math.round(
                  completedPapers.reduce((acc, p) => acc + (p.bestAccuracy || 0), 0) / completedCount
                )
              : null;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Library Mastery */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3 premium-card">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Series Progress
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {completedCount} <span className="text-xs text-slate-400 font-normal">/ {totalPapersCount} Complete</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(completionPercentage, 3)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Average Score */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3 premium-card">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Average Score
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {averageScore !== null ? (
                      <>
                        {averageScore} <span className="text-xs text-slate-400 font-normal">/ 720</span>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">No attempts yet</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Govt MBBS benchmark: 650+
                  </div>
                </div>
              </div>

              {/* Card 3: Accuracy Benchmark */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3 premium-card">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <Target className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Accuracy Rate
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {averageAccuracy !== null ? (
                      `${averageAccuracy}%`
                    ) : (
                      <span className="text-xs font-medium text-slate-400">--%</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Precision rate across questions
                  </div>
                </div>
              </div>

              {/* Card 4: 2015-2026 Standard */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3 premium-card">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Curriculum Structure
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    17 PYQs + 83 Mocks
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Zero duplicate question policy
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Primary Category Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            All 100 Papers ({papers.length})
          </button>
          <button
            onClick={() => setCategoryFilter('OFFICIAL_PYQS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'OFFICIAL_PYQS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            Official 2015–2026 Papers (01–17)
          </button>
          <button
            onClick={() => setCategoryFilter('MODERN_MOCKS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'MODERN_MOCKS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            Curated Mock Tests (18–100)
          </button>
        </div>

        {/* Candidate Bar & Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 flex items-center gap-1.5 mr-1 text-[11px]">
              <Filter className="w-3.5 h-3.5 text-slate-600" /> Filter:
            </span>
            {(
              [
                { id: 'ALL', label: `All (${papers.length})` },
                {
                  id: 'UNATTEMPTED',
                  label: `Unattempted (${papers.filter((p) => p.attemptStatus === 'NOT_STARTED').length})`,
                },
                {
                  id: 'IN_PROGRESS',
                  label: `In Progress (${papers.filter((p) => p.attemptStatus === 'IN_PROGRESS').length})`,
                },
                {
                  id: 'COMPLETED',
                  label: `Completed (${papers.filter((p) => p.attemptStatus === 'COMPLETED').length})`,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Active Candidate Badge with Rename Trigger */}
            <button
              type="button"
              onClick={() => {
                setPendingLaunch(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded font-medium text-xs transition-colors cursor-pointer"
              title="Click to rename candidate"
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Candidate: <strong className="uppercase">{candidate.name}</strong></span>
              <span className="text-[10px] text-slate-500 font-mono">({candidate.rollNumber})</span>
              <Edit2 className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
            </button>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search paper or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-slate-800 text-xs text-slate-800 placeholder:text-slate-400 shadow-2xs transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="kbd-cap absolute right-2 top-1.5 text-[9px] text-slate-400 pointer-events-none hidden sm:inline-flex">
                  /
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
            <div className="w-10 h-10 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-slate-600 text-sm font-semibold">
              Loading official 100 NEET CBT mock test series...
            </div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-center text-xs">
            {error}
          </div>
        ) : filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPapers.map((paper) => {
              const isCompleted = paper.attemptStatus === 'COMPLETED';
              const isInProgress = paper.attemptStatus === 'IN_PROGRESS';
              const isOfficialPYQ = paper.paperNumber <= 17;
              const academicFocus = !isOfficialPYQ ? getAcademicFocus(paper.paperNumber) : null;

              return (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white rounded-xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs premium-card ${
                    isOfficialPYQ
                      ? 'border-slate-300 bg-slate-50/20'
                      : isCompleted
                      ? 'border-slate-300'
                      : isInProgress
                      ? 'border-slate-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header Code & Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {paper.code}
                      </span>
                      {isCompleted ? (
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-slate-600" /> Attempted ({paper.totalAttempts}x)
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" /> In Progress
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">Unattempted</span>
                      )}
                    </div>

                    {/* Official PYQ or Focus Pill */}
                    {isOfficialPYQ ? (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Official PYQ (2015–2026)
                        </span>
                      </div>
                    ) : academicFocus ? (
                      <div className="mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${academicFocus.badgeClass}`}>
                          {academicFocus.label}
                        </span>
                      </div>
                    ) : null}

                    {/* Paper Title */}
                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {paper.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3">
                      NEET (UG) CBT Simulation • 180 Questions • 720 Marks
                    </p>

                    {/* Blueprint Specs */}
                    <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-600 space-y-1 mb-3.5 border border-slate-100 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Total Questions:</span>
                        <span className="font-semibold text-slate-900">180 Questions (720M)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Duration:</span>
                        <span className="font-semibold text-slate-900">180 Minutes (3h)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Subjects:</span>
                        <span className="font-medium text-slate-700">45 Phy • 45 Chem • 45 Bot • 45 Zoo</span>
                      </div>

                      {/* Visual Segmented Difficulty Distribution Bar */}
                      <div className="pt-2 mt-1 border-t border-slate-200 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-sans">
                          <span>Difficulty:</span>
                          <span className="font-mono text-slate-700 font-semibold">54 Easy • 90 Mod • 36 Diff</span>
                        </div>
                        <div
                          className="h-1.5 w-full bg-slate-200 rounded overflow-hidden flex"
                          title="54 Easy (30%), 90 Moderate (50%), 36 Difficult (20%)"
                        >
                          <div className="h-full bg-slate-400" style={{ width: '30%' }} />
                          <div className="h-full bg-slate-600" style={{ width: '50%' }} />
                          <div className="h-full bg-slate-900" style={{ width: '20%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Previous Result (if attempted) */}
                    {isCompleted && paper.bestScore !== null && (
                      <div className="mb-3.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-400">Previous Score</span>
                          <span className="text-slate-900 font-bold font-mono text-sm">
                            {paper.bestScore} <span className="text-xs text-slate-400 font-normal">/ 720</span>
                          </span>
                        </div>
                        {paper.bestAccuracy !== null && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-semibold text-slate-400">Accuracy</span>
                            <span className="text-slate-800 font-bold font-mono text-xs">
                              {paper.bestAccuracy}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                    {isInProgress ? (
                      <button
                        onClick={() => triggerLaunchPaper(paper.id, false)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Examination
                      </button>
                    ) : isCompleted ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/result`)}
                            className="flex-1 bg-white hover:bg-slate-50 text-slate-800 font-medium py-1.5 rounded-lg text-xs active:scale-98 transition-all border border-slate-300 cursor-pointer"
                          >
                            Result
                          </button>
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/solutions`)}
                            className="flex-1 bg-white hover:bg-slate-50 text-slate-800 font-medium py-1.5 rounded-lg text-xs active:scale-98 transition-all border border-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-slate-500" /> Solutions
                          </button>
                        </div>
                        <button
                          onClick={() => triggerLaunchPaper(paper.id, true)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Retake examination"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retake Examination
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => triggerLaunchPaper(paper.id, false)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Examination
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center text-xs text-slate-500 border border-slate-200 shadow-xs">
            No mock papers found matching your filter criteria.
          </div>
        )}
      </div>

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingLaunch(null);
        }}
        onConfirm={handleConfirmedLaunch}
        title={pendingLaunch ? 'Verify Candidate Details' : 'Rename Candidate Profile'}
        subtitle={
          pendingLaunch
            ? 'Confirm or edit your candidate name and roll number before starting this examination.'
            : 'Update your candidate profile for tracking your examination results and analytics.'
        }
        confirmLabel={pendingLaunch ? 'Start Examination Now' : 'Save Details'}
      />
    </div>
  );
}
