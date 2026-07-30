'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput, MultiMediaInput } from '@/components/MediaInput';
import { ShieldAlert, Plus, Edit, Check, Clock, IndianRupee, Building2, X, Loader2, Download, Trash2 } from 'lucide-react';

interface PackageItem {
  _id?: string;
  id?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  overview?: string;
  durationDays?: number;
  price: number;
  discountedPrice?: number;
  branchCode?: string;
  assignedBranchIds?: any[];
  inclusions: string[];
  exclusions?: string[];
  coverImage?: string;
  image?: string;
  galleryImages?: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export default function PackagesPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inclusionsInput, setInclusionsInput] = useState('');
  const [exclusionsInput, setExclusionsInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    overview: '',
    durationDays: 7,
    price: 15000,
    discountedPrice: 13500,
    branchCode: 'KTK',
    assignedBranchIds: [] as string[],
    coverImage: '',
    galleryImages: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/admin/branches');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBranches(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/packages', {
        params: {
          page,
          limit: 10,
          branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setPackages(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotalCount(response.data.meta.total || response.data.data.length);
        }
      }
    } catch (err) {
      console.error('Error fetching care packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedBranchId]);

  const filteredPkgs = packages;

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Care_Packages',
      [
        { header: 'ID', accessor: (p) => p.id || p._id || '' },
        { header: 'Package Title', accessor: (p) => p.title },
        { header: 'Subtitle', accessor: (p) => p.subtitle || '' },
        { header: 'Duration (Days)', accessor: (p) => p.durationDays || 7 },
        { header: 'Price (INR)', accessor: (p) => p.price },
        { header: 'Status', accessor: (p) => p.status },
      ],
      filteredPkgs
    );
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      subtitle: 'Complete Ayurvedic Wellness Protocol',
      overview: 'Comprehensive classical Ayurvedic treatment and wellness package protocol.',
      durationDays: 7,
      price: 15000,
      discountedPrice: 13500,
      branchCode: 'KTK',
      assignedBranchIds: branches.length > 0 ? [branches[0]._id] : [],
      coverImage: '',
      galleryImages: [],
      status: 'ACTIVE',
    });
    setInclusionsInput('Physician Consultation, Daily Panchakarma Therapy, Herbal Diet Plan');
    setExclusionsInput('Personal Transportation, Private Suite Upgrades');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: PackageItem) => {
    setEditingId(pkg._id || pkg.id || null);
    setForm({
      title: pkg.title || '',
      subtitle: pkg.subtitle || pkg.tagline || '',
      overview: pkg.overview || '',
      durationDays: pkg.durationDays || 7,
      price: pkg.price || 15000,
      discountedPrice: pkg.discountedPrice || pkg.price || 15000,
      branchCode: pkg.branchCode || 'KTK',
      assignedBranchIds: Array.isArray(pkg.assignedBranchIds)
        ? pkg.assignedBranchIds.map((b: any) => (typeof b === 'object' ? b._id : b))
        : [],
      coverImage: pkg.coverImage || pkg.image || '',
      galleryImages: Array.isArray(pkg.galleryImages) ? pkg.galleryImages : [],
      status: pkg.status || 'ACTIVE',
    });
    setInclusionsInput(Array.isArray(pkg.inclusions) ? pkg.inclusions.join(', ') : '');
    setExclusionsInput(Array.isArray(pkg.exclusions) ? pkg.exclusions.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleDeletePackage = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this care package?')) return;
    try {
      await apiClient.delete(`/admin/packages/${id}`);
      await fetchPackages();
    } catch (err) {
      console.error('Error deleting package:', err);
      alert('Failed to delete care package.');
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      tagline: form.subtitle,
      overview: form.overview || form.subtitle || form.title || 'Comprehensive Ayurvedic Care Package Protocol',
      durationDays: Number(form.durationDays) || 7,
      price: Number(form.price) || 15000,
      discountedPrice: Number(form.discountedPrice) || form.price,
      branchCode: form.branchCode,
      assignedBranchIds: form.assignedBranchIds,
      inclusions: inclusionsInput.split(',').map((s) => s.trim()).filter(Boolean),
      exclusions: exclusionsInput.split(',').map((s) => s.trim()).filter(Boolean),
      coverImage: form.coverImage,
      image: form.coverImage,
      galleryImages: form.galleryImages,
      status: form.status,
    };

    try {
      if (editingId) {
        await apiClient.put(`/admin/packages/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/packages', payload);
      }
      await fetchPackages();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving care package:', err);
      alert(err.response?.data?.message || 'Failed to save package');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ayurvedic Treatment & Care Packages</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing care packages across all hospital branches.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Package</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading care packages from database...</span>
        </div>
      ) : filteredPkgs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No care package found in database. Click &quot;Add New Package&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPkgs.map((pkg) => (
            <div key={pkg._id || pkg.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              {pkg.coverImage && (
                <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={pkg.coverImage} alt={pkg.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-6 space-y-4 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock className="h-3 w-3 mr-1" /> {pkg.durationDays || 7} Days Duration
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenEditModal(pkg)} className="p-1 rounded text-muted-foreground hover:text-susrutha-brand">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeletePackage(pkg._id || pkg.id)} className="p-1 rounded text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground">{pkg.title}</h3>
                    <p className="text-xs text-susrutha-brand font-medium">{pkg.subtitle || pkg.tagline}</p>
                  </div>

                  <div className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <span className="flex items-center text-emerald-600">
                      <IndianRupee className="h-5 w-5" /> {pkg.price.toLocaleString('en-IN')}
                    </span>
                    {pkg.discountedPrice && pkg.discountedPrice < pkg.price && (
                      <span className="text-xs font-normal text-slate-400 line-through">₹{pkg.discountedPrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  {Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package Inclusions:</span>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {pkg.inclusions.map((inc, idx) => (
                          <li key={idx} className="flex items-center">
                            <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  {pkg.branchCode || 'All Branches'}
                </span>
                <span className="font-bold text-emerald-600">{pkg.status || 'ACTIVE'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground rounded-lg">
        <div>
          Showing {totalCount > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
          {Math.min(page * 10, totalCount)} of {totalCount} care packages
        </div>
        <div className="flex items-center space-x-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border bg-background px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Prev
          </button>
          <span className="px-2 font-semibold">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border bg-background px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Care Package' : 'Add New Care Package'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-sm">
              <MediaInput
                label="Main Package Cover Image"
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
                acceptType="image"
                placeholder="Upload primary cover image..."
              />

              <MultiMediaInput
                label="Package Gallery Images"
                values={form.galleryImages}
                onChange={(urls) => setForm({ ...form, galleryImages: urls })}
                acceptType="image"
              />

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Package Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Complete Panchakarma Detox Package"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="7-Day Intensive Rejuvenation Therapy"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Package Overview / Description
                </label>
                <textarea
                  rows={3}
                  value={form.overview || ''}
                  onChange={(e) => setForm({ ...form, overview: e.target.value })}
                  placeholder="Comprehensive clinical overview of this treatment & care package..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.durationDays}
                    onChange={(e) => {
                      const newDays = parseInt(e.target.value) || 7;
                      setForm((prev) => {
                        const updatedSubtitle = prev.subtitle ? prev.subtitle.replace(/\b\d+[- ]Day\b/gi, `${newDays}-Day`) : prev.subtitle;
                        const updatedTitle = prev.title ? prev.title.replace(/\b\d+[- ]Day\b/gi, `${newDays}-Day`) : prev.title;
                        return {
                          ...prev,
                          durationDays: newDays,
                          subtitle: updatedSubtitle,
                          title: updatedTitle,
                        };
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Offer Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.discountedPrice}
                    onChange={(e) => setForm({ ...form, discountedPrice: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Inclusions (comma-separated)</label>
                <input
                  type="text"
                  value={inclusionsInput}
                  onChange={(e) => setInclusionsInput(e.target.value)}
                  placeholder="Doctor Consultation, Daily Massage, Herbal Diet"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Exclusions (comma-separated)</label>
                <input
                  type="text"
                  value={exclusionsInput}
                  onChange={(e) => setExclusionsInput(e.target.value)}
                  placeholder="Personal Transport, Special AC Suite"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-susrutha-brand px-4 py-2 text-xs font-semibold text-white hover:bg-susrutha-brandHover shadow-sm"
                >
                  {editingId ? 'Update Package' : 'Save Care Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
