'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { Quote, Plus, Search, Edit, Trash2, Download, Loader2, X, Star, CheckCircle2 } from 'lucide-react';

interface TestimonialItem {
  _id?: string;
  id?: string;
  patientName: string;
  patientLocation?: string;
  treatmentReceived?: string;
  rating: number;
  reviewText: string;
  patientPhoto?: string;
  videoUrl?: string;
  isFeatured: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TestimonialItem>>({
    patientName: '',
    patientLocation: 'Thiruvananthapuram',
    treatmentReceived: 'Panchakarma Detox Therapy',
    rating: 5,
    reviewText: '',
    patientPhoto: '',
    videoUrl: '',
    isFeatured: false,
    status: 'ACTIVE',
  });

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/testimonials');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTestimonials(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const filtered = testimonials.filter((t) => {
    if (ratingFilter !== 'ALL' && t.rating !== Number(ratingFilter)) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.patientName.toLowerCase().includes(q) ||
        (t.patientLocation && t.patientLocation.toLowerCase().includes(q)) ||
        (t.treatmentReceived && t.treatmentReceived.toLowerCase().includes(q)) ||
        t.reviewText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setFormData({
      patientName: '',
      patientLocation: 'Thiruvananthapuram',
      treatmentReceived: 'Panchakarma Detox Therapy',
      rating: 5,
      reviewText: '',
      patientPhoto: '',
      videoUrl: '',
      isFeatured: false,
      status: 'ACTIVE',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TestimonialItem) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.reviewText) return;

    setIsSubmitting(true);
    try {
      if (isEditing && formData._id) {
        const res = await apiClient.put(`/testimonials/${formData._id}`, formData);
        if (res.data?.success) {
          setTestimonials((prev) => prev.map((t) => (t._id === formData._id ? res.data.data : t)));
        }
      } else {
        const res = await apiClient.post('/testimonials', formData);
        if (res.data?.success) {
          setTestimonials((prev) => [...prev, res.data.data]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving testimonial:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await apiClient.delete(`/testimonials/${id}`);
      setTestimonials((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Error deleting testimonial:', err);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Testimonials',
      [
        { header: 'ID', accessor: (t) => t._id || '' },
        { header: 'Patient Name', accessor: (t) => t.patientName },
        { header: 'Location', accessor: (t) => t.patientLocation || '' },
        { header: 'Treatment Received', accessor: (t) => t.treatmentReceived || '' },
        { header: 'Rating (1-5)', accessor: (t) => t.rating },
        { header: 'Review Text', accessor: (t) => t.reviewText },
        { header: 'Is Featured', accessor: (t) => (t.isFeatured ? 'Yes' : 'No') },
        { header: 'Status', accessor: (t) => t.status },
        { header: 'Created At', accessor: (t) => (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '') },
      ],
      filtered
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Quote className="h-6 w-6 text-susrutha-brand" />
            Patient Testimonials & Reviews
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage verified patient reviews, ratings, and featured homepage stories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Testimonial
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient name, treatment, review..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>

        <div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Testimonials List Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading patient testimonials from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No testimonials found matching the selected filters.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Treatment / Location</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Review Snippet</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{item.patientName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{item.treatmentReceived || 'General Consultation'}</p>
                      <p>{item.patientLocation}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-amber-500 gap-1 font-semibold text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating}.0</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">{item.reviewText}</td>
                    <td className="px-4 py-3">
                      {item.isFeatured ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
                          title="Edit Testimonial"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(item._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Testimonial"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Testimonial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Testimonial' : 'Add Patient Testimonial'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTestimonial} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={formData.patientName || ''}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Location</label>
                  <input
                    type="text"
                    value={formData.patientLocation || ''}
                    onChange={(e) => setFormData({ ...formData, patientLocation: e.target.value })}
                    placeholder="e.g. Trivandrum"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Treatment Received</label>
                  <input
                    type="text"
                    value={formData.treatmentReceived || ''}
                    onChange={(e) => setFormData({ ...formData, treatmentReceived: e.target.value })}
                    placeholder="e.g. Spine Care & Abhyangam"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Rating (1 to 5 Stars)</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    <option value={5}>5 Stars (Excellent)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Patient Review / Feedback</label>
                <textarea
                  required
                  rows={4}
                  value={formData.reviewText || ''}
                  onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                  placeholder="Patient review details..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand h-4 w-4"
                  />
                  Featured Homepage Story
                </label>

                <div>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    <option value="ACTIVE">Status: ACTIVE</option>
                    <option value="INACTIVE">Status: INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEditing ? 'Save Changes' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
