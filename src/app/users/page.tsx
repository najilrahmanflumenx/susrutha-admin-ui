'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { User, Plus, Edit, Trash2, Shield, Building2, CheckCircle2, X, Loader2, Download } from 'lucide-react';

interface UserAccount {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  roleId?: string;
  roleName: string;
  roleCode: string;
  branchScope: 'GLOBAL' | 'KTK' | 'KWR';
  status: 'ACTIVE' | 'INACTIVE';
}

export default function UsersPage() {
  const { selectedBranchId } = useBranch();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<UserAccount> | null>(null);

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

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/users');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          name: item.name,
          email: item.email,
          roleId: item.roleId?._id || item.roleId,
          roleName: item.roleId?.displayName || item.roleId?.name || item.roleName || 'Staff Member',
          roleCode: item.roleId?.name || item.roleCode || 'STAFF',
          branchScope: item.branchScope || 'GLOBAL',
          status: item.status || 'ACTIVE',
        }));
        setUsers(mapped);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await apiClient.get('/admin/roles');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAvailableRoles(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching available roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Dynamic Branch Scope Filtering
  const filteredUsers = users.filter((u) => {
    if (selectedBranchId === 'ALL') return true;
    return u.branchScope === 'GLOBAL' || u.branchScope === selectedBranchId;
  });

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Staff_Users',
      [
        { header: 'ID', accessor: (u) => u.id || u._id || '' },
        { header: 'Full Name', accessor: (u) => u.name },
        { header: 'Email Address', accessor: (u) => u.email },
        { header: 'Role Name', accessor: (u) => u.roleName },
        { header: 'Role Code', accessor: (u) => u.roleCode },
        { header: 'Branch Scope', accessor: (u) => u.branchScope },
        { header: 'Account Status', accessor: (u) => u.status },
      ],
      filteredUsers
    );
  };

  const handleOpenAddModal = () => {
    const firstRole = availableRoles[0];
    setCurrentUser({
      name: '',
      email: '',
      password: '',
      roleId: firstRole?._id || '',
      roleName: firstRole?.displayName || firstRole?.name || 'Super Administrator',
      roleCode: firstRole?.name || 'SUPER_ADMIN',
      branchScope: selectedBranchId === 'KWR' ? 'KWR' : selectedBranchId === 'KTK' ? 'KTK' : 'GLOBAL',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (usr: UserAccount) => {
    setCurrentUser({ ...usr, password: '' });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (usr: UserAccount) => {
    const targetId = usr.id || usr._id;
    if (!targetId) return;

    if (!window.confirm(`Are you sure you want to delete user account "${usr.name}"?`)) return;

    try {
      await apiClient.delete(`/admin/users/${targetId}`);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user account.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.name || !currentUser?.email) return;

    const targetId = currentUser.id || currentUser._id;

    try {
      const payload: any = {
        name: currentUser.name,
        email: currentUser.email,
        roleId: currentUser.roleId,
        roleName: currentUser.roleName || 'Staff Member',
        roleCode: currentUser.roleCode || 'STAFF',
        branchScope: currentUser.branchScope || 'GLOBAL',
        status: currentUser.status || 'ACTIVE',
      };

      if (currentUser.password) {
        payload.password = currentUser.password;
      }

      if (targetId) {
        await apiClient.put(`/admin/users/${targetId}`, payload);
      } else {
        if (!currentUser.password) {
          alert('Please enter a password for the new user account.');
          return;
        }
        await apiClient.post('/admin/users', payload);
      }

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving user:', err);
      alert(err.response?.data?.message || 'Failed to save user account.');
    }
  };

  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-sm shadow-sm">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">View-Only Access Mode:</span> Your logged-in user account has view-only permissions. Modifying staff accounts, creating users, or changing roles is restricted.
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & Admin User Accounts</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing all hospital staff user accounts.'
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
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading staff user accounts from MongoDB database...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No user account found in database. Click &quot;Create New User&quot; to add one.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">User Name & Email</th>
                  <th className="px-6 py-3.5">Assigned Role</th>
                  <th className="px-6 py-3.5">Branch Scope</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground">
                      <span className="inline-flex items-center space-x-1">
                        <Shield className="h-3.5 w-3.5 text-susrutha-brand" />
                        <span>{user.roleName}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center space-x-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {user.branchScope === 'GLOBAL'
                            ? 'All Branches (Global View)'
                            : user.branchScope === 'KTK'
                            ? 'Kattakada Inpatient Hospital'
                            : 'Kowdiar City OP Clinic'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          Edit Scope
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="Delete user account"
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
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

      {/* Create / Edit User Modal - Bulletproof High Contrast Background */}
      {isModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentUser.id ? 'Edit User Account' : 'Create New User Account'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={currentUser.name || ''}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                  placeholder="e.g. Dr. Vijay Kumar"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={currentUser.email || ''}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                  placeholder="doctor@susruthaayurveda.com"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {currentUser.id || currentUser._id ? 'New Password (Optional)' : 'Account Login Password *'}
                </label>
                <input
                  type="password"
                  required={!(currentUser.id || currentUser._id)}
                  value={currentUser.password || ''}
                  onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                  placeholder={currentUser.id || currentUser._id ? '•••••••• (leave blank to keep unchanged)' : 'Enter account password'}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assigned Role
                </label>
                <select
                  value={currentUser.roleId || (availableRoles.find((r) => r.name === currentUser.roleCode)?._id || '')}
                  onChange={(e) => {
                    const roleId = e.target.value;
                    const selectedRole = availableRoles.find((r) => r._id === roleId);
                    setCurrentUser({
                      ...currentUser,
                      roleId: roleId,
                      roleCode: selectedRole?.name || currentUser.roleCode || 'STAFF',
                      roleName: selectedRole?.displayName || selectedRole?.name || currentUser.roleName || 'Staff Member',
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                >
                  {availableRoles.length > 0 ? (
                    availableRoles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.displayName || role.name} ({role.name})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="SUPER_ADMIN">Super Administrator</option>
                      <option value="DOCTOR_MANAGER">Doctor & Clinical Manager</option>
                      <option value="RECEPTION">Outpatient Receptionist</option>
                      <option value="WARD_MANAGER">Ward Manager</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Branch Scope
                </label>
                <select
                  value={currentUser.branchScope || 'GLOBAL'}
                  onChange={(e) => setCurrentUser({ ...currentUser, branchScope: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                >
                  <option value="GLOBAL">All Branches (Global View)</option>
                  <option value="KTK">Kattakada Inpatient Hospital</option>
                  <option value="KWR">Kowdiar City OP Clinic</option>
                </select>
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
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
