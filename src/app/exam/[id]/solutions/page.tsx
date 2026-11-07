'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  BookmarkCheck,
  ArrowLeft,
  Filter,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';

interface SolutionQuestion {
  id: string;
  questionOrder: number;
  subjectCode: 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY';
  chapter: string;
  topic?: string | null;
  difficulty: 'EASY' | 'MODERATE' | 'DIFFICULT';
  statement: string;
  imageUrl?: string | null;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  selectedOption: number | null;
  correctAnswer: number;
  isCorrect: boolean | null;
  status: string;
  explanation: string;
  previousYear?: string | null;
  isVerifiedPYQ: boolean;
  timeSpentSeconds: number;
  marksAwarded: number;
}

export default function ExamSolutionsReviewPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;

  const [questions, setQuestions] = useState<SolutionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED' | 'MARKED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY'>('ALL');
  const [activeQuestionOrder, setActiveQuestionOrder] = useState<number>(1);

  useEffect(() => {
    async function loadSolutions() {
      try {
        const res = await fetch(`/api/exam/${attemptId}/result`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load solutions.');
        setQuestions(json.questions || []);
      } catch (e: any) {
        setError(e.message || 'Error loading solutions.');
      } finally {
        setLoading(false);
      }
    }
    loadSolutions();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
        <div className="text-base font-bold text-gray-800">Loading Detailed Question Solutions...</div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-xl border border-red-200 max-w-md w-full text-center shadow">
          <XCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Error Loading Solutions</h2>
          <p className="text-xs text-red-600 mb-4">{error || 'No questions found for review.'}</p>
          <button
            onClick={() => router.push(`/exam/${attemptId}/result`)}
            className="w-full bg-blue-700 text-white text-xs font-bold py-2 rounded-md"
          >
            Back to Result Summary
          </button>
        </div>
      </div>
    );
  }

  // Filtered Questions List
  const filteredQuestions = questions.filter((q) => {
    // Subject filter
    if (subjectFilter !== 'ALL' && q.subjectCode !== subjectFilter) return false;

    // Status filter
    if (statusFilter === 'CORRECT' && q.isCorrect !== true) return false;
    if (statusFilter === 'INCORRECT' && q.isCorrect !== false) return false;
    if (statusFilter === 'UNATTEMPTED' && q.isCorrect !== null) return false;
    if (statusFilter === 'MARKED' && !q.status.includes('MARKED')) return false;

    return true;
  });

  const currentQ =
    filteredQuestions.find((q) => q.questionOrder === activeQuestionOrder) ||
    filteredQuestions[0] ||
    questions[0];

  const getOptionBadge = (optNum: number) => {
    const isSelected = currentQ.selectedOption === optNum;
    const isOfficialCorrect = currentQ.correctAnswer === optNum;

    if (isOfficialCorrect && isSelected) {
      return {
        bg: 'bg-green-50 border-green-600 text-green-900 ring-1 ring-green-600',
        badge: 'bg-green-600 text-white',
        label: '✓ Your Correct Choice',
      };
    }
    if (isOfficialCorrect) {
      return {
        bg: 'bg-green-50/70 border-green-500 text-green-900',
        badge: 'bg-green-600 text-white',
        label: '✓ Correct Answer',
      };
    }
    if (isSelected) {
      return {
        bg: 'bg-red-50 border-red-500 text-red-900 ring-1 ring-red-500',
        badge: 'bg-red-600 text-white',
        label: '✗ Your Selected Answer',
      };
    }
    return {
      bg: 'bg-white border-gray-200 text-gray-700',
      badge: 'bg-gray-100 text-gray-700 border border-gray-300',
      label: null,
    };
  };

  return (
    <div className="flex-1 bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Header Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/exam/${attemptId}/result`)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors"
              title="Back to Result Scorecard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">
                Examination Solution Review & Step-by-Step Explanations
              </h1>
              <p className="text-xs text-gray-500">
                Detailed analysis of all 180 questions with NCERT explanations and KaTeX math formulas
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg border border-gray-300"
          >
            Student Dashboard
          </button>
        </div>

        {/* Filter Pills Strip */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-gray-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Response:
            </span>
            {(
              [
                { id: 'ALL', label: `All (${questions.length})` },
                {
                  id: 'CORRECT',
                  label: `Correct (${questions.filter((q) => q.isCorrect === true).length})`,
                  color: 'text-green-700',
                },
                {
                  id: 'INCORRECT',
                  label: `Incorrect (${questions.filter((q) => q.isCorrect === false).length})`,
                  color: 'text-red-600',
                },
                {
                  id: 'UNATTEMPTED',
                  label: `Unattempted (${questions.filter((q) => q.isCorrect === null).length})`,
                  color: 'text-gray-600',
                },
                {
                  id: 'MARKED',
                  label: `Marked (${questions.filter((q) => q.status.includes('MARKED')).length})`,
                  color: 'text-purple-700',
                },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  statusFilter === filter.id
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-700 mr-1">Subject:</span>
            {(['ALL', 'PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-0.5 rounded text-xs font-semibold transition-colors ${
                  subjectFilter === sub
                    ? 'bg-blue-100 text-blue-900 border border-blue-300 font-bold'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN QUESTION REVIEW AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Question Viewer (Left/Center) */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {currentQ ? (
              <>
                {/* Question Info Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-950 text-sm">
                      Question No. {currentQ.questionOrder}
                    </span>
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {currentQ.subjectCode}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]">
                      {currentQ.chapter}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    {currentQ.isCorrect === true && (
                      <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> +4 Marks (Correct)
                      </span>
                    )}
                    {currentQ.isCorrect === false && (
                      <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> -1 Mark (Incorrect)
                      </span>
                    )}
                    {currentQ.isCorrect === null && (
                      <span className="bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> 0 Marks (Unattempted)
                      </span>
                    )}
                    <span className="text-gray-500 text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {currentQ.timeSpentSeconds}s
                    </span>
                  </div>
                </div>

                {/* Statement */}
                <div className="text-sm font-medium text-gray-900 leading-relaxed">
                  <MathRenderer text={currentQ.statement} />
                  {currentQ.imageUrl && (
                    <div className="mt-3 max-w-sm border border-gray-200 rounded p-2">
                      <img src={currentQ.imageUrl} alt="Diagram" className="max-h-48 object-contain mx-auto" />
                    </div>
                  )}
                </div>

                {/* Options Review */}
                <div className="space-y-2.5">
                  {[
                    { num: 1, text: currentQ.option1 },
                    { num: 2, text: currentQ.option2 },
                    { num: 3, text: currentQ.option3 },
                    { num: 4, text: currentQ.option4 },
                  ].map((opt) => {
                    const badge = getOptionBadge(opt.num);
                    return (
                      <div
                        key={opt.num}
                        className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-xs sm:text-sm ${badge.bg}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${badge.badge}`}
                          >
                            {opt.num}
                          </span>
                          <div className="leading-relaxed">
                            <MathRenderer text={opt.text} />
                          </div>
                        </div>

                        {badge.label && (
                          <span className="text-[10px] font-bold shrink-0 self-center uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border">
                            {badge.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Step-by-Step Explanation Box */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-xs space-y-2">
                  <div className="font-bold text-amber-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      Detailed Solution & Conceptual Explanation:
                    </span>
                    {currentQ.previousYear && (
                      <span className="bg-amber-200 text-amber-900 text-[10px] font-mono px-2 py-0.5 rounded">
                        {currentQ.previousYear}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-800 leading-relaxed pt-1">
                    <MathRenderer text={currentQ.explanation} />
                  </div>
                </div>

                {/* Navigation Between Questions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const idx = filteredQuestions.findIndex((q) => q.questionOrder === currentQ.questionOrder);
                      if (idx > 0) {
                        setActiveQuestionOrder(filteredQuestions[idx - 1].questionOrder);
                      }
                    }}
                    disabled={filteredQuestions.findIndex((q) => q.questionOrder === currentQ.questionOrder) <= 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Question
                  </button>

                  <span className="text-xs text-gray-500 font-mono">
                    {filteredQuestions.findIndex((q) => q.questionOrder === currentQ.questionOrder) + 1} of{' '}
                    {filteredQuestions.length} in current filter
                  </span>

                  <button
                    onClick={() => {
                      const idx = filteredQuestions.findIndex((q) => q.questionOrder === currentQ.questionOrder);
                      if (idx < filteredQuestions.length - 1) {
                        setActiveQuestionOrder(filteredQuestions[idx + 1].questionOrder);
                      }
                    }}
                    disabled={
                      filteredQuestions.findIndex((q) => q.questionOrder === currentQ.questionOrder) >=
                      filteredQuestions.length - 1
                    }
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-40 shadow-xs"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-gray-500 text-xs">
                No questions match the current filter selection.
              </div>
            )}
          </div>

          {/* Question Navigator Grid (Right Sidebar) */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col max-h-[75vh]">
            <div className="font-bold text-xs text-gray-900 mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Questions List</span>
              <span className="text-gray-500 font-mono text-[11px]">
                Showing {filteredQuestions.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 pr-1">
              {filteredQuestions.map((q) => {
                const isCurrent = q.questionOrder === currentQ?.questionOrder;
                let bg = 'bg-gray-100 text-gray-700 border-gray-300';
                if (q.isCorrect === true) bg = 'bg-green-600 text-white border-green-700';
                else if (q.isCorrect === false) bg = 'bg-red-600 text-white border-red-700';

                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionOrder(q.questionOrder)}
                    className={`h-8 rounded text-xs font-bold flex items-center justify-center border transition-all ${bg} ${
                      isCurrent ? 'ring-2 ring-blue-700 ring-offset-1 font-black scale-105' : 'hover:opacity-90'
                    }`}
                  >
                    {q.questionOrder}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
