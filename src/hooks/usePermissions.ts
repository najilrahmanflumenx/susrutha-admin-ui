'use client';

import { useState, useEffect } from 'react';

export interface UserPermissionsState {
  isSuperAdmin: boolean;
  isReadOnly: boolean;
  userRoleName: string;
  permissions: string[];
  canWrite: (requiredPermission?: string) => boolean;
}

export function usePermissions(requiredModulePermission?: string): UserPermissionsState {
  const [state, setState] = useState<UserPermissionsState>({
    isSuperAdmin: false,
    isReadOnly: false,
    userRoleName: '',
    permissions: [],
    canWrite: () => true,
  });

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const savedUser = localStorage.getItem('susrutha_user');
      if (!savedUser) return;

      const parsed = JSON.parse(savedUser);
      const roleObj = parsed?.roleId;
      const roleName = typeof roleObj === 'object' ? roleObj?.name : parsed?.roleCode || parsed?.roleName || '';
      const displayName = typeof roleObj === 'object' ? roleObj?.displayName || roleObj?.name : roleName;
      const perms: string[] = Array.isArray(roleObj?.permissions)
        ? roleObj.permissions
        : Array.isArray(parsed?.permissions)
        ? parsed.permissions
        : [];

      const isSuperAdmin =
        roleName === 'SUPER_ADMIN' ||
        perms.includes('*') ||
        perms.includes('ALL_PERMISSIONS');

      const isReadOnly =
        !isSuperAdmin &&
        (perms.includes('view_only') ||
          (perms.length > 0 && perms.every((p) => p.endsWith(':read') || p === 'view_only')));

      const canWrite = (permKey?: string) => {
        if (isSuperAdmin) return true;
        if (isReadOnly) return false;
        if (!permKey && requiredModulePermission) permKey = requiredModulePermission;
        if (!permKey) return !isReadOnly;
        return perms.includes(permKey) || perms.includes('*') || perms.includes('ALL_PERMISSIONS');
      };

      setState({
        isSuperAdmin,
        isReadOnly,
        userRoleName: displayName || 'Staff Member',
        permissions: perms,
        canWrite,
      });
    } catch (e) {
      console.error('Error parsing user permissions:', e);
    }
  }, [requiredModulePermission]);

  return state;
}
