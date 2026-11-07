'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';

interface QuestionItem {
  id: string;
  questionOrder: number;
  subjectCode: string;
  chapter: string;
  statement: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

interface AttemptData {
  attemptId: string;
  title: string;
  candidate: {
    name: string;
    rollNumber: string;
  };
  totalQuestions: number;
  questions: QuestionItem[];
}

export default function PrintablePaperPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/exam/${attemptId}/status`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700 font-semibold text-sm">
        Preparing Printable NEET Question Booklet...
      </div>
    );
  }

  if (!data || !data.questions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600 text-sm">
        Failed to load question paper data.
      </div>
    );
  }

  const physicsQuestions = data.questions.filter((q) => q.subjectCode === 'PHYSICS');
  const chemistryQuestions = data.questions.filter((q) => q.subjectCode === 'CHEMISTRY');
  const botanyQuestions = data.questions.filter((q) => q.subjectCode === 'BOTANY');
  const zoologyQuestions = data.questions.filter((q) => q.subjectCode === 'ZOOLOGY');

  const renderSection = (title: string, questions: QuestionItem[]) => (
    <div className="mb-6 break-after-page">
      <div className="bg-gray-900 text-white p-2 text-center font-bold text-xs uppercase tracking-wider mb-4 border border-black">
        {title} (Questions {questions[0]?.questionOrder || 1} to {questions[questions.length - 1]?.questionOrder || 45})
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {questions.map((q) => (
          <div key={q.id} className="text-[11px] leading-snug border-b border-gray-200 pb-3 break-inside-avoid">
            <div className="font-semibold text-gray-950 mb-1.5 flex gap-1.5">
              <span className="font-bold text-blue-950 shrink-0 font-mono">Q.{q.questionOrder}.</span>
              <div className="flex-1">
                <MathRenderer text={q.statement} />
              </div>
            </div>

            <div className="space-y-1 pl-5">
              {[
                { num: 1, text: q.option1 },
                { num: 2, text: q.option2 },
                { num: 3, text: q.option3 },
                { num: 4, text: q.option4 },
              ].map((opt) => (
                <div key={opt.num} className="flex gap-1.5 text-gray-800">
                  <span className="font-bold shrink-0">({opt.num})</span>
                  <span>
                    <MathRenderer text={opt.text} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Rough Work Footer */}
      <div className="mt-6 border-2 border-dashed border-gray-400 p-2 h-24 rounded bg-gray-50 text-[10px] text-gray-500 font-mono">
        SPACE FOR ROUGH WORK
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white text-black font-serif">
      {/* Non-printing Control Header */}
      <div className="max-w-[210mm] mx-auto mb-4 print:hidden flex items-center justify-between bg-white p-3 rounded-lg border border-gray-300 shadow-xs font-sans">
        <button
          onClick={() => router.push(`/omr/${attemptId}`)}
          className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-black font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Digital OMR
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 font-medium">Official 180-Question NTA Booklet</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow"
          >
            <Printer className="w-4 h-4" /> Print Question Booklet (PDF)
          </button>
        </div>
      </div>

      {/* Main Booklet A4 Container */}
      <div className="max-w-[210mm] mx-auto bg-white border border-gray-300 p-8 print:p-0 print:border-none shadow-md print:shadow-none">
        {/* COVER PAGE */}
        <div className="border-4 border-double border-gray-900 p-6 mb-8 text-center break-after-page font-sans">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-1">
            National Testing Agency (NTA)
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-1">
            National Eligibility Cum Entrance Test (UG) 2027
          </h1>
          <div className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4">
            Question Booklet • Full-Length Simulation
          </div>

          <div className="grid grid-cols-2 gap-4 border-t-2 border-b-2 border-gray-900 py-3 my-4 text-xs font-mono">
            <div className="text-left space-y-1">
              <div><strong>TEST BOOKLET CODE:</strong> Q2</div>
              <div><strong>DURATION:</strong> 180 Minutes (3 Hours)</div>
              <div><strong>TOTAL QUESTIONS:</strong> 180 Questions</div>
            </div>
            <div className="text-right space-y-1">
              <div><strong>BOOKLET NO.:</strong> 240410012</div>
              <div><strong>MAXIMUM MARKS:</strong> 720 Marks</div>
              <div><strong>MARKING SCHEME:</strong> +4 / -1 / 0</div>
            </div>
          </div>

          {/* Candidate Registration Blanks */}
          <div className="my-6 text-left text-xs space-y-3 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-36 font-bold">Candidate Name (in Capitals):</span>
              <span className="flex-1 border-b border-black font-mono font-bold uppercase pb-0.5">
                {data.candidate.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-36 font-bold">Roll Number (in Figures):</span>
              <span className="flex-1 border-b border-black font-mono font-bold pb-0.5">
                {data.candidate.rollNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-36 font-bold">Centre of Examination:</span>
              <span className="flex-1 border-b border-black pb-0.5 font-mono">
                4102 - NTA Examination Centre, Pune
              </span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="text-left text-[11px] leading-relaxed text-gray-800 border border-gray-400 p-3 rounded bg-gray-50/70 space-y-1.5 font-sans">
            <div className="font-bold uppercase text-red-900">Important Instructions for Candidates:</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>The test is of <strong>3 hours duration</strong> and consists of <strong>180 questions</strong>.</li>
              <li>Each question carries <strong>4 marks</strong>. For each correct response, +4 marks will be awarded. For each incorrect response, <strong>1 mark will be deducted</strong> (-1).</li>
              <li>There are four sections: <strong>Physics (1-45)</strong>, <strong>Chemistry (46-90)</strong>, <strong>Botany (91-135)</strong>, and <strong>Zoology (136-180)</strong>.</li>
              <li>Use only <strong>Blue/Black Ball Point Pen</strong> to darken the circles on the OMR Sheet.</li>
              <li>Rough work is to be done only in the space provided at the bottom of each page.</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-300 text-xs">
            <div className="border-t border-black pt-1">Candidate Signature</div>
            <div className="border-t border-black pt-1">Invigilator Signature</div>
          </div>
        </div>

        {/* SECTION 1: PHYSICS */}
        {renderSection('Section 1 — Physics', physicsQuestions)}

        {/* SECTION 2: CHEMISTRY */}
        {renderSection('Section 2 — Chemistry', chemistryQuestions)}

        {/* SECTION 3: BOTANY */}
        {renderSection('Section 3 — Botany', botanyQuestions)}

        {/* SECTION 4: ZOOLOGY */}
        {renderSection('Section 4 — Zoology', zoologyQuestions)}
      </div>
    </div>
  );
}
