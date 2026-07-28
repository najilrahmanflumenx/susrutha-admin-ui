'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { Stethoscope, Plus, Search, Grid, List, Edit, Loader2, Download, X } from 'lucide-react';

interface BranchOption {
  _id: string;
  name: string;
  code: string;
}

interface DoctorItem {
  _id?: string;
  id?: string;
  name: string;
  qualifications: string;
  designation: string;
  specialties: string[];
  assignedBranchIds: (string | BranchOption)[];
  consultationFee: number;
  experienceYears: number;
  isDirector: boolean;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  bio?: string;
  departmentId?: string;
}

interface DoctorForm {
  name: string;
  qualifications: string;
  designation: string;
  specialties: string;       // comma-separated input
  assignedBranchIds: string[]; // array of branch _id strings
  consultationFee: number;
  experienceYears: number;
  isDirector: boolean;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  bio: string;
  slug: string;
  departmentId: string;
}

export default function DoctorsPage() {
  const { selectedBranchId } = useBranch();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorForm>({
    name: '',
    qualifications: 'BAMS',
    designation: 'Ayurvedic Consultant',
    specialties: '',
    assignedBranchIds: [],
    consultationFee: 500,
    experienceYears: 5,
    isDirector: false,
    status: 'ACTIVE',
    bio: '',
    slug: '',
    departmentId: '',
  });

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/admin/branches');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBranches(res.data.data.map((b: any) => ({ _id: b._id, name: b.name, code: b.code })));
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/doctors');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setDoctors(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchDoctors();
  }, []);

  // Helper: get branch codes for a doctor (assignedBranchIds may be populated objects or raw IDs)
  const getDoctorBranchCodes = (doc: DoctorItem): string => {
    if (!doc.assignedBranchIds || doc.assignedBranchIds.length === 0) return '—';
    return doc.assignedBranchIds
      .map((b) => (typeof b === 'object' && b !== null ? b.code : branches.find((br) => br._id === b)?.code || String(b).slice(-4)))
      .join(', ');
  };

  // Filter doctors by selected branch in admin header
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedBranchId !== 'ALL') {
      const branchMatch = doc.assignedBranchIds?.some((b) => {
        const code = typeof b === 'object' && b !== null ? b.code : branches.find((br) => br._id === b)?.code;
        return code === selectedBranchId;
      });
      if (!branchMatch) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const specStr = Array.isArray(doc.specialties) ? doc.specialties.join(' ').toLowerCase() : '';
      return doc.name.toLowerCase().includes(q) || specStr.includes(q);
    }
    return true;
  });

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Doctors',
      [
        { header: 'ID', accessor: (d: DoctorItem) => d.id || d._id || '' },
        { header: 'Name', accessor: (d: DoctorItem) => d.name },
        { header: 'Qualifications', accessor: (d: DoctorItem) => d.qualifications },
        { header: 'Designation', accessor: (d: DoctorItem) => d.designation },
        { header: 'Specialties', accessor: (d: DoctorItem) => (d.specialties || []).join(', ') },
        { header: 'Branches', accessor: (d: DoctorItem) => getDoctorBranchCodes(d) },
        { header: 'Consultation Fee (INR)', accessor: (d: DoctorItem) => d.consultationFee },
        { header: 'Experience (Yrs)', accessor: (d: DoctorItem) => d.experienceYears },
        { header: 'Director', accessor: (d: DoctorItem) => (d.isDirector ? 'Yes' : 'No') },
        { header: 'Status', accessor: (d: DoctorItem) => d.status },
      ],
      filteredDoctors
    );
  };

  // Auto-generate slug from name
  const toSlug = (name: string) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      qualifications: 'BAMS',
      designation: 'Ayurvedic Consultant',
      specialties: '',
      assignedBranchIds: branches.length > 0 ? [branches[0]._id] : [],
      consultationFee: 500,
      experienceYears: 5,
      isDirector: false,
      status: 'ACTIVE',
      bio: '',
      slug: '',
      departmentId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: DoctorItem) => {
    setEditingId(doc._id || doc.id || null);
    setForm({
      name: doc.name || '',
      qualifications: doc.qualifications || 'BAMS',
      designation: doc.designation || '',
      specialties: Array.isArray(doc.specialties) ? doc.specialties.join(', ') : '',
      assignedBranchIds: (doc.assignedBranchIds || []).map((b) =>
        typeof b === 'object' && b !== null ? b._id : String(b)
      ),
      consultationFee: doc.consultationFee || 500,
      experienceYears: doc.experienceYears || 5,
      isDirector: !!doc.isDirector,
      status: doc.status || 'ACTIVE',
      bio: doc.bio || '',
      slug: '',
      departmentId: doc.departmentId || '',
    });
    setIsModalOpen(true);
  };

  const handleBranchToggle = (branchId: string) => {
    setForm((prev) => {
      const already = prev.assignedBranchIds.includes(branchId);
      return {
        ...prev,
        assignedBranchIds: already
          ? prev.assignedBranchIds.filter((id) => id !== branchId)
          : [...prev.assignedBranchIds, branchId],
      };
    });
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      slug: form.slug || toSlug(form.name),
      qualifications: form.qualifications,
      designation: form.designation,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      assignedBranchIds: form.assignedBranchIds,   // ← array of ObjectID strings
      consultationFee: form.consultationFee,
      experienceYears: form.experienceYears,
      isDirector: form.isDirector,
      status: form.status,
      bio: form.bio || `${form.name} is an experienced Ayurvedic physician at Susrutha.`,
      ...(form.departmentId ? { departmentId: form.departmentId } : {}),
    };

    try {
      if (editingId) {
        await apiClient.put(`/admin/doctors/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/doctors', payload);
      }
      await fetchDoctors();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving doctor:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Doctors & Medical Directors</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing all doctors from database.'
              : `Filtered for branch: ${selectedBranchId}`}
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
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or specialty..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>
        <div className="flex items-center space-x-1 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-susrutha-brand text-white' : 'text-muted-foreground'}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-susrutha-brand text-white' : 'text-muted-foreground'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading doctors from database...</span>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No doctor records found. Click &quot;Add New Doctor&quot; to create one.
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Doctor & Credentials</th>
                  <th className="px-6 py-3.5">Specialties</th>
                  <th className="px-6 py-3.5">Branches</th>
                  <th className="px-6 py-3.5">OP Fee</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id || doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <Stethoscope className="h-5 w-5 text-susrutha-brand" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {doc.name}
                            {doc.isDirector && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">Director</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{doc.qualifications} • {doc.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-foreground">
                      {Array.isArray(doc.specialties) ? doc.specialties.slice(0, 2).join(', ') : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{getDoctorBranchCodes(doc)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600">₹{doc.consultationFee}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(doc)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div key={doc.id || doc._id} className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Stethoscope className="h-6 w-6 text-susrutha-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">{doc.name}</h3>
                  <p className="text-xs text-susrutha-brand font-semibold">{doc.qualifications}</p>
                  <p className="text-xs text-muted-foreground">{getDoctorBranchCodes(doc)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {Array.isArray(doc.specialties) ? doc.specialties.join(', ') : '—'}
              </p>
              <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-600">₹{doc.consultationFee} Consultation</span>
                <button onClick={() => handleOpenEditModal(doc)} className="text-susrutha-brand font-semibold hover:underline">
                  Edit Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-sm">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Doctor Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: toSlug(e.target.value) })}
                  placeholder="e.g. Dr. S. Susrutha Varma"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Qualifications */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Qualifications</label>
                  <input
                    type="text"
                    required
                    value={form.qualifications}
                    onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                    placeholder="BAMS, MD"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                {/* Fee */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.consultationFee}
                    onChange={(e) => setForm({ ...form, consultationFee: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Designation</label>
                <input
                  type="text"
                  required
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Senior Consultant Physician"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              {/* Specialties */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder="Panchakarma, Spine Care, Arthritis"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              {/* Assigned Branches — multi-select checkboxes from API */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assigned Branches {branches.length === 0 && <span className="text-red-400 normal-case font-normal">(loading…)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {branches.map((b) => {
                    const checked = form.assignedBranchIds.includes(b._id);
                    return (
                      <label
                        key={b._id}
                        className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          checked
                            ? 'border-susrutha-brand bg-susrutha-brand/10 text-susrutha-brand'
                            : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-susrutha-brand/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => handleBranchToggle(b._id)}
                        />
                        <span>{b.name}</span>
                        <span className="font-mono text-[10px] opacity-60">{b.code}</span>
                      </label>
                    );
                  })}
                </div>
                {form.assignedBranchIds.length === 0 && (
                  <p className="text-xs text-red-500">Please select at least one branch.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Experience */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Is Director */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDirector}
                  onChange={(e) => setForm({ ...form, isDirector: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Medical Director</span>
              </label>

              {/* Bio */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Bio (Optional)</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Brief clinical biography..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
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
                  disabled={form.assignedBranchIds.length === 0}
                  className="rounded-lg bg-susrutha-brand px-4 py-2 text-xs font-semibold text-white hover:bg-susrutha-brandHover shadow-sm disabled:opacity-50"
                >
                  {editingId ? 'Update Doctor' : 'Save Doctor to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
