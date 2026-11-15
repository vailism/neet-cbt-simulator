'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Atom, Copy, Check, Plus, BookOpen } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export interface PhysicalConstant {
  id: string;
  name: string;
  symbol: string;
  latexSymbol: string;
  value: string;
  unit: string;
  category: 'PHYSICS' | 'CHEMISTRY' | 'UNIVERSAL';
  description: string;
}

export const NEET_PHYSICAL_CONSTANTS: PhysicalConstant[] = [
  {
    id: 'c',
    name: 'Speed of Light in Vacuum',
    symbol: 'c',
    latexSymbol: 'c',
    value: '3.0 × 10⁸',
    unit: 'm s⁻¹',
    category: 'UNIVERSAL',
    description: 'Electromagnetic wave velocity in free space',
  },
  {
    id: 'h',
    name: "Planck's Constant",
    symbol: 'h',
    latexSymbol: 'h',
    value: '6.626 × 10⁻³⁴',
    unit: 'J s (or 4.136 × 10⁻¹⁵ eV s)',
    category: 'PHYSICS',
    description: 'Quantum of electromagnetic action; E = hν',
  },
  {
    id: 'hbar',
    name: 'Reduced Planck Constant',
    symbol: 'ℏ',
    latexSymbol: '\\hbar',
    value: '1.055 × 10⁻³⁴',
    unit: 'J s',
    category: 'PHYSICS',
    description: 'h / (2π), used in angular momentum and Bohr quantization',
  },
  {
    id: 'e',
    name: 'Elementary Charge',
    symbol: 'e',
    latexSymbol: 'e',
    value: '1.602 × 10⁻¹⁹',
    unit: 'C',
    category: 'UNIVERSAL',
    description: 'Magnitude of electric charge on electron or proton',
  },
  {
    id: 'eps0',
    name: 'Permittivity of Free Space',
    symbol: 'ε₀',
    latexSymbol: '\\varepsilon_0',
    value: '8.854 × 10⁻¹²',
    unit: 'C² N⁻¹ m⁻² (F m⁻¹)',
    category: 'PHYSICS',
    description: '1 / (4πε₀) = 8.988 × 10⁹ ≈ 9.0 × 10⁹ N m² C⁻²',
  },
  {
    id: 'mu0',
    name: 'Permeability of Free Space',
    symbol: 'μ₀',
    latexSymbol: '\\mu_0',
    value: '4π × 10⁻⁷ ≈ 1.257 × 10⁻⁶',
    unit: 'T m A⁻¹ (H m⁻¹)',
    category: 'PHYSICS',
    description: 'μ₀ / (4π) = 10⁻⁷ T m A⁻¹',
  },
  {
    id: 'G',
    name: 'Universal Gravitational Constant',
    symbol: 'G',
    latexSymbol: 'G',
    value: '6.674 × 10⁻¹¹',
    unit: 'N m² kg⁻²',
    category: 'PHYSICS',
    description: 'Gravitational force constant; F = G m₁ m₂ / r²',
  },
  {
    id: 'R',
    name: 'Universal Gas Constant',
    symbol: 'R',
    latexSymbol: 'R',
    value: '8.314 (0.0821 L atm mol⁻¹ K⁻¹ / 2 cal mol⁻¹ K⁻¹)',
    unit: 'J mol⁻¹ K⁻¹',
    category: 'CHEMISTRY',
    description: 'Ideal gas law constant; PV = nRT',
  },
  {
    id: 'NA',
    name: 'Avogadro Constant',
    symbol: 'N_A',
    latexSymbol: 'N_A',
    value: '6.022 × 10²³',
    unit: 'mol⁻¹',
    category: 'CHEMISTRY',
    description: 'Number of constituent particles per mole of substance',
  },
  {
    id: 'kB',
    name: 'Boltzmann Constant',
    symbol: 'k_B',
    latexSymbol: 'k_B',
    value: '1.381 × 10⁻²³',
    unit: 'J K⁻¹',
    category: 'PHYSICS',
    description: 'R / N_A; kinetic energy per degree of freedom = ½ k_B T',
  },
  {
    id: 'me',
    name: 'Electron Rest Mass',
    symbol: 'm_e',
    latexSymbol: 'm_e',
    value: '9.109 × 10⁻³¹',
    unit: 'kg (0.511 MeV/c²)',
    category: 'PHYSICS',
    description: 'Rest mass of an electron',
  },
  {
    id: 'mp',
    name: 'Proton Rest Mass',
    symbol: 'm_p',
    latexSymbol: 'm_p',
    value: '1.673 × 10⁻²⁷',
    unit: 'kg (1.007276 u)',
    category: 'PHYSICS',
    description: 'Rest mass of a proton ≈ 1836 m_e',
  },
  {
    id: 'mn',
    name: 'Neutron Rest Mass',
    symbol: 'm_n',
    latexSymbol: 'm_n',
    value: '1.675 × 10⁻²⁷',
    unit: 'kg (1.008665 u)',
    category: 'PHYSICS',
    description: 'Rest mass of a free neutron',
  },
  {
    id: 'RH',
    name: 'Rydberg Constant',
    symbol: 'R_H',
    latexSymbol: 'R_H',
    value: '1.097 × 10⁷',
    unit: 'm⁻¹',
    category: 'PHYSICS',
    description: 'Hydrogen spectral line constant; 1/λ = R_H (1/n₁² - 1/n₂²)',
  },
  {
    id: 'F',
    name: 'Faraday Constant',
    symbol: 'F',
    latexSymbol: 'F',
    value: '96485 (≈ 96500)',
    unit: 'C mol⁻¹',
    category: 'CHEMISTRY',
    description: 'Electric charge per mole of electrons; F = e × N_A',
  },
  {
    id: 'sigma',
    name: 'Stefan-Boltzmann Constant',
    symbol: 'σ',
    latexSymbol: '\\sigma',
    value: '5.670 × 10⁻⁸',
    unit: 'W m⁻² K⁻⁴',
    category: 'PHYSICS',
    description: 'Blackbody radiation emissive power; E = σ T⁴',
  },
  {
    id: 'b',
    name: "Wien's Displacement Constant",
    symbol: 'b',
    latexSymbol: 'b',
    value: '2.898 × 10⁻³',
    unit: 'm K',
    category: 'PHYSICS',
    description: 'Peak emission wavelength relation; λ_max × T = b',
  },
  {
    id: 'Vm',
    name: 'Molar Gas Volume at STP',
    symbol: 'V_m',
    latexSymbol: 'V_m',
    value: '22.414 (22.71 at modern standard 1 bar)',
    unit: 'L mol⁻¹',
    category: 'CHEMISTRY',
    description: 'Volume occupied by one mole of an ideal gas at 0 °C, 1 atm',
  },
  {
    id: 'g',
    name: 'Standard Acceleration of Gravity',
    symbol: 'g',
    latexSymbol: 'g',
    value: '9.807 (take 9.8 or 10 unless specified)',
    unit: 'm s⁻²',
    category: 'PHYSICS',
    description: 'Standard gravitational acceleration at sea level',
  },
  {
    id: 'atm',
    name: 'Standard Atmospheric Pressure',
    symbol: '1 atm',
    latexSymbol: '1\\text{ atm}',
    value: '1.013 × 10⁵',
    unit: 'Pa (N m⁻²) = 760 mmHg = 760 torr',
    category: 'CHEMISTRY',
    description: 'Standard sea-level atmospheric pressure',
  },
];

