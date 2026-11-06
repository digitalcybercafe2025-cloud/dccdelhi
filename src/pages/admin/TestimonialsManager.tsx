import React, { useState, useEffect, useCallback } from 'react';
import api, { getMediaUrl } from '../../api/axios';

const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5';
const modalInputCls = 'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold outline-none focus:border-blue-400 transition-colors';

const EMPTY_FORM = { name: '', role: 'Customer', message: '', image: '', rating: 5, order: 0, imageFile: null as File | null };

const TestimonialsManager: React.FC = () => {
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/testimonials/all'); setTestimonials(res.data.data || []); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm(f => ({ ...f, imageFile: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setImagePreview(null); setShowModal(true); };
    const openEdit = (t: any) => {
        setEditing(t);
        setForm({ name: t.name, role: t.role || 'Customer', message: t.message, image: t.image || '', rating: t.rating || 5, order: t.order || 0, imageFile: null });
        setImagePreview(t.image ? getMediaUrl(t.image) : null);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
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
        }
        finally { setSaving(false); }
    };

    const toggleActive = async (id: string) => {
        try { await api.patch(`/testimonials/${id}/toggle`); fetchAll(); }
        catch { alert('Toggle failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete testimonial?')) return;
        try { await api.delete(`/testimonials/${id}`); fetchAll(); }
        catch { alert('Delete failed'); }
    };

    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                <div>
                    <h2 className="text-slate-800 font-black text-base uppercase tracking-tight">Client Testimonials</h2>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
                        {testimonials.length} Total •{' '}
                        <span className="text-emerald-500">{testimonials.filter(t => t.active).length} Published</span>
                    </p>
                </div>
                <button onClick={openAdd}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    New Review
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {testimonials.map(t => (
                        <div key={t._id}
                            className={`bg-white border rounded-[2rem] p-6 shadow-sm transition-all hover:shadow-xl hover:scale-[1.02] duration-500 group relative border-b-4 ${t.active ? 'border-slate-50 border-b-emerald-500/10' : 'border-red-50 border-b-red-500/10 opacity-70 grayscale'}`}>

                            {/* Author row with circular avatar */}
                            <div className="flex flex-col items-center text-center mb-5">
                                <div className="relative mb-3">
                                    {t.image ? (
                                        <img
                                            src={getMediaUrl(t.image)}
                                            alt={t.name}
                                            className="w-16 h-16 rounded-3xl object-cover ring-4 ring-slate-50 group-hover:ring-blue-50 transition-all"
                                            onError={e => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${t.name}&background=eff6ff&color=2563eb`)}
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl font-black text-blue-600 ring-4 ring-slate-50">
                                            {t.name[0]}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${t.active ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{t.name}</p>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">{t.role}</p>
                                    <div className="flex justify-center gap-0.5 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-3 h-3 ${i < (t.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Message Bubble */}
                            <div className="relative mb-6">
                                <div className="absolute -top-2 left-4 text-slate-100 italic font-serif text-4xl pointer-events-none">“</div>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed line-clamp-4 italic px-2">
                                    {t.message}
                                </p>
                            </div>

                            {/* Actions overlay / bottom */}
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(t)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95">
                                    Modify
                                </button>
                                <button onClick={() => toggleActive(t._id)}
                                    className={`p-3 rounded-xl transition-all ${t.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                                </button>
                                <button onClick={() => handleDelete(t._id)}
                                    className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-xl transition-all">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {testimonials.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300 font-black uppercase tracking-[0.2em]">
                    Empty: No client reviews published
                </div>
            )}

            {/* ── Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
                            <button onClick={() => setShowModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex flex-col items-center">
                                <label className={labelCls}>Client Avatar</label>
                                <div className="group relative w-24 h-24 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-blue-400 transition-all">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => (document.getElementById('t-up') as any).click()} className="p-2 bg-white rounded-lg text-blue-600">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div onClick={() => (document.getElementById('t-up') as any).click()} className="text-center cursor-pointer">
                                            <svg className="w-6 h-6 text-slate-300 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                    )}
                                    <input id="t-up" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Full Name</label>
                                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={modalInputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Role / Designation</label>
                                    <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={modalInputCls} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Review Content</label>
                                <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    className={`${modalInputCls} h-28 resize-none`} placeholder="Type client review here..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Star Rating</label>
                                    <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                                        className={`${modalInputCls} appearance-none`}>
                                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Display Priority</label>
                                    <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={modalInputCls} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-400 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest transition-all">
                                    Dismiss
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60">
                                    {saving ? 'Processing...' : editing ? 'Update Review' : 'Publish Review'}
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
