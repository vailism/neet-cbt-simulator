'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export default function UnlockPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the access passcode.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid passcode.');
      }

      localStorage.setItem('neet_candidate_roll', data.student.rollNumber);
      localStorage.setItem('neet_candidate_name', data.student.name);

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-700/80 border border-blue-400/40 mx-auto mb-3 flex items-center justify-center text-amber-300">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight">NEET UG 2027 Simulator</h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Private Examination Platform • Kumar Aditya
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Private Single-Student Access</div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                This simulator is locked for single-student examination authenticity. Enter your private access passcode to continue.
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Access Passcode
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Enter passcode..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
            >
              {loading ? 'Unlocking...' : 'Unlock Simulator'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
            Candidate: KUMAR ADITYA (240410012345) • 100 Authentic CBT Mocks
          </div>
        </div>
      </div>
    </div>
  );
}
