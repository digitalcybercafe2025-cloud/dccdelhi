import React, { useState, useEffect, useCallback } from 'react';
import api, { getMediaUrl } from '../../api/axios';
import { LayoutGrid, List, Settings as SettingsIcon, Plus, Star, Trash2, Edit2, CheckCircle2, XCircle, Sliders, Check } from 'lucide-react';

const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5';
const modalInputCls = 'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold outline-none focus:border-indigo-400 transition-colors';

const EMPTY_FORM = { name: '', role: 'Customer', message: '', image: '', rating: 5, order: 0, imageFile: null as File | null };

const TestimonialsManager: React.FC = () => {
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('testimonials_view_mode') as 'grid' | 'list') || 'grid');
    const [showModal, setShowModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Testimonial Display Settings
    const [tSettings, setTSettings] = useState({
        testimonialAutoplay: true,
        testimonialInterval: 5,
        testimonialMinRating: 4,
        testimonialShowAvatar: true
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/testimonials/all');
            setTestimonials(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get('/settings');
            if (res.data?.data) {
                const s = res.data.data;
                setTSettings({
                    testimonialAutoplay: s.testimonialAutoplay !== undefined ? s.testimonialAutoplay : true,
                    testimonialInterval: s.testimonialInterval || 5,
                    testimonialMinRating: s.testimonialMinRating || 4,
                    testimonialShowAvatar: s.testimonialShowAvatar !== undefined ? s.testimonialShowAvatar : true
                });
            }
        } catch (e) {
            console.error('Failed to load testimonial settings', e);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        fetchSettings();
    }, [fetchAll, fetchSettings]);

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('testimonials_view_mode', mode);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm(f => ({ ...f, imageFile: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const openAdd = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEdit = (t: any) => {
        setEditing(t);
        setForm({
            name: t.name,
            role: t.role || 'Customer',
            message: t.message,
            image: t.image || '',
            rating: t.rating || 5,
            order: t.order || 0,
            imageFile: null
        });
        setImagePreview(t.image ? getMediaUrl(t.image) : null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('role', form.role);
            fd.append('message', form.message);
            fd.append('rating', String(form.rating));
            fd.append('order', String(form.order));
            if (form.imageFile) {
                fd.append('image', form.imageFile);
            } else if (form.image) {
                fd.append('image', form.image);
            }
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (editing) await api.put(`/testimonials/${editing._id}`, fd, config);
            else await api.post('/testimonials', fd, config);
            setShowModal(false);
            fetchAll();
        } catch (err: any) {
            console.error('Failed to save testimonial', err);
            const msg = err?.response?.data?.message || err?.message || 'Failed to save';
            alert(`Failed to save: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        setSettingsSaved(false);
        try {
            await api.put('/settings', tSettings);
            setSettingsSaved(true);
            setTimeout(() => {
                setSettingsSaved(false);
                setShowSettingsModal(false);
            }, 1200);
        } catch (err) {
            console.error('Failed to save settings', err);
            alert('Failed to save testimonial settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const toggleActive = async (id: string) => {
        try {
            await api.patch(`/testimonials/${id}/toggle`);
            fetchAll();
        } catch {
            alert('Toggle failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;
        try {
            await api.delete(`/testimonials/${id}`);
            fetchAll();
        } catch {
            alert('Delete failed');
        }
    };

    return (
        <div className="space-y-4">
            {/* ── Top Toolbar ── */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                <div>
                    <h2 className="text-slate-800 font-black text-base uppercase tracking-tight">Client Testimonials</h2>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
                        {testimonials.length} Total •{' '}
                        <span className="text-emerald-500">{testimonials.filter(t => t.active).length} Published</span>
                    </p>
                </div>

                {/* Right controls: List/Grid button -> Settings button -> + New Review button */}
                <div className="flex items-center gap-2.5">
                    {/* 1. List / Grid Toggle Button */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                        <button
                            type="button"
                            onClick={() => handleViewModeChange('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleViewModeChange('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* 2. Settings Button */}
                    <button
                        type="button"
                        onClick={() => setShowSettingsModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 active:scale-95"
                        title="Testimonial Display Settings"
                    >
                        <SettingsIcon size={15} className="text-slate-500" />
                        <span className="hidden sm:inline">Settings</span>
                    </button>

                    {/* 3. New Review (Violet Button) */}
                    <button
                        type="button"
                        onClick={openAdd}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-indigo-500/25 active:scale-95"
                    >
                        <Plus size={15} strokeWidth={3} />
                        <span>New Review</span>
                    </button>
                </div>
            </div>

            {/* ── Content View ── */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : testimonials.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-xs">
                    No client reviews yet. Click "+ New Review" to publish one.
                </div>
            ) : viewMode === 'grid' ? (
                /* ── GRID VIEW ── */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {testimonials.map(t => (
                        <div
                            key={t._id}
                            className={`bg-white border rounded-[2rem] p-6 shadow-sm transition-all hover:shadow-xl hover:scale-[1.01] duration-300 group relative border-b-4 flex flex-col justify-between ${
                                t.active ? 'border-slate-100 border-b-emerald-500/20' : 'border-red-50 border-b-red-500/20 opacity-75'
                            }`}
                        >
                            <div>
                                {/* Author row with circular avatar */}
                                <div className="flex flex-col items-center text-center mb-4">
                                    <div className="relative mb-3">
                                        {t.image ? (
                                            <img
                                                src={getMediaUrl(t.image)}
                                                alt={t.name}
                                                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50 group-hover:ring-indigo-50 transition-all"
                                                onError={e => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${t.name}&background=e0e7ff&color=4338ca`)}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600 ring-4 ring-slate-50">
                                                {t.name[0]}
                                            </div>
                                        )}
                                        <div
                                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                                                t.active ? 'bg-emerald-500' : 'bg-red-500'
                                            }`}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {t.name}
                                        </p>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">{t.role}</p>
                                        <div className="flex justify-center gap-0.5 mt-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={13}
                                                    className={i < (t.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="relative mb-5">
                                    <div className="absolute -top-3 left-2 text-indigo-100 italic font-serif text-3xl pointer-events-none">“</div>
                                    <p className="text-slate-600 text-xs font-semibold leading-relaxed line-clamp-4 italic px-2">
                                        {t.message}
                                    </p>
                                </div>
                            </div>

                            {/* Actions bottom */}
                            <div className="flex gap-2 pt-2 border-t border-slate-50">
                                <button
                                    onClick={() => openEdit(t)}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Edit2 size={12} />
                                    <span>Modify</span>
                                </button>
                                <button
                                    onClick={() => toggleActive(t._id)}
                                    title={t.active ? "Hide Review" : "Publish Review"}
                                    className={`p-2.5 rounded-xl transition-all ${
                                        t.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                    }`}
                                >
                                    {t.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                </button>
                                <button
                                    onClick={() => handleDelete(t._id)}
                                    title="Delete Review"
                                    className="p-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ── LIST / TABLE VIEW ── */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="py-3.5 px-5">Client</th>
                                    <th className="py-3.5 px-4">Rating</th>
                                    <th className="py-3.5 px-4">Review Message</th>
                                    <th className="py-3.5 px-4 text-center">Priority</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                {testimonials.map(t => (
                                    <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Client Info */}
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-3">
                                                {t.image ? (
                                                    <img
                                                        src={getMediaUrl(t.image)}
                                                        alt={t.name}
                                                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                                                        onError={e => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${t.name}&background=e0e7ff&color=4338ca`)}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600">
                                                        {t.name[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-slate-900">{t.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.role}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Rating */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={i < (t.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                                                    />
                                                ))}
                                                <span className="ml-1 text-[11px] font-bold text-slate-600">({t.rating || 5})</span>
                                            </div>
                                        </td>

                                        {/* Message */}
                                        <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                                            <p className="truncate text-slate-600 font-medium italic">"{t.message}"</p>
                                        </td>

                                        {/* Priority */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px]">
                                                {t.order || 0}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => toggleActive(t._id)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    t.active
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                            >
                                                {t.active ? 'Published' : 'Hidden'}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openEdit(t)}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t._id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Testimonials Settings Modal ── */}
            {showSettingsModal && (
                <div
                    className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={e => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}
                >
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl w-full max-w-md p-6 overflow-hidden">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Sliders size={16} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Testimonial Settings</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Public display rules</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-4 pt-5">
                            {/* Autoplay Toggle */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="font-bold text-xs text-slate-800">Auto-Rotate Reviews</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Automatically cycle testimonials on home page</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTSettings(s => ({ ...s, testimonialAutoplay: !s.testimonialAutoplay }))}
                                    className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                                        tSettings.testimonialAutoplay ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                                    }`}
                                >
                                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                </button>
                            </div>

                            {/* Rotation Speed */}
                            <div>
                                <label className={labelCls}>Rotation Interval (Seconds)</label>
                                <select
                                    value={tSettings.testimonialInterval}
                                    onChange={e => setTSettings(s => ({ ...s, testimonialInterval: Number(e.target.value) }))}
                                    className={modalInputCls}
                                >
                                    <option value={3}>3 Seconds (Fast)</option>
                                    <option value={5}>5 Seconds (Recommended)</option>
                                    <option value={8}>8 Seconds (Relaxed)</option>
                                    <option value={10}>10 Seconds (Slow)</option>
                                </select>
                            </div>

                            {/* Minimum Rating Filter */}
                            <div>
                                <label className={labelCls}>Show on Public Website</label>
                                <select
                                    value={tSettings.testimonialMinRating}
                                    onChange={e => setTSettings(s => ({ ...s, testimonialMinRating: Number(e.target.value) }))}
                                    className={modalInputCls}
                                >
                                    <option value={1}>Show All Ratings (1 to 5 Stars)</option>
                                    <option value={3}>3 Stars & Above Only</option>
                                    <option value={4}>4 & 5 Stars Only (Recommended)</option>
                                    <option value={5}>5 Stars Only</option>
                                </select>
                            </div>

                            {/* Show Avatar Toggle */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="font-bold text-xs text-slate-800">Show Client Photos</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Display avatar / photo in testimonial cards</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTSettings(s => ({ ...s, testimonialShowAvatar: !s.testimonialShowAvatar }))}
                                    className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                                        tSettings.testimonialShowAvatar ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                                    }`}
                                >
                                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                </button>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSettingsModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-1.5"
                                >
                                    {savingSettings ? 'Saving...' : settingsSaved ? (
                                        <>
                                            <Check size={14} />
                                            <span>Saved!</span>
                                        </>
                                    ) : (
                                        'Save Settings'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Review Create / Edit Modal ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">
                                    {editing ? 'Edit Testimonial' : 'Add Testimonial'}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                    Client review & feedback
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col items-center">
                                <label className={labelCls}>Client Avatar / Photo</label>
                                <div className="group relative w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-all cursor-pointer">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => (document.getElementById('t-up') as any).click()}
                                                    className="p-1.5 bg-white rounded-lg text-indigo-600 font-bold text-xs"
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div onClick={() => (document.getElementById('t-up') as any).click()} className="text-center">
                                            <Plus size={20} className="text-slate-400 mx-auto" />
                                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">Upload</span>
                                        </div>
                                    )}
                                    <input id="t-up" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Full Name *</label>
                                    <input
                                        required
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Ramesh Sharma"
                                        className={modalInputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Role / Designation</label>
                                    <input
                                        value={form.role}
                                        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                        placeholder="e.g. Business Owner"
                                        className={modalInputCls}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Review Content *</label>
                                <textarea
                                    required
                                    value={form.message}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    className={`${modalInputCls} h-24 resize-none`}
                                    placeholder="Type client feedback or testimony here..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Star Rating</label>
                                    <select
                                        value={form.rating}
                                        onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                                        className={modalInputCls}
                                    >
                                        {[5, 4, 3, 2, 1].map(r => (
                                            <option key={r} value={r}>
                                                {r} {r === 1 ? 'Star' : 'Stars'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Display Order</label>
                                    <input
                                        type="number"
                                        value={form.order}
                                        onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                                        className={modalInputCls}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60"
                                >
                                    {saving ? 'Saving...' : editing ? 'Update Review' : 'Publish Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestimonialsManager;