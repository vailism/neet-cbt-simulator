'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  Printer,
  FileText,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  User,
  ShieldAlert,
  Send,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  Info,
  BookOpen,
  LayoutGrid,
} from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';

interface CandidateInfo {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl?: string | null;
}

interface QuestionItem {
  id: string;
  questionId: string;
  questionOrder: number;
  subjectCode: 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY';
  chapter: string;
  topic?: string;
  statement: string;
  imageUrl?: string | null;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  selectedOption: number | null;
  status: string;
  timeSpentSeconds: number;
}

interface ExamStatusResponse {
  attemptId: string;
  title: string;
  candidate: CandidateInfo;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';
  mode: string;
  remainingSeconds: number;
  totalQuestions: number;
  questions: QuestionItem[];
  isFinished: boolean;
}

export default function OMRSimulationPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam Attempt State
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
  const [examTitle, setExamTitle] = useState('NEET (UG) 2027 OMR Simulation');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(180 * 60);

  // Active Navigation State
  const [activeSubject, setActiveSubject] = useState<'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY'>('PHYSICS');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 0..179
  const [bookletOpen, setBookletOpen] = useState(true); // Split view or OMR-only

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Question row ref map for scrolling to row on question jump
  const rowRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // 1. Initial Load
  const fetchExamState = useCallback(async () => {
    try {
      const res = await fetch(`/api/exam/${attemptId}/status`, { cache: 'no-store' });
      const data: ExamStatusResponse = await res.json();

      if (!res.ok) throw new Error((data as any).error || 'Failed to load exam attempt');

      if (data.isFinished) {
        router.replace(`/exam/${attemptId}/result`);
        return;
      }

      setCandidate(data.candidate);
      setExamTitle(data.title || 'NEET (UG) 2027 OMR Simulation');
      setQuestions(data.questions || []);
      setRemainingSeconds(data.remainingSeconds || 180 * 60);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error loading examination.');
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    fetchExamState();
  }, [fetchExamState]);

  // 2. Countdown Timer & Auto-Submit on Timeout
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, remainingSeconds]);

  // Handle timeout auto-submission
  const handleAutoSubmitOnTimeout = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/exam/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      router.push(`/exam/${attemptId}/result`);
    } catch (e) {
      router.push(`/exam/${attemptId}/result`);
    }
  };

  // Format seconds to HH:MM:SS
  const formatTimer = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 3. Digital Bubble Click Handler
  const handleBubbleSelect = async (questionOrder: number, optionNum: number) => {
    const targetQ = questions.find((q) => q.questionOrder === questionOrder);
    if (!targetQ) return;

    const currentSelected = targetQ.selectedOption;
    // If clicking already selected bubble, keep or toggle? In OMR ballpoint pen, clicking same bubble keeps it.
    const newSelected = currentSelected === optionNum ? optionNum : optionNum;

    // Optimistic UI Update
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionOrder === questionOrder
          ? {
              ...q,
              selectedOption: newSelected,
              status: 'ANSWERED',
            }
          : q
      )
    );

    // Sync to backend
    try {
      await fetch(`/api/exam/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptQuestionId: targetQ.id,
          selectedOption: newSelected,
          status: 'ANSWERED',
          timeSpentDeltaSeconds: 2,
        }),
      });
    } catch (err) {
      console.error('Answer sync error:', err);
    }
  };

  // 4. Clear Response for a Question
  const handleClearResponse = async (questionOrder: number) => {
    const targetQ = questions.find((q) => q.questionOrder === questionOrder);
    if (!targetQ) return;

    // Optimistic UI Update
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionOrder === questionOrder
          ? {
              ...q,
              selectedOption: null,
              status: 'NOT_ANSWERED',
            }
          : q
      )
    );

    // Sync to backend
    try {
      await fetch(`/api/exam/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptQuestionId: targetQ.id,
          selectedOption: null,
          status: 'NOT_ANSWERED',
          timeSpentDeltaSeconds: 1,
        }),
      });
    } catch (err) {
      console.error('Clear response error:', err);
    }
  };

  // 5. Jump to Question
  const handleJumpToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentQuestionIndex(index);
    const q = questions[index];
    if (q) {
      setActiveSubject(q.subjectCode);
      // Smooth scroll the OMR row into view
      rowRefs.current[q.questionOrder]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  // 6. Final OMR Submission
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exam/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      router.push(`/exam/${attemptId}/result`);
    } catch (err: any) {
      alert(err.message || 'Submission error');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Subject ranges
  const subjectRanges: Record<string, { start: number; end: number; name: string }> = {
    PHYSICS: { start: 1, end: 45, name: 'Physics' },
    CHEMISTRY: { start: 46, end: 90, name: 'Chemistry' },
    BOTANY: { start: 91, end: 135, name: 'Botany' },
    ZOOLOGY: { start: 136, end: 180, name: 'Zoology' },
  };

  const answeredCount = questions.filter((q) => q.selectedOption !== null).length;
  const unattemptedCount = questions.length - answeredCount;
  const currentQuestion = questions[currentQuestionIndex];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
        <div className="text-sm font-bold text-gray-800">Initializing NEET 2027 OMR Simulation...</div>
        <div className="text-xs text-gray-500 mt-1">Generating 180-Question Authentic Bubble Matrix</div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-xl border border-red-200 max-w-md w-full text-center shadow">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-gray-900 mb-1">Examination Error</h2>
          <p className="text-xs text-red-600 mb-4">{error || 'Unable to load OMR examination.'}</p>
          <button
            onClick={() => router.push('/papers')}
            className="w-full bg-blue-700 text-white text-xs font-bold py-2 rounded-md"
          >
            Return to Mock Paper Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
      {/* 1. TOP AUTHENTIC NTA HEADER */}
      <header className="bg-blue-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-blue-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400 text-blue-950 font-black px-2 py-0.5 rounded text-xs tracking-wider">
            OMR MODE
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <span>{examTitle}</span>
              <span className="text-[10px] bg-blue-800 border border-blue-400/30 px-1.5 py-0.5 rounded font-mono font-normal">
                BOOKLET CODE: Q2
              </span>
            </h1>
            <div className="text-[10px] text-blue-200 flex items-center gap-2">
              <span>Candidate: <strong>{candidate?.name || 'KUMAR ADITYA'}</strong></span>
              <span>•</span>
              <span className="font-mono">Roll: {candidate?.rollNumber || '240410012345'}</span>
              <span>•</span>
              <span>Centre: 4102</span>
            </div>
          </div>
        </div>

        {/* Top Controls: Print, Instructions, Timer, Submit */}
        <div className="flex items-center gap-2">
          {/* Printable Question Paper Link */}
          <a
            href={`/omr/${attemptId}/print-paper`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-[11px] bg-blue-800 hover:bg-blue-700 border border-blue-400/30 text-white font-semibold px-2.5 py-1.5 rounded transition-colors"
            title="Open printable 180-question paper formatted for A4"
          >
            <Printer className="w-3.5 h-3.5 text-blue-200" />
            <span>Print Paper</span>
            <ExternalLink className="w-2.5 h-2.5 text-blue-300" />
          </a>

          {/* Printable OMR Sheet Link */}
          <a
            href={`/omr/${attemptId}/print-omr`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-[11px] bg-blue-800 hover:bg-blue-700 border border-blue-400/30 text-white font-semibold px-2.5 py-1.5 rounded transition-colors"
            title="Open printable official NTA OMR sheet"
          >
            <FileText className="w-3.5 h-3.5 text-blue-200" />
            <span>Print OMR</span>
            <ExternalLink className="w-2.5 h-2.5 text-blue-300" />
          </a>

          {/* Instructions Modal Button */}
          <button
            onClick={() => setShowInstructionsModal(true)}
            className="flex items-center gap-1 text-[11px] bg-blue-800 hover:bg-blue-700 border border-blue-400/30 text-white font-semibold px-2.5 py-1.5 rounded transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Instructions</span>
          </button>

          {/* COUNTDOWN TIMER */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-black text-sm border tracking-wider ${
              remainingSeconds <= 900
                ? 'bg-red-600 border-red-700 text-white animate-pulse'
                : 'bg-blue-950 border-blue-700 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-1.5 rounded-md shadow flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit OMR</span>
          </button>
        </div>
      </header>

      {/* 2. SUBJECT TABS STRIP */}
      <div className="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs shrink-0 shadow-xs">
        <div className="flex items-center gap-1">
          {(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const).map((subCode) => {
            const range = subjectRanges[subCode];
            const subQuestions = questions.slice(range.start - 1, range.end);
            const subBubbled = subQuestions.filter((q) => q.selectedOption !== null).length;
            const isActive = activeSubject === subCode;

            return (
              <button
                key={subCode}
                onClick={() => {
                  setActiveSubject(subCode);
                  handleJumpToQuestion(range.start - 1);
                }}
                className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span>{range.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-800 text-amber-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {subBubbled}/45
                </span>
              </button>
            );
          })}
        </div>

        {/* View Toggle (Split Booklet + OMR vs Full OMR) */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-gray-600 hidden sm:flex items-center gap-3 font-medium">
            <span>
              Bubbled: <strong className="text-emerald-700 font-bold">{answeredCount}</strong>
            </span>
            <span>
              Blank: <strong className="text-gray-500 font-bold">{unattemptedCount}</strong>
            </span>
          </div>

          <button
            onClick={() => setBookletOpen(!bookletOpen)}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-semibold px-2 py-1 rounded border border-gray-300"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-700" />
            <span>{bookletOpen ? 'Hide Booklet' : 'Show Booklet'}</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: SPLIT BOOKLET (LEFT) & OMR SHEET (RIGHT) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: QUESTION BOOKLET READER */}
        {bookletOpen && (
          <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-300 bg-white">
            {/* Booklet Header */}
            <div className="bg-slate-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs">
                  Q.{currentQuestion.questionOrder} of 180
                </span>
                <span className="font-semibold text-gray-700">
                  {currentQuestion.subjectCode} • {currentQuestion.chapter}
                </span>
              </div>

              {/* Clear Response Button for Active Question */}
              {currentQuestion.selectedOption !== null && (
                <button
                  onClick={() => handleClearResponse(currentQuestion.questionOrder)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Bubble
                </button>
              )}
            </div>

            {/* Question Statement & Options */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              <div className="text-sm font-medium text-gray-950 leading-relaxed">
                <MathRenderer text={currentQuestion.statement} />
              </div>

              {currentQuestion.imageUrl && (
                <div className="my-3 text-center">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question Diagram"
                    className="max-h-56 mx-auto rounded border border-gray-300 shadow-xs"
                  />
                </div>
              )}

              {/* 4 Options */}
              <div className="space-y-2.5 pt-2">
                {[
                  { num: 1, label: 'A', text: currentQuestion.option1 },
                  { num: 2, label: 'B', text: currentQuestion.option2 },
                  { num: 3, label: 'C', text: currentQuestion.option3 },
                  { num: 4, label: 'D', text: currentQuestion.option4 },
                ].map((opt) => {
                  const isSelected = currentQuestion.selectedOption === opt.num;
                  return (
                    <div
                      key={opt.num}
                      onClick={() => handleBubbleSelect(currentQuestion.questionOrder, opt.num)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected
                          ? 'border-blue-900 bg-blue-50/80 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-950 text-white border-blue-950 shadow-inner'
                            : 'border-gray-400 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {opt.num}
                      </div>
                      <div className="flex-1 text-xs text-gray-900 pt-0.5">
                        <MathRenderer text={opt.text} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Booklet Navigation Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => handleJumpToQuestion(currentQuestionIndex - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="text-[11px] text-gray-500 font-mono">
                Clicking an option darkens the corresponding bubble on the OMR sheet.
              </div>

              <button
                disabled={currentQuestionIndex === questions.length - 1}
                onClick={() => handleJumpToQuestion(currentQuestionIndex + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* RIGHT PANE: OFFICIAL DIGITAL OMR ANSWER SHEET */}
        <div className={`flex-1 flex flex-col bg-slate-200 overflow-hidden ${!bookletOpen ? 'w-full' : ''}`}>
          {/* OMR Sheet Header Banner */}
          <div className="bg-gray-900 text-white px-4 py-2 border-b border-gray-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <span className="font-black uppercase tracking-wider">Official Digital OMR Answer Sheet</span>
            </div>
            <div className="text-[11px] text-gray-300 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-950 border border-white inline-block"></span>
                <span>Darkened Circle</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border border-gray-400 bg-white inline-block"></span>
                <span>Unattempted</span>
              </span>
            </div>
          </div>

          {/* OMR Scrollable Grid Container */}
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow border-2 border-gray-300 p-4">
              {/* OMR Sheet Title Header */}
              <div className="border-b-2 border-gray-900 pb-2 mb-3 text-center">
                <div className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">
                  National Testing Agency (NTA) • NEET UG 2027
                </div>
                <div className="text-xs font-black uppercase text-gray-900">
                  CANDIDATE OMR RESPONSE SHEET • FOUR SECTION MATRIX
                </div>
              </div>

              {/* 4 SUBJECT COLUMNS / CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const).map((subCode) => {
                  const range = subjectRanges[subCode];
                  const subQuestions = questions.slice(range.start - 1, range.end);
                  const isCurrentSection = activeSubject === subCode;

                  return (
                    <div
                      key={subCode}
                      className={`border-2 rounded-lg bg-white overflow-hidden transition-all ${
                        isCurrentSection ? 'border-blue-900 ring-1 ring-blue-900/30' : 'border-gray-300'
                      }`}
                    >
                      {/* Section Header */}
                      <div
                        className={`py-1.5 px-2 text-center text-xs font-black uppercase tracking-wide flex items-center justify-between ${
                          isCurrentSection ? 'bg-blue-900 text-white' : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        <span>{range.name}</span>
                        <span className="text-[10px] font-mono opacity-80">
                          {range.start}–{range.end}
                        </span>
                      </div>

                      {/* 45 Question Rows */}
                      <div className="divide-y divide-gray-100 p-1">
                        {subQuestions.map((q) => {
                          const isCurrent = currentQuestion.questionOrder === q.questionOrder;

                          return (
                            <div
                              key={q.id}
                              ref={(el) => {
                                rowRefs.current[q.questionOrder] = el;
                              }}
                              className={`flex items-center justify-between py-1 px-1.5 rounded transition-colors ${
                                isCurrent
                                  ? 'bg-amber-100 border-l-4 border-l-amber-600 font-bold'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* Question number - clickable to jump booklet */}
                              <button
                                onClick={() => handleJumpToQuestion(q.questionOrder - 1)}
                                className={`text-[11px] font-mono text-left w-7 hover:underline shrink-0 ${
                                  isCurrent ? 'font-black text-amber-950' : 'text-gray-700 font-semibold'
                                }`}
                                title={`Click to view Question ${q.questionOrder}`}
                              >
                                {q.questionOrder}.
                              </button>

                              {/* 4 BUBBLES */}
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4].map((optNum) => {
                                  const isSelected = q.selectedOption === optNum;
                                  return (
                                    <button
                                      key={optNum}
                                      onClick={() => handleBubbleSelect(q.questionOrder, optNum)}
                                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all ${
                                        isSelected
                                          ? 'bg-blue-950 border-blue-950 text-white shadow-inner scale-105'
                                          : 'border-gray-500 bg-white text-gray-700 hover:border-blue-900 hover:bg-blue-50/50'
                                      }`}
                                      title={`Mark option (${optNum}) for Q.${q.questionOrder}`}
                                    >
                                      {optNum}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Row action: Clear bubble if filled */}
                              <div className="w-4 text-right">
                                {q.selectedOption !== null && (
                                  <button
                                    onClick={() => handleClearResponse(q.questionOrder)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Clear this bubble"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-300 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-900" />
                Final OMR Sheet Submission
              </h3>
              <button onClick={() => setShowSubmitModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Please review your response summary carefully. Once submitted, your OMR sheet will
              be locked, evaluated, and your official scorecard will be generated.
            </p>

            {/* Summary Statistics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Total Questions</div>
                <div className="text-lg font-black text-gray-900 font-mono">180</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] text-emerald-800 font-bold uppercase">Bubbled</div>
                <div className="text-lg font-black text-emerald-700 font-mono">{answeredCount}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-[10px] text-amber-800 font-bold uppercase">Unanswered</div>
                <div className="text-lg font-black text-amber-700 font-mono">{unattemptedCount}</div>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50 space-y-1">
              <div className="font-bold text-gray-800 mb-1 text-[11px]">Subject Breakdown:</div>
              {(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const).map((s) => {
                const range = subjectRanges[s];
                const count = questions.slice(range.start - 1, range.end).filter((q) => q.selectedOption !== null).length;
                return (
                  <div key={s} className="flex justify-between text-[11px] text-gray-600">
                    <span>{range.name}:</span>
                    <strong className="text-gray-900">{count} / 45 Bubbled</strong>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Continue Examination
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
              >
                {submitting ? 'Scoring Answers...' : 'Confirm Final Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. INSTRUCTIONS MODAL */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-300 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-900" />
                NEET UG 2027 OMR Examination Instructions
              </h3>
              <button onClick={() => setShowInstructionsModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
              <div>
                <strong>1. Examination Structure:</strong>
                <p>The examination consists of 180 multiple-choice questions divided into 4 sections: Physics (1-45), Chemistry (46-90), Botany (91-135), and Zoology (136-180).</p>
              </div>

              <div>
                <strong>2. Marking Scheme:</strong>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Correct Answer:</strong> +4 Marks</li>
                  <li><strong>Incorrect Answer (Negative Marking):</strong> -1 Mark</li>
                  <li><strong>Unanswered / Blank Bubble:</strong> 0 Marks</li>
                </ul>
              </div>

              <div>
                <strong>3. Digital OMR Bubbling Rules:</strong>
                <p>Each question has 4 bubbles corresponding to options (1), (2), (3), and (4). Clicking a bubble fills it with an authentic ballpoint pen ink effect. You can click &quot;Clear Bubble&quot; to reset your response for any question before final submission.</p>
              </div>

              <div>
                <strong>4. Printable Material:</strong>
                <p>You may print the full 180-question paper booklet or the printable A4 OMR sheet at any time using the header buttons.</p>
              </div>

              <div>
                <strong>5. Timer & Automatic Submission:</strong>
                <p>The countdown timer runs continuously for 180 minutes. Upon timer expiry, the test will be automatically submitted and scored.</p>
              </div>
            </div>

            <div className="text-right pt-2 border-t border-gray-200">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-5 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
              >
                Got It, Return to OMR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
