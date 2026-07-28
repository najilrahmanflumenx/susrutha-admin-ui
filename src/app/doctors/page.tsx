'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { Stethoscope, Plus, Search, Award, Star, Building2, Grid, List, Edit, Trash2, X, Loader2, Download } from 'lucide-react';

interface DoctorItem {
  _id?: string;
  id?: string;
  name: string;
  degree: string;
  designation: string;
  specialty: string;
  branchCode: 'KTK' | 'KWR';
  fee: number;
  experienceYears: number;
  isMedicalDirector: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function DoctorsPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<Partial<DoctorItem> | null>(null);

  // Fetch live doctors from MongoDB backend
  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/doctors');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setDoctors(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Dynamic Branch Filtering
  const filteredDoctors = doctors.filter((doc) => {
    const matchesBranch = isBranchMatching(doc.branchCode || 'KTK');
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Doctors',
      [
        { header: 'ID', accessor: (d) => d.id || d._id || '' },
        { header: 'Name', accessor: (d) => d.name },
        { header: 'Degree', accessor: (d) => d.degree },
        { header: 'Designation', accessor: (d) => d.designation },
        { header: 'Specialty', accessor: (d) => d.specialty },
        { header: 'Branch Code', accessor: (d) => d.branchCode },
        { header: 'Consultation Fee (INR)', accessor: (d) => d.fee },
        { header: 'Experience (Yrs)', accessor: (d) => d.experienceYears },
        { header: 'Medical Director', accessor: (d) => (d.isMedicalDirector ? 'Yes' : 'No') },
        { header: 'Status', accessor: (d) => d.status },
      ],
      filteredDoctors
    );
  };

  const handleOpenAddModal = () => {
    setCurrentDoctor({
      name: '',
      degree: 'BAMS',
      designation: 'Ayurvedic Consultant',
      specialty: 'Panchakarma & General Wellness',
      branchCode: selectedBranchId === 'KWR' ? 'KWR' : 'KTK',
      fee: 500,
      experienceYears: 5,
      isMedicalDirector: false,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: DoctorItem) => {
    setCurrentDoctor({ ...doc });
    setIsModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoctor?.name) return;

    try {
      await apiClient.post('/admin/doctors', {
        name: currentDoctor.name,
        degree: currentDoctor.degree || 'BAMS',
        designation: currentDoctor.designation || 'Ayurvedic Consultant',
        specialty: currentDoctor.specialty || 'General Ayurveda',
        branchCode: currentDoctor.branchCode || 'KTK',
        fee: currentDoctor.fee || 500,
        experienceYears: currentDoctor.experienceYears || 5,
        isMedicalDirector: !!currentDoctor.isMedicalDirector,
        status: currentDoctor.status || 'ACTIVE',
      });
      await fetchDoctors();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving doctor:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Doctors & Medical Directors</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing doctors fetched directly from MongoDB backend.'
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
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctors by name or specialty..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>
        <div className="flex items-center space-x-1 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-susrutha-brand text-white' : 'text-muted-foreground'}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-susrutha-brand text-white' : 'text-muted-foreground'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading live doctors from MongoDB database...</span>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No doctor record found in MongoDB. Click &quot;Add New Doctor&quot; to create the first profile.
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 dark:bg-slate-900 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Doctor & Credentials</th>
                  <th className="px-6 py-3.5">Specialty</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">OP Fee</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id || doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                          <Stethoscope className="h-5 w-5 text-susrutha-brand" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center">
                            {doc.name}
                            {doc.isMedicalDirector && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                Director
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{doc.degree} • {doc.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground">{doc.specialty}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {doc.branchCode === 'KTK' ? 'Kattakada Inpatient' : 'Kowdiar City OP'}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600">₹{doc.fee}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(doc)}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div key={doc.id || doc._id} className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                  <Stethoscope className="h-6 w-6 text-susrutha-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">{doc.name}</h3>
                  <p className="text-xs text-susrutha-brand font-semibold">{doc.degree}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{doc.specialty}</p>
              <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-600">₹{doc.fee} Consultation</span>
                <button onClick={() => handleOpenEditModal(doc)} className="text-susrutha-brand font-semibold hover:underline">
                  Edit Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {isModalOpen && currentDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentDoctor.id || currentDoctor._id ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Doctor Full Name
                </label>
                <input
                  type="text"
                  required
                  value={currentDoctor.name || ''}
                  onChange={(e) => setCurrentDoctor({ ...currentDoctor, name: e.target.value })}
                  placeholder="e.g. Dr. S. Susrutha Varma"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Degrees
                  </label>
                  <input
                    type="text"
                    required
                    value={currentDoctor.degree || ''}
                    onChange={(e) => setCurrentDoctor({ ...currentDoctor, degree: e.target.value })}
                    placeholder="BAMS, MD"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentDoctor.fee || 500}
                    onChange={(e) => setCurrentDoctor({ ...currentDoctor, fee: parseInt(e.target.value) || 500 })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Clinical Specialty
                </label>
                <input
                  type="text"
                  required
                  value={currentDoctor.specialty || ''}
                  onChange={(e) => setCurrentDoctor({ ...currentDoctor, specialty: e.target.value })}
                  placeholder="e.g. Panchakarma & Chronic Spine Rehabilitation"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assigned Branch
                </label>
                <select
                  value={currentDoctor.branchCode || 'KTK'}
                  onChange={(e) => setCurrentDoctor({ ...currentDoctor, branchCode: e.target.value as any })}
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
                  Save Doctor Profile to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
