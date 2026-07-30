'use client';

import React, { useEffect } from 'react';
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
  X,
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
}

interface MenuSection {
  sectionTitle?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    sectionTitle: 'CORE SETUP (CREATE FIRST)',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Branches', href: '/branches', icon: Building2 },
      { name: 'Departments', href: '/departments', icon: Stethoscope },
      { name: 'Doctors', href: '/doctors', icon: UserCheck },
    ],
  },
  {
    sectionTitle: 'CLINICAL CONTENT',
    items: [
      { name: 'Conditions', href: '/conditions', icon: HeartPulse },
      { name: 'Treatments', href: '/treatments', icon: Syringe },
      { name: 'Packages', href: '/packages', icon: PackageCheck },
      { name: 'Infrastructure', href: '/infrastructure', icon: BedDouble },
    ],
  },
  {
    sectionTitle: 'PATIENT OPERATIONS',
    items: [
      { name: 'Appointments', href: '/appointments', icon: CalendarCheck },
      { name: 'Leads', href: '/leads', icon: MessageSquare },
    ],
  },
  {
    sectionTitle: 'MEDIA & CONTENT',
    items: [
      { name: 'Patient Reviews', href: '/testimonials', icon: Quote },
      { name: 'Blogs & Articles', href: '/blogs', icon: FileText },
      { name: 'FAQs & Help', href: '/faqs', icon: HelpCircle },
      { name: 'Campus Ecosystem', href: '/ecosystem', icon: Globe },
      { name: 'Media Gallery', href: '/gallery', icon: Image },
      { name: 'Press & Accreditations', href: '/media-coverage', icon: Newspaper },
    ],
  },
  {
    sectionTitle: 'SYSTEM & SECURITY',
    items: [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Roles', href: '/roles', icon: ShieldCheck },
      { name: 'Audit Logs', href: '/audit-logs', icon: History },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop — renders behind sidebar, closes on click */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border shadow-xl
          bg-white dark:bg-slate-900
          transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center border-b border-border px-4 justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-susrutha-brand text-white font-bold shadow-sm shrink-0">
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
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links Grouped */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {menuSections.map((section, idx) => (
            <div key={section.sectionTitle || idx} className="space-y-1">
              {section.sectionTitle && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {section.sectionTitle}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-red-50 text-susrutha-brand font-semibold dark:bg-red-950/40 dark:text-red-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    {/* Active indicator bar */}
                    <span className={`w-1 h-5 rounded-full shrink-0 transition-colors ${
                      isActive ? 'bg-susrutha-brand dark:bg-red-400' : 'bg-transparent'
                    }`} />
                    <Icon className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-susrutha-brand dark:text-red-400' : 'text-slate-400'
                    }`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-border p-3 shrink-0">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('susrutha_token');
                window.location.href = '/login';
              }
            }}
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
