'use client';

import React, { useEffect, useState } from 'react';
import { Syringe, Plus, Trash2, Edit, Download, Search, Loader2, X, CheckCircle2, FileText, Stethoscope, ListChecks, HelpCircle, Globe, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';
import { useBranch } from '@/context/BranchContext';

interface ProcedureStep {
  step: string;
  detail: string;
}

interface FAQItem {
  q: string;
  a: string;
}

interface TreatmentItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: string;
  malayalam?: string;
  shortDescription: string;
  fullDescription?: string;
  coverImage?: string;
  galleryImages?: string[];
  durationMinutes: number;
  recommendedDays: number;
  indications?: string[];
  benefits?: string[];
  contraindications?: string[];
  procedureSteps?: ProcedureStep[];
  preparation?: string[];
  aftercare?: string[];
  safety?: string[];
  faqs?: FAQItem[];
  doctorIds?: any[];
  assignedBranchIds?: any[];
  isFeatured?: boolean;
  status: 'published' | 'draft' | 'archived';
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
  createdAt?: string;
}

export default function TreatmentsPage() {
  const { selectedBranchId } = useBranch();
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'clinical' | 'protocol' | 'faqs' | 'seo'>('basic');

  // Input state for adding tags
  const [tagInputs, setTagInputs] = useState<{
    indications: string;
    benefits: string;
    contraindications: string;
    preparation: string;
    aftercare: string;
    safety: string;
  }>({
    indications: '',
    benefits: '',
    contraindications: '',
    preparation: '',
    aftercare: '',
    safety: '',
  });

  const emptyFormData: Partial<TreatmentItem> = {
    title: '',
    slug: '',
    category: 'Panchakarma',
    malayalam: '',
    shortDescription: '',
    fullDescription: '',
    coverImage: '',
    galleryImages: [],
    durationMinutes: 60,
    recommendedDays: 14,
    indications: [],
    benefits: [],
    contraindications: [],
    procedureSteps: [],
    preparation: [],
    aftercare: [],
    safety: [],
    faqs: [],
    doctorIds: [],
    assignedBranchIds: [],
    isFeatured: false,
    status: 'published',
    seo: { metaTitle: '', metaDescription: '', metaKeywords: '' },
  };

  const [formData, setFormData] = useState<Partial<TreatmentItem>>(emptyFormData);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const [txRes, docRes, branchRes] = await Promise.all([
        apiClient.get('/treatments', {
          params: {
            page,
            limit: 10,
            q: search,
            branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
          },
        }),
        apiClient.get('/doctors').catch(() => ({ data: { data: [] } })),
        apiClient.get('/branches').catch(() => ({ data: { data: [] } })),
      ]);

      if (txRes.data?.data && Array.isArray(txRes.data.data)) {
        setTreatments(txRes.data.data);
        if (txRes.data.meta) {
          setTotalPages(txRes.data.meta.totalPages || 1);
          setTotalCount(txRes.data.meta.total || txRes.data.data.length);
        }
      }
      if (docRes.data?.data && Array.isArray(docRes.data.data)) {
        setDoctorsList(docRes.data.data);
      }
      if (branchRes.data?.data && Array.isArray(branchRes.data.data)) {
        setBranchesList(branchRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching treatments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, selectedBranchId]);

  const filtered = treatments;

  const handleOpenAddModal = () => {
    setFormData(emptyFormData);
    setActiveTab('basic');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TreatmentItem) => {
    // Parse procedure steps if they come in as stringified JSON from older database records
    let parsedSteps: ProcedureStep[] = [];
    if (Array.isArray(item.procedureSteps)) {
      parsedSteps = item.procedureSteps.map((p: any, idx: number) => {
        if (typeof p === 'string') {
          try {
            const obj = JSON.parse(p);
            return { step: obj.step || `Step ${idx + 1}`, detail: obj.detail || String(p) };
          } catch {
            return { step: `Step ${idx + 1}`, detail: p };
          }
        }
        if (typeof p === 'object' && p !== null) {
          return { step: p.step || `Step ${idx + 1}`, detail: p.detail || String(p) };
        }
        return { step: `Step ${idx + 1}`, detail: String(p) };
      });
    }

    // Parse FAQs
    let parsedFaqs: FAQItem[] = [];
    if (Array.isArray(item.faqs)) {
      parsedFaqs = item.faqs.map((f: any) => ({
        q: f.q || f.question || '',
        a: f.a || f.answer || '',
      }));
    }

    setFormData({
      ...item,
      indications: Array.isArray(item.indications) ? item.indications : [],
      benefits: Array.isArray(item.benefits) ? item.benefits : [],
      contraindications: Array.isArray(item.contraindications) ? item.contraindications : [],
      procedureSteps: parsedSteps,
      preparation: Array.isArray(item.preparation) ? item.preparation : [],
      aftercare: Array.isArray(item.aftercare) ? item.aftercare : [],
      safety: Array.isArray(item.safety) ? item.safety : [],
      faqs: parsedFaqs,
      doctorIds: Array.isArray(item.doctorIds) ? item.doctorIds.map((d: any) => (typeof d === 'object' ? d._id : d)) : [],
      assignedBranchIds: Array.isArray(item.assignedBranchIds) ? item.assignedBranchIds.map((b: any) => (typeof b === 'object' ? b._id : b)) : [],
      seo: item.seo || { metaTitle: '', metaDescription: '', metaKeywords: '' },
    });
    setActiveTab('basic');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleAddArrayTag = (field: 'indications' | 'benefits' | 'contraindications' | 'preparation' | 'aftercare' | 'safety') => {
    const val = tagInputs[field].trim();
    if (!val) return;
    const current = formData[field] || [];
    setFormData({ ...formData, [field]: [...current, val] });
    setTagInputs({ ...tagInputs, [field]: '' });
  };

  const handleRemoveArrayTag = (field: 'indications' | 'benefits' | 'contraindications' | 'preparation' | 'aftercare' | 'safety', idx: number) => {
    const current = formData[field] || [];
    setFormData({ ...formData, [field]: current.filter((_, i) => i !== idx) });
  };

  // Procedure Steps helpers
  const handleAddProcedureStep = () => {
    const steps = formData.procedureSteps || [];
    setFormData({
      ...formData,
      procedureSteps: [...steps, { step: `Phase ${steps.length + 1}`, detail: '' }],
    });
  };

  const handleUpdateProcedureStep = (idx: number, key: 'step' | 'detail', val: string) => {
    const steps = [...(formData.procedureSteps || [])];
    steps[idx] = { ...steps[idx], [key]: val };
    setFormData({ ...formData, procedureSteps: steps });
  };

  const handleRemoveProcedureStep = (idx: number) => {
    const steps = (formData.procedureSteps || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, procedureSteps: steps });
  };

  // FAQ helpers
  const handleAddFaq = () => {
    const faqs = formData.faqs || [];
    setFormData({ ...formData, faqs: [...faqs, { q: '', a: '' }] });
  };

  const handleUpdateFaq = (idx: number, key: 'q' | 'a', val: string) => {
    const faqs = [...(formData.faqs || [])];
    faqs[idx] = { ...faqs[idx], [key]: val };
    setFormData({ ...formData, faqs: faqs });
  };

  const handleRemoveFaq = (idx: number) => {
    const faqs = (formData.faqs || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, faqs: faqs });
  };

  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.shortDescription) {
      alert('Title and Short Description are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = formData.slug?.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        slug,
        fullDescription: formData.fullDescription || formData.shortDescription,
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
    } catch (err: any) {
      console.error('Error saving treatment:', err);
      alert(`Failed to save treatment: ${err.response?.data?.message || err.message}`);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Syringe className="h-6 w-6 text-susrutha-brand" />
            Treatments & Clinical Therapies
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Full rich CMS management for Panchakarma, Kizhi, Dhara, Vasthi and specialized Kerala Ayurveda protocols.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add New Treatment
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search treatments by title or summary..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">Total Records: {filtered.length}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-susrutha-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Syringe className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold">No treatments found in database.</p>
          <p className="text-xs text-slate-400 mt-1">Click &quot;Add New Treatment&quot; above to create one.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Treatment Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item._id || item.slug} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{item.title}</div>
                      {item.malayalam && <span className="text-[10px] font-normal text-amber-700">{item.malayalam}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {item.durationMinutes} mins / {item.recommendedDays} days
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                      {item.shortDescription}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold text-[10px] capitalize ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-susrutha-brand transition-colors"
                          title="Edit Treatment"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Edit Treatment Therapy' : 'Add New Treatment Therapy'}
                </h3>
                <p className="text-xs text-slate-500">Configure complete rich fields for client UI detail rendering.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-100/70 px-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition-all ${
                  activeTab === 'basic' ? 'border-susrutha-brand text-susrutha-brand bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Syringe className="h-3.5 w-3.5" /> Basic & Media
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition-all ${
                  activeTab === 'content' ? 'border-susrutha-brand text-susrutha-brand bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Summaries & Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('clinical')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition-all ${
                  activeTab === 'clinical' ? 'border-susrutha-brand text-susrutha-brand bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5" /> Indications & Benefits
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('protocol')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition-all ${
                  activeTab === 'protocol' ? 'border-susrutha-brand text-susrutha-brand bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListChecks className="h-3.5 w-3.5" /> Procedure & Protocols
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faqs')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition-all ${
                  activeTab === 'faqs' ? 'border-susrutha-brand text-susrutha-brand bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" /> FAQs & Doctors
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition-all ${
                  activeTab === 'seo' ? 'border-susrutha-brand text-susrutha-brand bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> SEO Meta
              </button>
            </div>

            {/* Modal Content Body */}
            <form onSubmit={handleSaveTreatment} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: BASIC & MEDIA */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Treatment Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Abhyangam (Warm Medicated Oil Massage)"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">URL Slug</label>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="e.g. abhyangam-warm-oil-massage"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Malayalam Subtitle / Script</label>
                      <input
                        type="text"
                        value={formData.malayalam || ''}
                        onChange={(e) => setFormData({ ...formData, malayalam: e.target.value })}
                        placeholder="e.g. ആയുർവേദ ശരീര തിരുമ്മൽ"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || 'Panchakarma'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Panchakarma, External Therapy"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Session Duration (Mins)</label>
                      <input
                        type="number"
                        value={formData.durationMinutes || 60}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Status</label>
                      <select
                        value={formData.status || 'published'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <MediaInput
                    label="Cover Image / Therapy Banner Media"
                    value={formData.coverImage || ''}
                    onChange={(url) => setFormData({ ...formData, coverImage: url })}
                    acceptType="image"
                    placeholder="Upload image file or paste URL..."
                  />

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isFeaturedTx"
                      checked={!!formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand h-4 w-4"
                    />
                    <label htmlFor="isFeaturedTx" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Feature on client website homepage & primary clinical showcase grid
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT & OVERVIEW */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Short Summary / AI Executive Summary *</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.shortDescription || ''}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="Concise 2-3 sentence overview rendered in AI Summary block on detail page..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Full Detailed Overview (&quot;What it is&quot;) *</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.fullDescription || ''}
                      onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                      placeholder="Comprehensive clinical explanation, dosha background, and holistic benefits..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CLINICAL LISTS (TAGS) */}
              {activeTab === 'clinical' && (
                <div className="space-y-6">
                  {/* Indications */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Indications / Who Needs This Therapy</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={tagInputs.indications}
                        onChange={(e) => setTagInputs({ ...tagInputs, indications: e.target.value })}
                        placeholder="Add indication (e.g. Chronic joint stiffness, Insomnia)..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-susrutha-brand focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddArrayTag('indications')}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                      >
                        + Add Tag
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.indications || []).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 border border-amber-200">
                          {item}
                          <button type="button" onClick={() => handleRemoveArrayTag('indications', idx)} className="text-amber-600 hover:text-red-700">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Therapeutic Key Benefits</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={tagInputs.benefits}
                        onChange={(e) => setTagInputs({ ...tagInputs, benefits: e.target.value })}
                        placeholder="Add benefit (e.g. Relieves muscular tension, Improves circulation)..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-susrutha-brand focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddArrayTag('benefits')}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                      >
                        + Add Tag
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.benefits || []).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 border border-emerald-200">
                          {item}
                          <button type="button" onClick={() => handleRemoveArrayTag('benefits', idx)} className="text-emerald-600 hover:text-red-700">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contraindications */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Contraindications / When to Avoid</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={tagInputs.contraindications}
                        onChange={(e) => setTagInputs({ ...tagInputs, contraindications: e.target.value })}
                        placeholder="Add contraindication (e.g. Acute fevers, Skin infection)..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-susrutha-brand focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddArrayTag('contraindications')}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                      >
                        + Add Tag
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.contraindications || []).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-900 border border-red-200">
                          {item}
                          <button type="button" onClick={() => handleRemoveArrayTag('contraindications', idx)} className="text-red-600 hover:text-red-900 font-bold">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PROCEDURE & PROTOCOLS */}
              {activeTab === 'protocol' && (
                <div className="space-y-6">
                  {/* Procedure Steps */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Procedure Steps / Clinical Timeline</label>
                      <button
                        type="button"
                        onClick={handleAddProcedureStep}
                        className="inline-flex items-center gap-1 rounded-lg bg-susrutha-brand px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Step
                      </button>
                    </div>

                    <div className="space-y-3 mt-3">
                      {(formData.procedureSteps || []).map((step, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50 relative space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={step.step}
                              onChange={(e) => handleUpdateProcedureStep(idx, 'step', e.target.value)}
                              placeholder={`Step ${idx + 1} Name (e.g. Oil Selection)`}
                              className="font-bold text-xs bg-white border border-slate-300 rounded px-2.5 py-1 w-full focus:border-susrutha-brand"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProcedureStep(idx)}
                              className="text-slate-400 hover:text-red-600 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={step.detail}
                            onChange={(e) => handleUpdateProcedureStep(idx, 'detail', e.target.value)}
                            placeholder="Detailed description of this therapy phase..."
                            className="text-xs bg-white border border-slate-300 rounded p-2.5 w-full focus:border-susrutha-brand"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preparation Steps */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Pre-Therapy Preparation Instructions</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={tagInputs.preparation}
                        onChange={(e) => setTagInputs({ ...tagInputs, preparation: e.target.value })}
                        placeholder="Add prep instruction (e.g. Fast 2 hours prior)..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-susrutha-brand focus:outline-none"
                      />
                      <button type="button" onClick={() => handleAddArrayTag('preparation')} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                        + Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.preparation || []).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900 border border-blue-200">
                          {item}
                          <button type="button" onClick={() => handleRemoveArrayTag('preparation', idx)} className="text-blue-600 hover:text-red-700">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Aftercare Steps */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Post-Therapy Aftercare Instructions</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={tagInputs.aftercare}
                        onChange={(e) => setTagInputs({ ...tagInputs, aftercare: e.target.value })}
                        placeholder="Add aftercare instruction (e.g. Drink warm herbal water)..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-susrutha-brand focus:outline-none"
                      />
                      <button type="button" onClick={() => handleAddArrayTag('aftercare')} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                        + Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.aftercare || []).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-900 border border-purple-200">
                          {item}
                          <button type="button" onClick={() => handleRemoveArrayTag('aftercare', idx)} className="text-purple-600 hover:text-red-700">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Safety Guidelines */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Safety & Clinical Supervision Guidelines</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={tagInputs.safety}
                        onChange={(e) => setTagInputs({ ...tagInputs, safety: e.target.value })}
                        placeholder="Add safety guideline (e.g. Supervised by BAMS doctors)..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-susrutha-brand focus:outline-none"
                      />
                      <button type="button" onClick={() => handleAddArrayTag('safety')} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                        + Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.safety || []).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-900 border border-slate-300">
                          {item}
                          <button type="button" onClick={() => handleRemoveArrayTag('safety', idx)} className="text-slate-600 hover:text-red-700">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: FAQS & RELATIONS */}
              {activeTab === 'faqs' && (
                <div className="space-y-6">
                  {/* FAQs */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Frequently Asked Questions (FAQs)</label>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add FAQ
                      </button>
                    </div>

                    <div className="space-y-3 mt-3">
                      {(formData.faqs || []).map((faq, idx) => (
                        <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50 relative space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={faq.q}
                              onChange={(e) => handleUpdateFaq(idx, 'q', e.target.value)}
                              placeholder="Question (e.g. Is consultation mandatory before therapy?)"
                              className="font-bold text-xs bg-white border border-slate-300 rounded px-2.5 py-1 w-full focus:border-susrutha-brand"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              className="text-slate-400 hover:text-red-600 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={faq.a}
                            onChange={(e) => handleUpdateFaq(idx, 'a', e.target.value)}
                            placeholder="Detailed clinical answer..."
                            className="text-xs bg-white border border-slate-300 rounded p-2.5 w-full focus:border-susrutha-brand"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doctor Assignments */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Assign Consulting Doctors</label>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                      {doctorsList.map((doc) => {
                        const checked = (formData.doctorIds || []).includes(doc._id);
                        return (
                          <label key={doc._id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = formData.doctorIds || [];
                                if (e.target.checked) {
                                  setFormData({ ...formData, doctorIds: [...current, doc._id] });
                                } else {
                                  setFormData({ ...formData, doctorIds: current.filter((id: any) => id !== doc._id) });
                                }
                              }}
                              className="rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand h-4 w-4"
                            />
                            <span className="font-medium">{doc.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Branch Assignments */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Assign Hospital Branches</label>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                      {branchesList.map((br) => {
                        const checked = (formData.assignedBranchIds || []).includes(br._id);
                        return (
                          <label key={br._id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = formData.assignedBranchIds || [];
                                if (e.target.checked) {
                                  setFormData({ ...formData, assignedBranchIds: [...current, br._id] });
                                } else {
                                  setFormData({ ...formData, assignedBranchIds: current.filter((id: any) => id !== br._id) });
                                }
                              }}
                              className="rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand h-4 w-4"
                            />
                            <span className="font-medium">{br.name} ({br.code})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SEO */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Meta Title Tag</label>
                    <input
                      type="text"
                      value={formData.seo?.metaTitle || ''}
                      onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })}
                      placeholder="e.g. Abhyangam Therapy | Authentic Ayurvedic Oil Massage | Susrutha Hospital"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Meta Description Tag</label>
                    <textarea
                      rows={3}
                      value={formData.seo?.metaDescription || ''}
                      onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })}
                      placeholder="e.g. Experience authentic Kerala Abhyangam therapy directed by senior BAMS physicians at Susrutha Ayurveda Hospital..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.seo?.metaKeywords || ''}
                      onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaKeywords: e.target.value } })}
                      placeholder="abhyangam, panchakarma, kerala ayurveda, massage therapy, joint pain"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-between items-center pt-5 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Switch tabs to configure complete rich content.
                </span>
                <div className="flex gap-3">
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
                    {isEditing ? 'Save Complete Treatment Data' : 'Create Treatment Record'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
