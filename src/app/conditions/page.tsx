'use client';

import React, { useEffect, useState } from 'react';
import { HeartPulse, Plus, Trash2, Edit, Download, Search, Loader2, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';

interface ConditionItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: string;
  shortDescription: string;
  fullDescription?: string;
  coverImage?: string;
  ayurvedicRootCause?: string;
  symptoms?: string[];
  recommendedTreatmentIds?: any[];
  recommendedPackageIds?: any[];
  specialistDoctorIds?: any[];
  assignedBranchIds?: any[];
  status: 'published' | 'draft' | 'archived';
  isFeatured?: boolean;
}

export default function ConditionsPage() {
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [treatmentsList, setTreatmentsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [symptomsInput, setSymptomsInput] = useState('');
  const [formData, setFormData] = useState<Partial<ConditionItem>>({
    title: '',
    category: 'Spine & Joint Health',
    shortDescription: '',
    fullDescription: '',
    coverImage: '',
    ayurvedicRootCause: 'Vata Dosha Imbalance & Dhatu Kshaya',
    symptoms: [],
    recommendedTreatmentIds: [],
    specialistDoctorIds: [],
    assignedBranchIds: [],
    status: 'published',
    isFeatured: false,
  });

  const fetchConditions = async () => {
    try {
      setLoading(true);
      const [condRes, txRes, docRes, branchRes] = await Promise.all([
        apiClient.get('/conditions'),
        apiClient.get('/treatments').catch(() => ({ data: { data: [] } })),
        apiClient.get('/doctors').catch(() => ({ data: { data: [] } })),
        apiClient.get('/branches').catch(() => ({ data: { data: [] } })),
      ]);

      if (condRes.data?.data && Array.isArray(condRes.data.data)) {
        setConditions(condRes.data.data);
      }
      if (txRes.data?.data && Array.isArray(txRes.data.data)) {
        setTreatmentsList(txRes.data.data);
      }
      if (docRes.data?.data && Array.isArray(docRes.data.data)) {
        setDoctorsList(docRes.data.data);
      }
      if (branchRes.data?.data && Array.isArray(branchRes.data.data)) {
        setBranchesList(branchRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching conditions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, []);

  const filtered = conditions.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.shortDescription.toLowerCase().includes(q);
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      category: 'Spine & Joint Health',
      shortDescription: '',
      fullDescription: '',
      coverImage: '',
      ayurvedicRootCause: 'Vata Dosha Imbalance',
      symptoms: [],
      recommendedTreatmentIds: [],
      specialistDoctorIds: [],
      assignedBranchIds: [],
      status: 'published',
      isFeatured: false,
    });
    setSymptomsInput('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ConditionItem) => {
    setFormData({
      ...item,
      symptoms: Array.isArray(item.symptoms) ? item.symptoms : [],
      recommendedTreatmentIds: Array.isArray(item.recommendedTreatmentIds)
        ? item.recommendedTreatmentIds.map((t: any) => (typeof t === 'object' ? t._id : t))
        : [],
      specialistDoctorIds: Array.isArray(item.specialistDoctorIds)
        ? item.specialistDoctorIds.map((d: any) => (typeof d === 'object' ? d._id : d))
        : [],
      assignedBranchIds: Array.isArray(item.assignedBranchIds)
        ? item.assignedBranchIds.map((b: any) => (typeof b === 'object' ? b._id : b))
        : [],
    });
    setSymptomsInput(Array.isArray(item.symptoms) ? item.symptoms.join(', ') : '');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.shortDescription) return;

    setIsSubmitting(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        fullDescription: formData.fullDescription || formData.shortDescription,
        symptoms: symptomsInput.split(',').map((s) => s.trim()).filter(Boolean),
        slug,
      };

      if (isEditing && formData._id) {
        await apiClient.put(`/conditions/${formData._id}`, payload);
      } else {
        await apiClient.post('/conditions', payload);
      }
      fetchConditions();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving condition:', err);
      alert(err.response?.data?.message || 'Failed to save condition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete condition from database?')) return;
    try {
      await apiClient.delete(`/conditions/${id}`);
      fetchConditions();
    } catch (err) {
      console.error('Error deleting condition:', err);
      alert('Failed to delete condition');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Health_Conditions',
      [
        { header: 'ID', accessor: (c) => c._id || '' },
        { header: 'Title', accessor: (c) => c.title },
        { header: 'Category', accessor: (c) => c.category },
        { header: 'Ayurvedic Root Cause', accessor: (c) => c.ayurvedicRootCause || '' },
        { header: 'Short Description', accessor: (c) => c.shortDescription },
        { header: 'Status', accessor: (c) => c.status },
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
            <HeartPulse className="h-6 w-6 text-susrutha-brand" />
            Clinical Conditions & Speciality Pathways
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage disease categories (Spine, Joint, Metabolic, Skin, Stress, Stroke rehab)
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
            Add New Condition
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conditions by title or description..."
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
          <span>Loading clinical conditions from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-slate-500">
          No conditions found matching search filter.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Condition Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Ayurvedic Root Cause</th>
                  <th className="px-4 py-3">Short Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-3">
                      {c.coverImage ? (
                        <img src={c.coverImage} alt={c.title} className="h-9 w-9 rounded-lg object-cover border border-slate-200" />
                      ) : null}
                      <span>{c.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{c.ayurvedicRootCause || 'Vata Dosha'}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">{c.shortDescription}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 transition-colors"
                          title="Edit Condition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Condition"
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

      {/* Modal: Add / Edit Condition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Health Condition' : 'Add New Health Condition'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCondition} className="space-y-4 text-sm">
              <MediaInput
                label="Condition Banner / Illustration Image"
                value={formData.coverImage || ''}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
                acceptType="image"
                placeholder="Upload image or enter URL..."
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Condition Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Cervical Spondylosis & Disc Bulge"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category || 'Spine & Joint Health'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Spine & Joint Health"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Ayurvedic Root Cause</label>
                  <input
                    type="text"
                    value={formData.ayurvedicRootCause || ''}
                    onChange={(e) => setFormData({ ...formData, ayurvedicRootCause: e.target.value })}
                    placeholder="e.g. Vata Imbalance & Asthi Dhatu Kshaya"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Key Symptoms (comma-separated)</label>
                <input
                  type="text"
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Neck pain, Radiating numbness, Stiffness"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-susrutha-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Short Summary</label>
                <textarea
                  required
                  rows={2}
                  value={formData.shortDescription || ''}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Clinical summary..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-susrutha-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Full Description</label>
                <textarea
                  rows={4}
                  value={formData.fullDescription || ''}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  placeholder="Detailed ayurvedic perspective, prognosis, and treatment protocol..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-susrutha-brand focus:outline-none"
                />
              </div>

              {/* Recommended Treatments */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Recommended Treatments</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-xs">
                  {treatmentsList.map((t) => {
                    const checked = (formData.recommendedTreatmentIds || []).includes(t._id);
                    return (
                      <label key={t._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const cur = formData.recommendedTreatmentIds || [];
                            setFormData({
                              ...formData,
                              recommendedTreatmentIds: e.target.checked ? [...cur, t._id] : cur.filter((id) => id !== t._id),
                            });
                          }}
                          className="rounded text-susrutha-brand focus:ring-susrutha-brand h-3.5 w-3.5"
                        />
                        <span className="truncate">{t.title}</span>
                      </label>
                    );
                  })}
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
                  {isEditing ? 'Save Changes' : 'Create Condition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
