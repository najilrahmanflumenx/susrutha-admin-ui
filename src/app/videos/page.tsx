'use client';

import React, { useEffect, useState } from 'react';
import { Video, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';

interface VideoItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: 'patient_story' | 'doctor_talk' | 'facility_tour' | 'treatment_demo';
  youtubeUrl: string;
  videoHost?: 'youtube' | 'vimeo' | 'cloudinary';
  description: string;
  isFeatured?: boolean;
  status?: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

const CATEGORIES = [
  { value: 'patient_story', label: 'Patient Story' },
  { value: 'doctor_talk', label: 'Doctor Talk' },
  { value: 'facility_tour', label: 'Facility Tour' },
  { value: 'treatment_demo', label: 'Treatment Demo' },
];

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<VideoItem>>({
    title: '',
    category: 'patient_story',
    youtubeUrl: '',
    videoHost: 'youtube',
    description: '',
    isFeatured: false,
    status: 'published',
  });

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/videos');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setVideos(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      category: 'patient_story',
      youtubeUrl: '',
      videoHost: 'youtube',
      description: '',
      isFeatured: false,
      status: 'published',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: VideoItem) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.youtubeUrl) return;

    setIsSubmitting(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        slug,
      };

      if (isEditing && formData._id) {
        const res = await apiClient.put(`/videos/${formData._id}`, payload);
        if (res.data?.success || res.data?.data) {
          fetchVideos();
        }
      } else {
        const res = await apiClient.post('/videos', payload);
        if (res.data?.success || res.data?.data) {
          fetchVideos();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving video:', err);
      alert('Failed to save video embed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete video asset from database?')) return;
    try {
      await apiClient.delete(`/videos/${id}`);
      fetchVideos();
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Video_Gallery',
      [
        { header: 'ID', accessor: (v) => v._id || '' },
        { header: 'Title', accessor: (v) => v.title },
        { header: 'Category', accessor: (v) => v.category },
        { header: 'URL', accessor: (v) => v.youtubeUrl },
        { header: 'Video Host', accessor: (v) => v.videoHost || 'youtube' },
        { header: 'Description', accessor: (v) => v.description },
        { header: 'Is Featured', accessor: (v) => (v.isFeatured ? 'Yes' : 'No') },
      ],
      filteredVideos
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-susrutha-brand" />
            Video Gallery & Patient Recovery Stories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage YouTube & Cloudinary video embeds (Patient stories, Doctor talks, Facility tours)
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
            className="flex items-center gap-2 bg-susrutha-brand text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-red-700 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add New Video
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search video title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center p-12 text-slate-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-susrutha-brand" />
            <span>Loading video embeds from database...</span>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="col-span-3 rounded-xl border border-border bg-card p-12 text-center text-slate-500">
            No video embeds found matching the selected filter.
          </div>
        ) : (
          filteredVideos.map((item) => (
            <div
              key={item._id}
              className="bg-card rounded-xl overflow-hidden shadow-sm border border-border flex flex-col justify-between"
            >
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                    {item.category.replace('_', ' ')}
                  </span>
                  {item.isFeatured && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-foreground mt-3 mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">{item.description}</p>
              </div>
              <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-between text-xs">
                <a
                  href={item.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-susrutha-brand flex items-center gap-1 font-medium hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Video
                </a>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Video"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete Video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add / Edit Video Embed */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Video Embed' : 'Add New Video Embed'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVideo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Video Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Patient Recovery Story — Severe Arthritis Treatment"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Video Host</label>
                  <select
                    value={formData.videoHost || 'youtube'}
                    onChange={(e) => setFormData({ ...formData, videoHost: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="cloudinary">Cloudinary</option>
                  </select>
                </div>
              </div>

              <MediaInput
                label="Video Asset (Upload MP4 / WebM or Enter External URL)"
                value={formData.youtubeUrl || ''}
                onChange={(url) => setFormData({ ...formData, youtubeUrl: url })}
                acceptType="video"
                placeholder="https://www.youtube.com/watch?v=... or upload video file"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief overview of the patient testimonial or facility tour..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={!!formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="rounded border-slate-300 text-susrutha-brand focus:ring-susrutha-brand h-4 w-4"
                />
                <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Feature on website homepage & video section
                </label>
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
                  {isEditing ? 'Save Changes' : 'Create Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
