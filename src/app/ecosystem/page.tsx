'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Globe, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X, Tag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';

interface EcosystemItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  pillarType: string;
  tagline: string;
  description: string;
  coverImage?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

const PRESET_PILLARS = [
  'Medicinal Herbal Garden',
  'GMP Herbal Pharmacy',
  'Clinical Research Center',
  'Susrutha Ayurveda Academy',
];

export default function EcosystemPage() {
  const [pillars, setPillars] = useState<EcosystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomPillar, setIsCustomPillar] = useState(false);
  const [customPillarInput, setCustomPillarInput] = useState('');

  const [formData, setFormData] = useState<Partial<EcosystemItem>>({
    title: '',
    pillarType: 'Medicinal Herbal Garden',
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

  const dynamicPillarOptions = useMemo(() => {
    const set = new Set<string>(PRESET_PILLARS);
    pillars.forEach((p) => {
      if (p.pillarType) set.add(p.pillarType);
    });
    return Array.from(set);
  }, [pillars]);

  const filteredPillars = pillars.filter((item) => {
    if (pillarFilter !== 'ALL' && item.pillarType?.toLowerCase() !== pillarFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.tagline && item.tagline.toLowerCase().includes(q)) ||
        (item.pillarType && item.pillarType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      pillarType: 'Medicinal Herbal Garden',
      tagline: '',
      description: '',
      coverImage: '',
      status: 'published',
    });
    setIsCustomPillar(false);
    setCustomPillarInput('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: EcosystemItem) => {
    const isPreset = PRESET_PILLARS.includes(item.pillarType);
    setFormData({ ...item });
    if (!isPreset && item.pillarType) {
      setIsCustomPillar(true);
      setCustomPillarInput(item.pillarType);
    } else {
      setIsCustomPillar(false);
      setCustomPillarInput('');
    }
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSavePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const finalPillarType = isCustomPillar
      ? customPillarInput.trim() || 'Custom Pillar'
      : formData.pillarType || 'Medicinal Herbal Garden';

    setIsSubmitting(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        pillarType: finalPillarType,
        slug,
      };

      if (isEditing && formData._id) {
        const res = await apiClient.put(`/ecosystem/${formData._id}`, payload);
        if (res.data?.success) {
          setPillars((prev) => prev.map((p) => (p._id === formData._id ? res.data.data : p)));
        }
      } else {
        const res = await apiClient.post('/ecosystem', payload);
        if (res.data?.success) {
          setPillars((prev) => [...prev, res.data.data]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving ecosystem pillar:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePillar = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this ecosystem item?')) return;
    try {
      await apiClient.delete(`/ecosystem/${id}`);
      setPillars((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Error deleting pillar:', err);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Ecosystem_Facilities',
      [
        { header: 'ID', accessor: (p) => p._id || '' },
        { header: 'Title', accessor: (p) => p.title },
        { header: 'Unit / Pillar Type', accessor: (p) => p.pillarType },
        { header: 'Tagline', accessor: (p) => p.tagline || '' },
        { header: 'Status', accessor: (p) => p.status },
        { header: 'Created At', accessor: (p) => (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '') },
      ],
      filteredPillars
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-susrutha-brand" />
            Ecosystem & Custom Facilities CMS
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage Herbal Garden, GMP Pharmacy, Research Center, Academy, & custom facility units.
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
            Add Ecosystem Unit
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search facility name, title or tagline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>

        <div>
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          >
            <option value="ALL">All Facility Units ({dynamicPillarOptions.length})</option>
            {dynamicPillarOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards List Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading ecosystem facilities...</span>
        </div>
      ) : filteredPillars.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No ecosystem items found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPillars.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {item.coverImage ? (
                  <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                    No Cover Image
                  </div>
                )}
                <span className="absolute top-3 left-3 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-white flex items-center gap-1 border border-white/20">
                  <Tag className="w-3 h-3 text-gold" />
                  {item.pillarType || 'Custom Unit'}
                </span>
              </div>

              <div className="p-5 flex flex-col gap-2 flex-grow">
                <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                {item.tagline && <p className="text-xs font-medium text-susrutha-brand">{item.tagline}</p>}
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>

              <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between text-xs">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    item.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.status}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Edit Unit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePillar(item._id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Unit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add / Edit Ecosystem Unit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Ecosystem Facility' : 'Add Ecosystem Facility Unit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePillar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Facility / Unit Type *
                </label>
                {!isCustomPillar ? (
                  <select
                    value={formData.pillarType}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM_NEW') {
                        setIsCustomPillar(true);
                        setCustomPillarInput('');
                      } else {
                        setFormData({ ...formData, pillarType: e.target.value });
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    {PRESET_PILLARS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="CUSTOM_NEW">+ Add Custom Facility / Pillar Unit...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={customPillarInput}
                      onChange={(e) => setCustomPillarInput(e.target.value)}
                      placeholder="e.g. Yoga & Meditation Sanctuary"
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomPillar(false)}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg"
                    >
                      Select Preset
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Facility Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Medicinal Herbal Conservatory"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Over 100+ species of organic Ayurvedic medicinal plants"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide comprehensive details about this facility unit, equipment, capacity, or clinical role..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <MediaInput
                  label="Cover Image"
                  value={formData.coverImage || ''}
                  onChange={(url) => setFormData({ ...formData, coverImage: url })}
                  placeholder="Upload or enter cover photo URL..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
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
                  {isEditing ? 'Save Changes' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
