'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Stethoscope,
  CalendarCheck,
  PackageCheck,
  BedDouble,
  FileText,
  MessageSquare,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Activity,
  HeartPulse,
  Syringe,
  Globe,
  Video,
  Image,
  Newspaper,
  Award,
  FolderOpen,
  History,
  Quote,
  HelpCircle,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Hospital Branches', href: '/branches', icon: Building2 },
  { name: 'Doctors & Directors', href: '/doctors', icon: UserCheck },
  { name: 'Specialty Departments', href: '/departments', icon: Stethoscope },
  { name: 'Health Conditions', href: '/conditions', icon: HeartPulse },
  { name: 'Treatments & Therapies', href: '/treatments', icon: Syringe },
  { name: 'Care Packages', href: '/packages', icon: PackageCheck },
  { name: 'Appointments', href: '/appointments', icon: CalendarCheck },
  { name: 'Infrastructure', href: '/infrastructure', icon: BedDouble },
  { name: 'Patient Testimonials', href: '/testimonials', icon: Quote },
  { name: 'FAQs & Help Center', href: '/faqs', icon: HelpCircle },
  { name: 'Ecosystem & Research', href: '/ecosystem', icon: Globe },
  { name: 'Video Gallery', href: '/videos', icon: Video },
  { name: 'Photo Gallery', href: '/gallery', icon: Image },
  { name: 'Press & Media Coverage', href: '/media-coverage', icon: Newspaper },
  { name: 'Affiliations & Badges', href: '/affiliations', icon: Award },
  { name: 'Blogs & Articles', href: '/blogs', icon: FileText },
  { name: 'Patient Leads', href: '/leads', icon: MessageSquare },
  { name: 'Media Asset Library', href: '/media-library', icon: FolderOpen },
  { name: 'Audit & Security Logs', href: '/audit-logs', icon: History },
  { name: 'Staff User Accounts', href: '/users', icon: Users },
  { name: 'Roles & Permissions', href: '/roles', icon: ShieldCheck },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card shadow-lg md:shadow-sm transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Clean Brand Header */}
        <div className="flex h-16 items-center border-b border-border px-6 space-x-3 justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-susrutha-brand text-white font-bold shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground">
                SUSRUTHA
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                Hospital Admin CMS
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-50 text-susrutha-brand font-semibold border-l-4 border-susrutha-brand dark:bg-red-950/40 dark:text-red-300 dark:border-red-500'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-susrutha-brand dark:text-red-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-border p-3">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('susrutha_token');
                window.location.href = '/login';
              }
            }}
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
