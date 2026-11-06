import React, { useState, useEffect, useCallback } from 'react';
import api, { getMediaUrl } from '../../api/axios';

// ── Design tokens matching Dashboard ─────────────────────────────────────────
const inputCls = 'px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm font-bold outline-none focus:border-blue-400 transition-colors';
const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5';
const modalInputCls = 'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold outline-none focus:border-blue-400 transition-colors';
const modalSelectCls = 'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold outline-none focus:border-blue-400';

const EMPTY = {
    title: '',
    description: '',
    image: '',
    fee: 0,
    category: 'Government',
    color: 'blue',
    priority: 0,
    estimatedDays: '7-10 working days',
    requiredDocs: '',
    mandatoryDocs: '',
    idProofs: '',
    addressProofs: '',
    otherDocs: '',
    externalLink: ''
};

const ServicesManager: React.FC = () => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('admin_services_view') as any) || 'grid');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const API_BASE = 'http://localhost:5000';

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/services/all');
            setServices(res.data.data || []);
        }
        catch (e: any) {
            console.error(e);
            setError('Failed to fetch services. Access denied or server error.');
        }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    useEffect(() => {
        localStorage.setItem('admin_services_view', viewMode);
    }, [viewMode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const openAdd = () => {
        setEditing(null); setForm(EMPTY); setImagePreview(null); setSelectedFile(null); setShowModal(true);
        setError(null); setSuccess(null);
    };
    const openEdit = (svc: any) => {
        setEditing(svc);
        const hasCategories = (svc.mandatoryDocs && svc.mandatoryDocs.length > 0) ||
            (svc.idProofs && svc.idProofs.length > 0) ||
            (svc.addressProofs && svc.addressProofs.length > 0) ||
            (svc.otherDocs && svc.otherDocs.length > 0);

        setForm({
            title: svc.title,
            description: svc.description,
            image: svc.image,
            fee: svc.fee,
            category: svc.category,
            color: svc.color,
            priority: svc.priority || 0,
            estimatedDays: svc.estimatedDays || '7-10 working days',
            requiredDocs: Array.isArray(svc.requiredDocs) ? svc.requiredDocs.join(', ') : (svc.requiredDocs || ''),
            mandatoryDocs: Array.isArray(svc.mandatoryDocs)
                ? svc.mandatoryDocs.join(', ')
                : (svc.mandatoryDocs || (!hasCategories && Array.isArray(svc.requiredDocs) ? svc.requiredDocs.join(', ') : '')),
            idProofs: Array.isArray(svc.idProofs) ? svc.idProofs.join(', ') : (svc.idProofs || ''),
            addressProofs: Array.isArray(svc.addressProofs) ? svc.addressProofs.join(', ') : (svc.addressProofs || ''),
            otherDocs: Array.isArray(svc.otherDocs) ? svc.otherDocs.join(', ') : (svc.otherDocs || ''),
            externalLink: svc.externalLink || ''
        });
        const imgUrl = getMediaUrl(svc.image);
        setImagePreview(imgUrl);
        setSelectedFile(null);
        setShowModal(true);
        setError(null); setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key !== 'image') {
                    formData.append(key, (form as any)[key]);
                }
            });

            // Combine categories into requiredDocs for 100% backward compatibility
            const combinedList = [
                ...form.mandatoryDocs.split(',').map(s => s.trim()).filter(Boolean),
                ...form.idProofs.split(',').map(s => s.trim()).filter(Boolean),
                ...form.addressProofs.split(',').map(s => s.trim()).filter(Boolean),
                ...form.otherDocs.split(',').map(s => s.trim()).filter(Boolean)
            ];
            if (combinedList.length > 0) {
                formData.set('requiredDocs', combinedList.join(', '));
            }

            if (selectedFile) {
                formData.append('image', selectedFile);
            } else {
                formData.append('image', form.image);
            }

            let res;
            if (editing) {
                res = await api.put(`/services/${editing._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post('/services', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (res.data.success) {
                setSuccess(editing ? 'Service updated successfully!' : 'Service created successfully!');
                setTimeout(() => {
                    setShowModal(false);
                    fetchServices();
                }, 1500);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save service');
        }
        finally { setSaving(false); }
    };

    const handleToggle = async (svc: any) => {
        try { await api.put(`/services/${svc._id}`, { ...svc, requiredDocs: svc.requiredDocs, active: !svc.active }); fetchServices(); }
        catch { alert('Toggle failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        try { await api.delete(`/services/${id}`); fetchServices(); }
        catch { alert('Delete failed'); }
    };

    const filtered = services.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4">
            {/* ── Header bar ── */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                <div className="flex flex-1 items-center gap-4">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..."
                        className={`flex-1 max-w-sm ${inputCls}`} />
                    {/* View Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                        </button>
                    </div>
                </div>
                <button onClick={openAdd}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    New Service
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(svc => (
                        <div key={svc._id} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-xl hover:scale-[1.02] duration-500 group ${svc.active ? 'border-slate-100' : 'border-red-100 grayscale'}`}>
                            {/* Image with improved design */}
                            <div className="relative h-40 m-3 rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-50">
                                <img
                                    src={svc.image?.startsWith('/') ? `${API_BASE}${svc.image}` : svc.image}
                                    alt={svc.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={e => (e.currentTarget.src = 'https://placehold.co/400x200/f8fafc/94a3b8?text=Load+Error')}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                <div className="absolute top-3 left-3 flex gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/20">{svc.category}</span>
                                </div>
                                {!svc.active && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-red-500 text-white shadow-lg">Disabled</span>
                                    </div>
                                )}
                            </div>
                            {/* Card body */}
                            <div className="px-6 pb-6 pt-2">
                                <h3 className="font-black text-slate-800 text-sm mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{svc.title}</h3>
                                <p className="text-slate-400 text-[11px] font-bold leading-relaxed line-clamp-2 mb-4 h-8">{svc.description}</p>

                                <div className="flex items-center justify-between mb-5 px-1">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Base Fee</span>
                                        <span className="text-base font-black text-emerald-500">₹{svc.fee}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Priority</span>
                                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{svc.priority || 0}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(svc)}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(svc._id)}
                                        className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-[10px] font-black transition-all active:scale-90">
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-b-4 border-b-blue-500/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    {['Service', 'Category', 'Fee', 'Priority', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(svc => (
                                    <tr key={svc._id} className="hover:bg-blue-50/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={svc.image?.startsWith('/') ? `${API_BASE}${svc.image}` : svc.image}
                                                    className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                                                    onError={e => (e.currentTarget.src = 'https://placehold.co/100x100?text=Err')}
                                                />
                                                <span className="text-sm font-bold text-slate-700">{svc.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{svc.category}</td>
                                        <td className="px-6 py-4 text-sm font-black text-emerald-500 tabular-nums">₹{svc.fee}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{svc.priority || 0}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleToggle(svc)} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${svc.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                {svc.active ? 'Live' : 'Off'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(svc)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                                                <button onClick={() => handleDelete(svc._id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {filtered.length === 0 && !loading && (
                <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em] italic">Void: No Services Found</div>
            )}

            {/* ── Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800">{editing ? 'Edit Service' : 'Add New Service'}</h2>
                            <button onClick={() => setShowModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">✕</button>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 font-bold text-xs">
                                <span>⚠️ {error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-600 font-bold text-xs">
                                <span>✅ {success}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className={labelCls}>Service Showcase Image</label>
                                <div className="group relative h-48 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => (document.getElementById('file-up') as any).click()} className="px-4 py-2 bg-white rounded-lg text-xs font-black uppercase text-slate-800">Change Image</button>
                                            </div>
                                        </>
                                    ) : (
                                        <div onClick={() => (document.getElementById('file-up') as any).click()} className="text-center cursor-pointer">
                                            <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Preview File</p>
                                        </div>
                                    )}
                                    <input id="file-up" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                                <div className="mt-3">
                                    <label className={labelCls}>Or Paste External Image URL</label>
                                    <input
                                        type="text"
                                        value={form.image.startsWith('/') ? '' : form.image}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setForm(f => ({ ...f, image: val }));
                                            setSelectedFile(null);
                                            if (val) setImagePreview(val);
                                            else setImagePreview(null);
                                        }}
                                        placeholder="https://images.unsplash.com/..."
                                        className={modalInputCls}
                                    />
                                </div>
                            </div>

                            {[['title', 'Title', 'text', 'col-span-2'], ['description', 'Description', 'textarea', 'col-span-2']].map(([key, label, type, span]) => (
                                <div key={key} className={span as string}>
                                    <label className={labelCls}>{label}</label>
                                    {type === 'textarea'
                                        ? <textarea required value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={`${modalInputCls} h-20 resize-none`} />
                                        : <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required className={modalInputCls} />
                                    }
                                </div>
                            ))}
                            <div>
                                <label className={labelCls}>Fee (₹)</label>
                                <input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: Number(e.target.value) }))} className={modalInputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Priority</label>
                                <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} className={modalInputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Category</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={modalSelectCls}>
                                    {['Government', 'Digital', 'Academic'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Color</label>
                                <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className={modalSelectCls}>
                                    {['blue', 'green', 'orange', 'red'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls}>External Application Link (Optional)</label>
                                <input value={form.externalLink} onChange={e => setForm(f => ({ ...f, externalLink: e.target.value }))}
                                    placeholder="https://..." className={modalInputCls} />
                            </div>
                            {/* ── Categorized Document Requirements ── */}
                            <div className="col-span-2 bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        📁 Document Requirements by Category
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">Comma-separated lists</span>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-1">
                                        1. Mandatory Documents (अनिवार्य दस्तावेज़ *)
                                    </label>
                                    <input
                                        value={form.mandatoryDocs}
                                        onChange={e => setForm(f => ({ ...f, mandatoryDocs: e.target.value }))}
                                        placeholder="Passport Photo, Signature, Application Form..."
                                        className={modalInputCls}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Customer must upload every item listed here.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                                        2. Identity Proofs (पहचान पत्र - Any One)
                                    </label>
                                    <input
                                        value={form.idProofs}
                                        onChange={e => setForm(f => ({ ...f, idProofs: e.target.value }))}
                                        placeholder="Aadhaar Card, PAN Card, Voter ID, Passport, Driving License..."
                                        className={modalInputCls}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Customer selects and uploads their available ID proof.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                                        3. Address Proofs (पते का प्रमाण - Any One)
                                    </label>
                                    <input
                                        value={form.addressProofs}
                                        onChange={e => setForm(f => ({ ...f, addressProofs: e.target.value }))}
                                        placeholder="Electricity Bill, Ration Card, Domicile Certificate, Water Bill..."
                                        className={modalInputCls}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Customer selects and uploads their address proof.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">
                                        4. Other Supporting Proofs (अन्य सहायक दस्तावेज़ - Optional)
                                    </label>
                                    <input
                                        value={form.otherDocs}
                                        onChange={e => setForm(f => ({ ...f, otherDocs: e.target.value }))}
                                        placeholder="Income Certificate, 10th Marksheet, Caste Certificate..."
                                        className={modalInputCls}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Optional supporting proofs uploaded if applicable.</p>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className={labelCls}>Estimated Processing Timeline</label>
                                <input value={form.estimatedDays} onChange={e => setForm(f => ({ ...f, estimatedDays: e.target.value }))} className={modalInputCls} />
                            </div>
                            <div className="col-span-2 flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-black text-sm uppercase transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase transition-colors disabled:opacity-60">
                                    {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesManager;