interface PhysicalConstantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToScratchpad?: (text: string) => void;
}

export function PhysicalConstantsModal({
  isOpen,
  onClose,
  onInsertToScratchpad,
}: PhysicalConstantsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PHYSICS' | 'CHEMISTRY'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredConstants = useMemo(() => {
    return NEET_PHYSICAL_CONSTANTS.filter((c) => {
      const matchesCategory =
        categoryFilter === 'ALL' ||
        c.category === 'UNIVERSAL' ||
        c.category === categoryFilter;

      if (!matchesCategory) return false;

      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.symbol.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.value.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, categoryFilter]);

  const handleCopy = (constant: PhysicalConstant) => {
    const textToCopy = `${constant.symbol} = ${constant.value} ${constant.unit}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedId(constant.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleInsert = (constant: PhysicalConstant) => {
    if (onInsertToScratchpad) {
      const snippet = `${constant.symbol}=${constant.value.split(' ')[0]}`;
      onInsertToScratchpad(snippet);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="bg-[#1e3a8a] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-blue-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-800/80 border border-blue-400/30 flex items-center justify-center shadow-inner">
                  <Atom className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    Official NEET Physical Constants & Reference
                  </h3>
                  <p className="text-[11px] text-blue-200 font-medium">
                    Standard values per NCERT Physics & Chemistry Curriculum
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-blue-800/60 transition-colors cursor-pointer"
                aria-label="Close Reference Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search constant by name, symbol (c, h, R, G, e) or unit..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      categoryFilter === 'ALL'
                        ? 'bg-white text-blue-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({NEET_PHYSICAL_CONSTANTS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('PHYSICS')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      categoryFilter === 'PHYSICS'
                        ? 'bg-white text-blue-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Physics
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('CHEMISTRY')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      categoryFilter === 'CHEMISTRY'
                        ? 'bg-white text-blue-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Chemistry
                  </button>
                </div>
              </div>
            </div>

            {/* Constants Table / Grid */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {filteredConstants.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredConstants.map((constant) => {
                    const isCopied = copiedId === constant.id;
                    return (
                      <div
                        key={constant.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        {/* Left: Symbol & Details */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 text-blue-950 font-bold font-mono text-sm shadow-inner">
                            <MathRenderer text={`$${constant.latexSymbol}$`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {constant.name}
                              </span>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  constant.category === 'PHYSICS'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : constant.category === 'CHEMISTRY'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}
                              >
                                {constant.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {constant.description}
                            </div>
                          </div>
                        </div>

                        {/* Right: Value & SI Unit + Quick Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="font-mono font-extrabold text-blue-950 text-xs sm:text-sm">
                              {constant.value}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 font-semibold">
                              {constant.unit}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(constant)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                isCopied
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                              title="Copy constant to clipboard"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <span className="text-[10px] hidden sm:inline">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="text-[10px] hidden sm:inline">Copy</span>
                                </>
                              )}
                            </button>

                            {onInsertToScratchpad && (
                              <button
                                type="button"
                                onClick={() => handleInsert(constant)}
                                className="p-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                title="Insert directly into Rough Work Scratchpad"
                              >
                                <Plus className="w-3.5 h-3.5 text-blue-700" />
                                <span className="text-[10px] hidden sm:inline">Rough Work</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  No constant found matching &ldquo;{searchTerm}&rdquo;. Try searching by symbol (e.g. c, h, R, G, e) or category.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">Esc</kbd> anytime to return to your question.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              >
                Return to Exam
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

