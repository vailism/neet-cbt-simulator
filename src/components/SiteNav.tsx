'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CheckCircle,
  FileText,
  LayoutDashboard,
  User,
  Edit2,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { getClientCandidate, CandidateInfo, DEFAULT_CANDIDATE } from '@/lib/candidateClient';
import { CandidateModal } from '@/components/CandidateModal';

export const SiteNav: React.FC = () => {
  const pathname = usePathname();
  const [candidate, setCandidate] = useState<CandidateInfo>(DEFAULT_CANDIDATE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Do not render top navigation on active examination screen
  if (pathname.startsWith('/exam/') && !pathname.includes('/result') && !pathname.includes('/solutions') && !pathname.includes('/print')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Exam Portal', icon: FileText, badge: null },
    { href: '/papers', label: '100 Mock Papers', icon: BookOpen, badge: '100 Papers' },
    { href: '/practice', label: 'Chapter Practice', icon: CheckCircle, badge: '75 Ch.' },
    { href: '/dashboard', label: 'Analytics & AIR', icon: LayoutDashboard, badge: null },
  ];

  return (
    <>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        {/* Top Official notification strip */}
        <div className="bg-slate-900 text-slate-300 py-1.5 px-4 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-200 font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                Vailism CBT
              </span>
              <span className="text-[11px] text-slate-300 hidden sm:inline font-medium">
                VAILISM CBT EXAM CENTER • NEET (UG) 2015–2026
              </span>
              <span className="text-[11px] text-slate-300 sm:hidden font-medium">
                Vailism CBT Exam Center
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3 sm:gap-4 font-mono">
              <span className="text-slate-300">NEET 2015–2026 Pattern</span>
              <span className="hidden md:inline text-slate-600">|</span>
              <span className="hidden md:inline text-slate-400">100 Full-Length Papers • 720 Marks</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo & Platform Identity */}
          <Link href="/" className="flex items-center gap-3 group no-underline">
            <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-bold text-base shadow-2xs">
              V
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight text-base tracking-tight group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                <span>Vailism CBT Exam Center</span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  NEET UG
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-normal hidden sm:block">
                National Standard Computer-Based Examination Engine • 2015–2026
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Candidate Profile Pill & Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Active Student Pill */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left shadow-2xs"
              title="Click to rename student or switch roll number"
            >
              <div className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                {candidate.name ? candidate.name.charAt(0) : 'S'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-900 text-xs leading-tight flex items-center gap-1">
                  <span className="truncate max-w-[120px]">{candidate.name}</span>
                  <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono font-normal">
                  {candidate.rollNumber}
                </div>
              </div>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-50 text-blue-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-blue-700" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Active Student: <strong className="text-slate-900">{candidate.name}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="text-xs text-blue-700 font-bold underline"
              >
                Rename
              </button>
            </div>
          </div>
        )}
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
