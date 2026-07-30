'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  Calendar,
  Building,
  Activity,
  BedDouble,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Loader2,
} from 'lucide-react';

interface DashboardMetrics {
  activeDoctors: number;
  todayAppointments: number;
  inpatientBedsOccupied: number;
  inpatientTotalBeds: number;
  pendingLeads: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedBranchId } = useBranch();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeDoctors: 0,
    todayAppointments: 0,
    inpatientBedsOccupied: 0,
    inpatientTotalBeds: 0,
    pendingLeads: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refetch dashboard metrics and recent appointments whenever selectedBranchId changes
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsRes, apptRes] = await Promise.all([
        apiClient.get(`/dashboard?branchCode=${selectedBranchId}`),
        apiClient.get(`/appointments?branchCode=${selectedBranchId}`),
      ]);

      if (metricsRes.data?.success && metricsRes.data.data) {
        setMetrics(metricsRes.data.data);
      }

      if (apptRes.data?.success && Array.isArray(apptRes.data.data)) {
        setRecentAppointments(apptRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              SUSRUTHA Hospital Overview
            </h1>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-susrutha-brand" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Combined metrics across Kattakada Inpatient Hospital & Kowdiar City OP Clinic'
              : selectedBranchId === 'KTK'
              ? 'Kattakada 40-Bed Inpatient Panchakarma Hospital & Research Institute'
              : 'Kowdiar City Outpatient Clinic & Consultation Center'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => router.push('/appointments')}
            className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Doctors</span>
            <div className="rounded-md bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.activeDoctors} Physicians</div>
          <span className="text-xs text-muted-foreground">
            {selectedBranchId === 'ALL' ? 'Across all branches' : `Assigned to ${selectedBranchId}`}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appointments Today</span>
            <div className="rounded-md bg-blue-50 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.todayAppointments} Bookings</div>
          <span className="text-xs text-emerald-600 font-semibold flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-1" /> Live OP schedule
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inpatient Bed Capacity</span>
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <BedDouble className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {metrics.inpatientBedsOccupied} / {metrics.inpatientTotalBeds} Beds
          </div>
          <span className="text-xs text-muted-foreground">
            {metrics.inpatientTotalBeds > 0
              ? `${Math.round((metrics.inpatientBedsOccupied / metrics.inpatientTotalBeds) * 100)}% Inpatient Occupancy`
              : 'Outpatient Clinic Only (0 Inpatient Beds)'}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Leads</span>
            <div className="rounded-md bg-purple-50 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics.pendingLeads} Enquiries</div>
          <span className="text-xs text-muted-foreground">Requires reception follow-up</span>
        </div>
      </div>

      {/* Hospital Branches Overview & Live Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Recent Appointment Requests ({selectedBranchId === 'ALL' ? 'Global' : selectedBranchId})
              </h2>
              <span className="text-xs text-susrutha-brand font-semibold cursor-pointer hover:underline">View All</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Consultation</th>
                    <th className="px-4 py-3">Time Slot</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted-foreground">
                        No recent appointments recorded in database.
                      </td>
                    </tr>
                  ) : (
                    recentAppointments.map((apt: any) => (
                      <tr key={apt._id || apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{apt.patientName || apt.patient?.name || 'Patient'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{apt.branchId?.name || apt.branchCode || 'KTK'}</td>
                        <td className="px-4 py-3 text-xs font-medium">{apt.consultationType || apt.departmentId?.title || 'General OP'}</td>
                        <td className="px-4 py-3 text-xs">{apt.timeSlot || apt.preferredTimeSlot || '10:00 AM'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> {apt.status || 'CONFIRMED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Status Info */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center">
              <Building className="h-4 w-4 mr-2 text-susrutha-brand" /> Operational Branch Status
            </h3>
            <div className="space-y-3">
              {(selectedBranchId === 'ALL' || selectedBranchId === 'KTK') && (
                <div className="p-3 rounded-md bg-slate-50 border border-border dark:bg-slate-900 space-y-1">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Kattakada Hospital</span>
                    <span className="text-emerald-600 text-xs font-bold uppercase">OPD Open</span>
                  </div>
                  <p className="text-xs text-muted-foreground">40 Beds • Panchakarma Suites • OT</p>
                </div>
              )}
              {(selectedBranchId === 'ALL' || selectedBranchId === 'KWR') && (
                <div className="p-3 rounded-md bg-slate-50 border border-border dark:bg-slate-900 space-y-1">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Kowdiar City OP</span>
                    <span className="text-emerald-600 text-xs font-bold uppercase">OPD Open</span>
                  </div>
                  <p className="text-xs text-muted-foreground">City Outpatient Clinic (9 AM - 7 PM)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
