'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Activity, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@susruthaayurveda.com');
  const [password, setPassword] = useState('SusruthaAdmin2026!');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/admin/auth/login', { email, password });
      if (response.data?.success && response.data.data?.token) {
        localStorage.setItem('susrutha_token', response.data.data.token);
        localStorage.setItem('susrutha_user', JSON.stringify(response.data.data.user));
        router.push('/');
      } else {
        setErrorMsg(response.data?.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-susrutha-brand text-white shadow-md">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif-heading">
            SUSRUTHA CMS
          </h1>
          <p className="text-xs text-muted-foreground">
            Enterprise Hospital Administration & Management Panel
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@susruthaayurveda.com"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-susrutha-brand py-2.5 font-bold text-white hover:bg-susrutha-brandHover transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Admin CMS</span>
            )}
          </button>
        </form>

        <div className="text-center text-[10px] text-muted-foreground border-t border-border pt-4">
          SUSRUTHA Ayurvedhik Hospital & Research Center • Secure Enterprise Access
        </div>
      </div>
    </div>
  );
}
