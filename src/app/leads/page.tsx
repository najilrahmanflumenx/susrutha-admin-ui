'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import {
  Activity,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  Loader2,
  Download,
  PackageCheck,
  Stethoscope,
  MessageSquare,
  Star,
  Search,
  Filter,
} from 'lucide-react';

interface LeadItem {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message?: string;
  leadType?: 'PACKAGE_BOOKING' | 'SINGLE_TREATMENT' | 'GENERAL_INQUIRY' | 'FEEDBACK_RATING';
  packageId?: any;
  treatmentId?: any;
  doctorId?: any;
  branchId?: any;
  rating?: number;
  preferredDate?: string;
  preferredTimeSlot?: string;
  symptomsNote?: string;
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'CLOSED';
  notes?: string;
  createdAt: string;
}

export default function LeadsPage() {
  const { selectedBranchId } = useBranch();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedLeadType, setSelectedLeadType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
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
          limit: 20,
          branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
          leadType: selectedLeadType !== 'ALL' ? selectedLeadType : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          q: searchQuery || undefined,
        },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => {
          const subj = (item.subject || '').toLowerCase();
          const msg = (item.message || '').toLowerCase();

          const isPkg =
            item.leadType === 'PACKAGE_BOOKING' ||
            Boolean(item.packageId) ||
            subj.includes('package') ||
            msg.includes('package');

          const isSingle =
            item.leadType === 'SINGLE_TREATMENT' ||
            Boolean(item.treatmentId) ||
            subj.includes('treatment') ||
            subj.includes('therapy') ||
            msg.includes('treatment') ||
            msg.includes('therapy');

          const isRating =
            item.leadType === 'FEEDBACK_RATING' ||
            Boolean(item.rating) ||
            subj.includes('rating') ||
            subj.includes('feedback');

          const derivedType = isPkg
            ? 'PACKAGE_BOOKING'
            : isSingle
            ? 'SINGLE_TREATMENT'
            : isRating
            ? 'FEEDBACK_RATING'
            : (item.leadType || 'GENERAL_INQUIRY');

          return {
            ...item,
            id: item._id,
            name: item.name || 'Inquirer',
            phone: item.phone || '',
            email: item.email || '',
            leadType: derivedType,
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent',
            status: item.status || 'NEW',
          };
        });
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
  }, [page, selectedBranchId, selectedLeadType, selectedStatus]);

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Patient_Leads',
      [
        { header: 'ID', accessor: (l) => l.id || l._id || '' },
        { header: 'Type', accessor: (l) => l.leadType || 'INQUIRY' },
        { header: 'Name', accessor: (l) => l.name },
        { header: 'Phone', accessor: (l) => l.phone },
        { header: 'Email', accessor: (l) => l.email || '' },
        { header: 'Subject / Package', accessor: (l) => l.packageId?.title || l.treatmentId?.title || l.subject || '' },
        { header: 'Message / Symptoms', accessor: (l) => l.message || l.symptomsNote || '' },
        { header: 'Status', accessor: (l) => l.status },
        { header: 'Submitted At', accessor: (l) => l.createdAt },
      ],
      leads
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
      await apiClient.put(`/admin/leads/${currentLead.id || currentLead._id}`, {
        status: currentLead.status,
        notes: currentLead.notes,
      });
      await fetchLeads();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating lead status:', err);
      alert('Failed to update lead status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Patient Inquiries & Leads</h1>
          <p className="text-sm text-muted-foreground">
            Multi-format customer leads categorized by Care Package Bookings, Therapies, Inquiries, and Feedback.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Category Tab Filters */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {[
            { label: 'All Customer Leads', value: 'ALL' },
            { label: 'Package Bookings', value: 'PACKAGE_BOOKING', icon: PackageCheck, color: 'text-purple-600' },
            { label: 'Single Treatments', value: 'SINGLE_TREATMENT', icon: Stethoscope, color: 'text-blue-600' },
            { label: 'General Inquiries', value: 'GENERAL_INQUIRY', icon: MessageSquare, color: 'text-emerald-600' },
            { label: 'Ratings & Reviews', value: 'FEEDBACK_RATING', icon: Star, color: 'text-amber-500' },
          ].map((tab) => {
            const isActive = selectedLeadType === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedLeadType(tab.value);
                  setPage(1);
                }}
                className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-susrutha-brand text-susrutha-brand dark:text-red-400'
                    : 'border-transparent text-muted-foreground hover:border-slate-300 hover:text-foreground'
                }`}
              >
                {Icon && <Icon className={`h-4 w-4 ${tab.color}`} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
              placeholder="Search name, phone, subject..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-susrutha-brand"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New Lead</option>
            <option value="CONTACTED">Contacted</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-semibold">
          Total Leads Found: <span className="text-foreground font-bold">{totalCount}</span>
        </div>
      </div>

      {/* Main Leads Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Fetching structured patient leads...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No patient lead found matching the selected filter criteria.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Lead Format & Type</th>
                  <th className="px-6 py-3.5">Customer Contact</th>
                  <th className="px-6 py-3.5">Requested Package / Inquiry Details</th>
                  <th className="px-6 py-3.5">Branch / Doctor</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => {
                  const isPkg = lead.leadType === 'PACKAGE_BOOKING';
                  const isSingle = lead.leadType === 'SINGLE_TREATMENT';
                  const isRating = lead.leadType === 'FEEDBACK_RATING';

                  return (
                    <tr key={lead.id || lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Format Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPkg ? (
                          <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            <PackageCheck className="h-3.5 w-3.5 mr-1 text-purple-600" /> Care Package
                          </span>
                        ) : isSingle ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <Stethoscope className="h-3.5 w-3.5 mr-1 text-blue-600" /> Single Therapy
                          </span>
                        ) : isRating ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <Star className="h-3.5 w-3.5 mr-1 fill-amber-400 text-amber-500" /> Rating ({lead.rating || 5}★)
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <MessageSquare className="h-3.5 w-3.5 mr-1 text-slate-500" /> General Inquiry
                          </span>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-1">{lead.createdAt}</div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{lead.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" /> {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-400" /> {lead.email}
                          </div>
                        )}
                      </td>

                      {/* Package / Details */}
                      <td className="px-6 py-4">
                        {isPkg && lead.packageId ? (
                          <div className="space-y-1">
                            <div className="font-bold text-purple-900 dark:text-purple-200 text-sm">
                              {lead.packageId.title}
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300">
                              {lead.packageId.durationDays || 7} Days • ₹{lead.packageId.price || 15000}
                            </div>
                          </div>
                        ) : isSingle && lead.treatmentId ? (
                          <div className="space-y-1">
                            <div className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                              {lead.treatmentId.title || lead.treatmentId.name}
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              ₹{lead.treatmentId.price || 3500}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-foreground text-xs">{lead.subject || 'General Inquiry'}</div>
                            <div className="text-xs text-muted-foreground max-w-xs line-clamp-2 mt-0.5">
                              {lead.message || lead.symptomsNote || 'No additional message.'}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Branch & Doctor */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-foreground">
                          {lead.branchId?.name || (lead.branchId?.code ? `Branch: ${lead.branchId.code}` : 'General Branch')}
                        </div>
                        {lead.doctorId?.name && (
                          <div className="text-muted-foreground mt-0.5">
                            Doctor: <span className="font-semibold text-foreground">{lead.doctorId.name}</span>
                          </div>
                        )}
                        {lead.preferredDate && (
                          <div className="text-muted-foreground text-[11px] mt-0.5">
                            Date: {new Date(lead.preferredDate).toLocaleDateString()} {lead.preferredTimeSlot ? `(${lead.preferredTimeSlot})` : ''}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {lead.status === 'NEW' ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <Activity className="h-3 w-3 mr-1" /> New Lead
                          </span>
                        ) : lead.status === 'CONTACTED' ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <Phone className="h-3 w-3 mr-1" /> Contacted
                          </span>
                        ) : lead.status === 'SCHEDULED' ? (
                          <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            <Clock className="h-3 w-3 mr-1" /> Scheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Closed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenProcessModal(lead)}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
                        >
                          Process Lead
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3.5 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground">
            <div>
              Showing {totalCount > 0 ? (page - 1) * 20 + 1 : 0} to{' '}
              {Math.min(page * 20, totalCount)} of {totalCount} leads
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

      {/* Lead Process Modal */}
      {isModalOpen && currentLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Process Patient Lead
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeadStatus} className="space-y-4 text-sm">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{currentLead.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span>📞 {currentLead.phone}</span>
                  {currentLead.email && <span>✉️ {currentLead.email}</span>}
                </div>
                {currentLead.packageId && (
                  <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 p-2 rounded">
                    Package: {currentLead.packageId.title} ({currentLead.packageId.durationDays || 7} Days • ₹{currentLead.packageId.price})
                  </div>
                )}
                {currentLead.treatmentId && (
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 p-2 rounded">
                    Treatment: {currentLead.treatmentId.title || currentLead.treatmentId.name} (₹{currentLead.treatmentId.price})
                  </div>
                )}
                {currentLead.message && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{currentLead.message}</p>
                )}
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
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted Patient</option>
                  <option value="SCHEDULED">Appointment Scheduled</option>
                  <option value="CLOSED">Closed Lead</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Internal Staff Notes
                </label>
                <textarea
                  rows={2}
                  value={currentLead.notes || ''}
                  onChange={(e) => setCurrentLead({ ...currentLead, notes: e.target.value })}
                  placeholder="Record staff phone conversation notes..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
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
