'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2, Copy, Download, Search, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';

interface MediaFileItem {
  _id?: string;
  id?: string;
  filename: string;
  originalName?: string;
  mimeType: string;
  fileSize: number;
  url: string;
  altText?: string;
  createdAt?: string;
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    filename: '',
    url: '',
    mimeType: 'image/jpeg',
    altText: '',
  });

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/media-library');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setFiles(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching media files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const filtered = files.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return f.filename.toLowerCase().includes(q) || f.url.toLowerCase().includes(q);
  });

  const handleOpenAddModal = () => {
    setFormData({
      filename: '',
      url: '',
      mimeType: 'image/jpeg',
      altText: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveFileRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.filename || !formData.url) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/media-library', {
        ...formData,
        originalName: formData.filename,
        fileSize: 102400,
      });
      if (res.data?.success || res.data?.data) {
        fetchFiles();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving media record:', err);
      alert('Failed to save media asset record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Delete media asset record?')) return;
    try {
      await apiClient.delete(`/media-library/${id}`);
      fetchFiles();
    } catch (err) {
      console.error('Error deleting media asset:', err);
      alert('Failed to delete asset');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const handleExportCSV = () => {
    exportToCSV(
      'Susrutha_Media_Library',
      [
        { header: 'ID', accessor: (m) => m._id || '' },
        { header: 'Filename', accessor: (m) => m.filename },
        { header: 'MIME Type', accessor: (m) => m.mimeType },
        { header: 'Size (Bytes)', accessor: (m) => m.fileSize },
        { header: 'URL', accessor: (m) => m.url },
        { header: 'Alt Text', accessor: (m) => m.altText || '' },
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
            <FolderOpen className="h-6 w-6 text-susrutha-brand" />
            Media Asset Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Cloudinary & local server image uploads, hospital photos, and document PDFs
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
            Upload / Add Media File
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 flex items-center justify-center p-12 text-slate-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-susrutha-brand" />
            <span>Loading media files...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-4 rounded-xl border border-border bg-card p-12 text-center text-slate-500">
            No media files found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="bg-card rounded-xl overflow-hidden shadow-sm border border-border flex flex-col justify-between"
            >
              <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden relative">
                {item.url ? (
                  <img src={item.url} alt={item.altText || item.filename} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-foreground truncate">{item.filename}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{item.mimeType}</p>
              </div>
              <div className="bg-muted/40 p-2 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => handleCopyUrl(item.url)}
                  className="text-xs text-susrutha-brand hover:underline flex items-center gap-1 font-medium"
                >
                  <Copy className="h-3 w-3" /> Copy URL
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  title="Delete File"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Upload / Add Media File */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Add Media File Record</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFileRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Filename</label>
                <input
                  type="text"
                  required
                  value={formData.filename}
                  onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                  placeholder="e.g. kattakada-hospital-front.jpg"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Public Image / File URL</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">MIME Type</label>
                  <select
                    value={formData.mimeType}
                    onChange={(e) => setFormData({ ...formData, mimeType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  >
                    <option value="image/jpeg">image/jpeg</option>
                    <option value="image/png">image/png</option>
                    <option value="image/webp">image/webp</option>
                    <option value="application/pdf">application/pdf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Alt Text</label>
                  <input
                    type="text"
                    value={formData.altText}
                    onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                    placeholder="e.g. Susrutha Campus Entrance"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
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
                  Save Asset Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
