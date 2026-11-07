'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  Play,
  RotateCcw,
  FileCheck,
  Sparkles,
  Layers,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface MockPaperCard {
  id: string;
  paperNumber: number;
  code: string;
  title: string;
  description?: string;
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
  attemptStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  totalAttempts: number;
  latestAttemptId?: string | null;
  bestScore?: number | null;
  bestAccuracy?: number | null;
  lastAttemptDate?: string | null;
}

export default function MockPaperLibraryPage() {
  const router = useRouter();

  const [papers, setPapers] = useState<MockPaperCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNATTEMPTED' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingMore, setGeneratingMore] = useState(false);

  const [candidateRoll, setCandidateRoll] = useState('240410012345');
  const [candidateName, setCandidateName] = useState('KUMAR ADITYA');

  const loadPapers = useCallback(async () => {
    setLoading(true);
    try {
      const roll = localStorage.getItem('neet_candidate_roll') || '240410012345';
      const name = localStorage.getItem('neet_candidate_name') || 'KUMAR ADITYA';
      setCandidateRoll(roll);
      setCandidateName(name);

      const res = await fetch(`/api/papers?rollNumber=${roll}`);
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
    loadPapers();
  }, [loadPapers]);

  const handleLaunchPaper = async (
    paperId: string,
    forceNew = false,
    mode: 'FULL_MOCK' | 'OMR_SIMULATION' = 'FULL_MOCK'
  ) => {
    try {
      const res = await fetch(`/api/papers/${paperId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: candidateRoll,
          forceNewAttempt: forceNew,
          mode,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to launch examination.');

      if (json.mode === 'OMR_SIMULATION' || mode === 'OMR_SIMULATION') {
        router.push(`/omr/${json.attemptId}`);
      } else {
        router.push(`/exam/${json.attemptId}`);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to launch paper.');
    }
  };

  const handleGenerateNextBatch = async () => {
    setGeneratingMore(true);
    try {
      const currentHighest = papers.length > 0 ? Math.max(...papers.map((p) => p.paperNumber)) : 0;
      const startNumber = currentHighest + 1;
      const endNumber = Math.min(100, startNumber + 9);

      if (startNumber > 100) {
        alert('All 100 mock papers have already been generated!');
        setGeneratingMore(false);
        return;
      }

      const res = await fetch('/api/papers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNumber, endNumber }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate more papers.');

      alert(`Successfully generated Mock Papers ${startNumber} to ${endNumber}!`);
      loadPapers();
    } catch (e: any) {
      alert(e.message || 'Error generating papers.');
    } finally {
      setGeneratingMore(false);
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
              <h1 className="text-xl sm:text-3xl font-black mb-2">NEET Mock Test Library (01 – 10)</h1>
              <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Complete 10 full-length, authentic 180-question NEET CBT mock examinations generated from our validated question bank.
                Each paper adheres strictly to NTA difficulty distribution (54 Easy, 90 Moderate, 36 Difficult)
                and official 45-question subject partitions with zero question repetition.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleGenerateNextBatch}
                disabled={generatingMore || papers.length >= 100}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-blue-950 text-xs font-bold px-4 py-2.5 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {generatingMore ? 'Generating Papers...' : 'Generate Next 10 Mock Papers'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
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
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  statusFilter === f.id
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by test number or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Mock Papers Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800 mx-auto mb-3"></div>
            Loading Mock Papers Library...
          </div>
        ) : filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPapers.map((paper) => {
              const isCompleted = paper.attemptStatus === 'COMPLETED';
              const isInProgress = paper.attemptStatus === 'IN_PROGRESS';

              return (
                <div
                  key={paper.id}
                  className={`bg-white rounded-xl shadow-xs border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                    isCompleted
                      ? 'border-green-300 bg-green-50/20'
                      : isInProgress
                      ? 'border-amber-400 bg-amber-50/20'
                      : 'border-gray-200'
                  }`}
                >
                  <div>
                    {/* Badge & Status Strip */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                        {paper.code}
                      </span>
                      {isCompleted && (
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Attempted ({paper.totalAttempts}x)
                        </span>
                      )}
                      {isInProgress && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      )}
                      {!isCompleted && !isInProgress && (
                        <span className="text-gray-400 text-[10px] font-semibold">Not Attempted</span>
                      )}
                    </div>

                    {/* Paper Title */}
                    <h3 className="font-bold text-base text-gray-900 leading-snug mb-1">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                      {paper.description || 'Full 180-Question Mock Test with Official NTA CBT layout'}
                    </p>

                    {/* Specifications Grid */}
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-[11px] space-y-1 font-mono text-gray-700 mb-4">
                      <div className="flex justify-between">
                        <span>Total Questions:</span>
                        <strong className="text-gray-900">{paper.totalQuestions} Questions (720 Marks)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <strong className="text-gray-900">{paper.durationMinutes} Minutes (3 Hrs)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Subjects:</span>
                        <strong className="text-blue-900">45 Phy • 45 Chem • 45 Bot • 45 Zoo</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Difficulty:</span>
                        <strong className="text-purple-900">{paper.easyCount} Easy • {paper.moderateCount} Mod • {paper.difficultCount} Diff</strong>
                      </div>
                    </div>

                    {/* Score preview if attempted */}
                    {isCompleted && paper.bestScore !== null && (
                      <div className="mb-4 p-2.5 rounded bg-green-50 border border-green-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-green-800">Previous Score:</span>
                        <span className="font-black text-green-950 text-sm">
                          {paper.bestScore} / 720 ({paper.bestAccuracy}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                    {isInProgress ? (
                      <button
                        onClick={() => handleLaunchPaper(paper.id, false)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Examination
                      </button>
                    ) : isCompleted ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/result`)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-lg text-xs transition-colors border border-gray-300"
                          >
                            Result
                          </button>
                          <button
                            onClick={() => router.push(`/exam/${paper.latestAttemptId}/solutions`)}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold py-2 rounded-lg text-xs transition-colors border border-indigo-200 flex items-center justify-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Solutions
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleLaunchPaper(paper.id, true, 'FULL_MOCK')}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                            title="Retake in CBT mode"
                          >
                            <RotateCcw className="w-3 h-3" /> CBT Retake
                          </button>
                          <button
                            onClick={() => handleLaunchPaper(paper.id, true, 'OMR_SIMULATION')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                            title="Retake in OMR Simulation mode"
                          >
                            <Layers className="w-3 h-3" /> OMR Retake
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleLaunchPaper(paper.id, false, 'FULL_MOCK')}
                          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" /> CBT Exam
                        </button>
                        <button
                          onClick={() => handleLaunchPaper(paper.id, false, 'OMR_SIMULATION')}
                          className="bg-indigo-900 hover:bg-indigo-950 text-amber-300 font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5" /> OMR Exam
                        </button>
                      </div>
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
    </div>
  );
}

