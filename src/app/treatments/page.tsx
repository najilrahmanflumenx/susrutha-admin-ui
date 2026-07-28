'use client';

import React, { useEffect, useState } from 'react';
import { Syringe, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';

interface TreatmentItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: string;
  shortDescription: string;
  fullDescription?: string;
  durationMinutes: number;
  recommendedDays: number;
  isFeatured?: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TreatmentItem>>({
    title: '',
    category: 'Panchakarma',
    shortDescription: '',
    fullDescription: '',
    durationMinutes: 60,
    recommendedDays: 14,
    isFeatured: false,
    status: 'published',
  });

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/treatments');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setTreatments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching treatments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  const filtered = treatments.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.shortDescription.toLowerCase().includes(q);
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      category: 'Panchakarma',
      shortDescription: '',
      fullDescription: '',
      durationMinutes: 60,
      recommendedDays: 14,
      isFeatured: false,
      status: 'published',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TreatmentItem) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.shortDescription) return;

    setIsSubmitting(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        fullDescription: formData.fullDescription || formData.shortDescription,
        slug,
      };

      if (isEditing && formData._id) {
        const res = await apiClient.put(`/treatments/${formData._id}`, payload);
        if (res.data?.success || res.data?.data) {
          fetchTreatments();
        }
      } else {
        const res = await apiClient.post('/treatments', payload);
        if (res.data?.success || res.data?.data) {
          fetchTreatments();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving treatment:', err);
      alert('Failed to save treatment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete treatment from database?')) return;
    try {
      await apiClient.delete(`/treatments/${id}`);
      fetchTreatments();
    } catch (err) {
      console.error('Error deleting treatment:', err);
      alert('Failed to delete treatment');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Treatments',
      [
        { header: 'ID', accessor: (t) => t._id || '' },
        { header: 'Title', accessor: (t) => t.title },
        { header: 'Category', accessor: (t) => t.category },
        { header: 'Duration (Mins)', accessor: (t) => t.durationMinutes },
        { header: 'Recommended Days', accessor: (t) => t.recommendedDays },
        { header: 'Short Description', accessor: (t) => t.shortDescription },
        { header: 'Status', accessor: (t) => t.status },
      ],
      filtered
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Syringe className="h-6 w-6 text-susrutha-brand" />
            Treatments & Classical Therapies
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Panchakarma, Abhyangam, Kizhi, Dhara, and specialty clinical therapies
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
            className="flex items-center gap-2 bg-susrutha-brand text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-red-700 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add New Treatment
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search treatments by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-susrutha-brand" />
          <span>Loading treatments from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-slate-500">
          No treatments found matching search filter.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Treatment Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Session Duration</th>
                  <th className="px-4 py-3">Course Days</th>
                  <th className="px-4 py-3">Short Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{t.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.durationMinutes} mins</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.recommendedDays} days</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">{t.shortDescription}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 transition-colors"
                          title="Edit Treatment"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Treatment"
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

      {/* Modal: Add / Edit Treatment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Treatment Therapy' : 'Add New Treatment Therapy'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTreatment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Treatment Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Abhyangam & Elakizhi"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category || 'Panchakarma'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Panchakarma"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Session Duration (mins)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes || 60}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Recommended Days</label>
                <input
                  type="number"
                  value={formData.recommendedDays || 14}
                  onChange={(e) => setFormData({ ...formData, recommendedDays: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Short Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.shortDescription || ''}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Summary of therapy benefits, warm herbal oil application, indications..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
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
                  {isEditing ? 'Save Changes' : 'Create Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
