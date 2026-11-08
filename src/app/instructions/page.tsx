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
    <div className="flex-1 bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* NTA Instructions Header */}
        <div className="bg-[#1e3a8a] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-blue-900">
          <div>
            <div className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
              National Eligibility Cum Entrance Test (UG) - 2027
            </div>
            <h1 className="text-lg sm:text-xl font-bold">General Examination Instructions</h1>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 bg-blue-950/60 hover:bg-blue-950 border border-blue-400/30 px-3 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer group"
            title="Click to change candidate details"
          >
            <User className="w-4 h-4 text-blue-300" />
            <div>
              <div className="font-bold flex items-center gap-1">
                <span>{candidate.name}</span>
                <Edit2 className="w-2.5 h-2.5 text-blue-400 opacity-70 group-hover:opacity-100" />
              </div>
              <div className="font-mono text-blue-200 text-[11px]">{candidate.rollNumber}</div>
            </div>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-sm text-gray-800 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-center text-xs">
            <div>
              <div className="text-gray-500 font-medium">Total Duration</div>
              <div className="font-bold text-blue-900 text-sm">180 Minutes</div>
            </div>
            <div>
              <div className="text-gray-500 font-medium">Total Questions</div>
              <div className="font-bold text-blue-900 text-sm">180 Questions</div>
            </div>
            <div>
              <div className="text-gray-500 font-medium">Maximum Marks</div>
              <div className="font-bold text-blue-900 text-sm">720 Marks</div>
            </div>
            <div>
              <div className="text-gray-500 font-medium">Marking Scheme</div>
              <div className="font-bold text-emerald-700 text-sm">+4, -1, 0</div>
            </div>
          </div>

          {/* Section 1: General Instructions */}
          <div>
            <h2 className="font-bold text-base text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              1. General Guidelines
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700 leading-relaxed text-xs sm:text-sm">
              <li>
                The countdown timer in the top right corner of the screen will display the remaining
                time available for you to complete the examination.
              </li>
              <li>
                When the timer reaches zero, the examination will end automatically. You will NOT be
                required to end or submit your examination manually.
              </li>
              <li>
                The examination consists of 180 questions across Physics (45), Chemistry (45), Botany
                (45), and Zoology (45).
              </li>
            </ul>
          </div>

          {/* Section 2: Question Palette Color Legend */}
          <div>
            <h2 className="font-bold text-base text-blue-900 mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              2. Question Status Palette Legend
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded border border-gray-200 bg-gray-50">
                <div className="w-7 h-7 rounded bg-gray-200 border border-gray-400 flex items-center justify-center font-bold text-gray-700 shrink-0">
                  1
                </div>
                <span>You have not visited the question yet.</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded border border-red-200 bg-red-50/50">
                <div className="w-7 h-7 rounded bg-[#dc2626] flex items-center justify-center font-bold text-white shrink-0">
                  2
                </div>
                <span>You have not answered the question.</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded border border-green-200 bg-green-50/50">
                <div className="w-7 h-7 rounded bg-[#16a34a] flex items-center justify-center font-bold text-white shrink-0">
                  3
                </div>
                <span>You have answered the question.</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded border border-purple-200 bg-purple-50/50">
                <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-white shrink-0">
                  4
                </div>
                <span>You have marked the question for review (UNANSWERED).</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded border border-purple-200 bg-purple-50/50 sm:col-span-2">
                <div className="relative w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center font-bold text-white shrink-0">
                  5
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></span>
                </div>
                <span className="font-semibold text-purple-950">
                  The question is ANSWERED and marked for review. This answer{' '}
                  <span className="text-green-700 underline">WILL be evaluated</span> in calculation
                  of marks.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Navigation & Action Buttons */}
          <div>
            <h2 className="font-bold text-base text-blue-900 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              3. Navigating & Answering Questions
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700 leading-relaxed text-xs sm:text-sm">
              <li>
                <strong>Save & Next:</strong> Saves your selected answer and moves to the next
                question.
              </li>
              <li>
                <strong>Clear Response:</strong> Clears your selected answer for the currently
                active question.
              </li>
              <li>
                <strong>Save & Mark for Review:</strong> Saves your selected answer, marks the
                question for review, and moves to next. (Will be evaluated).
              </li>
              <li>
                <strong>Mark for Review & Next:</strong> Marks the question for review without
                selecting an answer, and moves to next. (Will NOT be evaluated).
              </li>
              <li>
                <strong>Subject Tabs:</strong> Click on Physics, Chemistry, Botany, or Zoology tabs
                at any time to directly switch sections.
              </li>
            </ul>
          </div>

          {/* Section 4: Marking Scheme */}
          <div>
            <h2 className="font-bold text-base text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              4. Official Marking Scheme
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 rounded-lg">
                <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">Response Type</th>
                    <th className="p-2.5">Marks Awarded</th>
                    <th className="p-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-2.5 font-bold text-green-700">Correct Answer</td>
                    <td className="p-2.5 font-bold text-green-700">+4</td>
                    <td className="p-2.5 text-gray-600">Candidate selected the correct option.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-red-600">Incorrect Answer</td>
                    <td className="p-2.5 font-bold text-red-600">-1</td>
                    <td className="p-2.5 text-gray-600">
                      Candidate selected an incorrect option (Negative Marking).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-gray-600">Unanswered / Skipped</td>
                    <td className="p-2.5 font-bold text-gray-600">0</td>
                    <td className="p-2.5 text-gray-600">No option selected; no marks deducted.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Configurable Examination Settings */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
            <h2 className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              5. Examination Timer & CBT Configuration
            </h2>

            <div className="text-xs">
              <label className="block font-bold text-gray-800 mb-1.5">Select Examination Duration:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => setSelectedDuration(180)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedDuration === 180
                      ? 'border-blue-700 bg-blue-50 font-bold text-blue-900 ring-1 ring-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-xs">⏱️ 180 Minutes (Standard NEET UG)</div>
                  <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                    Official 3-hour examination format (180 questions)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDuration(200)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedDuration === 200
                      ? 'border-blue-700 bg-blue-50 font-bold text-blue-900 ring-1 ring-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-xs">⏱️ 200 Minutes (Extended Window)</div>
                  <div className="text-[10px] text-gray-500 font-normal mt-0.5">
                    3 hours 20 minutes buffer format
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Declaration Checkbox */}
          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-start gap-3 p-3 bg-amber-50/60 border border-amber-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={declared}
                onChange={(e) => {
                  setDeclared(e.target.checked);
                  if (error) setError(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-800 leading-relaxed font-medium">
                I have read and understood all the instructions given above. I ensure that I am
                appearing for this computer-based examination under strictly authentic conditions.
                I understand that the timer will run for 180 minutes and my paper will be submitted
                automatically upon expiry.
              </span>
            </label>
          </div>

          {/* Bottom Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xs text-gray-600 hover:text-gray-900 underline font-medium"
            >
              Back to Candidate Portal
            </button>

            <button
              type="button"
              disabled={!declared || loading}
              onClick={handleStartExam}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm shadow transition-all ${
                declared && !loading
                  ? 'bg-green-700 hover:bg-green-800 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
