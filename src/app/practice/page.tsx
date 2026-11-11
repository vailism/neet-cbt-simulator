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
  Check,
  Target,
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
    <div className="flex-1 bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-elevated border border-emerald-800/40">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-emerald-800/60 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Targeted NCERT Subject & Chapter Practice</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                NEET Practice Lab
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                Configure custom question sets by subject, specific NCERT chapter, volume, and pacing.
                Instant step-by-step KaTeX solutions available for every single question.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2.5 bg-emerald-950/70 hover:bg-emerald-950 border border-emerald-400/40 px-3.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer group shadow-xs"
              title="Click to rename candidate"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                {candidate.name ? candidate.name.charAt(0) : 'S'}
              </div>
              <div>
                <div className="font-bold flex items-center gap-1 text-white text-xs">
                  <span>{candidate.name}</span>
                  <Edit2 className="w-2.5 h-2.5 text-emerald-300 opacity-70 group-hover:opacity-100" />
                </div>
                <div className="text-[10px] text-emerald-200 font-mono">{candidate.rollNumber}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl flex items-center gap-2">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* 1. Select Subject */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>1. Select Subject</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { code: 'PHYSICS', name: 'Physics', desc: 'Mechanics, Optics, Modern' },
                { code: 'CHEMISTRY', name: 'Chemistry', desc: 'Physical, Organic, Inorganic' },
                { code: 'BOTANY', name: 'Botany', desc: 'Plant Physio, Genetics' },
                { code: 'ZOOLOGY', name: 'Zoology', desc: 'Human Physio, Biotech' },
              ].map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(s.code);
                    setSelectedChapter('');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedSubject === s.code
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-600 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold">{s.name}</div>
                    {selectedSubject === s.code && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Select Chapter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>2. Select Specific Chapter (Optional)</span>
              </span>
              {selectedChapter && (
                <button
                  type="button"
                  onClick={() => setSelectedChapter('')}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                >
                  Clear Selection (All Chapters)
                </button>
              )}
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 45].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
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
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      difficulty === d.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Mode Toggles */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Timed Session ({Math.round(questionCount * 1.5)} Minutes)</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Simulate speed and pace with standard timer
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={instantFeedback}
                onChange={(e) => setInstantFeedback(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Instant Detailed Solutions</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
            >
              {loading ? (
                'Preparing Practice Questions...'
              ) : (
                <>
                  <span>Start Practice Session ({questionCount} Questions)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
