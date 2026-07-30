'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { Building2, Sun, Moon, Bell, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { apiClient } from '@/lib/api-client';

interface BranchOption {
  id: string;
  name: string;
  code?: string;
}

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { selectedBranchId, setSelectedBranchId } = useBranch();
  const { theme, setTheme } = useTheme();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [userName, setUserName] = useState('Admin User');
  const [userRoleDisplay, setUserRoleDisplay] = useState('Super Administrator');
  const [userInitials, setUserInitials] = useState('SA');

  // Read logged-in user info from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('susrutha_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const name: string = parsed?.name || parsed?.username || parsed?.email || 'Admin User';
        // Support both 'roleId' (new) and 'role' (legacy) keys in stored session
        const roleObj = parsed?.roleId || parsed?.role;
        const roleName: string =
          (typeof roleObj === 'object' ? roleObj?.displayName || roleObj?.name : null) ||
          parsed?.roleName ||
          'Staff Member';

        setUserName(name);
        // Make raw role codes human-readable
        setUserRoleDisplay(
          roleName === 'SUPER_ADMIN'
            ? 'Super Administrator'
            : roleName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        );

        // Generate avatar initials
        const parts = name.trim().split(' ').filter(Boolean);
        const initials =
          parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : name.slice(0, 2).toUpperCase();
        setUserInitials(initials);
      }
    } catch {
      // keep defaults on parse failure
    }
  }, []);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await apiClient.get('/branches', { params: { page: 1, limit: 100 } });
        const data: any[] = res.data?.data || res.data || [];
        setBranches(
          data.map((b: any) => ({
            id: b._id || b.id || b.code,
            name: b.name,
            code: b.code,
          }))
        );
      } catch {
        setBranches([]);
      }
    }
    loadBranches();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      {/* Left: Mobile Menu Toggle & Branch Selector */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted md:hidden transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center justify-center rounded-md bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Branch</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="max-w-[140px] xs:max-w-[180px] sm:max-w-none rounded-md border border-border bg-background px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-susrutha-brand truncate"
            >
              <option value="ALL">All Branches (Global)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.code || b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors">
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-susrutha-brand" />
        </button>

        {/* Dynamic User Info */}
        <div className="flex items-center space-x-2 sm:space-x-3 border-l border-border pl-2 sm:pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-susrutha-brand text-white font-semibold text-sm shadow-sm select-none">
            {userInitials}
          </div>
          <div className="hidden lg:flex flex-col max-w-[140px]">
            <span className="text-sm font-semibold leading-tight text-foreground truncate" title={userName}>
              {userName}
            </span>
            <span className="text-xs text-muted-foreground truncate" title={userRoleDisplay}>
              {userRoleDisplay}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
