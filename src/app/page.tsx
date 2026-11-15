'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  Award,
  BookOpen,
  User,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Zap,
  Edit3,
  Target,
  Flame,
  Check,
  Layers,
  FileText,
  AlertCircle,
  Keyboard,
  Compass,
  GraduationCap,
  Activity,
} from 'lucide-react';
import {
  getClientCandidate,
  saveClientCandidate,
  syncCandidateToServer,
  CandidateInfo,
  DEFAULT_CANDIDATE,
} from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';

export default function HomePage() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateInfo>(DEFAULT_CANDIDATE);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(DEFAULT_CANDIDATE.name);
  const [editRoll, setEditRoll] = useState(DEFAULT_CANDIDATE.rollNumber);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [drillLoading, setDrillLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const fetchMistakes = async (roll: string) => {
    try {
      const res = await fetch(`/api/exam/mistake-drill?rollNumber=${encodeURIComponent(roll)}`);
      const json = await res.json();
      if (json.success) setMistakeCount(json.mistakeCount || 0);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    setIsMounted(true);
    // Target: First Sunday of May 2027 (May 2, 2027 14:00:00 IST)
    const targetDate = new Date('2027-05-02T14:00:00+05:30').getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const current = getClientCandidate();
    setCandidate(current);
    setEditName(current.name);
    setEditRoll(current.rollNumber);
    fetchMistakes(current.rollNumber);

    const handleUpdate = (e: any) => {
      const c = e.detail || getClientCandidate();
      setCandidate(c);
      setEditName(c.name);
      setEditRoll(c.rollNumber);
      fetchMistakes(c.rollNumber);
    };

    window.addEventListener('neet_candidate_updated', handleUpdate);
    return () => window.removeEventListener('neet_candidate_updated', handleUpdate);
  }, []);

  const handleLaunchMistakeDrill = async () => {
    setDrillLoading(true);
    try {
      const res = await fetch('/api/exam/mistake-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: candidate.rollNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start mistake drill.');
      router.push(`/exam/${json.attemptId}`);
    } catch (e: any) {
      alert(e.message || 'Error launching drill.');
    } finally {
      setDrillLoading(false);
    }
  };

  const handleInlineSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editRoll.trim()) return;

    setSaving(true);
    try {
      const updated = await syncCandidateToServer(editName, editRoll);
      setCandidate(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update candidate details.');
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchInstantMock = () => {
    setIsModalOpen(true);
  };

  const onConfirmLaunch = () => {
    router.push('/instructions');
  };

  return (
    <div className="flex-1 bg-slate-50/70 pb-20">
      {/* 1. HERO SECTION - Institutional Exam Command Header */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 border-b border-slate-800">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center space-y-5">
          {/* Official Agency Badge Pill */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs px-3.5 py-1.5 rounded-full shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold tracking-wide text-[11px] text-slate-200">
              Vailism CBT Exam Center
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-mono text-[11px]">NEET (UG) 2015–2026 Standard</span>
          </motion.div>

          {/* Main Hero Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="space-y-3 max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Standard Computer-Based Examination Center
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-normal">
              100 full-length mock examinations strictly calibrated to the NEET (UG) pattern. Real-time 180-minute countdown, authentic NTA question palette (+4/-1), and zero question repetition.
            </p>
          </motion.div>

          {/* Live Countdown to NEET Examination */}
          {isMounted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="pt-1"
            >
              <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-slate-900/95 border border-slate-700/80 px-4 py-2 rounded-lg text-center font-mono shadow-xs">
                <span className="text-xs font-semibold text-slate-400 font-sans">
                  NEET UG Target:
                </span>
                <div className="flex items-center gap-2 text-white text-sm font-bold tabular-nums">
                  <span>{countdown.days}d</span>
                  <span className="text-slate-500">:</span>
                  <span>{String(countdown.hours).padStart(2, '0')}h</span>
                  <span className="text-slate-500">:</span>
                  <span>{String(countdown.minutes).padStart(2, '0')}m</span>
                  <span className="text-slate-500">:</span>
                  <span className="text-emerald-400">{String(countdown.seconds).padStart(2, '0')}s</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-2.5 pt-2"
          >
            <button
              type="button"
              onClick={handleLaunchInstantMock}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              <span>Start Full Mock CBT Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {mistakeCount > 0 ? (
              <button
                type="button"
                onClick={handleLaunchMistakeDrill}
                disabled={drillLoading}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg border border-slate-700 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>
                  {drillLoading ? 'Preparing...' : `Retest Mistakes (${mistakeCount} Qs)`}
                </span>
              </button>
            ) : (
              <Link
                href="/papers"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm px-4 py-2.5 rounded-lg border border-slate-700 active:scale-98 transition-all"
              >
                <span>Browse 100 Papers</span>
              </Link>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-sm px-4 py-2.5 rounded-lg border border-slate-700/80 active:scale-98 transition-all"
            >
              <span>Candidate Analytics</span>
            </Link>
          </motion.div>

          {/* 4 Core Examination Pillars HUD */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-4xl mx-auto text-left"
          >
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition-colors">
              <div className="text-[11px] text-slate-400 font-medium">Standard Duration</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">180 Mins (3 Hrs)</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition-colors">
              <div className="text-[11px] text-slate-400 font-medium">Questions Blueprint</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">180 Questions</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition-colors">
              <div className="text-[11px] text-slate-400 font-medium">Marking Engine</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">+4, -1, 0 Scheme</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition-colors">
              <div className="text-[11px] text-slate-400 font-medium">Mock Papers Library</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">100 Full Mocks</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. COMMAND CENTER - Candidate Profile & Feature Action Matrix */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Candidate Command Card */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              {/* Profile Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
                    {candidate.name ? candidate.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Active Candidate Profile
                    </div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">{candidate.name}</h2>
                    <p className="text-xs text-slate-500 font-mono">Roll: {candidate.rollNumber}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-slate-500" />
                  <span>{isEditing ? 'Cancel' : 'Rename'}</span>
                </button>
              </div>

              {/* Inline Rename Form or Quick Specs */}
              {isEditing ? (
                <form
                  onSubmit={handleInlineSave}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-4 space-y-3"
                >
                  <div className="text-xs font-semibold text-slate-800">
                    Edit Candidate Profile
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Student Full Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. PRIYA SHARMA"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-semibold uppercase text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Roll Number / Candidate ID:
                    </label>
                    <input
                      type="text"
                      required
                      value={editRoll}
                      onChange={(e) => setEditRoll(e.target.value)}
                      placeholder="e.g. 240410012345"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold px-3 py-1 rounded text-xs transition"
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-2 mb-4 font-medium text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Student Name:</span>
                    <span className="font-bold text-slate-900 uppercase">{candidate.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Roll Number:</span>
                    <span className="font-mono font-bold text-slate-900">{candidate.rollNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Examination Format:</span>
                    <span className="font-semibold text-slate-900">NEET (UG) 2015–2026</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Paper Inventory:</span>
                    <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      100 Full Mocks
                    </span>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Profile updated successfully.</span>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Single-student private environment. The platform automatically tracks your test scores,
                time-traps, and chapter mastery under this candidate profile.
              </p>
            </div>

            {/* Candidate Quick Action Stack */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              {mistakeCount > 0 && (
                <button
                  type="button"
                  onClick={handleLaunchMistakeDrill}
                  disabled={drillLoading}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold py-2 px-3 rounded transition flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {drillLoading
                      ? 'Loading Drill...'
                      : `Retest Mistakes (${mistakeCount} Questions)`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLaunchInstantMock}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3 rounded shadow-xs transition flex items-center justify-center gap-2 text-xs cursor-pointer group"
              >
                <span>Confirm Candidate & Start Examination</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <Link
                href="/dashboard"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 rounded border border-slate-300 transition flex items-center justify-center gap-2 text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Candidate Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Quick Action Modes - 4 Feature Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 100 Mock Papers Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs premium-card group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                    Full Mocks
                  </span>
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-900 transition-colors">
                  100 Full-Length Mocks
                </h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Authentic 180-question mock exams adhering strictly to NTA difficulty ratio (54 Easy, 90 Moderate, 36 Difficult) with zero repetition.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 font-mono bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between">
                    <span>Physics (45 Qs)</span>
                    <span className="font-semibold text-slate-800">180 M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chemistry (45 Qs)</span>
                    <span className="font-semibold text-slate-800">180 M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Botany (45 Qs)</span>
                    <span className="font-semibold text-slate-800">180 M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zoology (45 Qs)</span>
                    <span className="font-semibold text-slate-800">180 M</span>
                  </div>
                </div>
              </div>

              <Link
                href="/papers"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Browse All 100 Papers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Targeted Chapter Practice Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs premium-card group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                    Chapter Drill
                  </span>
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-900 transition-colors">
                  NCERT Chapter Practice
                </h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Focus on specific weak chapters across 75 NCERT topics with customizable volume (10 to 45 questions) and step-by-step explanations.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>75 NCERT Chapters supported</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Custom volume (10–45 questions)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Instant step-by-step solutions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Timed or untimed practice</span>
                  </div>
                </div>
              </div>

              <Link
                href="/practice"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Configure Practice Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Performance & Mistake Notebook */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs premium-card group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                    Analytics
                  </span>
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-900 transition-colors">
                  Mistake Notebook & AIR
                </h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Track historical exam attempts, All India Rank predictions, college cutoff tier chances, time-traps, and NCERT chapter mastery heatmap.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>NEET AIR & Percentile Predictor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Time-Trap Pace Analyzer (&gt;120s)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>NCERT 75-Chapter Heatmap</span>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Analytics & Heatmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Instant Exam Launcher Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs premium-card group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                    Instant Launch
                  </span>
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-900 transition-colors">
                  Instant Mock Exam
                </h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Start an authentic 180-question NEET CBT mock exam with official NTA instructions, kiosk layout, and 180-minute countdown.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Immediate start with 1-click</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>NTA Kiosk Fullscreen Lock</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Zero-Data-Loss Offline Sync</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchInstantMock}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Mock Exam Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. NTA OFFICIAL QUESTION PALETTE STATUS LEGEND */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-600" />
                NTA Question Palette Status Legend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official color-coded status indicators utilized during the computer-based test.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              NTA Standard
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* 1. Not Visited */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <div className="w-7 h-7 rounded bg-slate-200 border border-slate-400 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                01
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Not Visited</div>
                <div className="text-[10px] text-slate-400">Not yet viewed</div>
              </div>
            </div>

            {/* 2. Not Answered */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-red-200 bg-red-50/50">
              <div className="w-7 h-7 rounded bg-[#dc2626] flex items-center justify-center font-bold text-xs text-white shrink-0">
                02
              </div>
              <div className="text-xs">
                <div className="font-bold text-red-900">Not Answered</div>
                <div className="text-[10px] text-red-700">Visited but unanswered</div>
              </div>
            </div>

            {/* 3. Answered */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-50 transition-colors">
              <div className="w-8 h-8 rounded bg-[#16a34a] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                03
              </div>
              <div className="text-xs">
                <div className="font-bold text-green-900">Answered</div>
                <div className="text-[10px] text-green-700">Saved for evaluation</div>
              </div>
            </div>

            {/* 4. Marked for Review */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                04
              </div>
              <div className="text-xs">
                <div className="font-bold text-purple-900">Marked for Review</div>
                <div className="text-[10px] text-purple-700">Unanswered; not evaluated</div>
              </div>
            </div>

            {/* 5. Answered & Marked */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition-colors">
              <div className="relative w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                05
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="text-xs">
                <div className="font-bold text-purple-900">Answered & Marked</div>
                <div className="text-[10px] text-purple-700">Evaluated in final scoring</div>
              </div>
            </div>
          </div>

          {/* Official Evaluation Rule Alert */}
          <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Official NTA Evaluation Note:</strong> Questions answered and marked for review{' '}
              <span className="font-bold text-emerald-800 underline">WILL be evaluated</span> in calculation
              of final marks (+4 or -1). Questions flagged for review without an answer selected will NOT be evaluated.
            </div>
          </div>
        </div>

        {/* 4. KEYBOARD SHORTCUTS & CBT FEATURES STRIP */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Keyboard Shortcuts Deck */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 premium-card">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Keyboard className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                CBT Hotkeys & Rapid Navigation
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-3.5">
              Speed up your test attempt without touching the mouse:
            </p>
            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Select Option</span>
                <div className="flex items-center gap-1">
                  <span className="kbd-cap">1</span>
                  <span className="kbd-cap">2</span>
                  <span className="kbd-cap">3</span>
                  <span className="kbd-cap">4</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Save & Next</span>
                <span className="kbd-cap">Enter ↵</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Mark for Review</span>
                <span className="kbd-cap">M</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Clear Answer</span>
                <div className="flex items-center gap-1">
                  <span className="kbd-cap">C</span>
                  <span className="text-slate-400 text-[10px]">/</span>
                  <span className="kbd-cap">Space</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Next / Prev Q</span>
                <div className="flex items-center gap-1">
                  <span className="kbd-cap">←</span>
                  <span className="kbd-cap">→</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Strike Option</span>
                <span className="kbd-cap text-[10px]">Alt + 1..4</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Flag Priority</span>
                <span className="kbd-cap">S</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-sans text-xs">Fullscreen Kiosk</span>
                <span className="kbd-cap">F</span>
              </div>
            </div>
          </div>

          {/* Exam Resilience & Offline Guard */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Zero-Data-Loss Offline Architecture
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Your responses are cached continuously in browser local storage. Even if your internet connection
                temporarily disconnects, answers are queued locally and automatically synced with PostgreSQL as soon as connectivity resumes.
              </p>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Instant LocalStorage Answer Mirroring</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Background sync queue worker running every 4 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Tab-switch proctoring alert counter with advisory notice</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Syllabus: NMC NEET UG 2027</span>
              <span>100% Client-Side Safe</span>
            </div>
          </div>
        </div>

        {/* 5. SYLLABUS & BLUEPRINT COVERAGE BREAKDOWN */}
        <div className="mt-8 bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
                <BookOpen className="w-3 h-3" />
                <span>NMC / NTA Prescribed Blueprint</span>
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                NEET (UG) 180-Question Syllabus & Subject Weightage
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All 100 mock tests on Vailism CBT strictly adhere to this subject distribution and modern pattern question taxonomy.
              </p>
            </div>
            <Link
              href="/papers"
              className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
            >
              <span>Explore 100 Papers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Physics */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Physics</span>
                  <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">45 Qs • 180 M</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pt-1">
                  <li className="flex items-center justify-between">
                    <span>Mechanics & Kinematics</span>
                    <span className="font-mono font-semibold text-slate-800">~14 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Electrodynamics & Magnetism</span>
                    <span className="font-mono font-semibold text-slate-800">~12 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Optics & Modern Physics</span>
                    <span className="font-mono font-semibold text-slate-800">~11 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Thermodynamics & Waves</span>
                    <span className="font-mono font-semibold text-slate-800">~8 Qs</span>
                  </li>
                </ul>
              </div>
              <div className="pt-3 mt-3 border-t border-blue-200/60 text-[10px] text-blue-700 font-semibold">
                Target Pace: &lt; 90 seconds / question
              </div>
            </div>

            {/* Chemistry */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">Chemistry</span>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">45 Qs • 180 M</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pt-1">
                  <li className="flex items-center justify-between">
                    <span>Organic Chemistry & Mechanisms</span>
                    <span className="font-mono font-semibold text-slate-800">~16 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Inorganic Chemistry & Coordination</span>
                    <span className="font-mono font-semibold text-slate-800">~15 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Physical Chemistry & Equilibrium</span>
                    <span className="font-mono font-semibold text-slate-800">~14 Qs</span>
                  </li>
                </ul>
              </div>
              <div className="pt-3 mt-3 border-t border-emerald-200/60 text-[10px] text-emerald-700 font-semibold">
                Target Pace: &lt; 60 seconds / question
              </div>
            </div>

            {/* Botany */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider">Botany</span>
                  <span className="text-xs font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">45 Qs • 180 M</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pt-1">
                  <li className="flex items-center justify-between">
                    <span>Genetics & Molecular Biology</span>
                    <span className="font-mono font-semibold text-slate-800">~15 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Plant Physiology & Photosynthesis</span>
                    <span className="font-mono font-semibold text-slate-800">~12 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Ecology & Environment</span>
                    <span className="font-mono font-semibold text-slate-800">~10 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Cell Structure & Division</span>
                    <span className="font-mono font-semibold text-slate-800">~8 Qs</span>
                  </li>
                </ul>
              </div>
              <div className="pt-3 mt-3 border-t border-purple-200/60 text-[10px] text-purple-700 font-semibold">
                Target Pace: &lt; 40 seconds / question
              </div>
            </div>

            {/* Zoology */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider">Zoology</span>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">45 Qs • 180 M</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pt-1">
                  <li className="flex items-center justify-between">
                    <span>Human Physiology</span>
                    <span className="font-mono font-semibold text-slate-800">~18 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Reproduction & Reproductive Health</span>
                    <span className="font-mono font-semibold text-slate-800">~11 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Biotechnology Principles & Apps</span>
                    <span className="font-mono font-semibold text-slate-800">~8 Qs</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Animal Kingdom & Evolution</span>
                    <span className="font-mono font-semibold text-slate-800">~8 Qs</span>
                  </li>
                </ul>
              </div>
              <div className="pt-3 mt-3 border-t border-amber-200/60 text-[10px] text-amber-800 font-semibold">
                Target Pace: &lt; 40 seconds / question
              </div>
            </div>
          </div>

          {/* 2015-2026 Question Format Evolution Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-700" />
              <span>2015–2026 Modern Pattern Question Formats Calibrated in All 100 Tests:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-purple-900 mb-0.5">Assertion & Reason (A/R)</div>
                <div className="text-[11px] text-slate-500">Evaluates whether Reason explains Assertion with 4 standard options.</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-sky-900 mb-0.5">Statement I & II</div>
                <div className="text-[11px] text-slate-500">Dual statement validation testing line-by-line NCERT memory precision.</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-emerald-900 mb-0.5">Match List I with List II</div>
                <div className="text-[11px] text-slate-500">Column matching across 4 biological or chemical concepts per question.</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-amber-900 mb-0.5">Multi-Statement Combinations</div>
                <div className="text-[11px] text-slate-500">Multi-fact evaluation (&quot;A, B and C only&quot;) eliminating guesswork.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onConfirmLaunch}
        title="Candidate Verification"
        subtitle="Please confirm your candidate name and roll number before starting the examination."
        confirmLabel="Confirm & Continue"
      />
    </div>
  );
}
