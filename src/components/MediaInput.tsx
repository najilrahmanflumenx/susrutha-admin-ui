'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Loader2, CheckCircle2, Image as ImageIcon, Video as VideoIcon, X, FolderOpen, Search, Filter, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface MediaFileItem {
  _id?: string;
  id?: string;
  filename: string;
  originalName?: string;
  mimeType: string;
  fileSize?: number;
  url: string;
  altText?: string;
  createdAt?: string;
}

interface MediaInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  acceptType?: 'image' | 'video' | 'any';
  placeholder?: string;
}

export function MediaInput({
  label,
  value,
  onChange,
  acceptType = 'any',
  placeholder = 'https://...',
}: MediaInputProps) {
  const [mode, setMode] = useState<'url' | 'file' | 'library'>('url');
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Media Library Picker Modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaFileItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>(
    acceptType === 'image' ? 'image' : acceptType === 'video' ? 'video' : 'all'
  );

  const fetchMediaLibrary = async () => {
    try {
      setLoadingMedia(true);
      const res = await apiClient.get('/media-library');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setMediaItems(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleOpenPicker = () => {
    setIsPickerOpen(true);
    fetchMediaLibrary();
  };

  const handleModeChange = (newMode: 'url' | 'file' | 'library') => {
    setMode(newMode);
    if (newMode === 'library') {
      handleOpenPicker();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/upload', formData);

      const uploadedUrl = res.data?.url || res.data?.data?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
        // Refresh media list if picker is open or if user uploads
        fetchMediaLibrary();
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to upload file. Please try again.';
      alert(`Upload Error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectMedia = (itemUrl: string) => {
    onChange(itemUrl);
    setIsPickerOpen(false);
  };

  const isVideo = acceptType === 'video' || (value && (value.includes('.mp4') || value.includes('youtube') || value.includes('vimeo')));

  const filteredMedia = mediaItems.filter((item) => {
    // Type filtering
    if (typeFilter === 'image' && !item.mimeType?.startsWith('image/') && !/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.url)) {
      return false;
    }
    if (typeFilter === 'video' && !item.mimeType?.startsWith('video/') && !/\.(mp4|webm|mov|m4v|ogg)$/i.test(item.url)) {
      return false;
    }
    // Search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.filename?.toLowerCase().includes(q) ||
        item.originalName?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </label>

        {/* Mode Selector Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleModeChange('url')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === 'url' ? 'bg-white dark:bg-slate-900 text-susrutha-brand shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="h-3 w-3" />
            External URL
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('file')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === 'file' ? 'bg-white dark:bg-slate-900 text-susrutha-brand shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="h-3 w-3" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('library')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === 'library' ? 'bg-white dark:bg-slate-900 text-susrutha-brand shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FolderOpen className="h-3 w-3" />
            Media Library
          </button>
        </div>
      </div>

      {/* Inputs according to Mode */}
      {mode === 'url' ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <button
            type="button"
            onClick={handleOpenPicker}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
            title="Browse Media Library"
          >
            <FolderOpen className="h-4 w-4 text-susrutha-brand" />
            <span>Browse Library</span>
          </button>
        </div>
      ) : mode === 'file' ? (
        <div className="relative">
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="flex flex-col items-center justify-center pt-2 pb-3">
              {uploading ? (
                <div className="flex items-center gap-2 text-susrutha-brand font-semibold text-xs">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading file to server...</span>
                </div>
              ) : value ? (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="truncate max-w-xs">{selectedFileName || 'Media Selected / Uploaded'}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Click to select & upload {acceptType} file</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Images (≤10MB: JPEG, PNG, WEBP, SVG), Videos (≤100MB: MP4, WEBM)</p>
                </>
              )}
            </div>
            <input
              type="file"
              disabled={uploading}
              accept={acceptType === 'image' ? 'image/*' : acceptType === 'video' ? 'video/*' : 'image/*,video/*'}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border border-dashed border-susrutha-brand/40 bg-susrutha-brand/5 dark:bg-susrutha-brand/10 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <FolderOpen className="h-4 w-4 text-susrutha-brand" />
            <span>Select existing media file from Media Library</span>
          </div>
          <button
            type="button"
            onClick={handleOpenPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-susrutha-brand text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all shadow-xs"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Open Media Library
          </button>
        </div>
      )}

      {/* Visual Preview Section */}
      {value && (
        <div className="relative mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            {!isVideo ? (
              <img
                src={value}
                alt="Preview"
                className="h-10 w-10 object-cover rounded border border-slate-200 shrink-0 bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-10 w-10 bg-slate-950 rounded border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center relative">
                {value.includes('youtube.com') || value.includes('youtu.be') ? (
                  <img
                    src={`https://img.youtube.com/vi/${value.match(/(?:v=|\/|vi=)([a-zA-Z0-9_-]{11})/)?.[1] || ''}/hqdefault.jpg`}
                    alt="YouTube Thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <video
                    src={value}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <VideoIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            <div className="overflow-hidden">
              <span className="block truncate text-slate-700 dark:text-slate-300 font-medium">{value}</span>
              <span className="text-[10px] text-slate-400 font-mono">Active Media URL</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Remove Media"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Media Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-susrutha-brand" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Select from Media Asset Library
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search media by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      typeFilter === 'all' ? 'bg-susrutha-brand text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    All Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('image')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      typeFilter === 'image' ? 'bg-susrutha-brand text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Images
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('video')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      typeFilter === 'video' ? 'bg-susrutha-brand text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Videos
                  </button>
                </div>

                {/* Upload New Asset Button inside picker */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-800 transition-all shrink-0">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload New</span>
                  <input
                    type="file"
                    disabled={uploading}
                    accept={acceptType === 'image' ? 'image/*' : acceptType === 'video' ? 'video/*' : 'image/*,video/*'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Media Items Grid */}
            <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-susrutha-brand" />
                  <span className="text-xs font-semibold">Loading media library...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2 text-center">
                  <FolderOpen className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    No media files found matching your search.
                  </p>
                  <p className="text-[11px] text-slate-400">Upload a new file above to save it to your media library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((item, idx) => {
                    const isSelected = value === item.url;
                    const itemIsVideo = item.mimeType?.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg)$/i.test(item.url);

                    return (
                      <div
                        key={item._id || item.id || idx}
                        onClick={() => handleSelectMedia(item.url)}
                        className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 bg-slate-50 dark:bg-slate-800 ${
                          isSelected
                            ? 'border-susrutha-brand ring-2 ring-red-100 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm'
                        }`}
                      >
                        {/* Thumbnail / Media Container */}
                        <div className="aspect-square w-full relative bg-slate-900/5 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                          {!itemIsVideo ? (
                            <img
                              src={item.url}
                              alt={item.filename || 'Media Asset'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-white"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                              {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                <img
                                  src={`https://img.youtube.com/vi/${item.url.match(/(?:v=|\/|vi=)([a-zA-Z0-9_-]{11})/)?.[1] || ''}/hqdefault.jpg`}
                                  alt="YouTube Thumbnail"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <video
                                  src={item.url}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                  <VideoIcon className="h-4 w-4 fill-white text-white ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-2 left-2 text-[9px] font-mono font-bold uppercase bg-purple-950/80 text-purple-200 px-1.5 py-0.5 rounded backdrop-blur-xs">
                                Video
                              </span>
                            </div>
                          )}

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-susrutha-brand text-white p-1 rounded-full shadow-md">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* File Details Footer */}
                        <div className="p-2.5 bg-white dark:bg-slate-850 text-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.filename}>
                            {item.filename || item.originalName || 'Media File'}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span className="uppercase font-mono">{item.mimeType?.split('/')[1] || 'media'}</span>
                            {item.fileSize && <span>{(item.fileSize / 1024).toFixed(0)} KB</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {filteredMedia.length} media items available
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MultiMediaInputProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  acceptType?: 'image' | 'video' | 'any';
}

export function MultiMediaInput({
  label,
  values = [],
  onChange,
  acceptType = 'image',
}: MultiMediaInputProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaFileItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMediaLibrary = async () => {
    try {
      setLoadingMedia(true);
      const res = await apiClient.get('/media-library');
      if (res.data?.data) {
        setMediaItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const openPicker = () => {
    setIsPickerOpen(true);
    fetchMediaLibrary();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const rawUrl = res.data?.data?.url || res.data?.url || res.data?.data?.path;
        if (rawUrl) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
          const hostBase = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
          const finalUrl = rawUrl.startsWith('http') ? rawUrl : `${hostBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
          newUrls.push(finalUrl);
        }
      }
      if (newUrls.length > 0) {
        onChange([...values, ...newUrls]);
      }
    } catch (err) {
      console.error('Failed to upload files:', err);
      alert('Upload failed. Please check file type and server connection.');
    } finally {
      setUploading(false);
    }
  };

  const toggleSelectMediaItem = (itemUrl: string) => {
    const rawUrl = itemUrl;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const hostBase = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    const finalUrl = rawUrl.startsWith('http') ? rawUrl : `${hostBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

    if (values.includes(finalUrl)) {
      onChange(values.filter((u) => u !== finalUrl));
    } else {
      onChange([...values, finalUrl]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(values.filter((_, idx) => idx !== indexToRemove));
  };

  const filteredMedia = mediaItems.filter((item) => {
    const matchesSearch =
      item.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      acceptType === 'image'
        ? item.mimeType?.startsWith('image/')
        : acceptType === 'video'
        ? item.mimeType?.startsWith('video/')
        : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label} ({values.length} selected)
        </label>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <Upload className="w-3.5 h-3.5 text-amber-500" />}
            <span>Upload File(s)</span>
            <input
              type="file"
              accept={acceptType === 'image' ? 'image/*' : acceptType === 'video' ? 'video/*' : '*/*'}
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>

          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Media Library</span>
          </button>
        </div>
      </div>

      {/* Selected Image Grid */}
      {values.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          {values.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 group bg-slate-900">
              <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium bg-slate-50/50 dark:bg-slate-900/30">
          No gallery images selected. Upload files or select from Media Library.
        </div>
      )}

      {/* Multi Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Select Gallery Images</h3>
                <p className="text-xs text-slate-500">Click items to toggle selection in gallery</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images..."
                className="w-full px-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingMedia ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
                  <span className="text-xs">Loading media library...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No media files found.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredMedia.map((item) => {
                    const id = item._id || item.id || item.filename;
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
                    const hostBase = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
                    const rawUrl = item.url;
                    const finalUrl = rawUrl.startsWith('http') ? rawUrl : `${hostBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                    const isSelected = values.includes(finalUrl);

                    return (
                      <div
                        key={id}
                        onClick={() => toggleSelectMediaItem(item.url)}
                        className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-md scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="aspect-square bg-slate-950 overflow-hidden">
                          <img src={finalUrl} alt={item.filename} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">{values.length} images selected</span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
