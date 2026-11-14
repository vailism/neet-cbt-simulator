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
  Printer,
  Send,
  MessageSquare,
  Bot,
  Loader2,
  X,
  Lightbulb,
} from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';

function detectSolutionQuestionType(statement: string): { label: string; badgeClass: string } {
  const lower = statement.toLowerCase();
  if (
    (lower.includes('assertion') && lower.includes('reason')) ||
    (statement.includes('Assertion (A)') && statement.includes('Reason (R)'))
  ) {
    return { label: 'Assertion-Reason', badgeClass: 'bg-purple-100 text-purple-900 border-purple-200' };
  }
  if (lower.includes('statement i') && (lower.includes('statement ii') || lower.includes('statement 2'))) {
    return { label: 'Statement I & II', badgeClass: 'bg-sky-100 text-sky-900 border-sky-200' };
  }
  if (lower.includes('match list') || lower.includes('match column') || (statement.includes('List I') && statement.includes('List II'))) {
    return { label: 'Match List', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
  }
  if (
    lower.includes('which of the following statement') ||
    lower.includes('choose the correct answer from the options') ||
    lower.includes('a and b only') ||
    lower.includes('statements are correct')
  ) {
    return { label: 'Multi-Statement MCQ', badgeClass: 'bg-amber-100 text-amber-900 border-amber-200' };
  }
  return { label: 'Standard NCERT MCQ', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
}

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
  const [overallData, setOverallData] = useState<{
    totalScore: number;
    maxScore: number;
    accuracy: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED' | 'MARKED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY'>('ALL');
  const [activeQuestionOrder, setActiveQuestionOrder] = useState<number>(1);

  // AI Tutor States
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const [aiTutorLoading, setAiTutorLoading] = useState(false);
  const [aiTutorResponse, setAiTutorResponse] = useState<string | null>(null);
  const [customDoubt, setCustomDoubt] = useState('');

  // Reset AI Tutor response when question changes
  useEffect(() => {
    setAiTutorResponse(null);
    setCustomDoubt('');
    setAiTutorOpen(false);
  }, [activeQuestionOrder]);

  useEffect(() => {
    async function loadSolutions() {
      try {
        const res = await fetch(`/api/exam/${attemptId}/result`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load solutions.');
        setQuestions(json.questions || []);
        if (json.overall) {
          setOverallData({
            totalScore: json.overall.totalScore ?? 0,
            maxScore: json.overall.maxScore ?? 720,
            accuracy: json.overall.accuracy ?? 0,
            correctCount: json.overall.correctCount ?? 0,
            incorrectCount: json.overall.incorrectCount ?? 0,
            unattemptedCount: json.overall.unattemptedCount ?? 0,
          });
        }
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

  const handleAskAiTutor = async (mode: string, text?: string) => {
    if (!currentQ) return;
    setAiTutorLoading(true);
    setAiTutorOpen(true);
    try {
      const res = await fetch('/api/exam/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: currentQ.statement,
          options: [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4],
          selectedOption: currentQ.selectedOption,
          correctAnswer: currentQ.correctAnswer,
          explanation: currentQ.explanation,
          subjectCode: currentQ.subjectCode,
          chapter: currentQ.chapter,
          mode,
          userDoubt: text || customDoubt,
        }),
      });
      const json = await res.json();
      if (json.success && json.clarification) {
        setAiTutorResponse(json.clarification);
      } else {
        alert(json.error || 'Failed to generate AI tutor explanation.');
      }
    } catch (e: any) {
      alert(e.message || 'Error communicating with AI tutor.');
    } finally {
      setAiTutorLoading(false);
    }
  };

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

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/exam/${attemptId}/print`)}
              className="text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Print official test booklet or export PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Booklet / PDF</span>
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg border border-gray-300"
            >
              Student Dashboard
            </button>
          </div>
        </div>

        {/* SCORECARD SUMMARY HUD */}
        {overallData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Exam Score</div>
              <div className="text-xl font-black text-blue-950 font-mono mt-0.5">
                {overallData.totalScore} <span className="text-xs text-gray-400 font-normal">/ {overallData.maxScore}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                Accuracy: <strong className="text-blue-700">{overallData.accuracy}%</strong>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-emerald-200 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Correct Answers</div>
              <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                {overallData.correctCount} <span className="text-xs text-emerald-600/70 font-normal">Qs (+{overallData.correctCount * 4})</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">+4 marks per question</div>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Incorrect Deductions</div>
              <div className="text-xl font-black text-red-600 font-mono mt-0.5">
                {overallData.incorrectCount} <span className="text-xs text-red-500/70 font-normal">Qs (-{overallData.incorrectCount})</span>
              </div>
              <div className="text-[10px] text-red-600 mt-0.5">-1 negative penalty</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unattempted</div>
              <div className="text-xl font-black text-gray-700 font-mono mt-0.5">
                {overallData.unattemptedCount} <span className="text-xs text-gray-400 font-normal">Qs (0)</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Zero mark deduction</div>
            </div>
          </div>
        )}

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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-blue-950 text-sm">
                      Question No. {currentQ.questionOrder}
                    </span>
                    {(() => {
                      const qType = detectSolutionQuestionType(currentQ.statement);
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${qType.badgeClass}`}>
                          {qType.label}
                        </span>
                      );
                    })()}
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {currentQ.subjectCode}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]">
                      {currentQ.chapter}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    {currentQ.isCorrect === true && (
                      <span className="bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" /> +4 Marks (Correct)
                      </span>
                    )}
                    {currentQ.isCorrect === false && (
                      <span className="bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 border border-red-200">
                        <XCircle className="w-3.5 h-3.5" /> -1 Mark (Incorrect)
                      </span>
                    )}
                    {currentQ.isCorrect === null && (
                      <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 border border-gray-200">
                        <HelpCircle className="w-3.5 h-3.5" /> 0 Marks (Unattempted)
                      </span>
                    )}
                  </div>
                </div>

                {/* Timing & Pacing Benchmark Strip */}
                {(() => {
                  const isBio = currentQ.subjectCode === 'BOTANY' || currentQ.subjectCode === 'ZOOLOGY';
                  const targetSeconds = isBio ? 45 : 90;
                  const isTimeTrap = currentQ.timeSpentSeconds > 120 && currentQ.isCorrect === false;
                  const isRapidCorrect =
                    currentQ.timeSpentSeconds > 0 && currentQ.timeSpentSeconds <= 30 && currentQ.isCorrect === true;

                  return (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="font-mono text-slate-700 flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Time Spent: <strong>{currentQ.timeSpentSeconds}s</strong>
                        <span className="text-slate-400 font-normal">(Target pace: &lt;{targetSeconds}s)</span>
                      </span>

                      {isTimeTrap && (
                        <span className="bg-red-100 text-red-900 border border-red-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          ⚠️ Time Trap: Spent {currentQ.timeSpentSeconds}s &amp; lost -1 mark!
                        </span>
                      )}

                      {isRapidCorrect && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          ⚡ Rapid NCERT Recall (&lt;30s, +4 marks)
                        </span>
                      )}

                      {currentQ.difficulty && (
                        <span className="text-slate-500 text-[10px] ml-auto">
                          Difficulty: <strong className="uppercase font-semibold">{currentQ.difficulty}</strong>
                        </span>
                      )}
                    </div>
                  );
                })()}

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

                {/* AI Tutor Doubt Clarifier */}
                {!aiTutorOpen ? (
                  <button
                    onClick={() => setAiTutorOpen(true)}
                    className="flex items-center justify-between w-full p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition text-left group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>NCERT Concept Explainer & Doubt Resolution</span>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-normal">
                            AI Tutor
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Need clarification on an incorrect option, derivation step, or conceptual rule?
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition shrink-0 flex items-center gap-1">
                      Open Explainer <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ) : (
                  <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            NCERT Concept Explainer
                            <span className="text-[10px] text-slate-500 font-mono font-normal">
                              ({currentQ.chapter} • Q.{currentQ.questionOrder})
                            </span>
                          </h4>
                        </div>
                      </div>
                      <button
                        onClick={() => setAiTutorOpen(false)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Clarification Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Direct Query Options:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentQ.selectedOption && currentQ.selectedOption !== currentQ.correctAnswer && (
                          <button
                            type="button"
                            disabled={aiTutorLoading}
                            onClick={() => handleAskAiTutor('why_selected_wrong')}
                            className="text-xs font-medium bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded px-2.5 py-1 transition disabled:opacity-50"
                          >
                            Why is Option {currentQ.selectedOption} incorrect?
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={aiTutorLoading}
                          onClick={() => handleAskAiTutor('custom', 'Provide a step-by-step first-principles NCERT derivation of this question.')}
                          className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded px-2.5 py-1 transition disabled:opacity-50"
                        >
                          Step-by-step derivation
                        </button>
                        <button
                          type="button"
                          disabled={aiTutorLoading}
                          onClick={() => handleAskAiTutor('trap_analysis')}
                          className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded px-2.5 py-1 transition disabled:opacity-50"
                        >
                          Common traps & misconceptions
                        </button>
                        <button
                          type="button"
                          disabled={aiTutorLoading}
                          onClick={() => handleAskAiTutor('memory_hook')}
                          className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded px-2.5 py-1 transition disabled:opacity-50"
                        >
                          Core NCERT formula & takeaway
                        </button>
                      </div>
                    </div>

                    {/* Custom Question / Doubt Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDoubt}
                        onChange={(e) => setCustomDoubt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customDoubt.trim() && !aiTutorLoading) {
                            handleAskAiTutor('custom', customDoubt);
                          }
                        }}
                        placeholder="Ask a specific conceptual question about this problem..."
                        className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 bg-white"
                        disabled={aiTutorLoading}
                      />
                      <button
                        type="button"
                        disabled={aiTutorLoading || !customDoubt.trim()}
                        onClick={() => handleAskAiTutor('custom', customDoubt)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        {aiTutorLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Ask</span>
                      </button>
                    </div>

                    {/* AI Response Display */}
                    {aiTutorLoading && (
                      <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                        <Loader2 className="w-4 h-4 text-slate-600 animate-spin shrink-0" />
                        <span>Analyzing question parameters and drafting explanation...</span>
                      </div>
                    )}

                    {aiTutorResponse && !aiTutorLoading && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                          <span className="font-bold text-slate-900 text-[11px]">
                            Conceptual Explanation:
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">NCERT Verified</span>
                        </div>
                        <div className="text-slate-800 leading-relaxed font-sans max-w-none">
                          <MathRenderer text={aiTutorResponse} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
            <div className="font-bold text-xs text-gray-900 mb-2 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Question Palette ({filteredQuestions.length})</span>
              <span className="text-gray-500 font-mono text-[11px]">
                Click to jump
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-600 mb-2.5 pb-2 border-b border-gray-100">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Correct (+4)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Incorrect (-1)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Skipped (0)
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
                    className={`relative h-8 rounded text-xs font-bold flex items-center justify-center border transition-all cursor-pointer ${bg} ${
                      isCurrent ? 'ring-2 ring-blue-700 ring-offset-1 font-black scale-105' : 'hover:opacity-90'
                    }`}
                  >
                    {q.questionOrder}
                    {q.status?.includes('MARKED') && (
                      <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-purple-400 border border-white rounded-full"></span>
                    )}
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

