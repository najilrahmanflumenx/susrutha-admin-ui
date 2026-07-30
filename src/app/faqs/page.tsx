'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { HelpCircle, Plus, Search, Edit, Trash2, Download, Loader2, X, CheckCircle2, Tag } from 'lucide-react';

interface FAQItem {
  _id?: string;
  id?: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

const PRESET_CATEGORIES = [
  'General Queries',
  'Panchakarma Care',
  'Hospital Admission',
  'Treatments & Therapies',
  'Insurance & Billing',
  'Inpatient Amenities',
];

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [formData, setFormData] = useState<Partial<FAQItem>>({
    question: '',
    answer: '',
    category: 'General Queries',
    sortOrder: 0,
    status: 'ACTIVE',
  });

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/faqs');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setFaqs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const dynamicCategories = useMemo(() => {
    const set = new Set<string>(PRESET_CATEGORIES);
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [faqs]);

  const filteredFaqs = faqs.filter((faq) => {
    if (categoryFilter !== 'ALL' && faq.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (statusFilter !== 'ALL' && faq.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        (faq.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General Queries',
      sortOrder: faqs.length + 1,
      status: 'ACTIVE',
    });
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq: FAQItem) => {
    const isPreset = PRESET_CATEGORIES.includes(faq.category);
    setFormData({ ...faq });
    if (!isPreset && faq.category) {
      setIsCustomCategory(true);
      setCustomCategoryInput(faq.category);
    } else {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    }
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) return;

    const finalCategory = isCustomCategory
      ? customCategoryInput.trim() || 'General Queries'
      : formData.category || 'General Queries';

    const payload = {
      ...formData,
      category: finalCategory,
    };

    setIsSubmitting(true);
    try {
      if (isEditing && formData._id) {
        const res = await apiClient.put(`/faqs/${formData._id}`, payload);
        if (res.data?.success) {
          setFaqs((prev) => prev.map((f) => (f._id === formData._id ? res.data.data : f)));
        }
      } else {
        const res = await apiClient.post('/faqs', payload);
        if (res.data?.success) {
          setFaqs((prev) => [...prev, res.data.data]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving FAQ:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await apiClient.delete(`/faqs/${id}`);
      setFaqs((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_FAQs',
      [
        { header: 'ID', accessor: (f) => f._id || '' },
        { header: 'Question', accessor: (f) => f.question },
        { header: 'Answer', accessor: (f) => f.answer },
        { header: 'Category', accessor: (f) => f.category },
        { header: 'Sort Order', accessor: (f) => f.sortOrder },
        { header: 'Status', accessor: (f) => f.status },
        { header: 'Created At', accessor: (f) => (f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '') },
      ],
      filteredFaqs
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-susrutha-brand" />
            FAQs & Patient Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage public FAQs and custom category topics displayed on the public website.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add New FAQ
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          >
            <option value="ALL">All Categories ({dynamicCategories.length})</option>
            {dynamicCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* FAQs List Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading FAQs from database...</span>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No FAQs found matching the selected filters.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Sort</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Answer Snippet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFaqs.map((faq) => (
                  <tr key={faq._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{faq.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200">
                        <Tag className="w-3 h-3 text-susrutha-brand" />
                        {faq.category || 'General Queries'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground max-w-xs truncate">{faq.question}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">{faq.answer}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          faq.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {faq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(faq)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
                          title="Edit FAQ"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete FAQ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit FAQ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit FAQ Item' : 'Add New FAQ Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFaq} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  FAQ Category Topic
                </label>
                {!isCustomCategory ? (
                  <div className="space-y-2">
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM_NEW') {
                          setIsCustomCategory(true);
                          setCustomCategoryInput('');
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                    >
                      {PRESET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="CUSTOM_NEW">+ Add Custom Category...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="e.g. Panchakarma Diet & Protocol"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg"
                    >
                      Select Preset
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Question</label>
                <input
                  type="text"
                  required
                  value={formData.question || ''}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. What is the process for Panchakarma admission?"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Answer</label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer || ''}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Detailed explanation answering the patient query..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder ?? 0}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEditing ? 'Save Changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
