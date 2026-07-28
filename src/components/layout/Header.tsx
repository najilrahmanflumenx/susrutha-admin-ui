'use client';

import React from 'react';
import { useBranch } from '@/context/BranchContext';
import { Building2, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';

export const Header = () => {
  const { selectedBranchId, setSelectedBranchId } = useBranch();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-6">
      {/* Left: Branch Selector */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center rounded-md bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Branch</span>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          >
            <option value="ALL">All Branches (Global View)</option>
            <option value="KTK">Kattakada Inpatient Hospital & Research Center</option>
            <option value="KWR">Kowdiar City OP Clinic</option>
          </select>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
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

        <div className="flex items-center space-x-3 border-l border-border pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-susrutha-brand text-white font-semibold text-sm shadow-sm">
            SA
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">Admin User</span>
            <span className="text-xs text-muted-foreground">Super Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
};
