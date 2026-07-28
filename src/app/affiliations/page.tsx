'use client';

import React, { useEffect, useState } from 'react';
import { Award, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';

interface AffiliationItem {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  slug?: string;
  category: string;
  logoUrl?: string;
  badgeLogoUrl?: string;
  websiteUrl?: string;
  description: string;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

const CATEGORIES = [
  { value: 'accreditation', label: 'Government & NABH Accreditation' },
  { value: 'university', label: 'Ayurvedic Medical University' },
  { value: 'insurance', label: 'TPA & Health Insurance Empanelment' },
  { value: 'certification', label: 'Hospital Safety Certification' },
  { value: 'partner', label: 'International Research Partner' },
];

export default function AffiliationsPage() {
  const [items, setItems] = useState<AffiliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<AffiliationItem>>({
    title: '',
    name: '',
    category: 'accreditation',
    logoUrl: '',
    badgeLogoUrl: '',
    websiteUrl: '',
    description: '',
    status: 'published',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/affiliations');
      if (res.data?.data && Array.isArray(res.data.data)) {
        const normalized = res.data.data.map((item: any) => ({
          ...item,
          name: item.title || item.name || '',
          title: item.title || item.name || '',
          badgeLogoUrl: item.logoUrl || item.badgeLogoUrl || '',
          logoUrl: item.logoUrl || item.badgeLogoUrl || '',
        }));
        setItems(normalized);
      }
    } catch (err) {
      console.error('Error fetching affiliations:', err);
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
    const displayName = item.title || item.name || '';
    return displayName.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      name: '',
      category: 'accreditation',
      logoUrl: '',
      badgeLogoUrl: '',
      websiteUrl: '',
      description: '',
      status: 'published',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AffiliationItem) => {
    const displayName = item.title || item.name || '';
    const displayLogo = item.logoUrl || item.badgeLogoUrl || '';
    setFormData({
      ...item,
      title: displayName,
      name: displayName,
      logoUrl: displayLogo,
      badgeLogoUrl: displayLogo,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = formData.title || formData.name;
    const displayLogo = formData.logoUrl || formData.badgeLogoUrl;
    if (!displayName) return;

    setIsSubmitting(true);
    try {
      const slug = formData.slug || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        title: displayName,
        name: displayName,
        logoUrl: displayLogo,
        badgeLogoUrl: displayLogo,
        slug,
      };

      if (isEditing && formData._id) {
        const res = await apiClient.put(`/affiliations/${formData._id}`, payload);
        if (res.data?.success || res.data?.data) {
          fetchItems();
        }
      } else {
        const res = await apiClient.post('/affiliations', payload);
        if (res.data?.success || res.data?.data) {
          fetchItems();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving affiliation:', err);
      alert('Failed to save affiliation badge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete affiliation badge from database?')) return;
    try {
      await apiClient.delete(`/affiliations/${id}`);
      fetchItems();
    } catch (err) {
      console.error('Error deleting affiliation:', err);
      alert('Failed to delete affiliation');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Affiliations',
      [
        { header: 'ID', accessor: (a) => a._id || '' },
        { header: 'Name', accessor: (a) => a.name },
        { header: 'Category', accessor: (a) => a.category },
        { header: 'Website URL', accessor: (a) => a.websiteUrl || '' },
        { header: 'Description', accessor: (a) => a.description || '' },
        { header: 'Status', accessor: (a) => a.status },
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
            <Award className="h-6 w-6 text-susrutha-brand" />
            Accreditations, Affiliations & Badges
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage NABH/Ayush accreditations, medical university affiliations, and insurance empanelments
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
            Add Affiliation Badge
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search affiliations or accreditations..."
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
          <span>Loading affiliations from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-slate-500">
          No affiliation badges configured yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Affiliation / Accreditation Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{item.title || item.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">{item.description}</td>
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
                          title="Edit Affiliation"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Affiliation"
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

      {/* Modal: Add / Edit Affiliation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Affiliation Badge' : 'Add Affiliation Badge'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAffiliation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Affiliation / Badge Name</label>
                <input
                  type="text"
                  required
                  value={formData.title || formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value, name: e.target.value })}
                  placeholder="e.g. NABH Accredited Ayurvedic Hospital"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <MediaInput
                label="Badge Logo Asset (Upload Image File or Enter External URL)"
                value={formData.logoUrl || formData.badgeLogoUrl || ''}
                onChange={(url) => setFormData({ ...formData, logoUrl: url, badgeLogoUrl: url })}
                acceptType="image"
                placeholder="https://... or upload badge logo image"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details regarding government registration or university research tie-up..."
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
                  {isEditing ? 'Save Changes' : 'Create Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
