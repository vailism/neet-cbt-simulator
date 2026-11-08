'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, CheckCircle, FileText, LayoutDashboard, User, Edit2 } from 'lucide-react';
import { getClientCandidate, CandidateInfo, DEFAULT_CANDIDATE } from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';

export const SiteNav: React.FC = () => {
  const pathname = usePathname();
  const [candidate, setCandidate] = useState<CandidateInfo>(DEFAULT_CANDIDATE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Initial fetch from client storage
    setCandidate(getClientCandidate());

    // Listen for candidate updates across pages and modals
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setCandidate(e.detail);
      } else {
        setCandidate(getClientCandidate());
      }
    };

    window.addEventListener('neet_candidate_updated', handleUpdate);
    return () => {
      window.removeEventListener('neet_candidate_updated', handleUpdate);
    };
  }, []);

  // Do not render top navigation on active examination screen
  if (pathname.startsWith('/exam/') && !pathname.includes('/result') && !pathname.includes('/solutions')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Exam Portal', icon: FileText },
    { href: '/papers', label: '100 Mock Papers', icon: BookOpen },
    { href: '/practice', label: 'Practice Mode', icon: CheckCircle },
    { href: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        {/* Top Govt/NTA style branding bar */}
        <div className="bg-[#1e3a8a] text-white py-1.5 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 font-medium tracking-wide">
              <span className="bg-amber-400 text-blue-950 font-bold px-1.5 py-0.5 rounded text-[10px]">
                NTA CBT SIMULATOR
              </span>
              <span>NATIONAL ELIGIBILITY CUM ENTRANCE TEST (UG)</span>
            </div>
            <div className="text-[11px] text-blue-100 flex items-center gap-4">
              <span>Academic Session: 2026-27</span>
              <span className="hidden sm:inline">Official Mock Pattern: 180 Questions | 720 Marks</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <div className="h-9 w-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm font-bold text-lg">
              N
            </div>
            <div>
              <div className="font-extrabold text-blue-900 leading-tight text-base sm:text-lg">
                NEET CBT Simulator
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Computer Based Examination Platform
              </div>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Candidate Profile Pill & Rename Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer group text-left"
              title="Click to rename or change candidate"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold">
                {candidate.name ? candidate.name.charAt(0) : 'S'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-blue-900 text-[11px] leading-tight flex items-center gap-1">
                  <span>{candidate.name}</span>
                  <Edit2 className="w-2.5 h-2.5 text-blue-500 opacity-60 group-hover:opacity-100" />
                </div>
                <div className="text-[9px] text-blue-600 font-mono font-medium">
                  {candidate.rollNumber}
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Rename Student / Change Candidate"
        subtitle="Update the active candidate name and roll number for all exam attempts."
        confirmLabel="Save & Update Profile"
      />
    </>
  );
};
