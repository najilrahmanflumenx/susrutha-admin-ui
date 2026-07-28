'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Shield, Plus, Lock, Check, X, Loader2 } from 'lucide-react';

interface RoleItem {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

const availablePermissions = [
  { key: 'branches:read', label: 'View Branches' },
  { key: 'branches:write', label: 'Manage Branches' },
  { key: 'doctors:read', label: 'View Doctor Profiles' },
  { key: 'doctors:write', label: 'Manage Doctors' },
  { key: 'departments:read', label: 'View Departments' },
  { key: 'departments:write', label: 'Manage Departments' },
  { key: 'appointments:read', label: 'View Bookings' },
  { key: 'appointments:confirm', label: 'Confirm Appointments' },
  { key: 'packages:write', label: 'Manage Care Packages' },
  { key: 'infrastructure:write', label: 'Manage Infrastructure' },
  { key: 'faqs:write', label: 'Manage FAQs' },
  { key: 'testimonials:write', label: 'Manage Testimonials' },
  { key: 'leads:process', label: 'Process Leads' },
  { key: 'settings:manage', label: 'System Settings' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<RoleItem> | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/roles');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          name: item.displayName || item.name,
          code: item.name || 'ROLE',
          description: item.description || '',
          permissions: Array.isArray(item.permissions) ? item.permissions : ['ALL_PERMISSIONS'],
          isSystem: item.isSystem || false,
        }));
        setRoles(mapped);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenAddModal = () => {
    setCurrentRole({
      name: '',
      code: '',
      description: '',
      permissions: ['appointments:read'],
      isSystem: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleItem) => {
    setCurrentRole({ ...role });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permKey: string) => {
    if (!currentRole) return;
    const currentPerms = currentRole.permissions || [];
    if (currentPerms.includes(permKey)) {
      setCurrentRole({ ...currentRole, permissions: currentPerms.filter((p) => p !== permKey) });
    } else {
      setCurrentRole({ ...currentRole, permissions: [...currentPerms, permKey] });
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole?.name) return;

    try {
      await apiClient.post('/admin/roles', {
        name: currentRole.name?.toUpperCase().replace(/\s+/g, '_') || 'CUSTOM_ROLE',
        displayName: currentRole.name || 'Custom Role',
        description: currentRole.description || '',
        permissions: currentRole.permissions || ['appointments:read'],
        isSystem: false,
      });
      await fetchRoles();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving role:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Roles & Page-Wise Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Configure Granular Role-Based Access Control (RBAC) permission matrices per admin module.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading RBAC system roles from MongoDB database...</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No RBAC role found in database. Click &quot;Create New Role&quot; to define one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id || role._id} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-susrutha-brand" />
                  <h3 className="font-bold text-base text-foreground">{role.name}</h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>

                <div className="space-y-1.5 pt-3 border-t border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Module Access Matrix:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {role.permissions.includes('*') || role.permissions.includes('ALL_PERMISSIONS') ? (
                      <span className="inline-flex items-center rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        <Lock className="h-3 w-3 mr-1" /> Full System Control
                      </span>
                    ) : (
                      role.permissions.map((p, i) => (
                        <span key={i} className="inline-flex items-center rounded bg-slate-100 border border-border px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Check className="h-2.5 w-2.5 mr-1 text-emerald-600" /> {p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <button
                  onClick={() => handleOpenEditModal(role)}
                  className="w-full rounded-md border border-border py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Configure Permission Matrix
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Role Modal - Fixed Contrast & Typography */}
      {isModalOpen && currentRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentRole.id ? `Configure Role: ${currentRole.name}` : 'Create New System Role'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Role Title
                </label>
                <input
                  type="text"
                  required
                  value={currentRole.name || ''}
                  onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                  placeholder="e.g. Inpatient Ward Supervisor"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={currentRole.description || ''}
                  onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                  placeholder="Description of role responsibilities..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Module Permission Matrix
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-3.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  {availablePermissions.map((perm) => {
                    const isChecked = currentRole.permissions?.includes(perm.key);
                    return (
                      <label key={perm.key} className="flex items-center space-x-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.key)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-susrutha-brand focus:ring-susrutha-brand"
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
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
                  Save Role Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
