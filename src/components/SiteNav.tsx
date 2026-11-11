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
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Flame,
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
    { href: '/', label: 'Exam Portal', icon: FileText, badge: 'NTA' },
    { href: '/papers', label: '100 Mock Papers', icon: BookOpen, badge: '100 Mocks' },
    { href: '/practice', label: 'Chapter Practice', icon: CheckCircle, badge: '75 Ch.' },
    { href: '/dashboard', label: 'Analytics & AIR', icon: LayoutDashboard, badge: null },
  ];

  return (
    <>
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs transition-all">
        {/* Top Official NTA notification strip */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white py-1 px-4 text-xs border-b border-blue-900/40">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 font-medium tracking-wide">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] tracking-wider shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block"></span>
                NTA CBT 2027
              </span>
              <span className="text-[11px] text-slate-200 hidden sm:inline font-semibold">
                NATIONAL ELIGIBILITY CUM ENTRANCE TEST (UG)
              </span>
              <span className="text-[11px] text-slate-300 sm:hidden font-semibold">
                NEET (UG) 2027
              </span>
            </div>
            <div className="text-[11px] text-blue-200/90 flex items-center gap-3 sm:gap-4 font-mono">
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Target NEET 2027</span>
              </span>
              <span className="hidden md:inline text-slate-400">|</span>
              <span className="hidden md:inline text-slate-300">Official 180 Qs • 720 Marks</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo & Platform Identity */}
          <Link href="/" className="flex items-center gap-3 group no-underline">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20 font-black text-xl group-hover:scale-105 transition-transform duration-200">
                N
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div>
              <div className="font-extrabold text-slate-900 leading-tight text-base sm:text-lg tracking-tight group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                <span>NEET CBT Simulator</span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  2027
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                National Standard Computer-Based Examination Engine
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
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-700 rounded-full" />
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
              className="flex items-center gap-2.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 hover:border-blue-300 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer shadow-xs group text-left"
              title="Click to rename student or switch roll number"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:scale-105 transition-transform">
                {candidate.name ? candidate.name.charAt(0) : 'S'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-900 text-xs leading-tight flex items-center gap-1">
                  <span className="truncate max-w-[120px]">{candidate.name}</span>
                  <Edit2 className="w-2.5 h-2.5 text-blue-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-blue-700 font-mono font-medium">
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
