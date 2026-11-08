'use client';

import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, ArrowRight, X, Edit3, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700/80 border border-blue-400/40 flex items-center justify-center text-amber-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                NTA NEET (UG) 2027
              </div>
              <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">{subtitle}</p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              Candidate Full Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KUMAR ADITYA"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-semibold uppercase text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              Roll / Admission Number
            </label>
            <input
              type="text"
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 240410012345"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-gray-900"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Used to record test scores, mistake notebook, and chapter analytics.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
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

