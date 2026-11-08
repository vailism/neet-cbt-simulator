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
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-800/80 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>NEET UG 2027 Official CBT Mock Examinations</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black mb-2">NEET Mock Test Library (01 – 100)</h1>
              <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Complete 100 full-length, authentic 180-question NEET CBT mock examinations generated from our validated question bank.
                Each paper adheres strictly to NTA difficulty distribution (54 Easy, 90 Moderate, 36 Difficult)
                and official 45-question subject partitions with zero question repetition.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="bg-blue-800/80 border border-blue-400/40 text-blue-100 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>100 Full-Length Mocks Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Bar & Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-700 flex items-center gap-1 mr-1">
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
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === f.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
              title="Click to rename candidate"
            >
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>Candidate: <strong className="uppercase">{candidate.name}</strong></span>
              <span className="text-[10px] text-blue-600 font-mono">({candidate.rollNumber})</span>
              <Edit2 className="w-2.5 h-2.5 text-blue-500 ml-1" />
            </button>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by test number or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            Loading official 100 NEET CBT mock test series...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center text-xs">
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
                  className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                    isCompleted
                      ? 'border-green-200 bg-green-50/10'
                      : isInProgress
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-gray-200'
                  }`}
                >
                  <div>
                    {/* Header Code & Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {paper.code}
                      </span>
                      {isCompleted ? (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Attempted ({paper.totalAttempts}x)
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-400">Not Attempted</span>
                      )}
                    </div>

                    {/* Paper Title */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug">
                      {paper.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Official NEET UG 2027 CBT Full-Length Simulation (180 Questions, 720 Marks)
                    </p>

                    {/* Blueprint Specs */}
                    <div className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-600 space-y-1 mb-4 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Questions:</span>
                        <span className="font-bold text-gray-800">180 Questions (720 Marks)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="font-bold text-gray-800">180 Minutes (3 Hrs)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Subjects:</span>
                        <span className="font-medium text-gray-700">45 Phy • 45 Chem • 45 Bot • 45 Zoo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Difficulty:</span>
                        <span className="font-medium text-gray-700">54 Easy • 90 Mod • 36 Diff</span>
                      </div>
                    </div>

                    {/* Previous Result (if attempted) */}
                    {isCompleted && paper.bestScore !== null && (
                      <div className="mb-4 p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs flex items-center justify-between">
                        <span className="text-green-800 font-semibold">Previous Score:</span>
                        <span className="text-green-950 font-black font-mono">
                          {paper.bestScore} / 720 ({paper.bestAccuracy}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                    {isInProgress ? (
                      <button
                        onClick={() => triggerLaunchPaper(paper.id, false)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Examination
                      </button>
                    ) : isCompleted ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/result`)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-lg text-xs transition-colors border border-gray-300 cursor-pointer"
                          >
                            Result
                          </button>
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/solutions`)}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold py-2 rounded-lg text-xs transition-colors border border-indigo-200 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Solutions
                          </button>
                        </div>
                        <button
                          onClick={() => triggerLaunchPaper(paper.id, true)}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          title="Retake CBT examination"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retake Examination
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => triggerLaunchPaper(paper.id, false)}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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
          <div className="bg-white rounded-xl p-12 text-center text-xs text-gray-500 border border-gray-200">
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
