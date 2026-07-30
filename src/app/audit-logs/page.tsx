'use client';

import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, X, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface AuditLogItem {
  _id: string;
  userName?: string;
  userEmail?: string;
  action: string;
  module: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  timestamp?: string;
  createdAt?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Backend Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // Modal Payload Inspector
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };

      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedModule !== 'ALL') params.module = selectedModule;
      if (selectedAction !== 'ALL') params.action = selectedAction;

      const res = await apiClient.get('/audit-logs', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
        if (res.data.meta) {
          setMeta({
            total: res.data.meta.total || 0,
            page: res.data.meta.page || 1,
            limit: res.data.meta.limit || limit,
            totalPages: res.data.meta.totalPages || 1,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, selectedModule, selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedModule('ALL');
    setSelectedAction('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-susrutha-brand" />
            Audit & Security Activity Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable audit trail recording who modified data, administrative user activities, and security changes.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 rounded-full font-bold shadow-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Backend Audit Logging Active
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, action, or payload..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
            />
          </div>

          {/* Module Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
            >
              <option value="ALL">All Modules</option>
              <option value="USERS">USERS (Staff Accounts)</option>
              <option value="RBAC">RBAC (Roles & Permissions)</option>
              <option value="BRANCHES">BRANCHES (Hospital Locations)</option>
              <option value="DOCTORS">DOCTORS (Medical Staff)</option>
              <option value="APPOINTMENTS">APPOINTMENTS (Bookings)</option>
              <option value="SETTINGS">SETTINGS (Global Config)</option>
              <option value="SYSTEM">SYSTEM (Engine Bootstraps)</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
            >
              <option value="ALL">All Action Types</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_UPDATED">USER_UPDATED</option>
              <option value="USER_DELETED">USER_DELETED</option>
              <option value="ROLE_CREATED">ROLE_CREATED</option>
              <option value="ROLE_UPDATED">ROLE_UPDATED</option>
              <option value="ROLE_DELETED">ROLE_DELETED</option>
              <option value="SYSTEM_BOOTSTRAP">SYSTEM_BOOTSTRAP</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters"
              className="rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Main Table View */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-susrutha-brand border-t-transparent"></div>
            <div>Loading audit activity records from database...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No activity log record found matching current filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Performed By</th>
                  <th className="px-6 py-3.5">Module & Action</th>
                  <th className="px-6 py-3.5">Who / What Changed (Details)</th>
                  <th className="px-6 py-3.5">Client IP</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((item) => {
                  const summaryText =
                    item.details?.summary ||
                    (item.details?.name ? `Target entity: ${item.details.name}` : null) ||
                    (item.entityId ? `Target ID: ${item.entityId}` : 'Administrative action logged');

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Timestamp */}
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {new Date(item.timestamp || item.createdAt || Date.now()).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Performed By User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-foreground">
                              {item.userName || item.userEmail || 'Super Admin'}
                            </div>
                            {item.userEmail && <div className="text-[11px] text-muted-foreground">{item.userEmail}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Module & Action Badges */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                            {item.module}
                          </span>
                          <span className="inline-flex items-center rounded bg-susrutha-brand/10 border border-susrutha-brand/20 px-2 py-0.5 text-[10px] font-mono font-bold text-susrutha-brand">
                            {item.action}
                          </span>
                        </div>
                      </td>

                      {/* Human Readable Details */}
                      <td className="px-6 py-4 text-xs text-foreground max-w-xs leading-relaxed">
                        <p className="font-medium truncate" title={summaryText}>
                          {summaryText}
                        </p>
                      </td>

                      {/* IP Address */}
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <span className="inline-flex items-center rounded bg-slate-50 border border-border px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.ipAddress || '127.0.0.1'}
                        </span>
                      </td>

                      {/* View Payload Modal Button */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLogForDetails(item)}
                          className="inline-flex items-center space-x-1 rounded border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-colors text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5 text-susrutha-brand" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Full Backend Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border px-6 py-3 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{logs.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}</strong> to{' '}
              <strong className="text-foreground">{Math.min(meta.page * meta.limit, meta.total)}</strong> of{' '}
              <strong className="text-foreground">{meta.total}</strong> total audit records
            </span>
            <div className="flex items-center space-x-1">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground mr-2 font-medium">
              Page <strong className="text-foreground">{meta.page}</strong> of <strong className="text-foreground">{meta.totalPages}</strong>
            </span>
            <button
              disabled={meta.page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="flex items-center space-x-1 rounded-lg border border-border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            <button
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
              className="flex items-center space-x-1 rounded-lg border border-border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Audit Activity Inspection
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {selectedLogForDetails._id} | {selectedLogForDetails.action}
                </p>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 space-y-1 text-xs">
                <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Action Summary:</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedLogForDetails.details?.summary || selectedLogForDetails.action}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">User Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLogForDetails.userName || 'Super Admin'}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">User Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLogForDetails.userEmail || 'admin@susruthaayurveda.com'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Raw Audit Details Payload:</span>
                <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(selectedLogForDetails.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="rounded-lg bg-susrutha-brand px-4 py-2 text-xs font-semibold text-white hover:bg-susrutha-brandHover shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
