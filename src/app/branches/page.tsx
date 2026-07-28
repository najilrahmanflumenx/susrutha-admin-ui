'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { Building, Plus, Phone, Mail, MapPin, BedDouble, Clock, CheckCircle2, Edit, X, Loader2 } from 'lucide-react';

interface BranchItem {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  opdTimings: string;
  bedCapacity: number;
  isMainBranch: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function BranchesPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<Partial<BranchItem> | null>(null);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/branches');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          name: item.name,
          code: item.code,
          type: item.type || 'CITY_CLINIC',
          address: typeof item.address === 'object'
            ? `${item.address.street || ''}, ${item.address.city || ''}, ${item.address.state || ''} - ${item.address.pincode || ''}`
            : item.address || 'Thiruvananthapuram, Kerala',
          phone: Array.isArray(item.contact?.phone) ? item.contact.phone[0] : item.phone || '+91 96566 56736',
          email: item.contact?.email || item.email || 'info@susruthaayurveda.com',
          opdTimings: item.opdTimings || '09:00 AM - 07:00 PM',
          bedCapacity: item.bedCapacity || 0,
          isMainBranch: item.isMainBranch || false,
          status: item.status || 'ACTIVE',
        }));
        setBranches(mapped);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Dynamic branch filtering
  const filteredBranches = branches.filter((b) => isBranchMatching(b.code));

  const handleOpenAddModal = () => {
    setCurrentBranch({
      name: '',
      code: '',
      type: 'CITY_CLINIC',
      address: 'Thiruvananthapuram, Kerala',
      phone: '+91 96566 56736',
      email: 'info@susruthaayurveda.com',
      opdTimings: '09:00 AM - 07:00 PM (Mon - Sat)',
      bedCapacity: 0,
      isMainBranch: false,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenConfigureModal = (branch: BranchItem) => {
    setCurrentBranch({ ...branch });
    setIsModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch?.name || !currentBranch?.code) return;

    try {
      await apiClient.post('/admin/branches', {
        name: currentBranch.name,
        code: currentBranch.code.toUpperCase(),
        type: currentBranch.type || 'CITY_CLINIC',
        address: currentBranch.address || '',
        phone: currentBranch.phone || '',
        email: currentBranch.email || '',
        opdTimings: currentBranch.opdTimings || '09:00 AM - 07:00 PM',
        bedCapacity: Number(currentBranch.bedCapacity) || 0,
        isMainBranch: currentBranch.isMainBranch || false,
        status: currentBranch.status || 'ACTIVE',
      });
      await fetchBranches();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving branch:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospital Branches</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing all active hospital branches and city outpatient clinics.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading hospital branches from MongoDB database...</span>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No hospital branch found for selected filter code ({selectedBranchId}).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBranches.map((branch) => (
            <div key={branch.id} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-lg">
                    <Building className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center text-foreground">
                      {branch.name}
                      {branch.isMainBranch && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Main Branch
                        </span>
                      )}
                    </h3>
                    <span className="text-xs font-mono font-semibold text-muted-foreground">CODE: {branch.code}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-susrutha-brand shrink-0" />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-susrutha-brand shrink-0" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-susrutha-brand shrink-0" />
                  <span>{branch.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-susrutha-brand shrink-0" />
                  <span>OPD Hours: {branch.opdTimings}</span>
                </div>
                {branch.bedCapacity > 0 && (
                  <div className="flex items-center space-x-2 text-foreground font-semibold">
                    <BedDouble className="h-4 w-4 text-susrutha-brand shrink-0" />
                    <span>Inpatient Capacity: {branch.bedCapacity} Beds</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Active Operational
                </span>
                <button
                  onClick={() => handleOpenConfigureModal(branch)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors flex items-center space-x-1"
                >
                  <Edit className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  <span>Configure Branch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configure / Edit Branch Modal */}
      {isModalOpen && currentBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentBranch.id ? `Configure Branch: ${currentBranch.code}` : 'Add New Hospital Branch'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Branch Name
                </label>
                <input
                  type="text"
                  required
                  value={currentBranch.name || ''}
                  onChange={(e) => setCurrentBranch({ ...currentBranch, name: e.target.value })}
                  placeholder="e.g. Kattakada Inpatient Hospital"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={currentBranch.code || ''}
                    onChange={(e) => setCurrentBranch({ ...currentBranch, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. KTK"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Facility Type
                  </label>
                  <select
                    value={currentBranch.type || 'CITY_CLINIC'}
                    onChange={(e) => setCurrentBranch({ ...currentBranch, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  >
                    <option value="INPATIENT_HOSPITAL">Inpatient Hospital</option>
                    <option value="CITY_CLINIC">City OP Clinic</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Street Address
                </label>
                <input
                  type="text"
                  value={currentBranch.address || ''}
                  onChange={(e) => setCurrentBranch({ ...currentBranch, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={currentBranch.phone || ''}
                    onChange={(e) => setCurrentBranch({ ...currentBranch, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Inpatient Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentBranch.bedCapacity || 0}
                    onChange={(e) => setCurrentBranch({ ...currentBranch, bedCapacity: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBranch.isMainBranch || false}
                  onChange={(e) => setCurrentBranch({ ...currentBranch, isMainBranch: e.target.checked })}
                  className="rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand"
                />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Set as Main Hospital Branch</span>
              </label>

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
                  Save Branch Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
