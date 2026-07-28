'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';

interface MediaCoverageItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  publisherName: string;
  publicationType: 'newspaper' | 'tv' | 'digital' | 'press_release';
  articleUrl?: string;
  summary: string;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

const TYPES = [
  { value: 'newspaper', label: 'Print Newspaper' },
  { value: 'tv', label: 'TV Broadcast' },
  { value: 'digital', label: 'Digital Health Publication' },
  { value: 'press_release', label: 'Hospital Press Release' },
];

export default function MediaCoveragePage() {
  const [items, setItems] = useState<MediaCoverageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MediaCoverageItem>>({
    title: '',
    publisherName: 'Malayala Manorama',
    publicationType: 'newspaper',
    articleUrl: '',
    summary: '',
    status: 'published',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/media-coverage');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching media coverage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.publisherName.toLowerCase().includes(q);
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      publisherName: 'Malayala Manorama',
      publicationType: 'newspaper',
      articleUrl: '',
      summary: '',
      status: 'published',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MediaCoverageItem) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveCoverage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.publisherName) return;

    setIsSubmitting(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        slug,
      };

      if (isEditing && formData._id) {
        const res = await apiClient.put(`/media-coverage/${formData._id}`, payload);
        if (res.data?.success || res.data?.data) {
          fetchItems();
        }
      } else {
        const res = await apiClient.post('/media-coverage', payload);
        if (res.data?.success || res.data?.data) {
          fetchItems();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving media coverage:', err);
      alert('Failed to save press release item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete press release item from database?')) return;
    try {
      await apiClient.delete(`/media-coverage/${id}`);
      fetchItems();
    } catch (err) {
      console.error('Error deleting press release item:', err);
      alert('Failed to delete item');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Media_Coverage',
      [
        { header: 'ID', accessor: (m) => m._id || '' },
        { header: 'Headline', accessor: (m) => m.title },
        { header: 'Publisher', accessor: (m) => m.publisherName },
        { header: 'Type', accessor: (m) => m.publicationType },
        { header: 'URL', accessor: (m) => m.articleUrl || '' },
        { header: 'Summary', accessor: (m) => m.summary },
        { header: 'Status', accessor: (m) => m.status },
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
            <Newspaper className="h-6 w-6 text-susrutha-brand" />
            Press Releases & Media Coverage
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage press clippings, news articles, TV broadcasts, and corporate press releases
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
            Add Press Release
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search press headlines or publishers..."
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
          <span>Loading press coverage from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-slate-500">
          No press release items found.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Headline / Title</th>
                  <th className="px-4 py-3">Publisher</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{item.title}</td>
                    <td className="px-4 py-3 font-medium text-susrutha-brand">{item.publisherName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                        {item.publicationType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">{item.summary}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 transition-colors"
                          title="Edit Coverage"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Coverage"
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

      {/* Modal: Add / Edit Media Coverage */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Press Release' : 'Add Press Release'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCoverage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Article / Release Headline</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Susrutha Ayurveda Expands 40-Bed Inpatient Campus in Trivandrum"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Publisher Name</label>
                  <input
                    type="text"
                    required
                    value={formData.publisherName || ''}
                    onChange={(e) => setFormData({ ...formData, publisherName: e.target.value })}
                    placeholder="e.g. The Hindu / Mathrubhumi"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Publication Type</label>
                  <select
                    value={formData.publicationType}
                    onChange={(e) => setFormData({ ...formData, publicationType: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <MediaInput
                label="Article Asset (Upload Image/PDF or Enter External URL)"
                value={formData.articleUrl || ''}
                onChange={(url) => setFormData({ ...formData, articleUrl: url })}
                acceptType="any"
                placeholder="https://... or upload article clipping"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Summary</label>
                <textarea
                  rows={3}
                  value={formData.summary || ''}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Key highlights covered in the news report..."
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
                  {isEditing ? 'Save Changes' : 'Create Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
