'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { MediaInput } from '@/components/MediaInput';
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
  image?: string;
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentFacility, setCurrentFacility] = useState<Partial<Facility> & { customCategory?: string }>({
    title: '',
    category: 'ROOMS',
    customCategory: '',
    description: '',
    capacity: 1,
    image: '',
    status: 'ACTIVE',
  });

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

  const filteredFacilities = facilities.filter((fac) => isBranchMatching(fac.branchCode || 'KTK'));

  const handleOpenAddModal = () => {
    setEditingId(null);
    setCurrentFacility({
      title: '',
      category: 'ROOMS',
      customCategory: '',
      description: '',
      capacity: 1,
      image: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac: Facility) => {
    setEditingId(fac._id || fac.id || null);
    const isPreset = PRESET_CATEGORIES.some((c) => c.value === fac.category);
    setCurrentFacility({
      ...fac,
      category: isPreset ? fac.category : 'CUSTOM',
      customCategory: isPreset ? '' : fac.category,
      image: fac.image || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteFacility = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this infrastructure facility?')) return;
    try {
      await apiClient.delete(`/admin/infrastructure/${id}`);
      await fetchFacilities();
    } catch (err) {
      console.error('Error deleting facility:', err);
      alert('Failed to delete facility.');
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFacility?.title) return;

    const finalCategory =
      currentFacility.category === 'CUSTOM'
        ? currentFacility.customCategory || 'Custom Category'
        : currentFacility.category || 'ROOMS';

    const payload = {
      title: currentFacility.title,
      category: finalCategory,
      description: currentFacility.description || '',
      capacity: Number(currentFacility.capacity) || 1,
      image: currentFacility.image || '',
      status: currentFacility.status || 'ACTIVE',
    };

    try {
      if (editingId) {
        await apiClient.put(`/admin/infrastructure/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/infrastructure', payload);
      }
      await fetchFacilities();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving facility:', err);
      alert(err.response?.data?.message || 'Failed to save facility');
    }
  };

  return (
    <div className="space-y-6">
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

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading live infrastructure data from backend...</span>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No facility found in MongoDB. Click &quot;Add New Facility&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFacilities.map((facility) => (
            <div key={facility.id || facility._id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              {facility.image && (
                <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={facility.image} alt={facility.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-5 space-y-3 flex-1">
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
                    <button
                      onClick={() => handleDeleteFacility(facility._id || facility.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Delete Facility"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{facility.description}</p>
              </div>

              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" /> {facility.branchName}
                </span>
                <span className="font-bold text-foreground">Capacity: {facility.capacity} Units</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && currentFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Facility' : 'Add New Infrastructure Facility'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-4 text-sm">
              <MediaInput
                label="Facility Photo / Render"
                value={currentFacility.image || ''}
                onChange={(url) => setCurrentFacility({ ...currentFacility, image: url })}
                acceptType="image"
                placeholder="Upload facility photo..."
              />

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
                    placeholder="e.g. Hydrotherapy Suite"
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
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-susrutha-brand px-4 py-2 text-xs font-semibold text-white hover:bg-susrutha-brandHover shadow-sm"
                >
                  {editingId ? 'Update Facility' : 'Save Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
