'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Edit, ExternalLink, Download, Search, Loader2, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';

interface AlbumItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: 'infrastructure' | 'ayur_village' | 'kowdiar_op' | 'herbal_garden' | 'events' | 'treatments';
  description?: string;
  coverImage?: string;
  isFeatured?: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

const CATEGORIES = [
  { value: 'infrastructure', label: 'Hospital Campus & Beds' },
  { value: 'ayur_village', label: 'Ayur Village Resort' },
  { value: 'kowdiar_op', label: 'Kowdiar OP Clinic' },
  { value: 'herbal_garden', label: 'Medicinal Herbal Garden' },
  { value: 'events', label: 'Clinical Conferences & Events' },
  { value: 'treatments', label: 'Therapy & Procedure Photos' },
];

export default function GalleryPage() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<AlbumItem>>({
    title: '',
    category: 'infrastructure',
    description: '',
    coverImage: '',
    isFeatured: false,
    status: 'published',
  });

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/gallery');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setAlbums(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching gallery albums:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const filtered = albums.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q));
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      category: 'infrastructure',
      description: '',
      coverImage: '',
      isFeatured: false,
      status: 'published',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AlbumItem) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSubmitting(true);
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        ...formData,
        slug,
      };

      if (isEditing && formData._id) {
        const res = await apiClient.put(`/gallery/${formData._id}`, payload);
        if (res.data?.success || res.data?.data) {
          fetchAlbums();
        }
      } else {
        const res = await apiClient.post('/gallery', payload);
        if (res.data?.success || res.data?.data) {
          fetchAlbums();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving album:', err);
      alert('Failed to save gallery album');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete gallery album from database?')) return;
    try {
      await apiClient.delete(`/gallery/${id}`);
      fetchAlbums();
    } catch (err) {
      console.error('Error deleting album:', err);
      alert('Failed to delete album');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Gallery_Albums',
      [
        { header: 'ID', accessor: (a) => a._id || '' },
        { header: 'Album Title', accessor: (a) => a.title },
        { header: 'Category', accessor: (a) => a.category },
        { header: 'Cover Image', accessor: (a) => a.coverImage || '' },
        { header: 'Description', accessor: (a) => a.description || '' },
        { header: 'Status', accessor: (a) => a.status },
      ],
      filtered
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-susrutha-brand" />
            Photo Gallery Albums
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage photo albums for Kattakada Campus, Ayur Village, Panchakarma Units, & Events
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
            Add Photo Album
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search albums by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center p-12 text-slate-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-susrutha-brand" />
            <span>Loading gallery albums from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 rounded-xl border border-border bg-card p-12 text-center text-slate-500">
            No gallery albums found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="bg-card rounded-xl overflow-hidden shadow-sm border border-border flex flex-col justify-between"
            >
              <div className="p-4">
                <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                  {item.category.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-foreground mt-3 mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              </div>
              <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-600 uppercase text-[10px]">{item.status}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Album"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete Album"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add / Edit Album */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Photo Album' : 'Add New Photo Album'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAlbum} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Album Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Ayur Village Campus & Medicinal Herbal Flora"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

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

              <MediaInput
                label="Cover Image (Upload Image File or Enter External URL)"
                value={formData.coverImage || ''}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
                acceptType="image"
                placeholder="https://images.unsplash.com/... or upload image"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of photos in this album..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
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
                  {isEditing ? 'Save Changes' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
