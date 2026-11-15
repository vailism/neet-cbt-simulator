'use client';

import React, { useState, useEffect } from 'react';
import { User, ArrowRight, X, Hash, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  subtitle = 'Verify or update your candidate details before proceeding to the examination session.',
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Container with spring bounce */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10"
          >
            {/* Institutional Slate Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 shadow-inner">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Vailism CBT Examination Center
                  </div>
                  <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">{subtitle}</p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Candidate Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. KUMAR ADITYA"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-semibold uppercase text-slate-900 placeholder:text-slate-400 shadow-xs transition-all outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span>Roll / Admission Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 240410012345"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono text-slate-900 placeholder:text-slate-400 shadow-xs transition-all outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Attempts, analytics, and percentile ranks are mapped to this roll number.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-4 rounded-lg active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
