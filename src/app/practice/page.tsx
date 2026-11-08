'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  Zap,
  HelpCircle,
  User,
  Edit2,
} from 'lucide-react';
import {
  getClientCandidate,
  CandidateInfo,
  DEFAULT_CANDIDATE,
} from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';

interface SubjectWithChapters {
  id: string;
  code: string;
  name: string;
  chapters: Array<{
    id: string;
    name: string;
    _count: { questions: number };
  }>;
  _count: { questions: number };
}

export default function PracticeModePage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<SubjectWithChapters[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('PHYSICS');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<string>('ALL');
  const [isTimed, setIsTimed] = useState<boolean>(true);
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);

  const [candidate, setCandidate] = useState<CandidateInfo>(DEFAULT_CANDIDATE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = getClientCandidate();
    setCandidate(current);

    const handleUpdate = (e: any) => {
      setCandidate(e.detail || getClientCandidate());
    };

    window.addEventListener('neet_candidate_updated', handleUpdate);

    // Fetch subjects & chapters
    fetch('/api/meta/chapters')
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects) setSubjects(data.subjects);
      })
      .catch((e) => console.error(e));

    return () => window.removeEventListener('neet_candidate_updated', handleUpdate);
  }, []);

  const activeSubjectObj = subjects.find((s) => s.code === selectedSubject);
  const availableChapters = activeSubjectObj?.chapters || [];

  const handleConfirmedPractice = async (c: CandidateInfo) => {
    setLoading(true);
    setError(null);

    try {
      const durationMinutes = isTimed ? Math.max(10, Math.round(questionCount * 1.5)) : 180;

      const res = await fetch('/api/exam/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: c.rollNumber,
          candidateName: c.name,
          mode: 'PRACTICE',
          subjectFilter: selectedSubject !== 'ALL' ? selectedSubject : undefined,
          chapterFilter: selectedChapter || undefined,
          questionCount,
          durationMinutes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start practice session.');

      router.push(`/exam/${data.attemptId}`);
    } catch (err: any) {
      setError(err.message || 'Error creating practice session.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-700/80 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Targeted Subject & Chapter Practice</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black mb-2">NEET Practice Lab</h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Customize practice questions by subject, specific NCERT chapter, volume, and timing.
              Instant KaTeX step-by-step explanations available for every problem.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2.5 bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-400/40 px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer group"
            title="Click to rename candidate"
          >
            <User className="w-4 h-4 text-emerald-300" />
            <div>
              <div className="font-bold flex items-center gap-1">
                <span>{candidate.name}</span>
                <Edit2 className="w-2.5 h-2.5 text-emerald-400 opacity-70 group-hover:opacity-100" />
              </div>
              <div className="text-[10px] text-emerald-200 font-mono">{candidate.rollNumber}</div>
            </div>
          </button>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-lg">
              {error}
            </div>
          )}

          {/* 1. Select Subject */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
              1. Select Subject
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { code: 'PHYSICS', name: 'Physics' },
                { code: 'CHEMISTRY', name: 'Chemistry' },
                { code: 'BOTANY', name: 'Botany' },
                { code: 'ZOOLOGY', name: 'Zoology' },
              ].map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(s.code);
                    setSelectedChapter('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSubject === s.code
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 font-bold'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-bold">{s.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">45 NTA Questions</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Select Chapter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>2. Select Specific Chapter (Optional)</span>
              {selectedChapter && (
                <button
                  type="button"
                  onClick={() => setSelectedChapter('')}
                  className="text-xs text-emerald-700 hover:underline font-semibold"
                >
                  Clear Selection (All Chapters)
                </button>
              )}
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Chapters ({selectedSubject})</option>
              {availableChapters.map((ch) => (
                <option key={ch.id} value={ch.name}>
                  {ch.name} ({ch._count.questions} Questions)
                </option>
              ))}
            </select>
          </div>

          {/* 3. Number of Questions & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                3. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 45].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                      questionCount === cnt
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                4. Difficulty Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'EASY', label: 'Easy' },
                  { id: 'MODERATE', label: 'Mod' },
                  { id: 'DIFFICULT', label: 'Diff' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                      difficulty === d.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Mode Toggles */}
          <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <div className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Timed Session ({questionCount * 1.5} Minutes)
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">
                  Simulate speed and pace with countdown timer
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={instantFeedback}
                onChange={(e) => setInstantFeedback(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <div className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Instant Detailed Solutions
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">
                  View complete explanations immediately after submission
                </div>
              </div>
            </label>
          </div>

          {/* Start Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? 'Preparing Practice Questions...' : `Start Practice Session (${questionCount} Questions)`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmedPractice}
        title="Candidate Verification"
        subtitle="Confirm candidate name and roll number before starting practice."
        confirmLabel="Start Practice Now"
      />
    </div>
  );
}
