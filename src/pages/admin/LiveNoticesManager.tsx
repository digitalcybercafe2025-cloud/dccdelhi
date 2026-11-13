import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Trash2, Edit3, Save, X, MoveUp, MoveDown, Zap, AlertTriangle,
  Megaphone, CreditCard, Loader2, Calendar, Copy, Eye, Sliders, RefreshCw,
  Clock, CheckCircle, Image as ImageIcon, Sparkles, ExternalLink, Play, Pause, ChevronRight, BellRing
} from 'lucide-react';
import api, { getMediaUrl } from '../../api/axios';

interface Notice {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  type: string;
  badge: string;
  icon: string;
  iconType: 'emoji' | 'lucide' | 'image';
  iconImage?: string;
  status: boolean;
  order: number;
  priority: 'High' | 'Normal' | 'Low';
  startDate?: string;
  expiryDate?: string;
  isLifetime: boolean;
  actionText?: string;
  actionUrl?: string;
  createdAt?: string;
}

interface NoticeSettings {
  visibleCount: number;
  autoAnimation: boolean;
  animationType: 'scroll' | 'fade' | 'slide' | 'fade-slide' | 'instant';
  animationDirection: 'up' | 'down' | 'left' | 'right';
  animationSpeed: 'slow' | 'normal' | 'fast' | 'custom';
  animationDuration: number;
  pauseInterval: number;
  autoRotation: boolean;
  hoverPause: boolean;
  resumeAfterHover: boolean;
  touchPause: boolean;
  infiniteLoop: boolean;
}

const DEFAULT_SETTINGS: NoticeSettings = {
  visibleCount: 2,
  autoAnimation: true,
  animationType: 'scroll',
  animationDirection: 'up',
  animationSpeed: 'normal',
  animationDuration: 600,
  pauseInterval: 4,
  autoRotation: true,
  hoverPause: true,
  resumeAfterHover: true,
  touchPause: true,
  infiniteLoop: true,
};

const EMOJI_PRESETS = [
  { emoji: '🪔', label: 'Diwali' },
  { emoji: '🪪', label: 'PAN/ID' },
  { emoji: '🎂', label: 'Birthday' },
  { emoji: '🎉', label: 'Festival' },
  { emoji: '🎁', label: 'Offer' },
  { emoji: '📢', label: 'Notice' },
  { emoji: '📄', label: 'Govt Form' },
  { emoji: '⚡', label: 'Urgent' },
  { emoji: '🚗', label: 'DL/RC' },
  { emoji: '🇮🇳', label: 'Digital India' },
];

const CATEGORIES = ['Important', 'Special', 'Alert', 'Festival', 'Scheme', 'Offer'];

const LiveNoticesManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notices' | 'animation' | 'preview'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [settings, setSettings] = useState<NoticeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    title: '',
    shortDescription: '',
    description: '',
    type: 'Important',
    badge: 'LIVE',
    icon: '⚡',
    iconType: 'emoji',
    priority: 'Normal',
    startDate: '',
    expiryDate: '',
    isLifetime: false,
    actionText: '',
    actionUrl: '',
    status: true,
    order: 0,
  });

  // Preview tab state
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewAnimating, setPreviewAnimating] = useState(false);
  const [previewPaused, setPreviewPaused] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [noticesRes, settingsRes] = await Promise.allSettled([
        api.get('/hero/notices'),
        api.get('/hero/notices/settings/admin'),
      ]);

      if (noticesRes.status === 'fulfilled' && noticesRes.value.data?.success) {
        setNotices(noticesRes.value.data.data || []);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.value.data.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // ── Notice CRUD ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setEditingNotice(null);
    setSelectedFile(null);
    setFilePreview(null);
    setFormData({
      title: '',
      shortDescription: '',
      description: '',
      type: 'Important',
      badge: 'LIVE',
      icon: '⚡',
      iconType: 'emoji',
      priority: 'Normal',
      startDate: '',
      expiryDate: '',
      isLifetime: false,
      actionText: '',
      actionUrl: '',
      status: true,
      order: notices.length,
    });
  };

  const openEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setSelectedFile(null);
    setFilePreview(notice.iconImage ? getMediaUrl(notice.iconImage) : null);
    setFormData({
      title: notice.title || '',
      shortDescription: notice.shortDescription || '',
      description: notice.description || '',
      type: notice.type || 'Important',
      badge: notice.badge || 'LIVE',
      icon: notice.icon || '⚡',
      iconType: notice.iconType || 'emoji',
      priority: notice.priority || 'Normal',
      startDate: notice.startDate ? notice.startDate.slice(0, 16) : '',
      expiryDate: notice.expiryDate ? notice.expiryDate.slice(0, 16) : '',
      isLifetime: notice.isLifetime || false,
      actionText: notice.actionText || '',
      actionUrl: notice.actionUrl || '',
      status: notice.status !== false,
      order: notice.order || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedFile) {
        const data = new FormData();
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== undefined && formData[key] !== null) {
            data.append(key, formData[key]);
          }
        });
        data.append('iconImage', selectedFile);

        if (editingNotice) {
          await api.put(`/hero/notices/${editingNotice._id}`, data);
          showSuccess('Notice updated successfully!');
        } else {
          await api.post('/hero/notices', data);
          showSuccess('New notice broadcasted live!');
        }
      } else {
        // Send as clean JSON when no file upload
        if (editingNotice) {
          await api.put(`/hero/notices/${editingNotice._id}`, formData);
          showSuccess('Notice updated successfully!');
        } else {
          await api.post('/hero/notices', formData);
          showSuccess('New notice broadcasted live!');
        }
      }

      await fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Save Notice Error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save notice';
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNotice = async (id: string) => {
    if (!window.confirm('Delete this notice? This action cannot be undone.')) return;
    try {
      await api.delete(`/hero/notices/${id}`);
      showSuccess('Notice removed.');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateNotice = async (id: string) => {
    try {
      await api.post(`/hero/notices/${id}/duplicate`);
      showSuccess('Notice duplicated.');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNoticeStatus = async (notice: Notice) => {
    try {
      await api.put(`/hero/notices/${notice._id}`, { status: !notice.status });
      showSuccess(`Notice is now ${!notice.status ? 'LIVE' : 'DISABLED'}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const moveNotice = async (id: string, direction: 'up' | 'down') => {
    const index = notices.findIndex((n) => n._id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === notices.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentNotice = notices[index];
    const targetNotice = notices[targetIndex];

    try {
      await Promise.all([
        api.put(`/hero/notices/${currentNotice._id}`, { order: targetNotice.order }),
        api.put(`/hero/notices/${targetNotice._id}`, { order: currentNotice.order }),
      ]);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Settings Save ──────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true);
      await api.put('/hero/notices/settings', settings);
      showSuccess('Animation & Display settings saved and published!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm('Restore default animation and display settings?')) return;
    try {
      setSettingsSaving(true);
      setSettings(DEFAULT_SETTINGS);
      await api.put('/hero/notices/settings', DEFAULT_SETTINGS);
      showSuccess('Default settings restored.');
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Live Animation Preview Controller ──────────────────────────────────────

  const activeNoticesList = useMemo(() => {
    const now = Date.now();
    return notices.filter((n) => {
      if (!n.status) return false;
      if (n.startDate && new Date(n.startDate).getTime() > now) return false;
      if (n.isLifetime) return true;
      if (n.expiryDate && new Date(n.expiryDate).getTime() <= now) return false;
      return true;
    });
  }, [notices]);

  useEffect(() => {
    if (activeTab !== 'preview' || previewPaused || !settings.autoAnimation) return;
    const count = activeNoticesList.length;
    const visible = Math.min(settings.visibleCount || 2, Math.max(1, count));
    if (count <= visible) return;

    const intervalMs = Math.max(2, settings.pauseInterval || 4) * 1000;
    const durationMs = Math.max(200, settings.animationDuration || 600);

    const timer = setInterval(() => {
      if (settings.animationType === 'instant') {
        setPreviewIndex((prev) => (prev + visible) % count);
      } else {
        setPreviewAnimating(true);
        setTimeout(() => {
          setPreviewIndex((prev) => (prev + visible) % count);
          setPreviewAnimating(false);
        }, durationMs);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeTab, previewPaused, activeNoticesList.length, settings]);

  const previewDisplayItems = useMemo(() => {
    const count = activeNoticesList.length;
    if (count === 0) return [];
    const visible = Math.min(settings.visibleCount || 2, count);
    const items: Notice[] = [];
    for (let i = 0; i < visible; i++) {
      items.push(activeNoticesList[(previewIndex + i) % count]);
    }
    return items;
  }, [activeNoticesList, previewIndex, settings.visibleCount]);

  // Helper render icon
  const renderNoticeIcon = (n: Notice) => {
    if (n.iconImage) {
      return <img src={getMediaUrl(n.iconImage)} alt={n.title} className="w-6 h-6 object-contain rounded" />;
    }
    if (n.icon && /\p{Emoji}/u.test(n.icon)) {
      return <span className="text-xl leading-none select-none">{n.icon}</span>;
    }
    return <Zap className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* SUCCESS NOTIFICATION TOAST */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-500 border border-red-100 dark:border-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                Live Notices Manager
              </h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 mt-0.5">
                Real-time alert broadcasting, visual animations & scheduling control
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> BROADCAST NEW NOTICE
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-2">
        <button
          onClick={() => setActiveTab('notices')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
            activeTab === 'notices'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Notices Management ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('animation')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
            activeTab === 'animation'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Animation & Display Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Animation Preview</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: NOTICES MANAGEMENT ──────────────── */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl text-center border border-slate-100 dark:border-slate-700">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-700 dark:text-white">No notices created yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Click "Broadcast New Notice" to create your first announcement with custom icons, timing, and animations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {notices.map((notice, idx) => {
                const isExpired = notice.expiryDate && !notice.isLifetime && new Date(notice.expiryDate).getTime() < Date.now();
                const isUpcoming = notice.startDate && new Date(notice.startDate).getTime() > Date.now();

                return (
                  <div
                    key={notice._id}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-sm transition-all hover:shadow-lg flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              notice.status
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {notice.status ? 'LIVE ON SITE' : 'INACTIVE'}
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {notice.type}
                          </span>

                          {notice.priority === 'High' && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                              HIGH PRIORITY
                            </span>
                          )}

                          {notice.isLifetime ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Lifetime
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Expired
                            </span>
                          ) : isUpcoming ? (
                            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Scheduled
                            </span>
                          ) : null}
                        </div>

                        {/* Order Reorder */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveNotice(notice._id, 'up')}
                            disabled={idx === 0}
                            title="Move Up"
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <MoveUp size={15} />
                          </button>
                          <button
                            onClick={() => moveNotice(notice._id, 'down')}
                            disabled={idx === notices.length - 1}
                            title="Move Down"
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <MoveDown size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Main card info */}
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-inner">
                          {renderNoticeIcon(notice)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-[#0f172a] dark:text-white text-base tracking-tight truncate">
                              {notice.title}
                            </h3>
                            <span className="bg-[#fff1f2] dark:bg-rose-500/15 text-[#f43f5e] dark:text-rose-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              {notice.badge || 'LIVE'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {notice.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60">
                      <button
                        onClick={() => toggleNoticeStatus(notice)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          notice.status
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                        }`}
                      >
                        {notice.status ? 'Deactivate' : 'Publish Live'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => duplicateNotice(notice._id)}
                          title="Duplicate Notice"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => openEdit(notice)}
                          title="Edit Notice"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deleteNotice(notice._id)}
                          title="Delete Notice"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: ANIMATION & DISPLAY SETTINGS ──────────────── */}
      {activeTab === 'animation' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700/80 shadow-sm space-y-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              Live Notices Animation Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure how notices rotate, scroll, transition, and pause on the public website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Visible Count */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Visible Notices Count (Default: 2)
              </label>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSettings({ ...settings, visibleCount: num })}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      settings.visibleCount === num
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                Controls how many notices are shown simultaneously in the hero widget.
              </p>
            </div>

            {/* 2. Animation Mode */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Animation Mode
              </label>
              <select
                value={settings.animationType}
                onChange={(e) => setSettings({ ...settings, animationType: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scroll">Vertical Scrolling</option>
                <option value="fade">Fade (Fade In / Out)</option>
                <option value="slide">Slide Transition</option>
                <option value="fade-slide">Fade + Slide (Combined)</option>
                <option value="instant">Instant Switching (No Animation)</option>
              </select>
              <p className="text-[10px] text-slate-400 pt-1">
                Visual style used to transition between notice groups.
              </p>
            </div>

            {/* 3. Animation Direction */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Animation Direction
              </label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {(['up', 'down', 'left', 'right'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setSettings({ ...settings, animationDirection: dir })}
                    className={`py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                      settings.animationDirection === dir
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                Direction the notices travel during scroll and slide.
              </p>
            </div>

            {/* 4. Pause Between Groups */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pause Interval: {settings.pauseInterval}s
              </label>
              <input
                type="range"
                min="2"
                max="15"
                step="1"
                value={settings.pauseInterval}
                onChange={(e) => setSettings({ ...settings, pauseInterval: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Fast (2s)</span>
                <span>Normal (4s)</span>
                <span>Slow (15s)</span>
              </div>
            </div>

            {/* 5. Animation Duration */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Transition Speed / Duration: {settings.animationDuration}ms
              </label>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={settings.animationDuration}
                onChange={(e) => setSettings({ ...settings, animationDuration: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Fast (200ms)</span>
                <span>Normal (600ms)</span>
                <span>Smooth (1500ms)</span>
              </div>
            </div>

            {/* 6. Auto Animation Toggle */}
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Auto Rotation / Animation
              </label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, autoAnimation: !settings.autoAnimation, autoRotation: !settings.autoAnimation })}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    settings.autoAnimation
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {settings.autoAnimation ? 'ENABLED (ROTATING)' : 'PAUSED (STATIC)'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                When enabled, notices cycle automatically.
              </p>
            </div>

          </div>

          {/* ADVANCED TOGGLES */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700/80">
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
              Interactive Behaviors & Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.hoverPause}
                  onChange={(e) => setSettings({ ...settings, hoverPause: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Hover Pause</div>
                  <div className="text-[10px] text-slate-400">Pause rotation on mouse hover</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.resumeAfterHover}
                  onChange={(e) => setSettings({ ...settings, resumeAfterHover: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Resume After Hover</div>
                  <div className="text-[10px] text-slate-400">Restart rotation when cursor leaves</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.touchPause}
                  onChange={(e) => setSettings({ ...settings, touchPause: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Touch Pause (Mobile)</div>
                  <div className="text-[10px] text-slate-400">Pause rotation during touch/scroll</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.infiniteLoop}
                  onChange={(e) => setSettings({ ...settings, infiniteLoop: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">Infinite Loop</div>
                  <div className="text-[10px] text-slate-400">Seamless continuous repeat</div>
                </div>
              </label>
            </div>
          </div>

          {/* SAVE AND RESTORE BUTTONS */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700/80 flex-wrap gap-4">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="flex items-center gap-2 px-5 py-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-black transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Restore Default Settings
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              SAVE & APPLY ANIMATION SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: LIVE ANIMATION PREVIEW ──────────────── */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                Interactive Hero Box Preview
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Test and observe your chosen animation mode ({settings.animationType}, direction: {settings.animationDirection}, speed: {settings.animationDuration}ms, visible: {settings.visibleCount})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewPaused(!previewPaused)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  previewPaused
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {previewPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {previewPaused ? 'Resume Playback' : 'Pause Playback'}
              </button>

              <button
                onClick={() => setPreviewIndex((prev) => (prev + 1) % Math.max(1, activeNoticesList.length))}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black cursor-pointer"
              >
                Next Group <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SIMULATED WIDGET */}
          <div className="flex justify-center p-4">
            <div
              className="w-full max-w-[440px] min-h-[380px] md:h-[440px] rounded-[32px] p-[1.5px] shadow-2xl flex flex-col relative transition-all duration-700"
              style={{ background: 'linear-gradient(135deg, rgba(255,75,75,0.7), rgba(234,179,8,0.7), rgba(34,197,94,0.7), rgba(59,130,246,0.7))' }}
            >
              <div className="w-full h-full bg-[#fcfdfd] dark:bg-slate-900 rounded-[30px] flex flex-col p-5 relative overflow-hidden shadow-inner flex-1">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-500 border border-red-100 dark:border-red-500/20 shadow-sm">
                      <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={2.2} />
                    </div>
                    <h3 className="font-extrabold text-[#1e293b] dark:text-white text-[22px] tracking-tight leading-none">
                      Live Notices
                    </h3>
                  </div>

                  <div className="relative">
                    <BellRing className="w-8 h-8 text-amber-500 drop-shadow-sm animate-bounce" strokeWidth={2.2} />
                    {activeNoticesList.length > 0 && (
                      <div className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[11px] font-black w-[20px] h-[20px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                        {activeNoticesList.length}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cards Container */}
                <div
                  className={`flex-1 flex flex-col gap-3 overflow-hidden transition-all duration-500 ${
                    previewAnimating
                      ? settings.animationType === 'fade'
                        ? 'opacity-0'
                        : settings.animationDirection === 'down'
                        ? 'translate-y-6 opacity-0'
                        : '-translate-y-6 opacity-0'
                      : 'opacity-100 transform-none'
                  }`}
                  style={{ transitionDuration: `${settings.animationDuration || 600}ms` }}
                >
                  {previewDisplayItems.length > 0 ? (
                    previewDisplayItems.map((msg, idx) => (
                      <div
                        key={msg._id || idx}
                        className="p-3.5 rounded-[20px] bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700/80 flex gap-3 items-center relative overflow-hidden"
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r pointer-events-none ${
                            idx % 2 === 0
                              ? 'from-amber-100/50 via-emerald-100/20'
                              : 'from-sky-100/50 via-teal-100/20'
                          } to-transparent z-0`}
                        />

                        <div className="shrink-0 w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10">
                          {renderNoticeIcon(msg)}
                        </div>

                        <div className="h-8 w-[1.5px] bg-slate-200 dark:bg-slate-700 shrink-0 z-10" />

                        <div className="flex-1 min-w-0 z-10">
                          <h4 className="text-[#0f172a] dark:text-white font-extrabold text-[14px] uppercase tracking-tight truncate">
                            {msg.title}
                          </h4>
                          <span className="bg-[#fff1f2] dark:bg-rose-500/15 text-[#f43f5e] dark:text-rose-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase inline-block my-0.5">
                            {msg.badge || 'LIVE'}
                          </span>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                            {msg.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-6 text-slate-400 text-xs">
                      No live notices active to preview.
                    </div>
                  )}
                </div>

                {/* Bottom Rainbow button */}
                <div className="mt-auto pt-3 z-10">
                  <div
                    className="w-full py-[13px] rounded-full font-bold text-white text-[15px] shadow-[0_8px_20px_rgba(251,113,133,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'linear-gradient(to right, #f43f5e, #f97316, #eab308, #10b981, #0ea5e9)' }}
                  >
                    See All Notices <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: CREATE / EDIT NOTICE ──────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl">
                  <Megaphone className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">
                    {editingNotice ? 'EDIT LIVE BROADCAST' : 'NEW LIVE BROADCAST'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Official Notice & Alert Configuration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-slate-500 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto custom-scroll flex-1">
              
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Notice Headline / Title *
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. HAPPY DIWALI ✨ OFFERS or TODAY OFFER ! PAN CARD MADE ₹199 ONLY"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Short Description (Card Preview)
                </label>
                <input
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short 1-2 sentence preview"
                />
              </div>

              {/* Full Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Full Description (Displayed on "See More" and "See All Notices") *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none"
                  placeholder="Provide full description, offers, requirements, or instructions..."
                />
              </div>

              {/* Icon Selection & Upload */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Notice Icon (Select Emoji or Upload Custom Graphic)
                </label>

                {/* Preset Emojis */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {EMOJI_PRESETS.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, icon: item.emoji, iconType: 'emoji' });
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        formData.icon === item.emoji && !selectedFile
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Emoji input or Image File */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Custom Emoji</span>
                    <input
                      value={formData.icon}
                      onChange={(e) => {
                        setFormData({ ...formData, icon: e.target.value, iconType: 'emoji' });
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                      placeholder="e.g. 🎁, 🚀, 🪪"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Or Upload Custom Icon Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                          setFilePreview(URL.createObjectURL(e.target.files[0]));
                          setFormData({ ...formData, iconType: 'image' });
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {filePreview && (
                  <div className="flex items-center gap-3 pt-2">
                    <img src={filePreview} alt="Preview" className="w-10 h-10 object-contain rounded-xl border border-slate-200" />
                    <span className="text-[11px] text-slate-500 font-bold">Image icon selected</span>
                  </div>
                )}
              </div>

              {/* Type, Badge & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Category Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Badge Text
                  </label>
                  <input
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                    placeholder="LIVE"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High (Top)</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Scheduling & Expiry */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Scheduling & Lifetime Expiry Logic
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLifetime}
                      onChange={(e) => setFormData({ ...formData, isLifetime: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      Lifetime Notice (Never Expires)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">Start Date & Time (Optional)</span>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Expiry Date & Time {!formData.isLifetime ? '(Automatic Removal)' : '(Disabled - Lifetime)'}
                    </span>
                    <input
                      type="datetime-local"
                      disabled={formData.isLifetime}
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white ${
                        formData.isLifetime ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Action Button Label (Optional)
                  </label>
                  <input
                    value={formData.actionText}
                    onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                    placeholder="e.g. Apply Now or View Details"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Action URL / Route (Optional)
                  </label>
                  <input
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                    placeholder="e.g. /services/pan or https://..."
                  />
                </div>
              </div>

              {/* Status Toggle Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: !formData.status })}
                  className={`w-full py-3.5 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                    formData.status
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {formData.status ? '● NOTICE WILL BE BROADCASTED LIVE' : '○ NOTICE IS DISABLED (DRAFT)'}
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={submitting}
                  type="submit"
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone size={16} />}
                  {editingNotice ? 'UPDATE NOTICE' : 'BROADCAST NOTICE NOW'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveNoticesManager;
