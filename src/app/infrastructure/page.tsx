'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { BedDouble, Plus, Edit, Trash2, X, Building2, Loader2 } from 'lucide-react';

interface Facility {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  branchId?: any;
  branchName?: string;
  branchCode?: string;
  description: string;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE';
}

const PRESET_CATEGORIES = [
  { value: 'ROOMS', label: 'Inpatient Deluxe Rooms' },
  { value: 'PANCHAKARMA_SUITES', label: 'Panchakarma Suites' },
  { value: 'OPERATING_THEATRE', label: 'Sterilized Kshara Sutra OT' },
  { value: 'YOGA_HALL', label: 'Ayur Village & Yoga Pavilion' },
  { value: 'CUSTOM', label: '+ Type Custom Category...' },
];

export default function InfrastructurePage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFacility, setCurrentFacility] = useState<Partial<Facility> & { customCategory?: string }>({
    title: '',
    category: 'ROOMS',
    customCategory: '',
    branchCode: selectedBranchId === 'KWR' ? 'KWR' : 'KTK',
    description: '',
    capacity: 1,
    status: 'ACTIVE',
  });

  // Fetch live facilities from MongoDB
  const fetchFacilities = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/infrastructure');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          branchName: item.branchId?.name || 'Kattakada Inpatient Hospital',
          branchCode: item.branchId?.code || 'KTK',
        }));
        setFacilities(mapped);
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Dynamic Branch Filtering
  const filteredFacilities = facilities.filter((fac) => isBranchMatching(fac.branchCode || 'KTK'));

  const handleOpenAddModal = () => {
    setCurrentFacility({
      title: '',
      category: 'ROOMS',
      customCategory: '',
      branchCode: selectedBranchId === 'KWR' ? 'KWR' : 'KTK',
      description: '',
      capacity: 1,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac: Facility) => {
    const isPreset = PRESET_CATEGORIES.some((c) => c.value === fac.category);
    setCurrentFacility({
      ...fac,
      category: isPreset ? fac.category : 'CUSTOM',
      customCategory: isPreset ? '' : fac.category,
    });
    setIsModalOpen(true);
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFacility?.title) return;

    const finalCategory =
      currentFacility.category === 'CUSTOM'
        ? currentFacility.customCategory || 'Custom Category'
        : currentFacility.category || 'ROOMS';

    try {
      await apiClient.post('/admin/infrastructure', {
        title: currentFacility.title,
        category: finalCategory,
        description: currentFacility.description || '',
        capacity: Number(currentFacility.capacity) || 1,
        status: currentFacility.status || 'ACTIVE',
      });
      await fetchFacilities();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving facility:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hospital Infrastructure & Facilities</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing infrastructure fetched directly from MongoDB backend.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Facility</span>
        </button>
      </div>

      {/* Grid Display or Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading live infrastructure data from backend...</span>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No facility found in MongoDB for selected branch filter ({selectedBranchId}). Click &quot;Add New Facility&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFacilities.map((facility) => (
            <div key={facility.id || facility._id} className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <BedDouble className="h-5 w-5 text-susrutha-brand" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">{facility.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-susrutha-brand">{facility.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(facility)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Edit Facility"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{facility.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                <span className="text-muted-foreground flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" /> {facility.branchName}
                </span>
                <span className="font-bold text-foreground">Capacity: {facility.capacity} Units</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Facility Modal with Fixed Colors and Custom Category Option */}
      {isModalOpen && currentFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentFacility.id ? 'Edit Facility' : 'Add New Infrastructure Facility'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Facility Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={currentFacility.title || ''}
                  onChange={(e) => setCurrentFacility({ ...currentFacility, title: e.target.value })}
                  placeholder="e.g. Deluxe Panchakarma Suite A"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Facility Category
                </label>
                <select
                  value={currentFacility.category || 'ROOMS'}
                  onChange={(e) => setCurrentFacility({ ...currentFacility, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Custom Category Input if 'CUSTOM' selected */}
              {currentFacility.category === 'CUSTOM' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Type Custom Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={currentFacility.customCategory || ''}
                    onChange={(e) => setCurrentFacility({ ...currentFacility, customCategory: e.target.value })}
                    placeholder="e.g. Hydrotherapy Suite / Herb Garden"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Capacity Units / Bed Count
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={currentFacility.capacity || 1}
                  onChange={(e) => setCurrentFacility({ ...currentFacility, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={currentFacility.description || ''}
                  onChange={(e) => setCurrentFacility({ ...currentFacility, description: e.target.value })}
                  placeholder="Facility features and equipment details..."
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
                  Save Facility to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
