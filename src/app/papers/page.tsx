'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Clock,
  Sparkles,
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
} from 'lucide-react';
import {
  getClientCandidate,
  CandidateInfo,
  DEFAULT_CANDIDATE,
} from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';

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
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-elevated border border-blue-900/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-blue-800/60 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>NTA NEET UG 2027 Full-Length Examination Series</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                NEET Mock Test Library (01 – {papers.length || 100})
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {papers.length || 100} full-length, authentic 180-question NEET CBT mock examinations generated from our validated question bank.
                Each paper adheres strictly to NTA difficulty distribution (54 Easy, 90 Moderate, 36 Difficult)
                and official 45-question subject partitions with zero question repetition.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="bg-slate-900/80 border border-blue-400/30 text-blue-200 text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-sm backdrop-blur-md">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{papers.length || 100} Full Mocks Ready</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateNextBatch}
                disabled={generatingBatch}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 text-slate-950 font-black px-4 py-3 rounded-2xl flex items-center gap-2 shadow-md transition-all cursor-pointer text-xs"
                title="Generate 10 more unique full-length mock examinations"
              >
                <PlusCircle className={`w-4 h-4 ${generatingBatch ? 'animate-spin' : ''}`} />
                <span>{generatingBatch ? 'Generating 10 Mocks...' : '+ Generate Next 10 Papers'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generation Notification Toast */}
        {genNotification && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3 rounded-2xl flex items-center justify-between text-xs font-medium shadow-xs">
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

        {/* Candidate Bar & Filter Toolbar */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-blue-700" /> Filter:
            </span>
            {(
              [
                { id: 'ALL', label: `All Papers (${papers.length})` },
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
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Active Candidate Badge with Rename Trigger */}
            <button
              type="button"
              onClick={() => {
                setPendingLaunch(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200 px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              title="Click to rename candidate"
            >
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>Candidate: <strong className="uppercase">{candidate.name}</strong></span>
              <span className="text-[10px] text-blue-600 font-mono">({candidate.rollNumber})</span>
              <Edit2 className="w-2.5 h-2.5 text-blue-500 ml-0.5" />
            </button>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by test number or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs text-slate-800 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="w-10 h-10 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-slate-600 text-sm font-semibold">
              Loading official 100 NEET CBT mock test series...
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl text-center text-xs">
            {error}
          </div>
        ) : filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPapers.map((paper) => {
              const isCompleted = paper.attemptStatus === 'COMPLETED';
              const isInProgress = paper.attemptStatus === 'IN_PROGRESS';

              return (
                <div
                  key={paper.id}
                  className={`bg-white rounded-2xl border p-5 shadow-card flex flex-col justify-between transition-all hover:shadow-elevated hover:-translate-y-0.5 ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : isInProgress
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header Code & Badge */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                        {paper.code}
                      </span>
                      {isCompleted ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Attempted ({paper.totalAttempts}x)
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> In Progress
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">Not Attempted</span>
                      )}
                    </div>

                    {/* Paper Title */}
                    <h3 className="text-sm font-extrabold text-slate-900 mb-1 leading-snug">
                      {paper.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Official NEET UG 2027 CBT Full-Length Simulation (180 Questions, 720 Marks)
                    </p>

                    {/* Blueprint Specs */}
                    <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 space-y-1 mb-4 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Questions:</span>
                        <span className="font-bold text-slate-900">180 Questions (720 Marks)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <span className="font-bold text-slate-900">180 Minutes (3 Hrs)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subjects:</span>
                        <span className="font-medium text-slate-700">45 Phy • 45 Chem • 45 Bot • 45 Zoo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Difficulty:</span>
                        <span className="font-medium text-slate-700">54 Easy • 90 Mod • 36 Diff</span>
                      </div>
                    </div>

                    {/* Previous Result (if attempted) */}
                    {isCompleted && paper.bestScore !== null && (
                      <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Previous Best Score</span>
                          <span className="text-emerald-950 font-black font-mono text-sm">
                            {paper.bestScore} <span className="text-xs text-slate-500 font-normal">/ 720</span>
                          </span>
                        </div>
                        {paper.bestAccuracy !== null && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Attempt Accuracy</span>
                            <span className="text-emerald-800 font-bold font-mono text-xs">
                              {paper.bestAccuracy}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    {isInProgress ? (
                      <button
                        onClick={() => triggerLaunchPaper(paper.id, false)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Examination
                      </button>
                    ) : isCompleted ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/result`)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors border border-slate-300 cursor-pointer"
                          >
                            Result
                          </button>
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/solutions`)}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold py-2 rounded-xl text-xs transition-colors border border-indigo-200 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Solutions
                          </button>
                        </div>
                        <button
                          onClick={() => triggerLaunchPaper(paper.id, true)}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          title="Retake CBT examination"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retake Examination
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => triggerLaunchPaper(paper.id, false)}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Examination
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-500 border border-slate-200 shadow-xs">
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
