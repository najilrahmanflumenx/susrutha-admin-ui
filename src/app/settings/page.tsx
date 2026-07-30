'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Settings, Save, Globe, Megaphone, Share2, Search, CheckCircle2, Loader2, Image as ImageIcon, Sparkles, Upload } from 'lucide-react';
import { MediaInput } from '@/components/MediaInput';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'general' | 'announcement' | 'social' | 'seo'>('hero');

  // Hero CMS Settings State
  const [heroBadgeText, setHeroBadgeText] = useState('AUTHENTIC KERALA AYURVEDA HOSPITAL & SANCTUARY');
  const [heroHeadline, setHeroHeadline] = useState('Centuries of Classical Healing, Mastered for Modern Wellness');
  const [heroHighlightTitle, setHeroHighlightTitle] = useState('Susrutha Ayurvedhik');
  const [heroSubtitle, setHeroSubtitle] = useState('Experience research-backed 40-bed inpatient Panchakarma retreats and specialized clinical care at our serene hospital campus in Kattakada.');
  const [heroBgImageUrl, setHeroBgImageUrl] = useState('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80');
  const [heroCtaText, setHeroCtaText] = useState('BOOK CONSULTATION');
  const [heroCtaLink, setHeroCtaLink] = useState('/booking');
  const [heroSecondaryCtaText, setHeroSecondaryCtaText] = useState('EXPLORE SANCTUARY');
  const [heroSecondaryCtaLink, setHeroSecondaryCtaLink] = useState('/locations');

  // General & Social Settings
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
  const [isUploading, setIsUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/settings');
      if (response.data?.data) {
        const data = response.data.data;
        if (data.HERO) {
          setHeroBadgeText(data.HERO.badgeText || heroBadgeText);
          setHeroHeadline(data.HERO.headline || heroHeadline);
          setHeroHighlightTitle(data.HERO.highlightTitle || heroHighlightTitle);
          setHeroSubtitle(data.HERO.subtitle || heroSubtitle);
          setHeroBgImageUrl(data.HERO.bgImageUrl || heroBgImageUrl);
          setHeroCtaText(data.HERO.ctaText || heroCtaText);
          setHeroCtaLink(data.HERO.ctaLink || heroCtaLink);
          setHeroSecondaryCtaText(data.HERO.secondaryCtaText || heroSecondaryCtaText);
          setHeroSecondaryCtaLink(data.HERO.secondaryCtaLink || heroSecondaryCtaLink);
        }
        if (data.GENERAL) {
          setBrandTitle(data.GENERAL.brandTitle || brandTitle);
          setTagline(data.GENERAL.tagline || tagline);
          setPhone(data.GENERAL.phone || phone);
          setEmail(data.GENERAL.email || email);
        }
        if (data.ANNOUNCEMENT) {
          setAnnouncementText(data.ANNOUNCEMENT.text || announcementText);
          setAnnouncementLink(data.ANNOUNCEMENT.link || announcementLink);
        }
        if (data.SOCIAL) {
          setFacebook(data.SOCIAL.facebook || facebook);
          setInstagram(data.SOCIAL.instagram || instagram);
          setYoutube(data.SOCIAL.youtube || youtube);
        }
        if (data.SEO) {
          setMetaTitle(data.SEO.metaTitle || metaTitle);
          setMetaDescription(data.SEO.metaDescription || metaDescription);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        setHeroBgImageUrl(res.data.url);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await apiClient.post('/settings', {
        HERO: {
          badgeText: heroBadgeText,
          headline: heroHeadline,
          highlightTitle: heroHighlightTitle,
          subtitle: heroSubtitle,
          bgImageUrl: heroBgImageUrl,
          ctaText: heroCtaText,
          ctaLink: heroCtaLink,
          secondaryCtaText: heroSecondaryCtaText,
          secondaryCtaLink: heroSecondaryCtaLink,
        },
        GENERAL: { brandTitle, tagline, phone, email },
        ANNOUNCEMENT: { text: announcementText, link: announcementLink },
        SOCIAL: { facebook, instagram, youtube },
        SEO: { metaTitle, metaDescription },
      });
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
            Website CMS & Content Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Website Hero Banners, Text Content, Badges, Images, CTA Links, Announcement Bar, and Social Links
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-susrutha-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-susrutha-brand-dark transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="flex items-center space-x-2 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>Website content and settings updated dynamically across the platform!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-6 text-sm font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'hero' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Hero Section & Banners
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'general' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="h-4 w-4" />
          Hospital Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'announcement' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Announcement Bar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'social' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Social Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'seo' ? 'border-susrutha-brand text-susrutha-brand font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="h-4 w-4" />
          Global SEO
        </button>
      </div>

      {/* HERO SECTION CMS STUDIO */}
      {activeTab === 'hero' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-susrutha-brand" />
                Homepage Hero Section CMS
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Edit main title, background image, badges, and CTA action buttons rendered on the website homepage.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Top Badge Pill Text</label>
              <input
                type="text"
                value={heroBadgeText}
                onChange={(e) => setHeroBadgeText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                placeholder="e.g. AUTHENTIC KERALA AYURVEDA HOSPITAL"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Brand Highlight Prefix</label>
              <input
                type="text"
                value={heroHighlightTitle}
                onChange={(e) => setHeroHighlightTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                placeholder="e.g. Susrutha Ayurvedhik"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Main Hero Headline Text</label>
            <input
              type="text"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900 font-medium"
              placeholder="e.g. Centuries of Classical Healing, Mastered for Modern Wellness"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subtext / Paragraph Description</label>
            <textarea
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              placeholder="Describe hospital offerings..."
            />
          </div>

          {/* Background Image Upload & URL */}
          <MediaInput
            label="Hero Cover Background Image"
            value={heroBgImageUrl}
            onChange={(url) => setHeroBgImageUrl(url)}
            acceptType="image"
          />

          {/* CTA Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Primary CTA Button Text</label>
              <input
                type="text"
                value={heroCtaText}
                onChange={(e) => setHeroCtaText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Primary CTA Target Link</label>
              <input
                type="text"
                value={heroCtaLink}
                onChange={(e) => setHeroCtaLink(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Secondary CTA Button Text</label>
              <input
                type="text"
                value={heroSecondaryCtaText}
                onChange={(e) => setHeroSecondaryCtaText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Secondary CTA Target Link</label>
              <input
                type="text"
                value={heroSecondaryCtaLink}
                onChange={(e) => setHeroSecondaryCtaLink(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}

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

