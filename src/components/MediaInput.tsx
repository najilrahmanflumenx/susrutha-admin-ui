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
    // Clear value when switching modes to ensure ONLY 1 option is active at a time
    onChange('');
    setSelectedFileName('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        onChange(res.data.url);
      } else if (res.data?.data?.url) {
        onChange(res.data.data.url);
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isVideo = acceptType === 'video' || (value && (value.includes('.mp4') || value.includes('youtube') || value.includes('vimeo')));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{label}</label>

        {/* Toggle Mode: Only 1 option active at a time */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleModeChange('url')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === 'url' ? 'bg-white text-susrutha-brand shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="h-3 w-3" />
            External URL
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('file')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === 'file' ? 'bg-white text-susrutha-brand shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-susrutha-brand focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      ) : (
        <div className="relative">
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-2 pb-3">
              {uploading ? (
                <div className="flex items-center gap-2 text-susrutha-brand font-semibold text-xs">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading file to server...</span>
                </div>
              ) : value ? (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="truncate max-w-xs">{selectedFileName || 'File Uploaded Successfully'}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                  <p className="text-xs text-slate-600 font-medium">Click to select & upload {acceptType} file</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WEBP, SVG, MP4 (Max 10MB)</p>
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

      {/* Preview Section */}
      {value && (
        <div className="relative mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            {isVideo ? (
              <VideoIcon className="h-4 w-4 text-purple-600 shrink-0" />
            ) : (
              <ImageIcon className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <span className="truncate text-slate-700 font-medium">{value}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            title="Remove Media"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
