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
  // Core Setup
  { key: 'branches:read', label: 'View Branches' },
  { key: 'branches:write', label: 'Manage Branches' },
  { key: 'departments:read', label: 'View Departments' },
  { key: 'departments:write', label: 'Manage Departments' },
  { key: 'doctors:read', label: 'View Doctor Profiles' },
  { key: 'doctors:write', label: 'Manage Doctors' },

  // Clinical Content
  { key: 'conditions:write', label: 'Manage Conditions' },
  { key: 'treatments:write', label: 'Manage Treatments' },
  { key: 'packages:write', label: 'Manage Care Packages' },
  { key: 'infrastructure:write', label: 'Manage Infrastructure' },

  // Patient Operations
  { key: 'appointments:read', label: 'View Bookings' },
  { key: 'appointments:confirm', label: 'Confirm Appointments' },
  { key: 'leads:process', label: 'Process Leads' },

  // Media & Content
  { key: 'testimonials:write', label: 'Manage Testimonials' },
  { key: 'blogs:write', label: 'Manage Blogs & Articles' },
  { key: 'faqs:write', label: 'Manage FAQs' },
  { key: 'ecosystem:write', label: 'Manage Campus Ecosystem' },
  { key: 'gallery:write', label: 'Manage Media Gallery' },
  { key: 'media-coverage:write', label: 'Manage Press & Media' },
  { key: 'videos:write', label: 'Manage Video Library' },
  { key: 'media-library:write', label: 'Manage Media Assets' },

  // System & Security
  { key: 'users:manage', label: 'Manage Staff Users' },
  { key: 'roles:manage', label: 'Manage Roles & RBAC' },
  { key: 'audit-logs:read', label: 'View Audit Logs' },
  { key: 'settings:manage', label: 'System Settings' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<RoleItem> | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('susrutha_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const perms: string[] = parsed?.roleId?.permissions || parsed?.permissions || [];
        const rName = parsed?.roleId?.name || parsed?.roleName || '';
        if (rName !== 'SUPER_ADMIN' && !perms.includes('*') && !perms.includes('ALL_PERMISSIONS')) {
          if (perms.includes('view_only') || perms.every((p) => p.endsWith(':read') || p === 'view_only')) {
            setIsReadOnly(true);
          }
        }
      }
    } catch (e) {}
  }, []);

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

  const handleSelectAllPermissions = () => {
    if (!currentRole) return;
    const allKeys = availablePermissions.map((p) => p.key);
    setCurrentRole({ ...currentRole, permissions: allKeys });
  };

  const handleSelectAllViewPermissions = () => {
    if (!currentRole) return;
    const viewKeys = availablePermissions
      .filter((p) => p.key.endsWith(':read') || p.key.includes('read') || p.label.startsWith('View'))
      .map((p) => p.key);
    setCurrentRole({ ...currentRole, permissions: viewKeys });
  };

  const handleClearAllPermissions = () => {
    if (!currentRole) return;
    setCurrentRole({ ...currentRole, permissions: [] });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole?.name) return;

    try {
      const roleId = currentRole.id || currentRole._id;
      const payload = {
        name: currentRole.name?.toUpperCase().replace(/\s+/g, '_') || 'CUSTOM_ROLE',
        displayName: currentRole.name || 'Custom Role',
        description: currentRole.description || '',
        permissions: currentRole.permissions || ['appointments:read'],
        isSystem: false,
      };

      if (roleId) {
        await apiClient.put(`/admin/roles/${roleId}`, payload);
      } else {
        await apiClient.post('/admin/roles', payload);
      }
      await fetchRoles();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving role:', err);
      alert(err.response?.data?.message || 'Failed to save role permission configuration.');
    }
  };

  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-sm shadow-sm">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">View-Only Access Mode:</span> Your logged-in user account has view-only permissions. Modifying system RBAC roles or permissions is restricted.
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Roles & Page-Wise Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Configure Granular Role-Based Access Control (RBAC) permission matrices per admin module.
          </p>
        </div>
        <button
          disabled={isReadOnly}
          onClick={handleOpenAddModal}
          title={isReadOnly ? 'Role creation is disabled in View-Only mode' : 'Create New Role'}
          className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors shadow-sm ${
            isReadOnly
              ? 'bg-slate-400 cursor-not-allowed opacity-60'
              : 'bg-susrutha-brand hover:bg-susrutha-brandHover'
          }`}
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
                  disabled={isReadOnly}
                  onClick={() => handleOpenEditModal(role)}
                  title={isReadOnly ? 'Role editing is disabled in View-Only mode' : 'Configure Permission Matrix'}
                  className={`w-full rounded-md border border-border py-1.5 text-xs font-semibold transition-colors ${
                    isReadOnly
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                      : 'hover:bg-muted'
                  }`}
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

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Module Permission Matrix
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="rounded bg-susrutha-brand/10 hover:bg-susrutha-brand hover:text-white border border-susrutha-brand/30 px-2 py-1 text-[11px] font-bold text-susrutha-brand transition-colors"
                    >
                      Select All Permissions
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllViewPermissions}
                      className="rounded bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700 transition-colors"
                    >
                      View Only
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllPermissions}
                      className="rounded bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-3.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60">
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
