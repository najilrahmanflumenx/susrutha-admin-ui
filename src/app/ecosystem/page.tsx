'use client';

import React, { useEffect, useState } from 'react';
import { Globe, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';

interface EcosystemItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  pillarType: 'herbal_garden' | 'pharmacy_unit' | 'research_center' | 'academy';
  tagline: string;
  description: string;
  coverImage?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

const PILLAR_TYPES = [
  { value: 'herbal_garden', label: 'Medicinal Herbal Garden' },
  { value: 'pharmacy_unit', label: 'GMP Herbal Pharmacy' },
  { value: 'research_center', label: 'Clinical Research Center' },
  { value: 'academy', label: 'Susrutha Ayurveda Academy' },
];

export default function EcosystemPage() {
  const [pillars, setPillars] = useState<EcosystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<EcosystemItem>>({
    title: '',
    pillarType: 'herbal_garden',
    tagline: '',
    description: '',
    coverImage: '',
    status: 'published',
  });

  const fetchPillars = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ecosystem');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setPillars(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching ecosystem pillars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPillars();
  }, []);

  const filteredPillars = pillars.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || (item.tagline && item.tagline.toLowerCase().includes(q));
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      pillarType: 'herbal_garden',
      tagline: '',
      description: '',
      coverImage: '',
      status: 'published',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: EcosystemItem) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSavePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsSubmitting(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        slug,
      };

      if (isEditing && formData._id) {
        const res = await apiClient.put(`/ecosystem/${formData._id}`, payload);
        if (res.data?.success || res.data?.data) {
          fetchPillars();
        }
      } else {
        const res = await apiClient.post('/ecosystem', payload);
        if (res.data?.success || res.data?.data) {
          fetchPillars();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving ecosystem pillar:', err);
      alert('Failed to save ecosystem pillar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete ecosystem pillar from database?')) return;
    try {
      await apiClient.delete(`/ecosystem/${id}`);
      fetchPillars();
    } catch (err) {
      console.error('Error deleting ecosystem pillar:', err);
      alert('Failed to delete item');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Ecosystem_Pillars',
      [
        { header: 'ID', accessor: (p) => p._id || '' },
        { header: 'Pillar Title', accessor: (p) => p.title },
        { header: 'Pillar Type', accessor: (p) => p.pillarType },
        { header: 'Tagline', accessor: (p) => p.tagline || '' },
        { header: 'Description', accessor: (p) => p.description },
        { header: 'Status', accessor: (p) => p.status || 'published' },
      ],
      filteredPillars
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="h-6 w-6 text-susrutha-brand" />
            Susrutha Ecosystem & Research Pillars
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Medicinal Herbal Garden, In-house Pharmacy Manufacturing Unit, Clinical Research, & Ayurveda Academy
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
            Add Ecosystem Pillar
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ecosystem pillars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center p-12 text-slate-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-susrutha-brand" />
            <span>Loading ecosystem pillars from database...</span>
          </div>
        ) : filteredPillars.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-border bg-card p-12 text-center text-slate-500">
            No ecosystem pillars configured yet.
          </div>
        ) : (
          filteredPillars.map((item) => (
            <div
              key={item._id}
              className="bg-card rounded-xl overflow-hidden shadow-sm border border-border flex flex-col justify-between"
            >
              <div className="p-6">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {item.pillarType.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-3 mb-1">{item.title}</h3>
                <p className="text-xs font-medium text-susrutha-brand mb-3">{item.tagline}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
              </div>
              <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-600 uppercase text-[10px]">{item.status || 'published'}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Pillar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete Pillar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add / Edit Ecosystem Pillar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Ecosystem Pillar' : 'Add Ecosystem Pillar'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSavePillar} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Pillar Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Medicinal Herbal Garden"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Pillar Type</label>
                <select
                  value={formData.pillarType}
                  onChange={(e) => setFormData({ ...formData, pillarType: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  {PILLAR_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. 500+ Rare Ayurvedic Medicinal Species"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Detailed Overview</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of herbal species cultivated, GMP pharmacy production capacity..."
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
                  {isEditing ? 'Save Changes' : 'Create Pillar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
