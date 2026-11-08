'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { SINGLE_STUDENT } from '@/lib/auth';

export default function HomePage() {
  return (
    <div className="flex-1 bg-gray-50 pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-blue-900 to-[#1e3a8a] text-white py-12 px-4 shadow-md">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-800/80 border border-blue-400/30 text-blue-200 text-xs px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>NTA NEET UG 2027 Official CBT Simulation Environment</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            National Eligibility Cum Entrance Test (UG) Simulator
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Authentic Computer-Based Examination Platform for NEET (UG) 2027. Full NTA question palette,
            180-minute countdown timer, official +4/-1 marking scheme, and immediate performance analysis.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
            <span className="bg-blue-950/60 border border-blue-600/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> 180 Minutes (3 Hours)
            </span>
            <span className="bg-blue-950/60 border border-blue-600/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-green-400" /> 180 Questions (4 Core Subjects)
            </span>
            <span className="bg-blue-950/60 border border-blue-600/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-400" /> Maximum 720 Marks (+4 / -1)
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Candidate Card */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-black text-lg flex items-center justify-center shadow-sm">
                    {SINGLE_STUDENT.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Authorized Candidate Profile
                    </div>
                    <h2 className="text-base font-bold text-gray-900">{SINGLE_STUDENT.name}</h2>
                    <p className="text-xs text-gray-500 font-mono">Roll: {SINGLE_STUDENT.rollNumber}</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2 mb-4 font-medium text-slate-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Examination:</span>
                  <span className="font-bold text-gray-900">NEET (UG) 2027</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registered Email:</span>
                  <span className="font-mono text-gray-800">{SINGLE_STUDENT.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Access Mode:</span>
                  <span className="text-emerald-700 font-semibold">Private Single-Student Simulator</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available Mock Papers:</span>
                  <span className="font-bold text-blue-900">100 Full-Length Mocks</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Your examination session is permanently synced. Every attempted test, chapter analytics,
                and review bookmark are recorded automatically in your personal database.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Link
                href="/instructions"
                className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-all flex items-center justify-center gap-2 text-xs"
              >
                <span>Read Official Examination Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold py-2 px-4 rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
                <span>Open Personal Analytics Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Quick Action Modes */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 100 Mock Papers Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-blue-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    100 Mock Papers
                  </span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  100 Full-Length Mocks
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  100 authentic 180-question mock exams covering Physics (45), Chemistry (45), Botany (45), and Zoology (45).
                </p>
                <div className="text-[11px] text-gray-500 space-y-1 mb-4 font-mono bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div>• Physics: 45 Questions (180 Marks)</div>
                  <div>• Chemistry: 45 Questions (180 Marks)</div>
                  <div>• Botany: 45 Questions (180 Marks)</div>
                  <div>• Zoology: 45 Questions (180 Marks)</div>
                </div>
              </div>

              <Link
                href="/papers"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Browse 100 Mock Papers
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Targeted Practice Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-emerald-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Self-Paced Practice
                  </span>
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Chapter Practice Mode
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Practice specific subjects or chapters with customized question counts (10, 20, 30, 45) and instant KaTeX solutions.
                </p>
                <div className="text-[11px] text-gray-500 space-y-1 mb-4 bg-gray-50 p-2.5 rounded border border-gray-200">
                  <div>• 75 NCERT Chapters supported</div>
                  <div>• Custom volume (10–45 questions)</div>
                  <div>• Instant feedback & explanations</div>
                  <div>• Timed or untimed practice</div>
                </div>
              </div>

              <Link
                href="/practice"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Configure Practice Mode
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Student Dashboard Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-purple-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Performance Analytics
                  </span>
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Mistake Notebook & Stats
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Track historical exam scores, accuracy trends over time, subject strengths, and review past incorrect questions.
                </p>
              </div>

              <Link
                href="/dashboard"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                View Analytics & Trends
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Exam Launch Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-amber-600">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Quick Start
                  </span>
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  Instant Mock Exam
                </h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  Jump straight into a standardized 180-question NEET CBT mock examination with official 180-minute timer.
                </p>
              </div>

              <Link
                href="/instructions"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Launch Mock Exam
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
