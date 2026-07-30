'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, Award, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X, CheckCircle2, ShieldCheck } from 'lucide-react';
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

interface AffiliationItem {
  _id?: string;
  id?: string;
  name: string;
  type?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  status?: string;
}

export default function PressAndAccreditationsPage() {
  const [activeTab, setActiveTab] = useState<'PRESS' | 'ACCREDITATIONS'>('PRESS');
  const [loading, setLoading] = useState(true);

  const [coverageItems, setCoverageItems] = useState<MediaCoverageItem[]>([]);
  const [affiliations, setAffiliations] = useState<AffiliationItem[]>([]);

  // Modal States
  const [isPressModalOpen, setIsPressModalOpen] = useState(false);
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pressForm, setPressForm] = useState<Partial<MediaCoverageItem>>({
    title: '',
    publisherName: 'Malayala Manorama',
    publicationType: 'newspaper',
    articleUrl: '',
    summary: '',
    status: 'published',
  });

  const [affiliationForm, setAffiliationForm] = useState<Partial<AffiliationItem>>({
    name: '',
    type: 'Government Accreditation',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    status: 'ACTIVE',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'PRESS') {
        const res = await apiClient.get('/media-coverage');
        setCoverageItems(res.data?.data || []);
      } else {
        const res = await apiClient.get('/affiliations');
        setAffiliations(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching press data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Press handlers
  const handleSavePress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pressForm.title || !pressForm.publisherName) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...pressForm,
        externalLink: pressForm.articleUrl || '',
        summary: pressForm.summary || pressForm.title || '',
      };
      if (isEditing && pressForm._id) {
        await apiClient.put(`/media-coverage/${pressForm._id}`, payload);
      } else {
        await apiClient.post('/media-coverage', payload);
      }
      setIsPressModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving press coverage:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePress = async (id?: string) => {
    if (!id || !confirm('Delete this press article?')) return;
    await apiClient.delete(`/media-coverage/${id}`);
    loadData();
  };

  // Affiliation handlers
  const handleSaveAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliationForm.name) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...affiliationForm,
        title: affiliationForm.name,
        status: affiliationForm.status === 'ACTIVE' ? 'published' : affiliationForm.status || 'published',
      };
      if (isEditing && affiliationForm._id) {
        await apiClient.put(`/affiliations/${affiliationForm._id}`, payload);
      } else {
        await apiClient.post('/affiliations', payload);
      }
      setIsAffiliationModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving accreditation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAffiliation = async (id?: string) => {
    if (!id || !confirm('Delete this accreditation item?')) return;
    await apiClient.delete(`/affiliations/${id}`);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-susrutha-brand" />
            Press & Accreditations CMS
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage media releases, newspaper features, NABH certifications, and hospital partners.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            if (activeTab === 'PRESS') setIsPressModalOpen(true);
            else setIsAffiliationModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add {activeTab === 'PRESS' ? 'Press Release' : 'Accreditation'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('PRESS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'PRESS'
              ? 'bg-susrutha-brand text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          News & Press Coverage
        </button>
        <button
          onClick={() => setActiveTab('ACCREDITATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'ACCREDITATIONS'
              ? 'bg-susrutha-brand text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Accreditations & Certificates
        </button>
      </div>

      {/* Main List Rendering */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading data...</span>
        </div>
      ) : activeTab === 'PRESS' ? (
        /* Press Coverage Items */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coverageItems.map((item) => (
            <div key={item._id} className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-3 shadow-sm">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-susrutha-brand bg-red-50 w-fit px-2.5 py-0.5 rounded-full">
                  {item.publisherName} • {item.publicationType}
                </span>
                <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">{item.summary}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                {item.articleUrl ? (
                  <a href={item.articleUrl} target="_blank" rel="noreferrer" className="text-xs text-susrutha-brand font-bold flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Read Article
                  </a>
                ) : <span className="text-xs text-slate-400">Internal Release</span>}
                <div className="flex gap-2">
                  <button onClick={() => { setPressForm(item); setIsEditing(true); setIsPressModalOpen(true); }} className="p-1 text-slate-600 hover:text-slate-900"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeletePress(item._id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Accreditations Items */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {affiliations.map((aff) => (
            <div key={aff._id} className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-3 shadow-sm">
              <div className="aspect-[4/3] w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative flex items-center justify-center p-2 shadow-xs">
                {aff.logoUrl ? (
                  <img src={aff.logoUrl} alt={aff.name} className="w-full h-full object-contain" />
                ) : (
                  <ShieldCheck className="w-10 h-10 text-susrutha-brand/50" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate">{aff.name}</h4>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">{aff.type || 'Certification'}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{aff.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                <div className="flex gap-2">
                  <button onClick={() => { setAffiliationForm(aff); setIsEditing(true); setIsAffiliationModalOpen(true); }} className="p-1 text-slate-600 hover:text-slate-900"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteAffiliation(aff._id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Press Item */}
      {isPressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 text-slate-900">
            <h3 className="font-bold text-lg">{isEditing ? 'Edit Press Item' : 'Add Press Coverage Item'}</h3>
            <form onSubmit={handleSavePress} className="space-y-3">
              <input type="text" required placeholder="Article Title" value={pressForm.title || ''} onChange={(e) => setPressForm({ ...pressForm, title: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <input type="text" required placeholder="Publisher Name (e.g. Times of India)" value={pressForm.publisherName || ''} onChange={(e) => setPressForm({ ...pressForm, publisherName: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <input type="text" placeholder="Article Web URL (e.g. https://manorama.com/...)" value={pressForm.articleUrl || ''} onChange={(e) => setPressForm({ ...pressForm, articleUrl: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <textarea required placeholder="Summary / Excerpt" rows={3} value={pressForm.summary || ''} onChange={(e) => setPressForm({ ...pressForm, summary: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPressModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-susrutha-brand text-white rounded-lg text-xs font-bold">Save Press Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Accreditation Item */}
      {isAffiliationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 text-slate-900">
            <h3 className="font-bold text-lg">{isEditing ? 'Edit Accreditation' : 'Add Accreditation Item'}</h3>
            <form onSubmit={handleSaveAffiliation} className="space-y-3">
              <input type="text" required placeholder="Organization / Accreditation Name (e.g. NABH)" value={affiliationForm.name || ''} onChange={(e) => setAffiliationForm({ ...affiliationForm, name: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <input type="text" placeholder="Type (e.g. Ministry of AYUSH Approved)" value={affiliationForm.type || ''} onChange={(e) => setAffiliationForm({ ...affiliationForm, type: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <textarea placeholder="Description" rows={3} value={affiliationForm.description || ''} onChange={(e) => setAffiliationForm({ ...affiliationForm, description: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <MediaInput label="Logo / Certificate Image" value={affiliationForm.logoUrl || ''} onChange={(url) => setAffiliationForm({ ...affiliationForm, logoUrl: url })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAffiliationModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-susrutha-brand text-white rounded-lg text-xs font-bold">Save Accreditation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
