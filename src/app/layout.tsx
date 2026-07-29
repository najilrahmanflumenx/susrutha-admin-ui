'use client';

import React, { useState } from 'react';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { BranchProvider } from '@/context/BranchContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BranchProvider>
            <AuthGuard>
              {isLoginPage ? (
                <main className="min-h-screen bg-background">{children}</main>
              ) : (
                <div className="min-h-screen bg-background flex flex-col md:flex-row">
                  <Sidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                  />
                  <div className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
                    <Header onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
                    <main className="flex-1 p-4 sm:p-6">{children}</main>
                  </div>
                </div>
              )}
            </AuthGuard>
          </BranchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
