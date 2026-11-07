'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Download, ShieldCheck, Check } from 'lucide-react';

interface AttemptData {
  attemptId: string;
  candidate: {
    name: string;
    rollNumber: string;
  };
  title: string;
  totalQuestions: number;
}

export default function PrintableOMRPage() {
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

  const rollDigits = (data?.candidate?.rollNumber || '240410012345').padEnd(10, '0').slice(0, 10).split('');

  const renderSubjectColumn = (title: string, startQ: number, endQ: number) => {
    const rows = [];
    for (let q = startQ; q <= endQ; q++) {
      rows.push(
        <div key={q} className="flex items-center justify-between py-[2px] border-b border-gray-200 text-[10px]">
          <span className="font-bold text-gray-800 w-6 text-right pr-1 font-mono">{q}</span>
          <div className="flex items-center gap-1.5 px-1">
            {['1', '2', '3', '4'].map((opt) => (
              <span
                key={opt}
                className="w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-700 select-none"
              >
                {opt}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="border border-gray-800 rounded bg-white">
        <div className="bg-gray-800 text-white text-center font-bold text-[10px] py-1 tracking-wider uppercase">
          {title} ({startQ}–{endQ})
        </div>
        <div className="p-1">{rows}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white text-black font-sans">
      {/* Non-printing Control Header */}
      <div className="max-w-[210mm] mx-auto mb-4 print:hidden flex items-center justify-between bg-white p-3 rounded-lg border border-gray-300 shadow-xs">
        <button
          onClick={() => router.push(`/omr/${attemptId}`)}
          className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-black font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Digital OMR
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Official NTA OMR Sheet (180 Questions)</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* A4 Printable OMR Container */}
      <div className="max-w-[210mm] mx-auto bg-white border-2 border-gray-900 p-4 print:p-3 print:border print:m-0 print:w-full print:max-w-none shadow-md print:shadow-none text-black">
        {/* Top Header */}
        <div className="border-b-2 border-gray-900 pb-2 mb-2 text-center">
          <div className="text-[10px] font-bold tracking-widest text-gray-700 uppercase">
            National Testing Agency (NTA) • Government of India
          </div>
          <h1 className="text-sm font-black tracking-tight uppercase">
            National Eligibility Cum Entrance Test (UG) 2027
          </h1>
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
            Official OMR Answer Sheet • Side - 1
          </div>
        </div>

        {/* Candidate Info Grid */}
        <div className="grid grid-cols-12 gap-2 border border-gray-800 p-2 rounded mb-2 text-[10px]">
          {/* Candidate Roll Number bubbling grid */}
          <div className="col-span-6 border-r border-gray-300 pr-2">
            <div className="font-bold mb-1 uppercase text-gray-800">Roll Number (10 Digits)</div>
            {/* Digit boxes */}
            <div className="flex gap-1 mb-1.5">
              {rollDigits.map((d, i) => (
                <div key={i} className="flex-1 border-2 border-gray-800 text-center font-mono font-black text-xs py-0.5 bg-gray-50">
                  {d}
                </div>
              ))}
            </div>
            {/* Bubble grid 0-9 */}
            <div className="space-y-0.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((rowDigit) => (
                <div key={rowDigit} className="flex gap-1 justify-between">
                  {rollDigits.map((d, colIdx) => {
                    const isDark = parseInt(d, 10) === rowDigit;
                    return (
                      <div
                        key={colIdx}
                        className={`flex-1 flex items-center justify-center h-3 rounded-full border border-gray-700 text-[7px] font-bold ${
                          isDark ? 'bg-black text-white font-black' : 'text-gray-700'
                        }`}
                      >
                        {rowDigit}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Test Booklet Code & Candidate details */}
          <div className="col-span-6 flex flex-col justify-between pl-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold uppercase text-gray-800">Test Booklet Code:</span>
                <span className="font-mono font-black text-xs px-2 py-0.5 border border-black bg-yellow-50">Q2</span>
              </div>
              <div className="flex gap-2 justify-end mb-2">
                {['P', 'Q', 'R', 'S'].map((code) => (
                  <span
                    key={code}
                    className={`w-5 h-5 rounded-full border border-gray-800 flex items-center justify-center text-[9px] font-bold ${
                      code === 'Q' ? 'bg-black text-white' : ''
                    }`}
                  >
                    {code}
                  </span>
                ))}
              </div>

              <div className="space-y-1 text-[9px]">
                <div>
                  <span className="font-bold">Candidate Name: </span>
                  <span className="font-mono uppercase font-bold">{data?.candidate?.name || 'KUMAR ADITYA'}</span>
                </div>
                <div>
                  <span className="font-bold">Centre No: </span>
                  <span className="font-mono">4102 (NTA Test Centre)</span>
                </div>
                <div>
                  <span className="font-bold">Paper Title: </span>
                  <span>{data?.title || 'NEET (UG) Full Mock Examination'}</span>
                </div>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="bg-amber-50 border border-amber-300 p-1 rounded text-[8px] leading-tight text-amber-900">
              <strong>Instructions:</strong> Use only <strong>Blue/Black Ball Point Pen</strong>.
              Darken the bubble completely. Do not fold or tear this sheet. No stray marks.
            </div>
          </div>
        </div>

        {/* 180 QUESTIONS OMR GRID: 4 COLUMNS */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {renderSubjectColumn('Physics', 1, 45)}
          {renderSubjectColumn('Chemistry', 46, 90)}
          {renderSubjectColumn('Botany', 91, 135)}
          {renderSubjectColumn('Zoology', 136, 180)}
        </div>

        {/* Signatures Footer */}
        <div className="grid grid-cols-3 gap-3 border-t-2 border-gray-800 pt-2 text-[9px]">
          <div className="border border-gray-400 rounded p-1.5 h-14 flex flex-col justify-between">
            <span className="font-bold text-gray-700">Left Hand Thumb Impression</span>
            <div className="text-[8px] text-gray-400 italic">Candidate Impression Box</div>
          </div>
          <div className="border border-gray-400 rounded p-1.5 h-14 flex flex-col justify-between">
            <span className="font-bold text-gray-700">Signature of Candidate</span>
            <div className="text-[8px] text-gray-400 italic">(To be signed in presence of Invigilator)</div>
          </div>
          <div className="border border-gray-400 rounded p-1.5 h-14 flex flex-col justify-between">
            <span className="font-bold text-gray-700">Signature of Invigilator</span>
            <div className="text-[8px] text-gray-400 italic">(Verified Roll No. & Photo)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
