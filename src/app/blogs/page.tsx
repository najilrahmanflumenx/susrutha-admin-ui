'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { MediaInput } from '@/components/MediaInput';
import { FileText, Plus, Edit, Clock, User, CheckCircle2, X, Loader2, Trash2 } from 'lucide-react';

interface BlogPost {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  category: string;
  author: string;
  readTime: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  branchCode?: string;
  status: 'PUBLISHED' | 'DRAFT';
}

export default function BlogsPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Treatment Insights',
    author: 'Dr. S. Susrutha Varma',
    readTime: '5 min read',
    excerpt: '',
    content: '',
    coverImage: '',
    branchCode: 'KTK',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/blogs', {
        params: {
          page,
          limit: 10,
          branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setPosts(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.totalPages || 1);
          setTotalCount(response.data.meta.total || response.data.data.length);
        }
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedBranchId]);

  const filteredPosts = posts;

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      category: 'Treatment Insights',
      author: 'Dr. S. Susrutha Varma',
      readTime: '5 min read',
      excerpt: '',
      content: '',
      coverImage: '',
      branchCode: 'KTK',
      status: 'PUBLISHED',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: BlogPost) => {
    setEditingId(post._id || post.id || null);
    setForm({
      title: post.title || '',
      category: post.category || 'Treatment Insights',
      author: post.author || 'Clinical Staff',
      readTime: post.readTime || '5 min read',
      excerpt: post.excerpt || '',
      content: post.content || post.excerpt || '',
      coverImage: post.coverImage || '',
      branchCode: post.branchCode || 'KTK',
      status: post.status || 'PUBLISHED',
    });
    setIsModalOpen(true);
  };

  const handleDeleteBlog = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await apiClient.delete(`/admin/blogs/${id}`);
      await fetchBlogs();
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Failed to delete blog article.');
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    const payload = {
      title: form.title,
      slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: form.category,
      author: form.author,
      readTime: form.readTime,
      excerpt: form.excerpt,
      content: form.content || form.excerpt,
      coverImage: form.coverImage,
      branchCode: form.branchCode,
      status: form.status,
    };

    try {
      if (editingId) {
        await apiClient.put(`/admin/blogs/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/blogs', payload);
      }
      await fetchBlogs();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving blog:', err);
      alert(err.response?.data?.message || 'Failed to save blog post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Blogs & Articles CMS</h1>
          <p className="text-sm text-muted-foreground">
            {selectedBranchId === 'ALL'
              ? 'Showing articles across all hospital branches.'
              : `Filtered view for branch code: ${selectedBranchId}`}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 rounded-lg bg-susrutha-brand px-4 py-2 text-sm font-semibold text-white hover:bg-susrutha-brandHover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-susrutha-brand" />
          <span>Loading published articles from MongoDB database...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No blog article found in database. Click &quot;Write New Article&quot; to publish one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div key={post._id || post.id} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              {post.coverImage && (
                <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-6 space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-susrutha-brand">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEditModal(post)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteBlog(post._id || post.id)} className="p-1 rounded text-slate-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-foreground leading-snug">{post.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
              </div>

              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <User className="h-3.5 w-3.5 mr-1 text-susrutha-brand" /> {post.author}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" /> {post.readTime || '5 min read'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground rounded-lg">
        <div>
          Showing {totalCount > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
          {Math.min(page * 10, totalCount)} of {totalCount} blog posts
        </div>
        <div className="flex items-center space-x-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-border bg-background px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Prev
          </button>
          <span className="px-2 font-semibold">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-border bg-background px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingId ? 'Edit Article' : 'Write New Article'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 text-sm">
              <MediaInput
                label="Featured Cover Image"
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
                acceptType="image"
                placeholder="Upload banner image..."
              />

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Panchakarma Detoxification Guidelines"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Treatment Insights"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Author
                  </label>
                  <input
                    type="text"
                    required
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Excerpt Summary
                </label>
                <textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Brief summary for blog cards..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Full Article Body
                </label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Comprehensive clinical details and guidance..."
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
                  {editingId ? 'Update Article' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
