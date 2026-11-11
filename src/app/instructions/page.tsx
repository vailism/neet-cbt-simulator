'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
  Shield,
  HelpCircle,
  Layers,
  Edit2,
  Sparkles,
  Award,
  BookOpen,
  Check,
} from 'lucide-react';
import {
  getClientCandidate,
  CandidateInfo,
  DEFAULT_CANDIDATE,
} from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';

export default function InstructionsPage() {
  const router = useRouter();

  const [selectedDuration, setSelectedDuration] = useState<number>(180);
  const [candidate, setCandidate] = useState<CandidateInfo>(DEFAULT_CANDIDATE);
  const [declared, setDeclared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const current = getClientCandidate();
    setCandidate(current);

    const handleUpdate = (e: any) => {
      setCandidate(e.detail || getClientCandidate());
    };

    window.addEventListener('neet_candidate_updated', handleUpdate);
    return () => window.removeEventListener('neet_candidate_updated', handleUpdate);
  }, []);

  const handleStartExam = async () => {
    if (!declared) {
      setError('Please accept the declaration before proceeding.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create new Exam Attempt with current candidate
      const res = await fetch('/api/exam/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: candidate.rollNumber,
          candidateName: candidate.name,
          mode: 'FULL_MOCK',
          configCode: 'NEET_UG_DEFAULT',
          durationMinutes: selectedDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize examination.');
      }

      router.push(`/exam/${data.attemptId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start examination.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50/70 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-elevated border border-slate-200/90 overflow-hidden">
        {/* NTA Instructions Header */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-5 sm:p-7 flex flex-wrap items-center justify-between gap-4 border-b border-blue-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-blue-200 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>National Eligibility Cum Entrance Test (UG) 2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              General Examination Instructions & CBT Protocol
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="relative z-10 flex items-center gap-3 bg-blue-900/60 hover:bg-blue-900 border border-blue-400/30 px-4 py-2 rounded-xl text-xs text-left transition-all cursor-pointer group shadow-xs"
            title="Click to change candidate details"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {candidate.name ? candidate.name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="font-bold flex items-center gap-1 text-white text-xs">
                <span>{candidate.name}</span>
                <Edit2 className="w-2.5 h-2.5 text-blue-300 opacity-70 group-hover:opacity-100" />
              </div>
              <div className="font-mono text-blue-200 text-[11px]">{candidate.rollNumber}</div>
            </div>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 text-sm text-slate-800 space-y-7">
          {/* Quick Metrics HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-2xl text-center">
            <div className="p-2">
              <div className="text-slate-500 font-medium text-xs">Total Duration</div>
              <div className="font-black text-blue-950 text-base sm:text-lg font-mono">180 Minutes</div>
              <div className="text-[10px] text-blue-700">3 Hours Full Length</div>
            </div>
            <div className="p-2">
              <div className="text-slate-500 font-medium text-xs">Total Questions</div>
              <div className="font-black text-blue-950 text-base sm:text-lg font-mono">180 Questions</div>
              <div className="text-[10px] text-blue-700">4 Core Subjects</div>
            </div>
            <div className="p-2">
              <div className="text-slate-500 font-medium text-xs">Maximum Marks</div>
              <div className="font-black text-blue-950 text-base sm:text-lg font-mono">720 Marks</div>
              <div className="text-[10px] text-blue-700">Standard Cutoff Scale</div>
            </div>
            <div className="p-2">
              <div className="text-slate-500 font-medium text-xs">Marking Scheme</div>
              <div className="font-black text-emerald-700 text-base sm:text-lg font-mono">+4, -1, 0</div>
              <div className="text-[10px] text-emerald-600">Negative Marking</div>
            </div>
          </div>

          {/* Section 1: General Instructions */}
          <div className="space-y-3">
            <h2 className="font-bold text-base text-blue-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>1. General Guidelines & Examination Timer</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed text-xs sm:text-sm">
              <li>
                The countdown timer in the top right corner of the examination interface will continuously display the remaining time available for you to complete the test.
              </li>
              <li>
                When the timer reaches zero, the examination will end automatically. Your answers will be submitted and scored by the server without requiring manual submission.
              </li>
              <li>
                The examination consists of 180 compulsory questions across 4 subject sections: Physics (45), Chemistry (45), Botany (45), and Zoology (45).
              </li>
            </ul>
          </div>

          {/* Section 2: Question Palette Color Legend */}
          <div className="space-y-3">
            <h2 className="font-bold text-base text-blue-950 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-700" />
              <span>2. Official NTA Question Status Palette Legend</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="w-8 h-8 rounded bg-slate-200 border border-slate-400 flex items-center justify-center font-bold text-slate-700 shrink-0">
                  1
                </div>
                <span className="font-medium text-slate-700">You have not visited the question yet.</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50/50">
                <div className="w-8 h-8 rounded bg-[#dc2626] flex items-center justify-center font-bold text-white shrink-0">
                  2
                </div>
                <span className="font-medium text-red-900">You have visited the question but have not answered it.</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50/50">
                <div className="w-8 h-8 rounded bg-[#16a34a] flex items-center justify-center font-bold text-white shrink-0">
                  3
                </div>
                <span className="font-medium text-green-900">You have answered the question.</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/50">
                <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-white shrink-0">
                  4
                </div>
                <span className="font-medium text-purple-900">You have marked the question for review (UNANSWERED).</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/50 sm:col-span-2">
                <div className="relative w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-white shrink-0">
                  5
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <span className="font-semibold text-purple-950">
                  The question is ANSWERED and marked for review. This answer{' '}
                  <span className="text-green-700 underline font-bold">WILL be evaluated</span> in calculation
                  of marks.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Navigation & Action Buttons */}
          <div className="space-y-3">
            <h2 className="font-bold text-base text-blue-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>3. Navigating & Answering Questions</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed text-xs sm:text-sm">
              <li>
                <strong>Save & Next:</strong> Saves your selected answer and immediately navigates to the next question.
              </li>
              <li>
                <strong>Clear Response:</strong> Clears your currently selected option for the active question.
              </li>
              <li>
                <strong>Mark for Review & Next:</strong> Flags the question for review without selecting an option.
              </li>
              <li>
                <strong>Subject Tabs:</strong> Click on Physics, Chemistry, Botany, or Zoology tabs at any time to switch sections directly.
              </li>
            </ul>
          </div>

          {/* Section 4: Marking Scheme */}
          <div className="space-y-3">
            <h2 className="font-bold text-base text-blue-950 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" />
              <span>4. Official Marking Scheme</span>
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Response Type</th>
                    <th className="p-3">Marks Awarded</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-green-700">Correct Answer</td>
                    <td className="p-3 font-mono font-bold text-green-700 text-sm">+4</td>
                    <td className="p-3 text-slate-600">Candidate selected the correct option.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-red-600">Incorrect Answer</td>
                    <td className="p-3 font-mono font-bold text-red-600 text-sm">-1</td>
                    <td className="p-3 text-slate-600">
                      Candidate selected an incorrect option (Negative Marking).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-600">Unanswered / Skipped</td>
                    <td className="p-3 font-mono font-bold text-slate-600 text-sm">0</td>
                    <td className="p-3 text-slate-600">No option selected; zero marks awarded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Configurable Examination Settings */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-sm text-blue-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>5. Examination Timer & CBT Configuration</span>
            </h2>

            <div className="text-xs">
              <label className="block font-bold text-slate-800 mb-2">Select Examination Duration Window:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
                <button
                  type="button"
                  onClick={() => setSelectedDuration(180)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDuration === 180
                      ? 'border-blue-700 bg-blue-50/90 font-bold text-blue-950 ring-2 ring-blue-700 shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-blue-900">⏱️ 180 Minutes (Standard NEET UG)</div>
                    {selectedDuration === 180 && <Check className="w-4 h-4 text-blue-700" />}
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-1">
                    Official 3-hour examination format (180 questions)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDuration(200)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedDuration === 200
                      ? 'border-blue-700 bg-blue-50/90 font-bold text-blue-950 ring-2 ring-blue-700 shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-blue-900">⏱️ 200 Minutes (Extended Buffer)</div>
                    {selectedDuration === 200 && <Check className="w-4 h-4 text-blue-700" />}
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal mt-1">
                    3 hours 20 minutes buffer format
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Declaration Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3.5 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={declared}
                onChange={(e) => {
                  setDeclared(e.target.checked);
                  if (error) setError(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-slate-800 leading-relaxed font-medium">
                I have read and understood all the instructions given above. I ensure that I am
                appearing for this computer-based examination under strictly authentic conditions.
                I understand that the timer will run for {selectedDuration} minutes and my paper will be submitted
                automatically upon expiry.
              </span>
            </label>
          </div>

          {/* Bottom Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
            >
              Back to Candidate Portal
            </button>

            <button
              type="button"
              disabled={!declared || loading}
              onClick={handleStartExam}
              className={`flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                declared && !loading
                  ? 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Generating 180 Question Paper...' : 'I am ready to begin'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Verify Candidate Profile"
        subtitle="Confirm candidate name and roll number for this test attempt."
        confirmLabel="Save Details"
      />
    </div>
  );
}
