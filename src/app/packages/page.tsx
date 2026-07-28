'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { ShieldAlert, Plus, Edit, Check, Clock, IndianRupee, Building2, X, Loader2, Download } from 'lucide-react';

interface PackageItem {
  _id?: string;
  id?: string;
  title: string;
  subtitle: string;
  durationDays: number;
  price: number;
  branchCode: 'KTK' | 'KWR';
  inclusions: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export default function PackagesPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPkg, setCurrentPkg] = useState<Partial<PackageItem> | null>(null);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/packages');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          title: item.title,
          subtitle: item.subtitle || item.tagline || '',
          durationDays: item.durationDays || item.durationInDays || 7,
          price: item.price || 15000,
          branchCode: item.branchCode || 'KTK',
          inclusions: Array.isArray(item.inclusions) ? item.inclusions : ['Physician Consultation', 'Ayurvedic Therapy'],
          status: item.status || 'ACTIVE',
        }));
        setPackages(mapped);
      }
    } catch (err) {
      console.error('Error fetching care packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const filteredPkgs = packages.filter((p) => isBranchMatching(p.branchCode || 'KTK'));

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Care_Packages',
      [
        { header: 'ID', accessor: (p) => p.id || p._id || '' },
        { header: 'Package Title', accessor: (p) => p.title },
        { header: 'Subtitle', accessor: (p) => p.subtitle },
        { header: 'Duration (Days)', accessor: (p) => p.durationDays },
        { header: 'Price (INR)', accessor: (p) => p.price },
        { header: 'Branch Code', accessor: (p) => p.branchCode },
        { header: 'Inclusions', accessor: (p) => (p.inclusions ? p.inclusions.join('; ') : '') },
        { header: 'Status', accessor: (p) => p.status },
      ],
      filteredPkgs
    );
  };

  const handleOpenAddModal = () => {
    setCurrentPkg({
      title: '',
      subtitle: '',
      durationDays: 7,
      price: 15000,
      branchCode: selectedBranchId === 'KWR' ? 'KWR' : 'KTK',
      inclusions: ['Consultation', 'Treatment Therapy'],
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: PackageItem) => {
    setCurrentPkg({ ...pkg });
    setIsModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPkg?.title) return;

    try {
      await apiClient.post('/admin/packages', {
        title: currentPkg.title,
        subtitle: currentPkg.subtitle || '',
        durationDays: Number(currentPkg.durationDays) || 7,
        price: Number(currentPkg.price) || 10000,
        branchCode: currentPkg.branchCode || 'KTK',
        inclusions: currentPkg.inclusions || ['Ayurvedic Consultation'],
        status: 'ACTIVE',
      });
      await fetchPackages();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving care package:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ayurvedic Treatment & Care Packages</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing care packages across all hospital branches.'
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
            <span>Add New Package</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading care packages from MongoDB database...</span>
        </div>
      ) : filteredPkgs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No care package found in database for selected branch filter ({selectedBranchId}). Click &quot;Add New Package&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPkgs.map((pkg) => (
            <div key={pkg.id || pkg._id} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Clock className="h-3 w-3 mr-1" /> {pkg.durationDays} Days Duration
                  </span>
                  <button onClick={() => handleOpenEditModal(pkg)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-base text-foreground">{pkg.title}</h3>
                  <p className="text-xs text-susrutha-brand font-medium">{pkg.subtitle}</p>
                </div>

                <div className="text-xl font-extrabold text-foreground flex items-center">
                  <IndianRupee className="h-5 w-5" /> {pkg.price.toLocaleString('en-IN')}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package Inclusions:</span>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {pkg.inclusions.map((inc, idx) => (
                      <li key={idx} className="flex items-center">
                        <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  {pkg.branchCode === 'KTK' ? 'Kattakada Inpatient' : 'Kowdiar City OP'}
                </span>
                <span className="font-bold text-emerald-600">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Fixed Contrast & Solid Background */}
      {isModalOpen && currentPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentPkg.id ? 'Edit Care Package' : 'Add New Care Package'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Package Title
                </label>
                <input
                  type="text"
                  required
                  value={currentPkg.title || ''}
                  onChange={(e) => setCurrentPkg({ ...currentPkg, title: e.target.value })}
                  placeholder="e.g. Complete Panchakarma Detox"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={currentPkg.durationDays || 7}
                    onChange={(e) => setCurrentPkg({ ...currentPkg, durationDays: parseInt(e.target.value) || 7 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentPkg.price || 15000}
                    onChange={(e) => setCurrentPkg({ ...currentPkg, price: parseInt(e.target.value) || 15000 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Hospital Branch
                </label>
                <select
                  value={currentPkg.branchCode || 'KTK'}
                  onChange={(e) => setCurrentPkg({ ...currentPkg, branchCode: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                >
                  <option value="KTK">Kattakada Inpatient Hospital</option>
                  <option value="KWR">Kowdiar City OP Clinic</option>
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
                  Save Care Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
