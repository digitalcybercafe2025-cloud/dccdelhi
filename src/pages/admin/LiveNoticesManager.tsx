import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, MoveUp, MoveDown, Zap, AlertTriangle, Megaphone, CreditCard, Loader2, Calendar } from 'lucide-react';
import api from '../../api/axios';

interface Notice {
    _id: string;
    title: string;
    description: string;
    type: 'Important' | 'Special' | 'Alert';
    badge: string;
    icon: string;
    status: boolean;
    order: number;
    expiryDate?: string;
    createdAt: string;
}

const ICONS = ['Zap', 'AlertTriangle', 'Megaphone', 'CreditCard', 'Briefcase', 'Info', 'ShieldCheck'];

const LiveNoticesManager: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        type: 'Important',
        badge: 'LIVE',
        icon: 'Zap',
        status: true,
        order: 0,
        expiryDate: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await api.get('/hero/notices');
            setNotices(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingNotice) {
                await api.put(`/hero/notices/${editingNotice._id}`, formData);
            } else {
                await api.post('/hero/notices', formData);
            }
            fetchNotices();
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingNotice(null);
        setFormData({ title: '', description: '', type: 'Important', badge: 'LIVE', icon: 'Zap', status: true, order: 0, expiryDate: '' });
    };

    const openEdit = (notice: Notice) => {
        setEditingNotice(notice);
        setFormData({ ...notice, expiryDate: notice.expiryDate ? notice.expiryDate.split('T')[0] : '' });
        setIsModalOpen(true);
    };

    const deleteNotice = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/hero/notices/${id}`);
            fetchNotices();
        } catch (err) {
            console.error(err);
        }
    };

    const moveNotice = async (id: string, direction: 'up' | 'down') => {
        const index = notices.findIndex(n => n._id === id);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === notices.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const currentNotice = notices[index];
        const targetNotice = notices[targetIndex];

        try {
            await api.put(`/hero/notices/${currentNotice._id}`, { order: targetNotice.order });
            await api.put(`/hero/notices/${targetNotice._id}`, { order: currentNotice.order });
            fetchNotices();
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (name: string) => {
        switch (name) {
            case 'Zap': return <Zap size={20} />;
            case 'AlertTriangle': return <AlertTriangle size={20} />;
            case 'Megaphone': return <Megaphone size={20} />;
            case 'CreditCard': return <CreditCard size={20} />;
            default: return <Zap size={20} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Live Notices Manager</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time alerts and government schemes</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> BROADCAST NEW NOTICE
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {notices.map((notice, idx) => (
                        <div key={notice._id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm transition-all hover:shadow-xl group flex gap-5 items-start">
                            <div className="shrink-0 p-4 bg-slate-50 text-blue-600 rounded-[1.5rem] border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                {getIcon(notice.icon)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-slate-800 tracking-tight">{notice.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${notice.status ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {notice.status ? 'LIVE' : 'OFF'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => moveNotice(notice._id, 'up')} className="p-1.5 hover:bg-slate-50 text-slate-300 hover:text-blue-600 rounded-lg"><MoveUp size={14} /></button>
                                        <button onClick={() => moveNotice(notice._id, 'down')} className="p-1.5 hover:bg-slate-50 text-slate-300 hover:text-blue-600 rounded-lg"><MoveDown size={14} /></button>
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 line-clamp-2 mb-4">{notice.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{notice.type}</span>
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{notice.badge}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(notice)} className="p-2 hover:bg-slate-50 text-slate-300 hover:text-blue-600 rounded-xl transition-all"><Edit3 size={16} /></button>
                                        <button onClick={() => deleteNotice(notice._id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{editingNotice ? 'EDIT NOTICE' : 'NEW BROADCAST'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Live Alert System Configuration</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-90"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notice Headline</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                                    placeholder="e.g. Voter ID Corrections"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all h-24 resize-none"
                                    placeholder="Provide details about the scheme or alert..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notice Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all appearance-none"
                                    >
                                        <option value="Important">Important</option>
                                        <option value="Special">Special</option>
                                        <option value="Alert">Alert</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Badge Text</label>
                                    <input
                                        value={formData.badge}
                                        onChange={e => setFormData({ ...formData, badge: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notice Status</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: !formData.status })}
                                        className={`w-full py-3.5 rounded-2xl border text-[10px] font-black transition-all ${formData.status ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                    >
                                        {formData.status ? 'NOTICE IS BROADCASTING' : 'BROADCAST STOPPED'}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-50">
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone size={16} />}
                                    {editingNotice ? 'UPDATE BROADCAST' : 'START LIVE BROADCAST'}
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
