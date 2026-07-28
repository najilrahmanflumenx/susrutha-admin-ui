'use client';

import React, { useEffect, useState } from 'react';
import { History, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/audit-logs');
      if (res.data?.data) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            Audit & Security Activity Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable audit trail of all administrative actions, data edits, user logins, and system changes
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1.5 rounded-full font-semibold">
          <ShieldCheck className="h-4 w-4" />
          Audit Logging Active
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No activity logs recorded yet.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Module</th>
                <th className="px-6 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {logs.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {new Date(item.timestamp || item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-900 dark:text-white">
                    {item.userName || 'Super Admin'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">
                      {item.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{item.module}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{item.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
