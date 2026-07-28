'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { Building2, Plus, Edit, Trash2, Activity, X, Loader2 } from 'lucide-react';

interface DepartmentItem {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  tagline: string;
  overview: string;
  branchCode: 'KTK' | 'KWR';
  status: 'ACTIVE' | 'INACTIVE';
}

export default function DepartmentsPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState<Partial<DepartmentItem> | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/departments');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          name: item.name || item.title,
          code: item.code || 'DEPT',
          tagline: item.tagline || item.subtitle || '',
          overview: item.overview || item.description || '',
          branchCode: item.branchCode || 'KTK',
          status: item.status || 'ACTIVE',
        }));
        setDepartments(mapped);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepts = departments.filter((d) => isBranchMatching(d.branchCode || 'KTK'));

  const handleOpenAddModal = () => {
    setCurrentDept({
      name: '',
      code: '',
      tagline: '',
      overview: '',
      branchCode: selectedBranchId === 'KWR' ? 'KWR' : 'KTK',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: DepartmentItem) => {
    setCurrentDept({ ...dept });
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDept?.name) return;

    try {
      await apiClient.post('/admin/departments', {
        title: currentDept.name,
        name: currentDept.name,
        code: currentDept.code?.toUpperCase() || 'DEPT',
        tagline: currentDept.tagline || '',
        overview: currentDept.overview || '',
        branchCode: currentDept.branchCode || 'KTK',
        status: 'ACTIVE',
      });
      await fetchDepartments();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving department:', err);
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
          No specialty department found in database for selected branch filter ({selectedBranchId}). Click &quot;Add Department&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDepts.map((dept) => (
            <div key={dept.id || dept._id} className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Activity className="h-5 w-5 text-susrutha-brand" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">{dept.name}</h3>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-susrutha-brand">CODE: {dept.code}</span>
                    </div>
                  </div>
                  <button onClick={() => handleOpenEditModal(dept)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs font-semibold text-susrutha-brand">{dept.tagline}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{dept.overview}</p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  {dept.branchCode === 'KTK' ? 'Kattakada Hospital' : 'Kowdiar City OP'}
                </span>
                <span className="font-bold text-emerald-600">Active Operational</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Fixed Contrast & Solid Background */}
      {isModalOpen && currentDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentDept.id ? 'Edit Department' : 'Add Specialty Department'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  value={currentDept.name || ''}
                  onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })}
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
                    maxLength={4}
                    value={currentDept.code || ''}
                    onChange={(e) => setCurrentDept({ ...currentDept, code: e.target.value.toUpperCase() })}
                    placeholder="PKM"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Branch Assignment
                  </label>
                  <select
                    value={currentDept.branchCode || 'KTK'}
                    onChange={(e) => setCurrentDept({ ...currentDept, branchCode: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="KTK">Kattakada Inpatient Hospital</option>
                    <option value="KWR">Kowdiar City OP Clinic</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={currentDept.tagline || ''}
                  onChange={(e) => setCurrentDept({ ...currentDept, tagline: e.target.value })}
                  placeholder="Authentic 5-Stage Purificatory Treatments"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Overview Summary
                </label>
                <textarea
                  rows={3}
                  value={currentDept.overview || ''}
                  onChange={(e) => setCurrentDept({ ...currentDept, overview: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-susrutha-brand px-4 py-2 text-xs font-semibold text-white hover:bg-susrutha-brandHover shadow-sm"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
