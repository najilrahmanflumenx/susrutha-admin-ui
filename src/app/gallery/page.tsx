'use client';

import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  FolderOpen,
  Plus,
  Trash2,
  Edit,
  Download,
  Search,
  Loader2,
  X,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { exportToCSV } from '@/lib/export';
import { MediaInput } from '@/components/MediaInput';

interface AlbumItem {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: string;
  description?: string;
  coverImage?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt?: string;
}

interface VideoItem {
  _id?: string;
  id?: string;
  title: string;
  youtubeId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  status?: string;
}

interface FileItem {
  _id?: string;
  id?: string;
  filename: string;
  url: string;
  mimeType: string;
  fileSize: number;
}

export default function UnifiedMediaGalleryPage() {
  const [activeTab, setActiveTab] = useState<'PHOTOS' | 'VIDEOS' | 'FILES'>('PHOTOS');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Data states
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // Modal States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [photoForm, setPhotoForm] = useState<Partial<AlbumItem>>({
    title: '',
    category: 'infrastructure',
    description: '',
    coverImage: '',
    status: 'published',
  });

  const [videoForm, setVideoForm] = useState<Partial<VideoItem>>({
    title: '',
    youtubeId: '',
    videoUrl: '',
    thumbnailUrl: '',
    description: '',
    status: 'ACTIVE',
  });

  const [fileForm, setFileForm] = useState({
    filename: '',
    url: '',
    mimeType: 'image/jpeg',
    fileSize: 102400,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'PHOTOS') {
        const res = await apiClient.get('/gallery');
        setAlbums(res.data?.data || []);
      } else if (activeTab === 'VIDEOS') {
        const res = await apiClient.get('/videos');
        setVideos(res.data?.data || []);
      } else {
        const res = await apiClient.get('/media-library');
        setFiles(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Photo handlers
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.title) return;
    setIsSubmitting(true);
    try {
      if (isEditing && photoForm._id) {
        await apiClient.put(`/gallery/${photoForm._id}`, photoForm);
      } else {
        await apiClient.post('/gallery', photoForm);
      }
      setIsPhotoModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving photo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePhoto = async (id?: string) => {
    if (!id || !confirm('Delete this photo album?')) return;
    await apiClient.delete(`/gallery/${id}`);
    loadData();
  };

  // Video handlers
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...videoForm,
        youtubeUrl: videoForm.youtubeId || videoForm.videoUrl || 'N/A',
        videoUrl: videoForm.videoUrl || videoForm.youtubeId || '',
        status: videoForm.status === 'ACTIVE' ? 'published' : videoForm.status || 'published',
      };
      if (isEditing && videoForm._id) {
        await apiClient.put(`/videos/${videoForm._id}`, payload);
      } else {
        await apiClient.post('/videos', payload);
      }
      setIsVideoModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving video:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id?: string) => {
    if (!id || !confirm('Delete this video item?')) return;
    await apiClient.delete(`/videos/${id}`);
    loadData();
  };

  // File handlers
  const handleSaveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileForm.filename || !fileForm.url) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/media-library', fileForm);
      setIsFileModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving file:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFile = async (id?: string) => {
    if (!id || !confirm('Delete this file asset?')) return;
    await apiClient.delete(`/media-library/${id}`);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-susrutha-brand" />
            Media & Gallery Management Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage hospital photo albums, video walkthroughs, and raw media assets in one place.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            if (activeTab === 'PHOTOS') setIsPhotoModalOpen(true);
            else if (activeTab === 'VIDEOS') setIsVideoModalOpen(true);
            else setIsFileModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add {activeTab === 'PHOTOS' ? 'Photo Album' : activeTab === 'VIDEOS' ? 'Video Clip' : 'File Asset'}
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('PHOTOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'PHOTOS'
              ? 'bg-susrutha-brand text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Photo Albums
        </button>
        <button
          onClick={() => setActiveTab('VIDEOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'VIDEOS'
              ? 'bg-susrutha-brand text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <VideoIcon className="w-4 h-4" />
          Video Gallery
        </button>
        <button
          onClick={() => setActiveTab('FILES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === 'FILES'
              ? 'bg-susrutha-brand text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Media Library Files
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading media assets...</span>
        </div>
      ) : activeTab === 'PHOTOS' ? (
        /* Photo Albums Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {albums.map((item) => (
            <div key={item._id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="aspect-video bg-slate-100 relative">
                {item.coverImage ? (
                  <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold uppercase">No Image</div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1">
                <h4 className="font-bold text-base text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              </div>
              <div className="p-3 border-t border-border bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">{item.category}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setPhotoForm(item); setIsEditing(true); setIsPhotoModalOpen(true); }} className="p-1 text-slate-600 hover:text-slate-900"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeletePhoto(item._id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'VIDEOS' ? (
        /* Videos Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div key={vid._id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                {vid.videoUrl && (vid.videoUrl.includes('.mp4') || vid.videoUrl.includes('.webm') || vid.videoUrl.includes('.mov')) ? (
                  <video src={vid.videoUrl} className="w-full h-full object-cover" controls muted />
                ) : vid.thumbnailUrl && (vid.thumbnailUrl.includes('.mp4') || vid.thumbnailUrl.includes('.webm') || vid.thumbnailUrl.includes('.mov')) ? (
                  <video src={vid.thumbnailUrl} className="w-full h-full object-cover" controls muted />
                ) : vid.thumbnailUrl ? (
                  <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                ) : (
                  <VideoIcon className="w-10 h-10 text-white/50" />
                )}
              </div>
              <div className="p-4 flex flex-col gap-1">
                <h4 className="font-bold text-base text-foreground">{vid.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{vid.description}</p>
              </div>
              <div className="p-3 border-t border-border bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">{vid.youtubeId || 'Video Clip'}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setVideoForm(vid); setIsEditing(true); setIsVideoModalOpen(true); }} className="p-1 text-slate-600 hover:text-slate-900"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteVideo(vid._id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Files Grid */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file._id} className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
              <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                {file.mimeType.startsWith('image/') ? (
                  <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                ) : (
                  <FolderOpen className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs truncate">{file.filename}</h5>
                <span className="text-[10px] text-slate-400 font-mono block truncate">{file.url}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button onClick={() => navigator.clipboard.writeText(file.url)} className="text-[10px] text-susrutha-brand font-bold flex items-center gap-1"><Copy className="w-3 h-3" /> Copy URL</button>
                <button onClick={() => handleDeleteFile(file._id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Photo Album */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 text-slate-900">
            <h3 className="font-bold text-lg">{isEditing ? 'Edit Photo Album' : 'Add Photo Album'}</h3>
            <form onSubmit={handleSavePhoto} className="space-y-3">
              <input type="text" required placeholder="Album Title" value={photoForm.title || ''} onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <textarea placeholder="Description" rows={3} value={photoForm.description || ''} onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <MediaInput label="Cover Photo" value={photoForm.coverImage || ''} onChange={(url) => setPhotoForm({ ...photoForm, coverImage: url })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPhotoModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-susrutha-brand text-white rounded-lg text-xs font-bold">Save Album</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Video Clip */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 text-slate-900">
            <h3 className="font-bold text-lg">{isEditing ? 'Edit Video Clip' : 'Add Video Clip'}</h3>
            <form onSubmit={handleSaveVideo} className="space-y-3">
              <input type="text" required placeholder="Video Title" value={videoForm.title || ''} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <input type="text" placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)" value={videoForm.youtubeId || ''} onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <textarea placeholder="Video Description" rows={3} value={videoForm.description || ''} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <MediaInput label="Thumbnail Image" value={videoForm.thumbnailUrl || ''} onChange={(url) => setVideoForm({ ...videoForm, thumbnailUrl: url })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsVideoModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-susrutha-brand text-white rounded-lg text-xs font-bold">Save Video</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: File Asset */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 text-slate-900">
            <h3 className="font-bold text-lg">Add Media Asset File</h3>
            <form onSubmit={handleSaveFile} className="space-y-3">
              <input type="text" required placeholder="File Display Name" value={fileForm.filename} onChange={(e) => setFileForm({ ...fileForm, filename: e.target.value })} className="w-full border p-2 rounded-lg text-sm" />
              <MediaInput label="Select or Upload File Asset" value={fileForm.url} onChange={(url) => setFileForm({ ...fileForm, url })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsFileModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-susrutha-brand text-white rounded-lg text-xs font-bold">Upload Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
