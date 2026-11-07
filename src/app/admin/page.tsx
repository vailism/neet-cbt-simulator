'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertCircle,
  BookOpen,
  X,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { MathRenderer } from '@/components/MathRenderer';

interface QuestionItem {
  id: string;
  subject: { id: string; code: string; name: string };
  chapter?: { id: string; name: string } | null;
  topic?: string | null;
  statement: string;
  imageUrl?: string | null;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  previousYear?: string | null;
  isVerifiedPYQ: boolean;
  source?: string | null;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    id: '',
    subjectCode: 'PHYSICS',
    chapterName: 'Kinematics',
    topic: 'Laws of Motion',
    statement: 'A body of mass $m$ is accelerated uniformly at $a = 2\\text{ m/s}^2$. What is the force applied?',
    imageUrl: '',
    option1: '$F = 2m$',
    option2: '$F = m/2$',
    option3: '$F = 4m$',
    option4: '$F = 0$',
    correctAnswer: 1,
    explanation: 'According to Newton’s second law of motion: $F = ma = 2m$.',
    difficulty: 'EASY',
    previousYear: 'NEET 2023',
    isVerifiedPYQ: true,
    source: 'NTA Official Paper',
  });

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (subjectFilter) queryParams.set('subject', subjectFilter);
      if (difficultyFilter) queryParams.set('difficulty', difficultyFilter);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res = await fetch(`/api/admin/questions?${queryParams.toString()}`);
      const json = await res.json();
      setQuestions(json.questions || []);
      setTotalQuestions(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, subjectFilter, difficultyFilter, searchQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = Boolean(formData.id);
      const url = '/api/admin/questions';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save question.');

      setShowAddModal(false);
      fetchQuestions();
    } catch (e: any) {
      alert(e.message || 'Error saving question.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question.');
      fetchQuestions();
    } catch (e: any) {
      alert(e.message || 'Error deleting question.');
    }
  };

  const handleCSVImport = async () => {
    if (!csvText.trim()) return;
    setImportStatus('Importing questions...');
    try {
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: csvText,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Import failed.');

      setImportStatus(`Successfully imported ${json.importedCount} questions! (Skipped: ${json.skippedCount})`);
      fetchQuestions();
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setCsvText('');
      }, 2000);
    } catch (e: any) {
      setImportStatus(`Import Error: ${e.message}`);
    }
  };

  const sampleCSVTemplate = `subject,chapter,topic,statement,option1,option2,option3,option4,correctAnswer,explanation,difficulty,previousYear,isVerifiedPYQ
PHYSICS,Gravitation,Orbital Speed,"The orbital speed of a satellite orbiting at height $h$ is given by:",$v = \\sqrt{\\frac{GM}{R+h}}$,$v = \\sqrt{\\frac{2GM}{R}}$,$v = \\frac{GM}{R}$,$v = \\sqrt{gR}$,1,"Orbital speed is $v = \\sqrt{\\frac{GM}{R+h}}$.",MODERATE,NEET 2022,true
CHEMISTRY,Solutions,Colligative Properties,"Which colligative property is preferred for determining molar mass of polymers?",Osmotic pressure,Boiling elevation,Freezing depression,Relative vapor lowering,1,"Osmotic pressure can be measured at room temperature.",EASY,NEET 2021,true`;

  return (
    <div className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase text-amber-700">Administrator & Educator Hub</div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              NEET Question Bank Management
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Currently holding <strong>{totalQuestions}</strong> verified and practice questions across all subjects
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4 text-gray-600" />
              CSV / JSON Import
            </button>
            <button
              onClick={() => {
                setFormData({
                  id: '',
                  subjectCode: 'PHYSICS',
                  chapterName: 'Current Electricity',
                  topic: 'Resistivity & Temperature',
                  statement: 'As temperature increases, the resistance of a metallic conductor:',
                  imageUrl: '',
                  option1: 'Increases linearly due to frequent electron collisions',
                  option2: 'Decreases exponentially',
                  option3: 'Remains independent of temperature',
                  option4: 'Drops abruptly to zero',
                  correctAnswer: 1,
                  explanation: 'In metals, higher temperature increases lattice vibrations and collision frequency, thereby increasing resistance ($R_T = R_0(1 + \\alpha \\Delta T)$).',
                  difficulty: 'EASY',
                  previousYear: 'NEET 2023',
                  isVerifiedPYQ: true,
                  source: 'Official Question Bank',
                });
                setShowAddModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search statement, topic, or formula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 font-medium"
            >
              <option value="">All Subjects</option>
              <option value="PHYSICS">Physics</option>
              <option value="CHEMISTRY">Chemistry</option>
              <option value="BOTANY">Botany</option>
              <option value="ZOOLOGY">Zoology</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 font-medium"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MODERATE">Moderate</option>
              <option value="DIFFICULT">Difficult</option>
            </select>
          </div>

          <div className="text-gray-500 font-mono text-[11px]">
            Page {page} of {totalPages}
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading questions from PostgreSQL...</div>
          ) : questions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-16">Subject</th>
                    <th className="p-3 w-40">Chapter / Topic</th>
                    <th className="p-3">Question Statement</th>
                    <th className="p-3 text-center w-24">Key</th>
                    <th className="p-3 text-center w-24">Difficulty</th>
                    <th className="p-3 text-center w-28">Source / PYQ</th>
                    <th className="p-3 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                          {q.subject.name}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{q.chapter?.name || 'General'}</div>
                        {q.topic && <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{q.topic}</div>}
                      </td>
                      <td className="p-3 max-w-md">
                        <div className="line-clamp-2 text-gray-800">
                          <MathRenderer text={q.statement} />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-800 font-bold inline-flex items-center justify-center text-xs">
                          {q.correctAnswer}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.difficulty === 'EASY'
                              ? 'bg-green-50 text-green-700'
                              : q.difficulty === 'DIFFICULT'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {q.isVerifiedPYQ ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            ✓ {q.previousYear || 'PYQ'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Practice</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            setPreviewQuestion(q);
                            setShowPreviewModal(true);
                          }}
                          className="p-1 rounded text-gray-600 hover:text-blue-700 hover:bg-gray-100"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setFormData({
                              id: q.id,
                              subjectCode: q.subject.code,
                              chapterName: q.chapter?.name || 'General',
                              topic: q.topic || '',
                              statement: q.statement,
                              imageUrl: q.imageUrl || '',
                              option1: q.option1,
                              option2: q.option2,
                              option3: q.option3,
                              option4: q.option4,
                              correctAnswer: q.correctAnswer,
                              explanation: q.explanation,
                              difficulty: q.difficulty,
                              previousYear: q.previousYear || '',
                              isVerifiedPYQ: q.isVerifiedPYQ,
                              source: q.source || '',
                            });
                            setShowAddModal(true);
                          }}
                          className="p-1 rounded text-gray-600 hover:text-amber-700 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 rounded text-gray-600 hover:text-red-700 hover:bg-gray-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">No questions matched the filters.</div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 font-semibold"
              >
                Previous Page
              </button>
              <span className="font-mono text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 font-semibold"
              >
                Next Page
              </button>
            </div>
          )}
        </div>

        {/* MODAL 1: ADD / EDIT QUESTION WITH LIVE KATEX PREVIEW */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-base">
                  {formData.id ? 'Edit Question' : 'Add New Question to Bank'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-blue-200 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Subject *</label>
                    <select
                      value={formData.subjectCode}
                      onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="PHYSICS">Physics</option>
                      <option value="CHEMISTRY">Chemistry</option>
                      <option value="BOTANY">Botany</option>
                      <option value="ZOOLOGY">Zoology</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Chapter Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.chapterName}
                      onChange={(e) => setFormData({ ...formData, chapterName: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Topic</label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>

                {/* Statement with Live Preview */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Question Statement (Supports KaTeX: $...$ or $$...$$) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.statement}
                    onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono text-xs"
                  />
                  <div className="mt-1 p-2 bg-gray-50 border rounded-lg">
                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Live Formula Preview:</div>
                    <MathRenderer text={formData.statement} />
                  </div>
                </div>

                {/* Four Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((optNum) => (
                    <div key={optNum}>
                      <label className="font-bold text-gray-700 block mb-1">Option {optNum} *</label>
                      <input
                        type="text"
                        required
                        value={(formData as any)[`option${optNum}`]}
                        onChange={(e) =>
                          setFormData({ ...formData, [`option${optNum}`]: e.target.value })
                        }
                        className="w-full border rounded-lg p-2 font-mono"
                      />
                    </div>
                  ))}
                </div>

                {/* Answer Key, Difficulty, PYQ */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Correct Answer (1-4) *</label>
                    <select
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: Number(e.target.value) })}
                      className="w-full border rounded-lg p-2 font-bold text-green-700"
                    >
                      <option value={1}>Option 1</option>
                      <option value={2}>Option 2</option>
                      <option value={3}>Option 3</option>
                      <option value={4}>Option 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="DIFFICULT">Difficult</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Previous Year</label>
                    <input
                      type="text"
                      placeholder="e.g. NEET 2023"
                      value={formData.previousYear}
                      onChange={(e) => setFormData({ ...formData, previousYear: e.target.value })}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isVerifiedPYQ}
                        onChange={(e) => setFormData({ ...formData, isVerifiedPYQ: e.target.checked })}
                        className="rounded"
                      />
                      <span className="font-bold text-gray-700">Verified PYQ</span>
                    </label>
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Detailed Step-by-Step Explanation *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono text-xs"
                  />
                  <div className="mt-1 p-2 bg-gray-50 border rounded-lg">
                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Explanation Preview:</div>
                    <MathRenderer text={formData.explanation} />
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded-lg font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow"
                  >
                    Save Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: QUESTION PREVIEW */}
        {showPreviewModal && previewQuestion && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-bold text-blue-900 text-sm">
                  {previewQuestion.subject.name} • {previewQuestion.chapter?.name || 'General'}
                </span>
                <button onClick={() => setShowPreviewModal(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
                </button>
              </div>

              <div className="text-sm">
                <MathRenderer text={previewQuestion.statement} />
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { num: 1, text: previewQuestion.option1 },
                  { num: 2, text: previewQuestion.option2 },
                  { num: 3, text: previewQuestion.option3 },
                  { num: 4, text: previewQuestion.option4 },
                ].map((opt) => (
                  <div
                    key={opt.num}
                    className={`p-2.5 rounded-lg border ${
                      opt.num === previewQuestion.correctAnswer
                        ? 'bg-green-50 border-green-500 font-bold text-green-950'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    ({opt.num}) <MathRenderer text={opt.text} />
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
                <div className="font-bold text-amber-900 mb-1">Explanation:</div>
                <MathRenderer text={previewQuestion.explanation} />
              </div>

              <div className="text-right">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-1.5 bg-gray-200 text-gray-800 rounded text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: CSV IMPORT */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-3xl w-full p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                  Bulk Question Import (CSV / JSON)
                </h3>
                <button onClick={() => setShowImportModal(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Paste your CSV content below. Columns should match:
                <code className="block bg-gray-100 p-2 rounded mt-1 font-mono text-[11px] text-gray-800">
                  subject,chapter,topic,statement,option1,option2,option3,option4,correctAnswer,explanation,difficulty,previousYear,isVerifiedPYQ
                </code>
              </p>

              <button
                type="button"
                onClick={() => setCsvText(sampleCSVTemplate)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Copy Sample Template into Editor
              </button>

              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full border rounded-lg p-3 font-mono text-xs"
              />

              {importStatus && (
                <div className="text-xs p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 font-semibold">
                  {importStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCSVImport}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow"
                >
                  Start Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
