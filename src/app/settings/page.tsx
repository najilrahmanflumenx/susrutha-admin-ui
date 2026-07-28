'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Settings, Save, Globe, Megaphone, Share2, Search, CheckCircle2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'announcement' | 'social' | 'seo'>('general');

  const [brandTitle, setBrandTitle] = useState('SUSRUTHA Ayurvedhik Hospital');
  const [tagline, setTagline] = useState('Research-backed 40-bed authentic Kerala Ayurveda hospital campus');
  const [phone, setPhone] = useState('+91 96566 56736');
  const [email, setEmail] = useState('info@susruthaayurveda.com');
  const [announcementText, setAnnouncementText] = useState('Authentic Kerala Panchakarma Admissions Open — 40-Bed Campus at Kattakada');
  const [announcementLink, setAnnouncementLink] = useState('/packages');
  const [facebook, setFacebook] = useState('https://facebook.com/susruthaayurveda');
  const [instagram, setInstagram] = useState('https://instagram.com/susruthaayurveda');
  const [youtube, setYoutube] = useState('https://youtube.com/@susruthaayurveda');
  const [metaTitle, setMetaTitle] = useState('Susrutha Ayurveda — Authentic Kerala Ayurveda Hospital');
  const [metaDescription, setMetaDescription] = useState('Research-backed inpatient Ayurveda at Kattakada with city OP at Kowdiar.');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/settings');
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((s: any) => {
          if (s.key === 'GENERAL') {
            setBrandTitle(s.value.brandTitle || brandTitle);
            setTagline(s.value.tagline || tagline);
            setPhone(s.value.phone || phone);
            setEmail(s.value.email || email);
          } else if (s.key === 'ANNOUNCEMENT') {
            setAnnouncementText(s.value.text || announcementText);
            setAnnouncementLink(s.value.link || announcementLink);
          } else if (s.key === 'SOCIAL') {
            setFacebook(s.value.facebook || facebook);
            setInstagram(s.value.instagram || instagram);
            setYoutube(s.value.youtube || youtube);
          } else if (s.key === 'SEO') {
            setMetaTitle(s.value.metaTitle || metaTitle);
            setMetaDescription(s.value.metaDescription || metaDescription);
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await Promise.all([
        apiClient.post('/settings', { key: 'GENERAL', value: { brandTitle, tagline, phone, email } }),
        apiClient.post('/settings', { key: 'ANNOUNCEMENT', value: { text: announcementText, link: announcementLink } }),
        apiClient.post('/settings', { key: 'SOCIAL', value: { facebook, instagram, youtube } }),
        apiClient.post('/settings', { key: 'SEO', value: { metaTitle, metaDescription } }),
      ]);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-700" />
            Global Site & CMS Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure Hospital Info, Announcement Bar, Social Links, SEO Meta Tags, and Branch Coordinates
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-susrutha-brand-dark transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isSaving ? 'Saving Settings...' : 'Save Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="flex items-center space-x-2 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>System settings updated and persisted successfully!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'general' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="h-4 w-4" />
          General Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'announcement' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Announcement Bar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'social' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Social Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'seo' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="h-4 w-4" />
          Global SEO
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Hospital Identity & Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Brand Name</label>
              <input
                type="text"
                value={brandTitle}
                onChange={(e) => setBrandTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Hotline Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'announcement' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Bar Announcement Banner</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Announcement Text</label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target Link URL</label>
            <input
              type="text"
              value={announcementLink}
              onChange={(e) => setAnnouncementLink(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Social Media Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Facebook URL</label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Instagram URL</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">YouTube Channel URL</label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Default Search Engine Optimization (SEO)</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Default Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Default Meta Description</label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
            />
          </div>
        </div>
      )}
    </form>
  );
}
