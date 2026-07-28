'use client';

import React, { useState, useEffect } from 'react';
import { useBranch } from '@/context/BranchContext';
import { apiClient } from '@/lib/api-client';
import { FileText, Plus, Edit, Clock, User, CheckCircle2, X, Loader2 } from 'lucide-react';

interface BlogPost {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  author: string;
  readTime: string;
  excerpt: string;
  branchCode: 'KTK' | 'KWR';
  status: 'PUBLISHED' | 'DRAFT';
}

export default function BlogsPage() {
  const { selectedBranchId, isBranchMatching } = useBranch();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/admin/blogs');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((item: any) => ({
          ...item,
          id: item._id,
          title: item.title,
          category: item.category || 'General Health',
          author: item.author || 'Clinical Staff',
          readTime: item.readTime || '5 min read',
          excerpt: item.excerpt || item.summary || '',
          branchCode: item.branchCode || 'KTK',
          status: item.status || 'PUBLISHED',
        }));
        setPosts(mapped);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredPosts = posts.filter((p) => isBranchMatching(p.branchCode || 'KTK'));

  const handleOpenAddModal = () => {
    setCurrentPost({
      title: '',
      category: 'Treatment Insights',
      author: 'Dr. S. Susrutha Varma',
      readTime: '5 min read',
      excerpt: '',
      branchCode: selectedBranchId === 'KWR' ? 'KWR' : 'KTK',
      status: 'PUBLISHED',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: BlogPost) => {
    setCurrentPost({ ...post });
    setIsModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost?.title) return;

    try {
      await apiClient.post('/admin/blogs', {
        title: currentPost.title,
        category: currentPost.category || 'General Health',
        author: currentPost.author || 'Clinical Staff',
        readTime: currentPost.readTime || '5 min read',
        excerpt: currentPost.excerpt || '',
        branchCode: currentPost.branchCode || 'KTK',
        status: 'PUBLISHED',
      });
      await fetchBlogs();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving blog:', err);
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
            <div key={post.id || post._id} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-susrutha-brand">
                    {post.category}
                  </span>
                  <button onClick={() => handleOpenEditModal(post)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="font-bold text-base text-foreground leading-snug">{post.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{post.excerpt}</p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <User className="h-3.5 w-3.5 mr-1 text-susrutha-brand" /> {post.author}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" /> {post.readTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Fixed Contrast & Solid Background */}
      {isModalOpen && currentPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentPost.id ? 'Edit Article' : 'Write New Article'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={currentPost.title || ''}
                  onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
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
                    value={currentPost.category || ''}
                    onChange={(e) => setCurrentPost({ ...currentPost, category: e.target.value })}
                    placeholder="Treatment Insights"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Author Doctor
                  </label>
                  <input
                    type="text"
                    required
                    value={currentPost.author || ''}
                    onChange={(e) => setCurrentPost({ ...currentPost, author: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Excerpt Summary
                </label>
                <textarea
                  rows={3}
                  value={currentPost.excerpt || ''}
                  onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-susrutha-brand"
                />
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
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
