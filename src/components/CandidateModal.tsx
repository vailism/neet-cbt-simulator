'use client';

import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, ArrowRight, X, Edit3, CheckCircle2, Hash, Sparkles } from 'lucide-react';
import { getClientCandidate, syncCandidateToServer, CandidateInfo } from '@/lib/candidateClient';

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (candidate: CandidateInfo) => void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Candidate Verification',
  subtitle = 'Verify or update your candidate details before proceeding',
  confirmLabel = 'Proceed to Examination',
}) => {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getClientCandidate();
      setName(current.name);
      setRollNumber(current.rollNumber);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter candidate full name.');
      return;
    }
    if (!rollNumber.trim()) {
      setError('Please enter candidate roll number.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await syncCandidateToServer(name, rollNumber);
      if (onConfirm) {
        onConfirm(updated);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save candidate details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header with deep blue gradient */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-blue-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-amber-300 shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-200">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>NTA NEET (UG) 2027</span>
              </div>
              <h2 className="text-base font-extrabold text-white leading-tight">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{subtitle}</p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>Candidate Full Name</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KUMAR ADITYA"
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-semibold uppercase text-slate-900 shadow-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-700" />
              <span>Roll / Admission Number</span>
            </label>
            <input
              type="text"
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 240410012345"
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-slate-900 shadow-xs transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Your test attempts, score records, and chapter analytics will be tied to this roll number.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer hover:shadow-lg"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <span>{confirmLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
