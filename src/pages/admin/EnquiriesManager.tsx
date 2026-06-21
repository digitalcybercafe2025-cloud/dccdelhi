import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

const EnquiriesManager: React.FC = () => {
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchEnquiries = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/inquiries'); setEnquiries(res.data.data || []); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

    const toggleStatus = async (enq: any) => {
        const newStatus = enq.status === 'Contacted' ? 'Pending' : 'Contacted';
        try { await api.put(`/inquiries/${enq._id}`, { status: newStatus }); fetchEnquiries(); }
        catch { alert('Update failed'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this enquiry?')) return;
        try { await api.delete(`/inquiries/${id}`); fetchEnquiries(); }
        catch { alert('Delete failed'); }
    };

    const filtered = enquiries.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.mobile?.includes(search) ||
        e.message?.toLowerCase().includes(search.toLowerCase())
    );

    const pending = enquiries.filter(e => e.status === 'Pending').length;

    return (
        <div className="space-y-4">
            {/* ── Summary & Tools ── */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Find name, mobile, message..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-800 placeholder:text-slate-400 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-amber-500/20 transition-all font-mono" />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100 flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                {pending} Unresolved Signals
                            </p>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-2">{filtered.length} Total</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                    {filtered.map(enq => (
                        <div key={enq._id}
                            className={`bg-white border rounded-[2rem] p-6 shadow-sm transition-all hover:shadow-xl hover:scale-[1.01] duration-500 relative group border-b-4 ${enq.status === 'Pending' ? 'border-amber-100 border-b-amber-500/10' : 'border-slate-50 border-b-indigo-500/10'}`}>

                            {/* Card Header: Identity & Status */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${enq.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {enq.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{enq.name}</h3>
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">{new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${enq.status === 'Contacted' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                    {enq.status}
                                </div>
                            </div>

                            {/* Message Container */}
                            <div className="relative mb-5">
                                <div className="absolute -top-1 left-2 text-slate-100 italic font-serif text-3xl pointer-events-none opacity-50 uppercase">Msg</div>
                                <p className="text-slate-600 text-xs font-bold leading-relaxed bg-slate-50/50 rounded-2xl p-4 italic group-hover:bg-white transition-all border border-transparent group-hover:border-slate-100">
                                    {enq.message}
                                </p>
                            </div>

                            {/* Contact Info Pills */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                                    {enq.mobile}
                                </div>
                                {enq.email && (
                                    <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                        {enq.email}
                                    </div>
                                )}
                            </div>

                            {/* Actions bar */}
                            <div className="flex gap-2">
                                <a href={`https://wa.me/91${enq.mobile}?text=Hello ${encodeURIComponent(enq.name)}, I received your enquiry regarding: "${encodeURIComponent(enq.message?.substring(0, 100))}". How can I help you?`}
                                    target="_blank" rel="noreferrer"
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center shadow-lg shadow-emerald-600/10 active:scale-95">
                                    WhatsApp
                                </a>
                                <button onClick={() => toggleStatus(enq)}
                                    className={`p-3 rounded-xl transition-all border-2 ${enq.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                </button>
                                <button onClick={() => handleDelete(enq._id)}
                                    className="p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-xl transition-all">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="md:col-span-2 text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <span className="text-slate-300 font-black uppercase tracking-[0.3em] text-xs">No Signal Enquiries Found</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EnquiriesManager;
