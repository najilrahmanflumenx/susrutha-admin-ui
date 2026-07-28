'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/login') {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem('susrutha_token');
    if (!token) {
      setIsAuthenticated(false);
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
        <span className="text-sm font-semibold">Verifying Admin Authentication...</span>
      </div>
    );
  }

  return <>{children}</>;
};
