'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Award, CheckCircle, XCircle } from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';

export default function ExamPrintBookletPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/exam/${attemptId}/result`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load exam booklet data.');
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error loading booklet.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900 mb-3"></div>
        <div className="text-sm font-bold text-gray-800">Generating Official Printable NEET Test Booklet...</div>
        <div className="text-xs text-gray-500 mt-1">Formatting KaTeX formulas and 180 questions</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-xl border border-red-200 text-center max-w-md">
          <p className="text-sm font-bold text-red-700">{error || 'Failed to load booklet.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { candidate, overall, questions = [], subjectWise = [] } = data;

  const subjects = ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0 print:py-0">
      {/* Non-print Top Action Bar */}
      <div className="max-w-5xl mx-auto mb-6 print:hidden flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scorecard</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:inline">
            180 Questions • Formatted for A4 / Letter PDF
          </span>
          <button
            onClick={() => window.print()}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Booklet / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Booklet Container */}
      <div className="max-w-5xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-md border border-gray-200 print:shadow-none print:border-none print:p-0 print:max-w-none text-gray-900">
        {/* NTA PHYSICAL TEST BOOKLET COVER / HEADER */}
        <div className="border-4 border-double border-gray-900 p-6 text-center mb-8">
          <div className="text-[11px] font-black uppercase tracking-widest text-gray-600 mb-1">
            NATIONAL TESTING AGENCY • GOVERNMENT OF INDIA
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-950">
            National Eligibility Cum Entrance Test (UG) 2027
          </h1>
          <div className="text-xs font-bold text-gray-700 mt-1">
            Official Computer-Based Examination Question Paper & Complete Solutions
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t-2 border-gray-900 text-left text-xs">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Candidate Name</span>
              <strong className="text-sm font-black">{candidate.name}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Roll Number</span>
              <strong className="text-sm font-mono font-black">{candidate.rollNumber}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Score Obtained</span>
              <strong className="text-sm font-mono font-black">
                {overall.totalScore} / {overall.maxScore} ({overall.accuracy}%)
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Time Limit</span>
              <strong className="text-sm font-black">180 Minutes (720 Marks)</strong>
            </div>
          </div>
        </div>

        {/* INSTRUCTIONS STRIP */}
        <div className="bg-gray-50 border border-gray-300 rounded p-3 text-[11px] text-gray-700 mb-8 leading-relaxed">
          <strong>Marking Scheme:</strong> Each correct response is awarded <strong>+4 marks</strong>. An incorrect answer leads to <strong>-1 mark</strong> deduction. Unattempted questions yield <strong>0 marks</strong>.
        </div>

        {/* 180 QUESTIONS GROUPED BY SUBJECT */}
        {subjects.map((sub, sIdx) => {
          const subQuestions = questions.filter((q: any) => q.subjectCode === sub);
          if (subQuestions.length === 0) return null;

          return (
            <div key={sub} className="mb-10 break-before-page">
              {/* Subject Title */}
              <div className="bg-gray-900 text-white font-black text-xs uppercase px-4 py-2 mb-4 flex justify-between items-center rounded-sm">
                <span>Part {sIdx + 1}: {sub} (45 Questions • 180 Marks)</span>
                <span>Questions {subQuestions[0]?.questionOrder} to {subQuestions[subQuestions.length - 1]?.questionOrder}</span>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {subQuestions.map((q: any) => {
                  const isCorrect = q.isCorrect === true;
                  const isIncorrect = q.isCorrect === false;

                  return (
                    <div
                      key={q.id}
                      className="border-b border-gray-200 pb-5 text-xs text-gray-900 break-inside-avoid"
                    >
                      <div className="flex items-start justify-between gap-3 font-semibold mb-2">
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-black text-gray-950">Q.{q.questionOrder}.</span>
                          <div className="font-medium leading-relaxed">
                            <MathRenderer text={q.statement} />
                          </div>
                        </div>

                        {/* Marks badge */}
                        <div className="shrink-0 text-right font-mono text-[11px]">
                          {isCorrect ? (
                            <span className="text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              +4 Marks
                            </span>
                          ) : isIncorrect ? (
                            <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              -1 Mark
                            </span>
                          ) : (
                            <span className="text-gray-500 font-medium">0 Marks</span>
                          )}
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 mt-3 text-xs">
                        {[1, 2, 3, 4].map((optNum) => {
                          const optText = q[`option${optNum}`];
                          const isSelected = q.selectedOption === optNum;
                          const isAnswer = q.correctAnswer === optNum;

                          return (
                            <div
                              key={optNum}
                              className={`p-2 rounded border flex items-center gap-2 ${
                                isAnswer
                                  ? 'bg-green-50 border-green-400 font-bold text-green-950'
                                  : isSelected && !isAnswer
                                  ? 'bg-red-50 border-red-400 font-medium text-red-950 line-through'
                                  : 'border-gray-200 bg-white text-gray-800'
                              }`}
                            >
                              <span className="font-mono font-bold">({optNum})</span>
                              <div className="leading-snug">
                                <MathRenderer text={optText || ''} />
                              </div>
                              {isAnswer && <span className="ml-auto text-[10px] text-green-700">✓ Correct</span>}
                              {isSelected && !isAnswer && <span className="ml-auto text-[10px] text-red-700">✗ Chosen</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* NCERT Explanation */}
                      <div className="mt-3 pl-6 text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100">
                        <strong className="text-blue-900 block mb-0.5">NCERT Explanation:</strong>
                        <MathRenderer text={q.explanation} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* COMPLETE ANSWER KEY MATRIX (180 QUESTIONS) */}
        <div className="mt-12 pt-6 border-t-2 border-gray-900 break-before-page">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-950 mb-4 text-center">
            Official NEET UG 2027 Final Answer Key Grid (Q1 to Q180)
          </h2>

          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 text-center text-[10px] font-mono">
            {questions.map((q: any) => (
              <div
                key={q.id}
                className={`p-1 border rounded ${
                  q.isCorrect === true
                    ? 'bg-green-100 text-green-950 border-green-300 font-bold'
                    : q.isCorrect === false
                    ? 'bg-red-100 text-red-950 border-red-300 font-bold'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                <div>Q{q.questionOrder}</div>
                <div className="font-bold text-xs mt-0.5">({q.correctAnswer})</div>
              </div>
            ))}
          </div>
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500">
          Generated from authentic NEET UG 2027 CBT Simulation Platform • Candidate: {candidate.name} ({candidate.rollNumber})
        </div>
      </div>
    </div>
  );
}

