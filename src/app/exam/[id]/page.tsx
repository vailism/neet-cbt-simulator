'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookmarkCheck,
  Send,
  FileText,
  HelpCircle,
  WifiOff,
  User,
  Shield,
  X,
  Keyboard,
  Maximize,
  Minimize,
  AlertTriangle,
} from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';
import { getUpdatedQuestionStatus } from '@/lib/examEngine';

type QuestionStatusType =
  | 'NOT_VISITED'
  | 'NOT_ANSWERED'
  | 'ANSWERED'
  | 'MARKED_FOR_REVIEW'
  | 'ANSWERED_AND_MARKED';

interface ExamQuestionItem {
  id: string; // AttemptQuestion ID
  questionId: string;
  questionOrder: number;
  subjectCode: 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY';
  chapter: string;
  topic: string;
  statement: string;
  imageUrl?: string | null;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  selectedOption: number | null;
  status: QuestionStatusType;
  timeSpentSeconds: number;
}

interface AttemptData {
  attemptId: string;
  candidate: {
    id: string;
    rollNumber: string;
    name: string;
    avatarUrl?: string;
  };
  title: string;
  mode: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  totalQuestions: number;
  questions: ExamQuestionItem[];
}

export default function ExamInterfacePage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examData, setExamData] = useState<AttemptData | null>(null);

  // Active Navigation State
  const [activeSubject, setActiveSubject] = useState<'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY'>('PHYSICS');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [currentSelectedOption, setCurrentSelectedOption] = useState<number | null>(null);

  // Timer State
  const [remainingSeconds, setRemainingSeconds] = useState<number>(180 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Kiosk & Pacing State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [questionLiveSeconds, setQuestionLiveSeconds] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Question Time Tracking
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Attempt Status on Mount (Refresh Recovery)
  const fetchAttemptStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/exam/${attemptId}/status`, { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load examination status.');
      }

      if (data.isFinished) {
        router.replace(`/exam/${attemptId}/result`);
        return;
      }

      setExamData(data);
      setRemainingSeconds(data.remainingSeconds);

      // Initialize active question to first not-answered or question 0
      const firstQ = data.questions[0];
      if (firstQ) {
        setActiveSubject(firstQ.subjectCode);
        setActiveQuestionIndex(0);
        setCurrentSelectedOption(firstQ.selectedOption);

        // Mark first question as NOT_ANSWERED if it was NOT_VISITED
        if (firstQ.status === 'NOT_VISITED') {
          saveAnswerToServer(firstQ.id, null, 'NOT_ANSWERED', 0);
          firstQ.status = 'NOT_ANSWERED';
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to exam server.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    fetchAttemptStatus();
  }, [fetchAttemptStatus]);

  // 2. Countdown Timer synchronized with Server Expiry
  useEffect(() => {
    if (loading || !examData) return;

    const expiresAt = new Date(examData.expiresAt).getTime();

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        handleFinalSubmit(true); // Automatic submission on time expiration
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [loading, examData]);

  // 3. Online/Offline & Unload protection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'An examination is currently active. Are you sure you want to leave?';
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 3b. NTA Kiosk Mode & Tab-Switch Detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount((prev) => {
          const updated = prev + 1;
          setShowTabWarning(true);
          return updated;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchCount((prev) => {
        const updated = prev + 1;
        setShowTabWarning(true);
        return updated;
      });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // 3c. Question Pace Live Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setQuestionLiveSeconds(Math.floor((Date.now() - questionStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuestionIndex]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request:', e);
    }
  };

  // Format Timer as HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter questions for active subject
  const currentSubjectQuestions =
    examData?.questions.filter((q) => q.subjectCode === activeSubject) || [];

  const currentQuestion = examData?.questions[activeQuestionIndex];

  // Sync selected option when active question changes
  useEffect(() => {
    if (currentQuestion) {
      setCurrentSelectedOption(currentQuestion.selectedOption);
      questionStartTimeRef.current = Date.now();

      // If question is NOT_VISITED, change to NOT_ANSWERED upon viewing
      if (currentQuestion.status === 'NOT_VISITED') {
        currentQuestion.status = 'NOT_ANSWERED';
        saveAnswerToServer(currentQuestion.id, null, 'NOT_ANSWERED', 0);
      }
    }
  }, [activeQuestionIndex]);

  // 1b. Offline Sync Queue Helper
  const getQueue = useCallback((): Array<any> => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(`neet_queue_${attemptId}`) || '[]');
    } catch {
      return [];
    }
  }, [attemptId]);

  const setQueue = useCallback((q: Array<any>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`neet_queue_${attemptId}`, JSON.stringify(q));
      setPendingSyncCount(q.length);
    } catch (e) {
      console.warn('LocalStorage queue write failed', e);
    }
  }, [attemptId]);

  // Flush Queue to Server
  const flushSyncQueue = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    const remainingQueue: Array<any> = [];
    for (const item of queue) {
      try {
        const res = await fetch(`/api/exam/${attemptId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!res.ok) {
          remainingQueue.push(item);
        }
      } catch {
        remainingQueue.push(item);
      }
    }
    setQueue(remainingQueue);
  }, [attemptId, getQueue, setQueue]);

  // Background queue flusher (every 4s and on online event)
  useEffect(() => {
    const interval = setInterval(flushSyncQueue, 4000);
    window.addEventListener('online', flushSyncQueue);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', flushSyncQueue);
    };
  }, [flushSyncQueue]);

  // Save Answer to PostgreSQL via API with local caching fallback
  const saveAnswerToServer = async (
    attemptQuestionId: string,
    selectedOption: number | null,
    status: QuestionStatusType,
    timeDelta: number
  ) => {
    const payload = {
      attemptQuestionId,
      selectedOption,
      status,
      timeSpentDeltaSeconds: timeDelta,
    };

    // Cache entire attempt in localStorage for disaster recovery
    if (examData && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`neet_attempt_cache_${attemptId}`, JSON.stringify(examData));
      } catch (e) {
        // Ignore cache storage overflow
      }
    }

    try {
      const res = await fetch(`/api/exam/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Enqueue for background retry
        const q = getQueue();
        q.push(payload);
        setQueue(q);
      }
    } catch (e) {
      // Network failure / offline: enqueue safely
      const q = getQueue();
      q.push(payload);
      setQueue(q);
    }
  };

  // Handle Question Navigation
  const navigateToQuestion = (globalIndex: number, skipTiming = false) => {
    if (!examData || globalIndex < 0 || globalIndex >= examData.questions.length) return;

    // Calculate time spent on current question before leaving (unless already flushed by action handler)
    if (!skipTiming && currentQuestion) {
      const timeSpentDelta = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      currentQuestion.timeSpentSeconds += timeSpentDelta;
    }

    const targetQ = examData.questions[globalIndex];
    if (targetQ.subjectCode !== activeSubject) {
      setActiveSubject(targetQ.subjectCode);
    }

    setActiveQuestionIndex(globalIndex);
  };

  // ACTION: Save & Next (Green)
  const handleSaveAndNext = () => {
    if (!currentQuestion) return;

    const timeSpentDelta = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    currentQuestion.timeSpentSeconds += timeSpentDelta;

    const newStatus = getUpdatedQuestionStatus(
      currentQuestion.status,
      'SAVE_AND_NEXT',
      currentSelectedOption !== null
    );

    currentQuestion.selectedOption = currentSelectedOption;
    currentQuestion.status = newStatus;

    // Persist immediately
    saveAnswerToServer(currentQuestion.id, currentSelectedOption, newStatus, timeSpentDelta);

    // Reset timestamp so subsequent actions don't duplicate
    questionStartTimeRef.current = Date.now();

    // Advance to next question without re-adding delta
    if (activeQuestionIndex < (examData?.questions.length || 0) - 1) {
      navigateToQuestion(activeQuestionIndex + 1, true);
    }
  };

  // ACTION: Save & Mark for Review / Mark for Review & Next (Purple / Blue)
  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;

    const timeSpentDelta = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    currentQuestion.timeSpentSeconds += timeSpentDelta;

    const newStatus = getUpdatedQuestionStatus(
      currentQuestion.status,
      'MARK_FOR_REVIEW',
      currentSelectedOption !== null
    );

    currentQuestion.selectedOption = currentSelectedOption;
    currentQuestion.status = newStatus;

    // Persist immediately
    saveAnswerToServer(currentQuestion.id, currentSelectedOption, newStatus, timeSpentDelta);

    // Reset timestamp so subsequent actions don't duplicate
    questionStartTimeRef.current = Date.now();

    // Advance to next question without re-adding delta
    if (activeQuestionIndex < (examData?.questions.length || 0) - 1) {
      navigateToQuestion(activeQuestionIndex + 1, true);
    }
  };

  // ACTION: Clear Response
  const handleClearResponse = () => {
    if (!currentQuestion) return;

    setCurrentSelectedOption(null);
    currentQuestion.selectedOption = null;
    currentQuestion.status = 'NOT_ANSWERED';

    saveAnswerToServer(currentQuestion.id, null, 'NOT_ANSWERED', 0);
  };

  // ACTION: Final Exam Submission
  const handleFinalSubmit = async (auto = false) => {
    setIsSubmitting(true);
    try {
      // Flush last question timing
      if (currentQuestion) {
        const timeSpentDelta = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
        await saveAnswerToServer(
          currentQuestion.id,
          currentSelectedOption,
          currentQuestion.status,
          timeSpentDelta
        );
      }

      const res = await fetch(`/api/exam/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to submit examination.');
      }

      router.replace(`/exam/${attemptId}/result`);
    } catch (e: any) {
      alert(e.message || 'Submission failed. Please verify connection and retry.');
      setIsSubmitting(false);
    }
  };

  // 3. Global Keyboard Shortcuts for CBT Experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea or any modal is open
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (showSubmitModal || showPaperModal || showInstructionsModal || showShortcutsModal) return;

      const key = e.key.toLowerCase();
      if (e.key === '1' || key === 'a') {
        e.preventDefault();
        setCurrentSelectedOption(1);
      } else if (e.key === '2' || key === 'b') {
        e.preventDefault();
        setCurrentSelectedOption(2);
      } else if (e.key === '3' || key === 'c') {
        e.preventDefault();
        setCurrentSelectedOption(3);
      } else if (e.key === '4' || key === 'd') {
        e.preventDefault();
        setCurrentSelectedOption(4);
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleSaveAndNext();
      } else if (key === 'm') {
        e.preventDefault();
        handleMarkForReviewAndNext();
      } else if (e.key === 'Backspace' || key === 'c') {
        e.preventDefault();
        handleClearResponse();
      } else if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowLeft' || key === 'p') {
        if (activeQuestionIndex > 0) {
          e.preventDefault();
          navigateToQuestion(activeQuestionIndex - 1);
        }
      } else if (e.key === 'ArrowRight' || key === 'n') {
        if (activeQuestionIndex < (examData?.questions.length || 0) - 1) {
          e.preventDefault();
          navigateToQuestion(activeQuestionIndex + 1);
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeQuestionIndex,
    currentQuestion,
    currentSelectedOption,
    examData,
    showSubmitModal,
    showPaperModal,
    showInstructionsModal,
    showShortcutsModal,
  ]);

  // Question Palette Counters
  const getSubjectStatusCounts = (sub: 'PHYSICS' | 'CHEMISTRY' | 'BOTANY' | 'ZOOLOGY') => {
    const list = examData?.questions.filter((q) => q.subjectCode === sub) || [];
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let marked = 0;
    let answeredAndMarked = 0;

    for (const q of list) {
      if (q.status === 'ANSWERED') answered++;
      else if (q.status === 'NOT_ANSWERED') notAnswered++;
      else if (q.status === 'NOT_VISITED') notVisited++;
      else if (q.status === 'MARKED_FOR_REVIEW') marked++;
      else if (q.status === 'ANSWERED_AND_MARKED') answeredAndMarked++;
    }

    return { total: list.length, answered, notAnswered, notVisited, marked, answeredAndMarked };
  };

  const currentCounts = getSubjectStatusCounts(activeSubject);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
        <div className="text-base font-bold text-gray-800">
          Loading Examination CBT Environment...
        </div>
        <div className="text-xs text-gray-500 mt-1">Verifying server timestamps and questions</div>
      </div>
    );
  }

  if (error || !examData || !currentQuestion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-6 rounded-xl border border-red-200 max-w-md w-full text-center shadow">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Examination Error</h2>
          <p className="text-xs text-red-600 mb-4">{error || 'Unable to load examination.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-700 text-white text-xs font-bold py-2 rounded-md"
          >
            Return to Examination Portal
          </button>
        </div>
      </div>
    );
  }

  // Question Button Palette Color Resolver
  const getPaletteStyle = (status: QuestionStatusType, isCurrent: boolean) => {
    const currentRing = isCurrent ? 'ring-2 ring-blue-700 ring-offset-1 font-extrabold scale-105' : '';

    switch (status) {
      case 'ANSWERED':
        return `bg-[#16a34a] text-white hover:bg-green-700 ${currentRing}`;
      case 'NOT_ANSWERED':
        return `bg-[#dc2626] text-white hover:bg-red-700 ${currentRing}`;
      case 'MARKED_FOR_REVIEW':
        return `bg-[#7c3aed] text-white rounded-full hover:bg-purple-700 ${currentRing}`;
      case 'ANSWERED_AND_MARKED':
        return `relative bg-[#7c3aed] text-white rounded-full hover:bg-purple-700 ${currentRing}`;
      case 'NOT_VISITED':
      default:
        return `bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 ${currentRing}`;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] text-gray-900 select-none overflow-hidden min-h-screen">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>
            Internet connection disconnected. Answers will automatically sync once connection is restored.
          </span>
        </div>
      )}

      {/* TOP CBT HEADER (NTA Exact Layout) */}
      <header className="bg-[#1e3a8a] text-white border-b-2 border-amber-400 px-4 py-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Exam Title & Center Code */}
          <div>
            <div className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase">
              National Testing Agency (NTA) • CBT Center
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight">
              NATIONAL ELIGIBILITY CUM ENTRANCE TEST (UG) - 2027
            </h1>
          </div>

          {/* Quick Action Buttons & Countdown Timer */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowPaperModal(true)}
              className="hidden md:flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 border border-blue-400/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Question Paper
            </button>

            <button
              onClick={() => setShowInstructionsModal(true)}
              className="hidden md:flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 border border-blue-400/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Instructions
            </button>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="hidden lg:flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 border border-blue-400/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition-colors"
              title="Keyboard Shortcuts (1-4, Enter, Space, M, C, Arrows, F)"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-300" />
              Shortcuts
            </button>

            {/* NTA Kiosk Mode Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 border border-blue-400/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Kiosk Fullscreen' : 'Enter Kiosk Fullscreen (Exam Hall Mode)'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Kiosk' : 'Kiosk Mode'}</span>
            </button>

            {/* Real-time Sync Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium bg-blue-950/60 border border-blue-400/20">
              {pendingSyncCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300 font-mono text-[10px]">Syncing ({pendingSyncCount})</span>
                </>
              ) : isOffline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-300 font-mono text-[10px]">Offline Saved</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300 font-mono text-[10px]">Auto-Synced</span>
                </>
              )}
            </div>

            {/* Countdown Timer Display */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base tracking-wider ${
                remainingSeconds < 300
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-white text-blue-950 border-blue-200 shadow-inner'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <div className="text-xs font-sans text-gray-500 hidden sm:inline">Time Left:</div>
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit
            </button>
          </div>
        </div>
      </header>

      {/* NTA DISCIPLINE WARNING POPUP */}
      {showTabWarning && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-blue-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl border-2 border-amber-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 text-xs max-w-lg">
          <AlertTriangle className="w-5 h-5 text-red-900 shrink-0" />
          <div className="flex-1">
            <div className="font-extrabold uppercase text-[11px] tracking-wide">
              Official Examination Advisory Notice
            </div>
            <div className="text-[11px] font-medium text-blue-950 leading-tight mt-0.5">
              Window focus switch detected (Switch Count: <strong>{tabSwitchCount}</strong>).
              In official NEET CBT, navigation outside the exam window can cause automated disqualification.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTabWarning(false)}
            className="bg-blue-950 hover:bg-blue-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* CANDIDATE INFO BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between text-gray-700 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-gray-900">
            Candidate: <span className="text-blue-900 font-bold">{examData.candidate.name}</span>
          </div>
          <div className="text-gray-500">
            Roll No: <span className="font-mono font-bold text-gray-800">{examData.candidate.rollNumber}</span>
          </div>
          {tabSwitchCount > 0 && (
            <span className="bg-amber-50 text-amber-900 border border-amber-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              Window Focus Switches: {tabSwitchCount}
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 hidden sm:block">
          Language: <span className="font-bold text-gray-700">English</span> | Marking Scheme: <span className="font-bold text-green-700">+4</span> / <span className="font-bold text-red-600">-1</span>
        </div>
      </div>

      {/* MAIN CBT EXAMINATION BODY */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT / CENTER: QUESTION DISPLAY & CONTROLS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* SUBJECT SELECTION TABS */}
          <div className="bg-gray-100 border-b border-gray-200 px-3 pt-2 flex items-center gap-1 overflow-x-auto shrink-0">
            {(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const)
              .filter((sub) => examData.questions.some((q) => q.subjectCode === sub))
              .map((sub) => {
              const isActive = activeSubject === sub;
              const subQuestions = examData.questions.filter((q) => q.subjectCode === sub);
              const answeredCount = subQuestions.filter((q) => q.status === 'ANSWERED' || q.status === 'ANSWERED_AND_MARKED').length;

              return (
                <button
                  key={sub}
                  onClick={() => {
                    setActiveSubject(sub);
                    const firstSubIndex = examData.questions.findIndex((q) => q.subjectCode === sub);
                    if (firstSubIndex !== -1) {
                      navigateToQuestion(firstSubIndex);
                    }
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-l border-r flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-white text-blue-900 border-gray-300 border-b-transparent shadow-sm'
                      : 'bg-gray-200 text-gray-600 border-transparent hover:bg-gray-300/80'
                  }`}
                >
                  <span>{sub}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {answeredCount}/{subQuestions.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* QUESTION HEADER STRIP */}
          <div className="px-5 py-2.5 bg-blue-50/50 border-b border-gray-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-blue-950 text-sm">
                Question No. {currentQuestion.questionOrder}
              </span>
              <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                {currentQuestion.chapter}
              </span>
              {currentQuestion.topic && (
                <span className="text-gray-500 text-[11px] hidden sm:inline">
                  • {currentQuestion.topic}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-semibold text-[11px]">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${
                  questionLiveSeconds > 150
                    ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                    : questionLiveSeconds > 90
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
                title="Pace on this question (Target: < 90s Physics, < 45s Biology)"
              >
                <Clock className="w-3 h-3" />
                Time on Q: {questionLiveSeconds}s {questionLiveSeconds > 150 ? '⚠️ Time Trap!' : ''}
              </span>
              <span className="text-green-700">Marks: +4</span>
              <span className="text-red-600">Negative: -1</span>
            </div>
          </div>

          {/* QUESTION STATEMENT & OPTIONS (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Question Statement */}
            <div className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed border-b border-gray-100 pb-5">
              <MathRenderer text={currentQuestion.statement} />
              {currentQuestion.imageUrl && (
                <div className="mt-4 max-w-md border border-gray-200 rounded-lg overflow-hidden p-2 bg-gray-50">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question Diagram"
                    className="max-h-64 object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3 max-w-3xl">
              {[
                { num: 1, text: currentQuestion.option1 },
                { num: 2, text: currentQuestion.option2 },
                { num: 3, text: currentQuestion.option3 },
                { num: 4, text: currentQuestion.option4 },
              ].map((opt) => {
                const isSelected = currentSelectedOption === opt.num;
                return (
                  <label
                    key={opt.num}
                    onClick={() => setCurrentSelectedOption(opt.num)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50/80'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-400 bg-white text-gray-700'
                      }`}
                    >
                      {opt.num}
                    </div>
                    <div className="flex-1 text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <MathRenderer text={opt.text} />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* BOTTOM CBT ACTION BUTTONS (NTA Standard) */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Left Group */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleMarkForReviewAndNext}
                className="bg-[#7c3aed] hover:bg-purple-800 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded shadow-sm transition-colors flex items-center gap-1.5"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                {currentSelectedOption !== null ? 'Save & Mark for Review' : 'Mark for Review & Next'}
              </button>

              <button
                onClick={handleClearResponse}
                className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-2 rounded transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                Clear Response
              </button>
            </div>

            {/* Right Group (Save & Next, Previous) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeQuestionIndex > 0) {
                    navigateToQuestion(activeQuestionIndex - 1);
                  }
                }}
                disabled={activeQuestionIndex === 0}
                className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleSaveAndNext}
                className="bg-[#16a34a] hover:bg-green-700 text-white text-xs font-bold px-5 py-2 rounded shadow transition-colors flex items-center gap-1.5"
              >
                Save & Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: CANDIDATE PROFILE & QUESTION PALETTE */}
        <aside className="w-full md:w-80 lg:w-88 border-t md:border-t-0 md:border-l border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
          {/* Candidate Profile Box */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
            <div className="w-12 h-14 bg-gray-200 border border-gray-300 rounded flex flex-col items-center justify-center text-gray-500 shrink-0">
              <User className="w-7 h-7 text-gray-400" />
              <span className="text-[9px] font-mono font-bold mt-0.5">PHOTO</span>
            </div>
            <div className="text-xs">
              <div className="font-extrabold text-blue-950 uppercase">{examData.candidate.name}</div>
              <div className="font-mono text-gray-600 text-[11px]">{examData.candidate.rollNumber}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Section: {activeSubject}</div>
            </div>
          </div>

          {/* PALETTE STATUS COUNTERS LEGEND */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Answered */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#16a34a] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {currentCounts.answered}
                </div>
                <span className="text-gray-700">Answered</span>
              </div>

              {/* Not Answered */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#dc2626] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {currentCounts.notAnswered}
                </div>
                <span className="text-gray-700">Not Answered</span>
              </div>

              {/* Not Visited */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gray-200 border border-gray-400 text-gray-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {currentCounts.notVisited}
                </div>
                <span className="text-gray-700">Not Visited</span>
              </div>

              {/* Marked for Review */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {currentCounts.marked}
                </div>
                <span className="text-gray-700">Marked for Review</span>
              </div>

              {/* Answered & Marked */}
              <div className="col-span-2 flex items-center gap-2 pt-1">
                <div className="relative w-5 h-5 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {currentCounts.answeredAndMarked}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
                </div>
                <span className="text-[10px] text-gray-700 leading-tight">
                  Answered & Marked for Review (will be evaluated)
                </span>
              </div>
            </div>
          </div>

          {/* QUESTION PALETTE GRID */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            <div className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
              <span>{activeSubject} Questions:</span>
              <span className="text-[10px] text-gray-500">1 to {currentSubjectQuestions.length}</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {currentSubjectQuestions.map((q) => {
                const globalIndex = examData.questions.findIndex((item) => item.id === q.id);
                const isCurrent = globalIndex === activeQuestionIndex;
                const styleClass = getPaletteStyle(q.status, isCurrent);

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(globalIndex)}
                    className={`h-9 w-full rounded flex items-center justify-center text-xs font-bold shadow-xs transition-transform ${styleClass}`}
                    title={`Question ${q.questionOrder}: ${q.status}`}
                  >
                    {q.questionOrder}
                    {q.status === 'ANSWERED_AND_MARKED' && (
                      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-green-400 border border-white rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PALETTE FOOTER SUBMIT BUTTON */}
          <div className="p-3 border-t border-gray-200 bg-white shrink-0">
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-lg shadow text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Examination Paper
            </button>
          </div>
        </aside>
      </div>

      {/* MODAL 1: SUBMISSION CONFIRMATION SUMMARY (NTA Style) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Examination Summary</h3>
                <p className="text-xs text-blue-200">Review your question attempts before final submission</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Summary Table */}
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-xs text-left border border-gray-200 rounded-lg">
                <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5 text-center">Total</th>
                    <th className="p-2.5 text-center text-green-700">Answered</th>
                    <th className="p-2.5 text-center text-red-600">Not Answered</th>
                    <th className="p-2.5 text-center text-purple-700">Marked</th>
                    <th className="p-2.5 text-center text-purple-900">Ans & Marked</th>
                    <th className="p-2.5 text-center text-gray-500">Not Visited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {(['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const).map((sub) => {
                    const c = getSubjectStatusCounts(sub);
                    return (
                      <tr key={sub} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-gray-800">{sub}</td>
                        <td className="p-2.5 text-center font-bold">{c.total}</td>
                        <td className="p-2.5 text-center text-green-700 font-bold bg-green-50/40">{c.answered}</td>
                        <td className="p-2.5 text-center text-red-600 font-bold bg-red-50/40">{c.notAnswered}</td>
                        <td className="p-2.5 text-center text-purple-700 font-bold">{c.marked}</td>
                        <td className="p-2.5 text-center text-purple-900 font-bold">{c.answeredAndMarked}</td>
                        <td className="p-2.5 text-center text-gray-500">{c.notVisited}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold">Are you sure you want to submit your examination?</span>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Once submitted, you will not be able to modify your answers. Detailed result
                    analysis out of 720 and step-by-step solutions will be generated.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold"
              >
                Resume Examination
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
              >
                {isSubmitting ? 'Evaluating Marks...' : 'Yes, Submit Examination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL QUESTION PAPER VIEW */}
      {showPaperModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-4 h-4" /> Full Question Paper View
              </h3>
              <button onClick={() => setShowPaperModal(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {examData.questions.map((q) => (
                <div key={q.id} className="border-b border-gray-200 pb-4 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                    <span>Q{q.questionOrder}.</span>
                    <span className="text-gray-500 font-normal">[{q.subjectCode} - {q.chapter}]</span>
                  </div>
                  <div className="mb-2">
                    <MathRenderer text={q.statement} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 pl-4">
                    <div>(1) <MathRenderer text={q.option1} /></div>
                    <div>(2) <MathRenderer text={q.option2} /></div>
                    <div>(3) <MathRenderer text={q.option3} /></div>
                    <div>(4) <MathRenderer text={q.option4} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-3 border-t border-gray-200 text-right shrink-0">
              <button
                onClick={() => setShowPaperModal(false)}
                className="px-4 py-1.5 bg-blue-700 text-white rounded text-xs font-bold"
              >
                Close Paper View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INSTRUCTIONS POPUP */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">Examination Instructions</h3>
              <button onClick={() => setShowInstructionsModal(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-xs text-gray-800 space-y-3 leading-relaxed">
              <p>• <strong>Marking:</strong> +4 for each correct answer; -1 for each incorrect answer; 0 for unanswered.</p>
              <p>• <strong>Save & Next:</strong> Saves your option and advances to the next question.</p>
              <p>• <strong>Save & Mark for Review:</strong> Evaluated in final scoring.</p>
              <p>• <strong>Clear Response:</strong> Erases the chosen radio button for the active question.</p>
              <p>• <strong>Countdown Timer:</strong> Clock runs continuously at the server. Refreshing will not reset the timer.</p>
            </div>
            <div className="bg-gray-50 p-3 border-t border-gray-200 text-right shrink-0">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-4 py-1.5 bg-blue-700 text-white rounded text-xs font-bold"
              >
                Close Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KEYBOARD SHORTCUTS REFERENCE */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-amber-300" /> CBT Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowShortcutsModal(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 text-xs text-gray-800 space-y-2.5">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Select Option (1, 2, 3, or 4)</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-blue-900 font-bold">1, 2, 3, 4 / A, B, C, D</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Save & Next Question</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-green-700 font-bold">Enter / Space</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Mark for Review & Next</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-purple-700 font-bold">M</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Clear Current Selection</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-red-700 font-bold">C / Backspace</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Toggle Fullscreen Kiosk Mode</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-blue-700 font-bold">F</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Previous / Next Question</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-gray-800 font-bold">← / → (or P / N)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="font-semibold text-gray-700">Open Shortcuts Help</span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 text-gray-800 font-bold">?</span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 border-t border-gray-200 text-right">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold"
              >
                Close Shortcuts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

