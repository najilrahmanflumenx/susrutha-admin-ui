'use client';

import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2, CheckCircle2, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

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
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleModeChange = (newMode: 'url' | 'file') => {
    setMode(newMode);
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

      if (res.data?.url) {
        onChange(res.data.url);
      } else if (res.data?.data?.url) {
        onChange(res.data.data.url);
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to upload file. Please try again.';
      alert(`Upload Error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const isVideo = acceptType === 'video' || (value && (value.includes('.mp4') || value.includes('youtube') || value.includes('vimeo')));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{label}</label>

        {/* Toggle Mode */}
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
        </div>
      </div>

      {mode === 'url' ? (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      ) : (
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
      )}

      {/* Visual Preview Section */}
      {value && (
        <div className="relative mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            {!isVideo ? (
              <img
                src={value}
                alt="Preview"
                className="h-10 w-10 object-cover rounded border border-slate-200 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <VideoIcon className="h-5 w-5 text-purple-600 shrink-0" />
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
    </div>
  );
}
