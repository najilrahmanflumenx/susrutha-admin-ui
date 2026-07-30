'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { MediaInput } from '@/components/MediaInput';
import { Building2, Plus, Edit, Trash2, Activity, X, Loader2 } from 'lucide-react';

interface DepartmentItem {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  code?: string;
  tagline?: string;
  overview?: string;
  description?: string;
  image?: string;
  coverImage?: string;
  branchCode?: string;
  assignedBranchIds?: any[];
  status?: 'ACTIVE' | 'INACTIVE';
}

export default function DepartmentsPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [branchesList, setBranchesList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    code: '',
    tagline: '',
    description: '',
    image: '',
    branchCode: 'ALL',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiClient.get('/branches', { params: { page: 1, limit: 100 } });
        const data: any[] = res.data?.data || res.data || [];
        setBranchesList(
          data.map((b: any) => ({
            id: b._id || b.id || b.code,
            name: b.name,
            code: b.code || b.name,
          }))
        );
      } catch {
        setBranchesList([]);
      }
    }
    loadBranches();
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/departments', {
        params: {
          page,
          limit: 10,
        },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setDepartments(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotalCount(response.data.meta.total || response.data.data.length);
        }
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [page]);

  const filteredDepts = departments;

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      code: '',
      tagline: '',
      description: '',
      image: '',
      branchCode: 'ALL',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: DepartmentItem) => {
    const defaultBranch = dept.branchCode || (dept.assignedBranchIds?.[0]?.code) || dept.assignedBranchIds?.[0] || 'ALL';
    setEditingId(dept._id || dept.id || null);
    setForm({
      title: dept.title || dept.name || '',
      code: dept.code || '',
      tagline: dept.tagline || '',
      description: dept.description || dept.overview || '',
      image: dept.image || dept.coverImage || '',
      branchCode: defaultBranch,
      status: dept.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this department?')) return;
    try {
      await apiClient.delete(`/admin/departments/${id}`);
      await fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department.');
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    const payload = {
      title: form.title,
      name: form.title,
      code: form.code.toUpperCase(),
      tagline: form.tagline,
      description: form.description,
      overview: form.description,
      image: form.image,
      coverImage: form.image,
      branchCode: form.branchCode,
      assignedBranchIds: form.branchCode === 'ALL' ? [] : [form.branchCode],
      status: form.status,
    };

    try {
      if (editingId) {
        await apiClient.put(`/admin/departments/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/departments', payload);
      }
      await fetchDepartments();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving department:', err);
      alert(err.response?.data?.message || 'Failed to save department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Specialty Clinical Departments</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing specialty clinical departments across all hospital branches.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading clinical departments from MongoDB database...</span>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No specialty department found in database. Click &quot;Add Department&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDepts.map((dept) => {
            const deptImg = dept.image || dept.coverImage;

            return (
              <div key={dept._id || dept.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
                {deptImg ? (
                  <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-border">
                    <img src={deptImg} alt={dept.title || dept.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-28 w-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center border-b border-border">
                    <span className="text-xs text-muted-foreground font-medium">No Department Image Uploaded</span>
                  </div>
                )}
                <div className="p-5 space-y-3 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Activity className="h-5 w-5 text-susrutha-brand" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{dept.title || dept.name}</h3>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-susrutha-brand">CODE: {dept.code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenEditModal(dept)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteDepartment(dept._id || dept.id)} className="p-1 rounded text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {dept.tagline && <p className="text-xs font-semibold text-susrutha-brand">{dept.tagline}</p>}
                  <p className="text-xs text-muted-foreground leading-relaxed">{dept.description || dept.overview}</p>
                </div>

                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1" />
                    {Array.isArray(dept.assignedBranchIds) && dept.assignedBranchIds.length > 0
                      ? dept.assignedBranchIds.map((b: any) => (typeof b === 'object' ? b.name || b.code : b)).join(', ')
                      : dept.branchCode && dept.branchCode !== 'ALL'
                      ? dept.branchCode
                      : 'All Branches'}
                  </span>
                  <span className="font-bold text-emerald-600">{dept.status || 'ACTIVE'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground rounded-lg">
        <div>
          Showing {totalCount > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
          {Math.min(page * 10, totalCount)} of {totalCount} departments
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
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Department' : 'Add Specialty Department'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4 text-sm">
              <MediaInput
                label="Department Hero Image"
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
                acceptType="image"
                placeholder="Upload department image..."
              />

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Panchakarma & Detoxification"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Dept Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="PKM"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Branch Assignment
                  </label>
                  <select
                    value={form.branchCode}
                    onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="ALL">All Branches (Global)</option>
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.code || b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Authentic 5-Stage Purificatory Treatments"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Overview / Clinical Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
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
                  {editingId ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
