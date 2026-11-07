'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Sparkles,
  User,
  Hash,
  Database,
  BarChart3,
  Cpu,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const [candidateName, setCandidateName] = useState('KUMAR ADITYA');
  const [rollNumber, setRollNumber] = useState('240410012345');
  const [email, setEmail] = useState('aditya.neet@nta.ac.in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedRoll = localStorage.getItem('neet_candidate_roll');
    const savedName = localStorage.getItem('neet_candidate_name');
    if (savedRoll) setRollNumber(savedRoll);
    if (savedName) setCandidateName(savedName);
  }, []);

  const handleRegisterCandidate = async (targetRoute: string) => {
    if (!candidateName.trim() || !rollNumber.trim()) {
      setError('Please provide candidate name and roll number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/candidate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateName.trim(),
          rollNumber: rollNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate candidate.');
      }

      localStorage.setItem('neet_candidate_roll', data.candidate.rollNumber);
      localStorage.setItem('neet_candidate_name', data.candidate.name);
      localStorage.setItem('neet_candidate_id', data.candidate.id);

      router.push(targetRoute);
    } catch (err: any) {
      setError(err.message || 'An error occurred during candidate registration.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = () => {
    setCandidateName('KUMAR ADITYA');
    setRollNumber('240410012345');
    setEmail('aditya.neet@nta.ac.in');
  };

  return (
    <div className="flex-1 bg-gray-50 pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-blue-900 to-[#1e3a8a] text-white py-12 px-4 shadow-md">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-800/80 border border-blue-400/30 text-blue-200 text-xs px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>NTA NEET CBT Exact Examination Simulation Environment</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Master the Official Computer-Based Test Experience
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Eliminate exam-day anxiety. Experience the authentic question palette, countdown
            timer, marking scheme, subject switching, and instant performance analysis out of 720.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
            <span className="bg-blue-950/60 border border-blue-600/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> 180 Minutes (3 Hours)
            </span>
            <span className="bg-blue-950/60 border border-blue-600/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-green-400" /> 180 Questions (4 Subjects)
            </span>
            <span className="bg-blue-950/60 border border-blue-600/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-400" /> Maximum 720 Marks (+4 / -1)
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Candidate Registration Card */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Candidate Verification</h2>
                  <p className="text-xs text-gray-500">Step 1: Enter your admission roll details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={autofillDemo}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 transition-colors"
              >
                Auto-fill Demo
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegisterCandidate('/instructions');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Candidate Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. KUMAR ADITYA"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 uppercase font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Roll Number / Hall Ticket No. *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 240410012345"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono font-bold text-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@nta.ac.in"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-700"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg shadow transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? 'Verifying Candidate...' : 'Proceed to Instructions Screen'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span>Session state & question paper are preserved across browser refresh</span>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Action Modes */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Mock Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-blue-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Official Exam Structure
                  </span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Full NEET Mock Examination
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  180 questions across Physics (45), Chemistry (45), Botany (45), and Zoology (45).
                  180-minute countdown with full NTA navigation palette.
                </p>
                <div className="text-[11px] text-gray-500 space-y-1 mb-4 font-mono bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div>• Physics: 45 Questions (180 Marks)</div>
                  <div>• Chemistry: 45 Questions (180 Marks)</div>
                  <div>• Botany: 45 Questions (180 Marks)</div>
                  <div>• Zoology: 45 Questions (180 Marks)</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRegisterCandidate('/instructions')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Start Full Mock CBT
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Targeted Practice Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-emerald-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Self-Paced
                  </span>
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Targeted Practice Mode
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Practice specific subjects or chapters with customized question counts (10, 20, 30, 45).
                  Choose timed or untimed, with optional instant explanations.
                </p>
                <div className="text-[11px] text-gray-500 space-y-1 mb-4 bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div>• Subject & Chapter filter</div>
                  <div>• Custom question volume</div>
                  <div>• Instant feedback & KaTeX solutions</div>
                  <div>• Untimed or timed options</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRegisterCandidate('/practice')}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Configure Practice Mode
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Student Dashboard Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-purple-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Analytics Hub
                  </span>
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Student Dashboard
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Track historical exam scores, accuracy trends over time, subject strengths, and
                  review past solutions question-by-question.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRegisterCandidate('/dashboard')}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                View Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Question Bank Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-amber-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Educator & Admin
                  </span>
                  <Database className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Question Bank Manager
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Browse 250+ seeded authentic NEET questions, add custom questions with live KaTeX
                  formula preview, or import via CSV/JSON.
                </p>
              </div>

              <a
                href="/admin"
                className="w-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
              >
                Manage Question Bank
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* NTA CBT Color Legend & Scheme Showcase */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            Official NTA Question Palette Status Legend
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Not Visited */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <div className="w-7 h-7 rounded bg-gray-200 border border-gray-400 flex items-center justify-center font-bold text-xs text-gray-700 shrink-0">
                01
              </div>
              <div className="text-xs">
                <div className="font-bold text-gray-800">Not Visited</div>
                <div className="text-[10px] text-gray-500">You have not visited question yet</div>
              </div>
            </div>

            {/* Not Answered */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-red-200 bg-red-50/50">
              <div className="w-7 h-7 rounded bg-[#dc2626] flex items-center justify-center font-bold text-xs text-white shrink-0">
                02
              </div>
              <div className="text-xs">
                <div className="font-bold text-red-900">Not Answered</div>
                <div className="text-[10px] text-red-700">Visited but not answered</div>
              </div>
            </div>

            {/* Answered */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-green-200 bg-green-50/50">
              <div className="w-7 h-7 rounded bg-[#16a34a] flex items-center justify-center font-bold text-xs text-white shrink-0">
                03
              </div>
              <div className="text-xs">
                <div className="font-bold text-green-900">Answered</div>
                <div className="text-[10px] text-green-700">Saved for evaluation</div>
              </div>
            </div>

            {/* Marked for Review */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-purple-200 bg-purple-50/50">
              <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-xs text-white shrink-0">
                04
              </div>
              <div className="text-xs">
                <div className="font-bold text-purple-900">Marked for Review</div>
                <div className="text-[10px] text-purple-700">Not answered, marked for review</div>
              </div>
            </div>

            {/* Answered & Marked */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-purple-200 bg-purple-50/50">
              <div className="relative w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-xs text-white shrink-0">
                05
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></span>
              </div>
              <div className="text-xs">
                <div className="font-bold text-purple-900">Answered & Marked</div>
                <div className="text-[10px] text-purple-700">Evaluated in final scoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
