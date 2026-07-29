'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';
import { Stethoscope, Plus, Search, Grid, List, Edit, Loader2, Download, X, Trash2, Star, ShieldCheck } from 'lucide-react';

interface BranchOption {
  _id: string;
  name: string;
  code: string;
}

interface DepartmentOption {
  _id: string;
  title: string;
  code?: string;
}

interface DoctorItem {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  qualifications: string;
  designation: string;
  registrationNumber?: string;
  specialties: string[];
  languagesSpoken?: string[];
  assignedBranchIds: (string | BranchOption)[];
  departmentId?: string | DepartmentOption;
  consultationFee: number;
  experienceYears: number;
  isDirector: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  photo?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  bio?: string;
}

interface DoctorForm {
  name: string;
  qualifications: string;
  designation: string;
  registrationNumber: string;
  specialties: string;
  languagesSpoken: string;
  assignedBranchIds: string[];
  departmentId: string;
  consultationFee: number;
  experienceYears: number;
  isDirector: boolean;
  isFeatured: boolean;
  sortOrder: number;
  photo: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  bio: string;
  slug: string;
}

export default function DoctorsPage() {
  const { selectedBranchId } = useBranch();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorForm>({
    name: '',
    qualifications: 'BAMS',
    designation: 'Ayurvedic Consultant Physician',
    registrationNumber: '',
    specialties: '',
    languagesSpoken: 'English, Malayalam',
    assignedBranchIds: [],
    departmentId: '',
    consultationFee: 500,
    experienceYears: 5,
    isDirector: false,
    isFeatured: false,
    sortOrder: 0,
    photo: '',
    status: 'ACTIVE',
    bio: '',
    slug: '',
  });

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

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/admin/departments');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDepartments(res.data.data.map((d: any) => ({ _id: d._id, title: d.title || d.name, code: d.code })));
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/doctors', {
        params: {
          page: currentPage,
          limit: pageSize,
          q: searchTerm,
          branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setDoctors(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotalCount(response.data.meta.total || response.data.data.length);
        }
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchTerm, selectedBranchId]);

  const getDoctorBranchCodes = (doc: DoctorItem): string => {
    if (!doc.assignedBranchIds || doc.assignedBranchIds.length === 0) return '—';
    return doc.assignedBranchIds
      .map((b) => (typeof b === 'object' && b !== null ? b.code : branches.find((br) => br._id === b)?.code || String(b).slice(-4)))
      .join(', ');
  };

  const getDepartmentTitle = (doc: DoctorItem): string => {
    if (!doc.departmentId) return '—';
    if (typeof doc.departmentId === 'object' && doc.departmentId !== null) {
      return doc.departmentId.title || '—';
    }
    return departments.find((d) => d._id === doc.departmentId)?.title || '—';
  };

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
        { header: 'Reg No', accessor: (d: DoctorItem) => d.registrationNumber || '' },
        { header: 'Department', accessor: (d: DoctorItem) => getDepartmentTitle(d) },
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

  const toSlug = (name: string) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      qualifications: 'BAMS',
      designation: 'Ayurvedic Consultant Physician',
      registrationNumber: '',
      specialties: '',
      languagesSpoken: 'English, Malayalam',
      assignedBranchIds: branches.length > 0 ? [branches[0]._id] : [],
      departmentId: departments.length > 0 ? departments[0]._id : '',
      consultationFee: 500,
      experienceYears: 5,
      isDirector: false,
      isFeatured: false,
      sortOrder: 0,
      photo: '',
      status: 'ACTIVE',
      bio: '',
      slug: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: DoctorItem) => {
    setEditingId(doc._id || doc.id || null);
    setForm({
      name: doc.name || '',
      qualifications: doc.qualifications || 'BAMS',
      designation: doc.designation || '',
      registrationNumber: doc.registrationNumber || '',
      specialties: Array.isArray(doc.specialties) ? doc.specialties.join(', ') : '',
      languagesSpoken: Array.isArray(doc.languagesSpoken) ? doc.languagesSpoken.join(', ') : 'English, Malayalam',
      assignedBranchIds: (doc.assignedBranchIds || []).map((b) =>
        typeof b === 'object' && b !== null ? b._id : String(b)
      ),
      departmentId: typeof doc.departmentId === 'object' && doc.departmentId !== null ? doc.departmentId._id : String(doc.departmentId || ''),
      consultationFee: doc.consultationFee || 500,
      experienceYears: doc.experienceYears || 5,
      isDirector: !!doc.isDirector,
      isFeatured: !!doc.isFeatured,
      sortOrder: doc.sortOrder || 0,
      photo: doc.photo || '',
      status: doc.status || 'ACTIVE',
      bio: doc.bio || '',
      slug: doc.slug || '',
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

  const handleDeleteDoctor = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this doctor profile?')) return;
    try {
      await apiClient.delete(`/admin/doctors/${id}`);
      await fetchDoctors();
    } catch (err) {
      console.error('Error deleting doctor:', err);
      alert('Failed to delete doctor profile.');
    }
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      slug: form.slug || toSlug(form.name),
      qualifications: form.qualifications,
      designation: form.designation,
      registrationNumber: form.registrationNumber,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      languagesSpoken: form.languagesSpoken.split(',').map((s) => s.trim()).filter(Boolean),
      assignedBranchIds: form.assignedBranchIds,
      consultationFee: form.consultationFee,
      experienceYears: form.experienceYears,
      isDirector: form.isDirector,
      isFeatured: form.isFeatured,
      sortOrder: form.sortOrder,
      photo: form.photo,
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
    } catch (err: any) {
      console.error('Error saving doctor:', err);
      alert(err.response?.data?.message || 'Failed to save doctor profile.');
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
            className="flex items-center space-x-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
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
                  <th className="px-6 py-3.5">Doctor Profile</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Specialties</th>
                  <th className="px-6 py-3.5">Branches</th>
                  <th className="px-6 py-3.5">OP Fee</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDoctors
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((doc) => (
                  <tr key={doc.id || doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {doc.photo ? (
                          <img src={doc.photo} alt={doc.name} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <Stethoscope className="h-5 w-5 text-susrutha-brand" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {doc.name}
                            {doc.isDirector && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                <ShieldCheck className="h-3 w-3" /> Director
                              </span>
                            )}
                            {doc.isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                <Star className="h-3 w-3 fill-emerald-500" /> Featured
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{doc.qualifications} • {doc.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-foreground font-medium">{getDepartmentTitle(doc)}</td>
                    <td className="px-6 py-4 text-xs text-foreground">
                      {Array.isArray(doc.specialties) ? doc.specialties.slice(0, 2).join(', ') : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{getDoctorBranchCodes(doc)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600">₹{doc.consultationFee}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(doc)}
                        className="p-1.5 rounded text-muted-foreground hover:text-susrutha-brand hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Doctor"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doc._id || doc.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete Doctor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground">
            <div>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredDoctors.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredDoctors.length)} of {filteredDoctors.length} doctors
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-border bg-background px-2.5 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Prev
                </button>
                <span className="px-2 font-semibold">
                  Page {currentPage} of {Math.max(1, Math.ceil(filteredDoctors.length / pageSize))}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(filteredDoctors.length / pageSize)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded border border-border bg-background px-2.5 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((doc) => (
              <div key={doc.id || doc._id} className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-start space-x-3">
                  {doc.photo ? (
                    <img src={doc.photo} alt={doc.name} className="h-12 w-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Stethoscope className="h-6 w-6 text-susrutha-brand" />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-base text-foreground truncate">{doc.name}</h3>
                    <p className="text-xs text-susrutha-brand font-semibold">{doc.qualifications}</p>
                    <p className="text-xs text-muted-foreground">{getDoctorBranchCodes(doc)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {Array.isArray(doc.specialties) ? doc.specialties.join(', ') : '—'}
                </p>
                <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-600">₹{doc.consultationFee} Consultation</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEditModal(doc)} className="text-susrutha-brand font-semibold hover:underline">
                      Edit Profile
                    </button>
                    <button onClick={() => handleDeleteDoctor(doc._id || doc.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid View Pagination Footer */}
          <div className="flex items-center justify-between px-2 py-3 text-xs text-muted-foreground">
            <div>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredDoctors.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredDoctors.length)} of {filteredDoctors.length} doctors
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-border bg-card px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Prev
              </button>
              <span className="font-semibold">
                Page {currentPage} of {Math.max(1, Math.ceil(filteredDoctors.length / pageSize))}
              </span>
              <button
                disabled={currentPage >= Math.ceil(filteredDoctors.length / pageSize)}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded border border-border bg-card px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-sm">
              {/* Doctor Photo Upload */}
              <MediaInput
                label="Doctor Profile Photo"
                value={form.photo}
                onChange={(url) => setForm({ ...form, photo: url })}
                acceptType="image"
                placeholder="Upload photo or enter URL..."
              />

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
                    placeholder="BAMS, MD (Ayurveda)"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                {/* Registration Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Registration Number</label>
                  <input
                    type="text"
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                    placeholder="e.g. TCMC/AYU/12345"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Designation */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Designation</label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Senior Consultant Physician"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                {/* Department Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.title} {d.code ? `(${d.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder="Panchakarma, Spine Care, Stroke Rehabilitation"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              {/* Languages Spoken */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Languages Spoken (comma-separated)</label>
                <input
                  type="text"
                  value={form.languagesSpoken}
                  onChange={(e) => setForm({ ...form, languagesSpoken: e.target.value })}
                  placeholder="English, Malayalam, Hindi, Tamil"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              {/* Assigned Branches */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assigned Branches
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
              </div>

              <div className="grid grid-cols-3 gap-3">
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

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDirector}
                    onChange={(e) => setForm({ ...form, isDirector: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Medical Director</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Featured Doctor</span>
                </label>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Bio & Clinical Summary</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Detailed clinical background, achievements, and specializations..."
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
                  {editingId ? 'Update Doctor Profile' : 'Save Doctor to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
