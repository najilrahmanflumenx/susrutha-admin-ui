'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Settings,
  Save,
  Globe,
  Megaphone,
  Share2,
  Search,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Eye,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
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

  // General Hospital Info Settings
  const [brandTitle, setBrandTitle] = useState('SUSRUTHA Ayurvedhik Hospital');
  const [tagline, setTagline] = useState('Research-backed 40-bed authentic Kerala Ayurveda hospital campus');
  const [phone, setPhone] = useState('+91 96566 56736');
  const [email, setEmail] = useState('info@susruthaayurveda.com');
  const [whatsappNumber, setWhatsappNumber] = useState('+91 96566 56736');
  const [foundedYear, setFoundedYear] = useState('1986');
  const [lineageYear, setLineageYear] = useState('1970');

  // Announcement Bar Settings
  const [announcementText, setAnnouncementText] = useState('Authentic Kerala Panchakarma Admissions Open — 40-Bed Campus at Kattakada');
  const [announcementLink, setAnnouncementLink] = useState('/packages');
  const [announcementIsEnabled, setAnnouncementIsEnabled] = useState(true);

  // Social Media Links
  const [facebook, setFacebook] = useState('https://facebook.com/susruthaayurveda');
  const [instagram, setInstagram] = useState('https://instagram.com/susruthaayurveda');
  const [youtube, setYoutube] = useState('https://youtube.com/@susruthaayurveda');
  const [twitter, setTwitter] = useState('https://twitter.com/susruthaayurveda');
  const [linkedin, setLinkedin] = useState('https://linkedin.com/company/susruthaayurveda');

  // Global SEO Settings
  const [metaTitle, setMetaTitle] = useState('Susrutha Ayurveda — Authentic Kerala Ayurveda Hospital & Panchakarma Centre');
  const [metaDescription, setMetaDescription] = useState('Research-backed 40-bed inpatient Ayurveda hospital at Kattakada with city OP at Kowdiar. Classical healing treatments & expert doctors.');
  const [metaKeywords, setMetaKeywords] = useState('Ayurveda hospital, Panchakarma Kerala, Susrutha Ayurveda, Kerala wellness retreat, Ayurvedic clinical treatments');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
        if (data.GENERAL || data.GENERAL_SETTINGS) {
          const gen = data.GENERAL || data.GENERAL_SETTINGS;
          setBrandTitle(gen.brandTitle || gen.hospitalName || brandTitle);
          setTagline(gen.tagline || tagline);
          setPhone(gen.phone || gen.emergencyHotline || phone);
          setEmail(gen.email || gen.mainEmail || email);
          setWhatsappNumber(gen.whatsappNumber || whatsappNumber);
          setFoundedYear(gen.foundedYear ? String(gen.foundedYear) : foundedYear);
          setLineageYear(gen.lineageYear ? String(gen.lineageYear) : lineageYear);
        }
        if (data.ANNOUNCEMENT || data.ANNOUNCEMENT_BAR) {
          const ann = data.ANNOUNCEMENT || data.ANNOUNCEMENT_BAR;
          setAnnouncementText(ann.text || announcementText);
          setAnnouncementLink(ann.link || announcementLink);
          setAnnouncementIsEnabled(ann.isEnabled ?? true);
        }
        if (data.SOCIAL) {
          setFacebook(data.SOCIAL.facebook || facebook);
          setInstagram(data.SOCIAL.instagram || instagram);
          setYoutube(data.SOCIAL.youtube || youtube);
          setTwitter(data.SOCIAL.twitter || twitter);
          setLinkedin(data.SOCIAL.linkedin || linkedin);
        }
        if (data.SEO) {
          setMetaTitle(data.SEO.metaTitle || metaTitle);
          setMetaDescription(data.SEO.metaDescription || metaDescription);
          setMetaKeywords(data.SEO.metaKeywords || metaKeywords);
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
        GENERAL: {
          brandTitle,
          hospitalName: brandTitle,
          tagline,
          phone,
          emergencyHotline: phone,
          email,
          mainEmail: email,
          whatsappNumber,
          foundedYear: parseInt(foundedYear) || 1986,
          lineageYear: parseInt(lineageYear) || 1970,
        },
        ANNOUNCEMENT: {
          text: announcementText,
          link: announcementLink,
          isEnabled: announcementIsEnabled,
        },
        SOCIAL: { facebook, instagram, youtube, twitter, linkedin },
        SEO: { metaTitle, metaDescription, metaKeywords },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-susrutha-brand" />
            Website CMS & Content Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage Website Hero Banners, Hospital Brand Info, Announcement Header, Social Links, and Global SEO.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving || isLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-susrutha-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-susrutha-brand-dark transition-all shadow-md disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="flex items-center space-x-2.5 rounded-lg bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>Website content and settings successfully saved & synced across backend & patient platform!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-6 text-sm font-medium overflow-x-auto bg-white dark:bg-slate-800 px-6 pt-3 rounded-xl border">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'hero' ? 'border-susrutha-brand text-susrutha-brand font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Hero Section & Banners
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'general' ? 'border-susrutha-brand text-susrutha-brand font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="h-4 w-4" />
          Hospital Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'announcement' ? 'border-susrutha-brand text-susrutha-brand font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          Announcement Bar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'social' ? 'border-susrutha-brand text-susrutha-brand font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Social Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'seo' ? 'border-susrutha-brand text-susrutha-brand font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="h-4 w-4" />
          Global SEO
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Loader2 className="h-8 w-8 text-susrutha-brand animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading settings from server...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: HERO SECTION CMS */}
          {activeTab === 'hero' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input Column */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-susrutha-brand" />
                    Homepage Hero CMS Settings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Customize badge text, main headline, hero background image, and call-to-action links.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Top Badge Pill Text</label>
                    <input
                      type="text"
                      value={heroBadgeText}
                      onChange={(e) => setHeroBadgeText(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900 font-medium"
                      placeholder="e.g. AUTHENTIC KERALA AYURVEDA HOSPITAL"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Brand Highlight Prefix</label>
                    <input
                      type="text"
                      value={heroHighlightTitle}
                      onChange={(e) => setHeroHighlightTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900 font-medium"
                      placeholder="e.g. Susrutha Ayurvedhik"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Main Hero Headline Text</label>
                  <input
                    type="text"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900 font-semibold"
                    placeholder="e.g. Centuries of Classical Healing, Mastered for Modern Wellness"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subtext / Paragraph Description</label>
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Primary CTA Button Text</label>
                    <input
                      type="text"
                      value={heroCtaText}
                      onChange={(e) => setHeroCtaText(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Primary CTA Target Link</label>
                    <input
                      type="text"
                      value={heroCtaLink}
                      onChange={(e) => setHeroCtaLink(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Secondary CTA Button Text</label>
                    <input
                      type="text"
                      value={heroSecondaryCtaText}
                      onChange={(e) => setHeroSecondaryCtaText(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Secondary CTA Target Link</label>
                    <input
                      type="text"
                      value={heroSecondaryCtaLink}
                      onChange={(e) => setHeroSecondaryCtaLink(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Eye className="h-4 w-4" /> Live Website Hero Preview
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono">Dynamic Preview</span>
                  </div>

                  {heroBgImageUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-25 z-0"
                      style={{ backgroundImage: `url(${heroBgImageUrl})` }}
                    />
                  )}

                  <div className="relative z-10 space-y-4 text-center py-6 px-2">
                    {heroBadgeText && (
                      <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {heroBadgeText}
                      </span>
                    )}

                    <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                      <span className="text-amber-400">{heroHighlightTitle} </span>
                      {heroHeadline}
                    </h2>

                    <p className="text-xs text-slate-300 line-clamp-3 max-w-md mx-auto leading-relaxed">
                      {heroSubtitle}
                    </p>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      {heroCtaText && (
                        <span className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                          {heroCtaText}
                        </span>
                      )}
                      {heroSecondaryCtaText && (
                        <span className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">
                          {heroSecondaryCtaText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOSPITAL INFO */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-susrutha-brand" />
                  Hospital Brand Identity & Contact Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage official hospital brand title, tagline, hotline phone, email, and heritage stats.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Official Brand Title</label>
                  <input
                    type="text"
                    value={brandTitle}
                    onChange={(e) => setBrandTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hospital Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Hotline Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp Support Number</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Founded Year</label>
                    <input
                      type="number"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ayurvedic Lineage Year</label>
                    <input
                      type="number"
                      value={lineageYear}
                      onChange={(e) => setLineageYear(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENT BAR */}
          {activeTab === 'announcement' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-susrutha-brand" />
                      Top Announcement Bar CMS
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Configure top header notice banner displayed across all website pages.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementIsEnabled}
                      onChange={(e) => setAnnouncementIsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-susrutha-brand"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {announcementIsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Announcement Message Text</label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    placeholder="e.g. Authentic Kerala Panchakarma Admissions Open"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Link URL</label>
                  <input
                    type="text"
                    value={announcementLink}
                    onChange={(e) => setAnnouncementLink(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                    placeholder="e.g. /packages or /booking"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Eye className="h-4 w-4" /> Live Announcement Bar Preview
                    </span>
                  </div>

                  {announcementIsEnabled ? (
                    <div className="bg-gradient-to-r from-amber-900/60 via-amber-800/60 to-amber-900/60 border border-amber-600/30 rounded-lg p-3 text-center text-xs font-medium text-amber-200 flex items-center justify-center gap-2">
                      <span>{announcementText || 'Announcement text preview'}</span>
                      {announcementLink && (
                        <span className="underline text-amber-400 font-bold flex items-center gap-0.5">
                          Learn More <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-800 p-4 text-center text-xs text-slate-400 rounded-lg italic">
                      Announcement bar is currently disabled and hidden from website visitors.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-susrutha-brand" />
                  Social Media Handles & Links
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage official social media URLs linked across website header & footer.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Facebook Page URL</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Instagram Profile URL</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">YouTube Channel URL</label>
                  <input
                    type="text"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Twitter / X Handle URL</label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">LinkedIn Company Page URL</label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GLOBAL SEO */}
          {activeTab === 'seo' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Search className="h-5 w-5 text-susrutha-brand" />
                    Global Search Engine Optimization (SEO)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage default page meta title, meta description, and keywords indexed by search engines.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default Meta Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default Meta Description</label>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Meta Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-sm bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Google Snippet Live Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-susrutha-brand" /> Google Search Preview
                    </span>
                  </div>

                  <div className="space-y-1 font-sans">
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 truncate">
                      <span className="w-4 h-4 rounded-full bg-susrutha-brand/20 text-susrutha-brand font-bold text-[10px] flex items-center justify-center">
                        S
                      </span>
                      <span>https://susruthaayurveda.com</span>
                    </div>

                    <h4 className="text-base text-blue-800 dark:text-blue-400 hover:underline font-medium cursor-pointer leading-snug">
                      {metaTitle || 'Susrutha Ayurveda — Authentic Kerala Ayurveda Hospital'}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal line-clamp-3">
                      {metaDescription || 'Research-backed 40-bed inpatient Ayurveda hospital at Kattakada with city OP at Kowdiar.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
}
