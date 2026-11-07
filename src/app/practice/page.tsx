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
} from 'lucide-react';

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

  const [candidateRoll, setCandidateRoll] = useState('240410012345');
  const [candidateName, setCandidateName] = useState('KUMAR ADITYA');
  const [candidateId, setCandidateId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const roll = localStorage.getItem('neet_candidate_roll');
    const name = localStorage.getItem('neet_candidate_name');
    const id = localStorage.getItem('neet_candidate_id');
    if (roll) setCandidateRoll(roll);
    if (name) setCandidateName(name);
    if (id) setCandidateId(id);

    // Fetch subjects & chapters
    fetch('/api/meta/chapters')
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects) setSubjects(data.subjects);
      })
      .catch((e) => console.error(e));
  }, []);

  const activeSubjectObj = subjects.find((s) => s.code === selectedSubject);
  const availableChapters = activeSubjectObj?.chapters || [];

  const handleStartPractice = async () => {
    setLoading(true);
    setError(null);

    try {
      let cId = candidateId;
      if (!cId) {
        const loginRes = await fetch('/api/candidate/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: candidateName,
            rollNumber: candidateRoll,
          }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || 'Failed to authenticate');
        cId = loginData.candidate.id;
        localStorage.setItem('neet_candidate_id', cId!);
      }

      const durationMinutes = isTimed ? Math.max(10, Math.round(questionCount * 1.5)) : 180;

      const res = await fetch('/api/exam/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: cId,
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
        {/* Practice Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-1.5 bg-emerald-700/60 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Targeted Topic Mastery</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black mb-2">NEET Practice Mode</h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Strengthen your weak chapters with custom question sets. Practice with instant answer
            feedback, step-by-step KaTeX explanations, and customized timers.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Configuration Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* 1. Subject Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              1. Select Subject
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { code: 'PHYSICS', label: 'Physics' },
                  { code: 'CHEMISTRY', label: 'Chemistry' },
                  { code: 'BOTANY', label: 'Botany' },
                  { code: 'ZOOLOGY', label: 'Zoology' },
                ] as const
              ).map((sub) => {
                const isSelected = selectedSubject === sub.code;
                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(sub.code);
                      setSelectedChapter('');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm">{sub.label}</div>
                    <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                      {subjects.find((s) => s.code === sub.code)?._count.questions || 60}+ Questions
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chapter Selection (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              2. Chapter (Optional - Leave blank for full subject)
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 text-gray-800 font-medium"
            >
              <option value="">All Chapters in {selectedSubject}</option>
              {availableChapters.map((ch) => (
                <option key={ch.id} value={ch.name}>
                  {ch.name} ({ch._count.questions} Qs)
                </option>
              ))}
            </select>
          </div>

          {/* 3. Question Volume & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                3. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 45].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                      questionCount === count
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                4. Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL', label: 'Balanced' },
                  { id: 'EASY', label: 'Easy' },
                  { id: 'MODERATE', label: 'Moderate' },
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
              onClick={handleStartPractice}
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Preparing Practice Questions...' : `Start Practice Session (${questionCount} Questions)`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
