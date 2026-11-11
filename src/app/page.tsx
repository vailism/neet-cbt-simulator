'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Award,
  BookOpen,
  Sparkles,
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
      {/* 1. HERO SECTION - Ultra-Modern NTA Exam Command Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 text-white pt-12 pb-24 px-4 sm:px-6 grain">
        {/* Ambient Decorative Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute top-32 left-10 w-72 h-72 bg-amber-500/10 blur-[90px] pointer-events-none rounded-full" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-6xl mx-auto text-center space-y-6">
          {/* Official Agency Badge Pill */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-400/30 text-blue-200 text-xs px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide uppercase text-[11px] text-slate-200">
              National Testing Agency Standard CBT Environment
            </span>
            <span className="text-blue-400">|</span>
            <span className="text-amber-300 font-bold text-[11px]">NEET (UG) 2027</span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-3 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-balance leading-tight sm:leading-none">
              Master NEET UG 2027 with{' '}
              <span className="bg-gradient-to-r from-blue-200 via-sky-300 to-amber-200 bg-clip-text text-transparent">
                True NTA CBT Fidelity
              </span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-normal">
              Zero distractions. 100 authentic full-length mock examinations, full NTA question palette,
              strict 180-minute countdown, +4/-1 scoring engine, and AI-powered mistake remediation.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={handleLaunchInstantMock}
              className="group relative inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xl shadow-blue-900/40 hover:shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>Start Full Mock CBT Exam</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {mistakeCount > 0 ? (
              <button
                type="button"
                onClick={handleLaunchMistakeDrill}
                disabled={drillLoading}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm px-5 py-3.5 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <Target className="w-4 h-4 text-red-700" />
                <span>
                  {drillLoading ? 'Preparing Drill...' : `Mistake Drill (${mistakeCount} Qs)`}
                </span>
              </button>
            ) : (
              <Link
                href="/papers"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-3.5 rounded-xl border border-white/20 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4 text-blue-300" />
                <span>Browse 100 Mock Papers</span>
              </Link>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 text-slate-200 font-semibold text-sm px-4 py-3.5 rounded-xl border border-slate-700/80 transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Student Analytics</span>
            </Link>
          </div>

          {/* 4 Core Examination Pillars HUD */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Standard Duration</div>
                <div className="text-sm font-bold text-white font-mono">180 Mins (3 Hrs)</div>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Questions Blueprint</div>
                <div className="text-sm font-bold text-white font-mono">180 Questions</div>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Marking Engine</div>
                <div className="text-sm font-bold text-white font-mono">+4, -1, 0 Scheme</div>
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-purple-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Mock Papers Library</div>
                <div className="text-sm font-bold text-white font-mono">100 Full Mocks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMAND CENTER - Candidate Profile & Feature Action Matrix */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Candidate Command Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-elevated border border-slate-200/90 p-6 flex flex-col justify-between relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />

            <div>
              {/* Profile Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-black text-xl flex items-center justify-center shadow-md">
                      {candidate.name ? candidate.name.charAt(0) : 'S'}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold" title="Candidate Active">
                      ✓
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                      <span>Active Candidate Profile</span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 leading-snug">{candidate.name}</h2>
                    <p className="text-xs text-slate-500 font-mono">Roll: {candidate.rollNumber}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel' : 'Rename'}</span>
                </button>
              </div>

              {/* Inline Rename Form or Quick Specs */}
              {isEditing ? (
                <form
                  onSubmit={handleInlineSave}
                  className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 mb-5 space-y-3.5 animate-in fade-in"
                >
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Change Candidate Name & Roll Number</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Student Full Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. PRIYA SHARMA"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold uppercase text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Roll Number / Candidate ID:
                    </label>
                    <input
                      type="text"
                      required
                      value={editRoll}
                      onChange={(e) => setEditRoll(e.target.value)}
                      placeholder="e.g. 240410012345"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-4 text-xs space-y-2.5 mb-5 font-medium text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Student Name:</span>
                    <span className="font-bold text-slate-900 uppercase">{candidate.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Roll Number:</span>
                    <span className="font-mono font-bold text-slate-900">{candidate.rollNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Target Examination:</span>
                    <span className="font-bold text-blue-900">NEET (UG) 2027</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Full Mock Papers:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      100 Full Mocks Ready
                    </span>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Candidate profile updated successfully!</span>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Single-student private environment. The platform automatically tracks your test scores,
                time-traps, and chapter mastery under this candidate profile.
              </p>
            </div>

            {/* Candidate Quick Action Stack */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              {mistakeCount > 0 && (
                <button
                  type="button"
                  onClick={handleLaunchMistakeDrill}
                  disabled={drillLoading}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <Target className="w-4 h-4 text-red-700" />
                  <span>
                    {drillLoading
                      ? 'Loading Drill...'
                      : `🎯 Launch Mistake Drill (${mistakeCount} Questions)`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLaunchInstantMock}
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer group"
              >
                <span>Confirm Name & Read Instructions</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                href="/dashboard"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
                <span>Open Student Analytics & Heatmap</span>
              </Link>
            </div>
          </div>

          {/* Quick Action Modes - 4 Feature Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 100 Mock Papers Card */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:shadow-elevated transition-all border-l-4 border-l-blue-600 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Official 100 Papers
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mb-1.5 group-hover:text-blue-700 transition-colors">
                  100 Full-Length Mocks
                </h3>
                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                  Authentic 180-question mock exams adhering strictly to NTA difficulty ratio (54 Easy, 90 Moderate, 36 Difficult) with zero question repetition.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <span>• Physics (45 Qs)</span>
                    <span className="font-bold text-slate-900">180 M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Chemistry (45 Qs)</span>
                    <span className="font-bold text-slate-900">180 M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Botany (45 Qs)</span>
                    <span className="font-bold text-slate-900">180 M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Zoology (45 Qs)</span>
                    <span className="font-bold text-slate-900">180 M</span>
                  </div>
                </div>
              </div>

              <Link
                href="/papers"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Browse All 100 Papers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Targeted Chapter Practice Card */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:shadow-elevated transition-all border-l-4 border-l-emerald-600 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Self-Paced Practice
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mb-1.5 group-hover:text-emerald-700 transition-colors">
                  NCERT Chapter Practice
                </h3>
                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                  Focus on specific weak chapters across 75 NCERT topics with customizable question counts (10 to 45 questions) and instant KaTeX explanations.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>75 NCERT Chapters supported</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Custom volume (10–45 questions)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant solutions with formulas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Timed or untimed practice</span>
                  </div>
                </div>
              </div>

              <Link
                href="/practice"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Configure Practice Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Performance & Mistake Notebook */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:shadow-elevated transition-all border-l-4 border-l-purple-600 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Diagnostics & AIR
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mb-1.5 group-hover:text-purple-700 transition-colors">
                  Mistake Notebook & AIR
                </h3>
                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                  Track historical exam attempts, All India Rank predictions, college cutoff tier chances, time-traps, and NCERT chapter mastery heatmap.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>NEET AIR & Percentile Predictor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>Time-Trap Pace Analyzer (&gt;120s)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>NCERT 75-Chapter Heatmap</span>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>View Analytics & Heatmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Instant Exam Launcher Card */}
            <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-5 flex flex-col justify-between hover:shadow-elevated transition-all border-l-4 border-l-amber-500 group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Quick Start
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mb-1.5 group-hover:text-amber-600 transition-colors">
                  Instant Mock Exam
                </h3>
                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                  Jump directly into an official 180-question NEET CBT mock exam with official NTA instructions, kiosk mode, and 180-minute countdown.
                </p>

                <div className="text-[11px] text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>Immediate start with 1-click</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>NTA Kiosk Fullscreen Lock</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>Zero-Data-Loss Offline Sync</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchInstantMock}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Launch Mock Exam Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. NTA OFFICIAL QUESTION PALETTE STATUS LEGEND */}
        <div className="mt-8 bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-700" />
                Official NTA Question Status Palette Legend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard color-coded status indicators used in the actual NEET (UG) computer-based examination.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              NTA Guideline 2027
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* 1. Not Visited */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded bg-slate-200 border border-slate-400 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 shadow-xs">
                01
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Not Visited</div>
                <div className="text-[10px] text-slate-500">Question not yet viewed</div>
              </div>
            </div>

            {/* 2. Not Answered */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors">
              <div className="w-8 h-8 rounded bg-[#dc2626] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
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
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Keyboard className="w-4 h-4 text-blue-700" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                CBT Hotkeys & Rapid Navigation
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-3.5">
              Speed up your test attempt without touching the mouse:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Select Option</span>
                <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  1 • 2 • 3 • 4
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Save & Next</span>
                <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  Enter
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Mark for Review</span>
                <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  M
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Clear Answer</span>
                <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  C / Space
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Next / Prev Q</span>
                <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  ← • →
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Fullscreen Kiosk</span>
                <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  F
                </span>
              </div>
            </div>
          </div>

          {/* Exam Resilience & Offline Guard */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 flex flex-col justify-between">
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
