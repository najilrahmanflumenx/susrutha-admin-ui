'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { MediaInput } from '@/components/MediaInput';
import { Building, Plus, Phone, Mail, MapPin, BedDouble, Clock, CheckCircle2, Edit, X, Loader2, Trash2 } from 'lucide-react';

interface BranchItem {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type: string;
  tagline?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | string;
  contact?: {
    phone?: string[];
    email?: string;
    emergencyPhone?: string;
  };
  phone?: string;
  email?: string;
  opdTimings?: string;
  bedCapacity?: number;
  features?: string[];
  coverImage?: string;
  isMainBranch?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export default function BranchesPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'INPATIENT_HOSPITAL',
    tagline: '',
    street: '',
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    pincode: '695001',
    phone: '',
    emergencyPhone: '',
    email: '',
    opdTimings: '09:00 AM - 07:00 PM',
    bedCapacity: 0,
    features: '',
    coverImage: '',
    isMainBranch: false,
    status: 'ACTIVE',
  });

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/branches');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setBranches(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const getDisplayAddress = (b: BranchItem): string => {
    if (typeof b.address === 'object' && b.address !== null) {
      return `${b.address.street || ''}, ${b.address.city || ''}, ${b.address.state || 'Kerala'} - ${b.address.pincode || ''}`;
    }
    return String(b.address || 'Kerala, India');
  };

  const getDisplayPhone = (b: BranchItem): string => {
    if (b.contact?.phone && b.contact.phone.length > 0) return b.contact.phone.join(', ');
    return b.phone || '—';
  };

  const getDisplayEmail = (b: BranchItem): string => {
    return b.contact?.email || b.email || '—';
  };

  const filteredBranches = branches.filter((b) => isBranchMatching(b.code));

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      code: '',
      type: 'INPATIENT_HOSPITAL',
      tagline: '',
      street: '',
      city: 'Thiruvananthapuram',
      state: 'Kerala',
      pincode: '695001',
      phone: '+91 96566 56736',
      emergencyPhone: '',
      email: 'info@susruthaayurveda.com',
      opdTimings: '09:00 AM - 07:00 PM',
      bedCapacity: 0,
      features: 'Ayurvedic Pharmacy, Panchakarma Theatres, IPD Suites',
      coverImage: '',
      isMainBranch: false,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: BranchItem) => {
    setEditingId(b._id || b.id || null);
    const addr = typeof b.address === 'object' && b.address !== null ? b.address : {};
    setForm({
      name: b.name || '',
      code: b.code || '',
      type: b.type || 'INPATIENT_HOSPITAL',
      tagline: b.tagline || '',
      street: addr.street || (typeof b.address === 'string' ? b.address : ''),
      city: addr.city || 'Thiruvananthapuram',
      state: addr.state || 'Kerala',
      pincode: addr.pincode || '695001',
      phone: Array.isArray(b.contact?.phone) ? b.contact?.phone.join(', ') : b.phone || '',
      emergencyPhone: b.contact?.emergencyPhone || '',
      email: b.contact?.email || b.email || '',
      opdTimings: b.opdTimings || '09:00 AM - 07:00 PM',
      bedCapacity: b.bedCapacity || 0,
      features: Array.isArray(b.features) ? b.features.join(', ') : '',
      coverImage: b.coverImage || '',
      isMainBranch: !!b.isMainBranch,
      status: b.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleDeleteBranch = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this hospital branch?')) return;
    try {
      await apiClient.delete(`/admin/branches/${id}`);
      await fetchBranches();
    } catch (err) {
      console.error('Error deleting branch:', err);
      alert('Failed to delete branch.');
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) return;

    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      type: form.type,
      tagline: form.tagline,
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      contact: {
        phone: form.phone.split(',').map((p) => p.trim()).filter(Boolean),
        email: form.email,
        emergencyPhone: form.emergencyPhone,
      },
      opdTimings: form.opdTimings,
      bedCapacity: Number(form.bedCapacity) || 0,
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      coverImage: form.coverImage,
      isMainBranch: form.isMainBranch,
      status: form.status,
    };

    try {
      if (editingId) {
        await apiClient.put(`/admin/branches/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/branches', payload);
      }
      await fetchBranches();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving branch:', err);
      alert(err.response?.data?.message || 'Failed to save branch.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospital Branches</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing all active hospital branches and city outpatient clinics.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading hospital branches from database...</span>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No hospital branch found for selected filter code ({selectedBranchId}).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBranches.map((branch) => (
            <div key={branch._id || branch.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              {branch.coverImage && (
                <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={branch.coverImage} alt={branch.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-lg">
                      <Building className="h-6 w-6 text-susrutha-brand" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base flex items-center text-foreground">
                        {branch.name}
                        {branch.isMainBranch && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Main Branch
                          </span>
                        )}
                      </h3>
                      <span className="text-xs font-mono font-semibold text-muted-foreground">CODE: {branch.code} • {branch.type}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-susrutha-brand shrink-0" />
                    <span>{getDisplayAddress(branch)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-susrutha-brand shrink-0" />
                    <span>{getDisplayPhone(branch)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-susrutha-brand shrink-0" />
                    <span>{getDisplayEmail(branch)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-susrutha-brand shrink-0" />
                    <span>OPD Hours: {branch.opdTimings || '09:00 AM - 07:00 PM'}</span>
                  </div>
                  {branch.bedCapacity && branch.bedCapacity > 0 ? (
                    <div className="flex items-center space-x-2 text-foreground font-semibold">
                      <BedDouble className="h-4 w-4 text-susrutha-brand shrink-0" />
                      <span>Inpatient Capacity: {branch.bedCapacity} Beds</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-border flex items-center justify-between">
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {branch.status || 'ACTIVE'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(branch)}
                    className="rounded-md border border-border bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors flex items-center space-x-1"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    <span>Configure</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch._id || branch.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configure / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? `Configure Branch: ${form.code}` : 'Add New Hospital Branch'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4 text-sm">
              <MediaInput
                label="Branch Cover Image"
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
                acceptType="image"
                placeholder="Upload branch cover photo..."
              />

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Branch Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Kattakada Inpatient Hospital & Research Center"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. KTK"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Facility Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="INPATIENT_HOSPITAL">Inpatient Hospital</option>
                    <option value="CITY_CLINIC">City OP Clinic</option>
                    <option value="DIAGNOSTIC_CENTER">Diagnostic Center</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Street Address</label>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="Kattakada Town, Near KSRTC Depot"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Pincode</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Emergency Line</label>
                  <input
                    type="text"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    placeholder="+91 94471 23456"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">OPD Timings</label>
                  <input
                    type="text"
                    value={form.opdTimings}
                    onChange={(e) => setForm({ ...form, opdTimings: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Inpatient Bed Capacity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.bedCapacity}
                    onChange={(e) => setForm({ ...form, bedCapacity: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Features / Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm"
                />
              </div>

              <label className="flex items-center space-x-2 text-xs cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isMainBranch}
                  onChange={(e) => setForm({ ...form, isMainBranch: e.target.checked })}
                  className="rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand"
                />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Set as Main Hospital Headquarters</span>
              </label>

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
                  {editingId ? 'Update Branch' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
