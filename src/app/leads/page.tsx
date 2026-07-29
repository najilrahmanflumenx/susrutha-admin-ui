'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { Activity, Phone, Mail, Clock, CheckCircle2, AlertCircle, X, Edit, Loader2, Download } from 'lucide-react';

interface LeadItem {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email: string;
  healthConcern: string;
  preferredBranch: 'KTK' | 'KWR';
  createdAt: string;
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'CONVERTED';
}

export default function LeadsPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Partial<LeadItem> | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/leads', {
        params: {
          page,
          limit: 10,
          branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          name: item.name || 'Inquirer',
          phone: item.phone || '',
          email: item.email || '',
          healthConcern: item.message || item.healthConcern || 'Ayurvedic consultation inquiry',
          preferredBranch: item.preferredBranch || item.branchId?.code || 'KTK',
          createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent',
          status: item.status || 'NEW',
        }));
        setLeads(mapped);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotalCount(response.data.meta.total || mapped.length);
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedBranchId]);

  const filteredLeads = leads;

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Patient_Leads',
      [
        { header: 'ID', accessor: (l) => l.id || l._id || '' },
        { header: 'Name', accessor: (l) => l.name },
        { header: 'Phone', accessor: (l) => l.phone },
        { header: 'Email', accessor: (l) => l.email },
        { header: 'Branch Code', accessor: (l) => l.preferredBranch },
        { header: 'Health Concern / Message', accessor: (l) => l.healthConcern },
        { header: 'Status', accessor: (l) => l.status },
        { header: 'Submitted At', accessor: (l) => l.createdAt },
      ],
      filteredLeads
    );
  };

  const handleOpenProcessModal = (lead: LeadItem) => {
    setCurrentLead({ ...lead });
    setIsModalOpen(true);
  };

  const handleSaveLeadStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead?.id && !currentLead?._id) return;

    try {
      setLeads((prev) =>
        prev.map((item) => (item.id === currentLead.id ? ({ ...item, ...currentLead } as LeadItem) : item))
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Patient Inquiries & Website Leads</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing patient leads across all hospital branches.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 self-start sm:self-auto rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading patient inquiry leads from MongoDB database...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No patient inquiry lead found in database for selected branch filter ({selectedBranchId}).
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Patient Contact</th>
                  <th className="px-6 py-3.5">Health Concern Inquiry</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id || lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone} • {lead.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                      {lead.healthConcern}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {lead.preferredBranch === 'KTK' ? 'Kattakada Inpatient' : 'Kowdiar City OP'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{lead.createdAt}</td>
                    <td className="px-6 py-4">
                      {lead.status === 'NEW' ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          <Activity className="h-3 w-3 mr-1" /> New Enquiry
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenProcessModal(lead)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        Process Lead
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground">
            <div>
              Showing {totalCount > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
              {Math.min(page * 10, totalCount)} of {totalCount} leads
            </div>
            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-border bg-background px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Prev
              </button>
              <span className="px-2 font-semibold">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border bg-background px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Fixed Contrast & Solid Background */}
      {isModalOpen && currentLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Process Patient Inquiry Lead
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeadStatus} className="space-y-4 text-sm">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100">{currentLead.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{currentLead.phone} • {currentLead.email}</div>
                <p className="text-xs text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">{currentLead.healthConcern}</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Update Follow-Up Status
                </label>
                <select
                  value={currentLead.status || 'NEW'}
                  onChange={(e) => setCurrentLead({ ...currentLead, status: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                >
                  <option value="NEW">New Enquiry</option>
                  <option value="CONTACTED">Contacted Patient</option>
                  <option value="SCHEDULED">Appointment Scheduled</option>
                  <option value="CONVERTED">Converted Patient</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-susrutha-brand px-4 py-2 text-xs font-semibold text-white hover:bg-susrutha-brandHover shadow-sm"
                >
                  Update Lead Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
