'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { Calendar, Plus, Clock, CheckCircle2, AlertCircle, Search, Edit, X, Loader2, Download } from 'lucide-react';

interface AppointmentItem {
  _id?: string;
  id?: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  branchCode: 'KTK' | 'KWR';
  date: string;
  timeSlot: string;
  consultationType: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
}

export default function AppointmentsPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentApt, setCurrentApt] = useState<Partial<AppointmentItem> | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/appointments', {
        params: {
          page,
          limit: 10,
          q: searchTerm,
          branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          patientName: item.patientName || item.patient?.name || 'Patient',
          patientPhone: item.patientPhone || item.patient?.phone || '',
          doctorName: item.doctorName || item.doctorId?.name || 'Assigned Consultant',
          branchCode: item.branchCode || item.branchId?.code || 'KTK',
          date: item.date || item.preferredDate?.split('T')[0] || '2026-07-28',
          timeSlot: item.timeSlot || item.preferredTimeSlot || '10:00 AM',
          consultationType: item.consultationType || 'General Consultation',
          status: item.status || 'CONFIRMED',
        }));
        setAppointments(mapped);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotalCount(response.data.meta.total || mapped.length);
        }
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, selectedBranchId]);

  const filteredApts = appointments.filter((apt) => {
    const matchesBranch = isBranchMatching(apt.branchCode || 'KTK');
    const matchesSearch =
      (apt.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Appointments',
      [
        { header: 'ID', accessor: (a) => a.id || a._id || '' },
        { header: 'Patient Name', accessor: (a) => a.patientName },
        { header: 'Patient Phone', accessor: (a) => a.patientPhone },
        { header: 'Doctor', accessor: (a) => a.doctorName },
        { header: 'Branch', accessor: (a) => a.branchCode },
        { header: 'Date', accessor: (a) => a.date },
        { header: 'Time Slot', accessor: (a) => a.timeSlot },
        { header: 'Consultation Type', accessor: (a) => a.consultationType },
        { header: 'Status', accessor: (a) => a.status },
      ],
      filteredApts
    );
  };

  const handleOpenAddModal = () => {
    setCurrentApt({
      patientName: '',
      patientPhone: '+91 ',
      doctorName: 'Dr. S. Susrutha Varma',
      branchCode: selectedBranchId === 'KWR' ? 'KWR' : 'KTK',
      date: '2026-07-28',
      timeSlot: '10:00 AM',
      consultationType: 'General Consultation',
      status: 'CONFIRMED',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (apt: AppointmentItem) => {
    setCurrentApt({ ...apt });
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApt?.patientName) return;

    try {
      await apiClient.post('/appointments', {
        patientName: currentApt.patientName,
        patientPhone: currentApt.patientPhone || '',
        doctorName: currentApt.doctorName || 'Consultant',
        branchCode: currentApt.branchCode || 'KTK',
        date: currentApt.date || '2026-07-28',
        timeSlot: currentApt.timeSlot || '10:00 AM',
        consultationType: currentApt.consultationType || 'General Consultation',
        status: currentApt.status || 'CONFIRMED',
      });
      await fetchAppointments();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving appointment:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Appointments & Consultation Bookings</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing all patient appointments.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by patient name or doctor..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading live appointment bookings...</span>
        </div>
      ) : filteredApts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No appointment found in database for selected branch filter ({selectedBranchId}). Click &quot;New Appointment&quot; to book one.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Doctor Assigned</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApts.map((apt) => (
                  <tr key={apt.id || apt._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{apt.patientName}</div>
                      <div className="text-xs text-muted-foreground">{apt.patientPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground">
                      <div>{apt.doctorName}</div>
                      <div className="text-[10px] text-susrutha-brand font-semibold">{apt.consultationType}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {apt.branchCode === 'KTK' ? 'Kattakada Inpatient' : 'Kowdiar City OP'}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-foreground">{apt.date}</div>
                      <div className="text-muted-foreground">{apt.timeSlot}</div>
                    </td>
                    <td className="px-6 py-4">
                      {apt.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <Clock className="h-3 w-3 mr-1" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(apt)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - Fixed Contrast & Solid Background */}
      {isModalOpen && currentApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentApt.id ? 'Manage Appointment' : 'Book New Appointment'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={currentApt.patientName || ''}
                  onChange={(e) => setCurrentApt({ ...currentApt, patientName: e.target.value })}
                  placeholder="e.g. Anand M."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Patient Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={currentApt.patientPhone || ''}
                    onChange={(e) => setCurrentApt({ ...currentApt, patientPhone: e.target.value })}
                    placeholder="+91 98470 12345"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hospital Branch
                  </label>
                  <select
                    value={currentApt.branchCode || 'KTK'}
                    onChange={(e) => setCurrentApt({ ...currentApt, branchCode: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="KTK">Kattakada Inpatient</option>
                    <option value="KWR">Kowdiar City OP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Doctor Assigned
                </label>
                <input
                  type="text"
                  required
                  value={currentApt.doctorName || ''}
                  onChange={(e) => setCurrentApt({ ...currentApt, doctorName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={currentApt.date || '2026-07-28'}
                    onChange={(e) => setCurrentApt({ ...currentApt, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={currentApt.status || 'CONFIRMED'}
                    onChange={(e) => setCurrentApt({ ...currentApt, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
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
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
