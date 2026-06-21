import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { SERVICES } from '../../../constants';
import { Download, Eye, X } from 'lucide-react';

// ── Status badge tokens matching Dashboard ────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
    received: 'bg-blue-50 text-blue-600 border-blue-100',
    review: 'bg-amber-50 text-amber-600 border-amber-100',
    verifying: 'bg-purple-50 text-purple-600 border-purple-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected: 'bg-red-50 text-red-600 border-red-100'
};
const STATUSES = ['all', 'received', 'review', 'verifying', 'completed', 'rejected'];
const STATUS_LABELS: Record<string, string> = {
    received: 'Received',
    review: 'Under Review',
    verifying: 'Verifying',
    completed: 'Completed',
    rejected: 'Rejected'
};

const inputCls = 'px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm font-bold outline-none focus:border-blue-400 transition-colors';
const sectionLabelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2';

const ApplicationsManager: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [selected, setSelected] = useState<any | null>(null);
    const [statusNote, setStatusNote] = useState('');
    const [certFile, setCertFile] = useState<File | null>(null);
    const [updating, setUpdating] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [downloadingDoc, setDownloadingDoc] = useState<number | null>(null);
    const [previewDocIndex, setPreviewDocIndex] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const fetchApps = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, limit: 15 };
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (serviceFilter !== 'all') params.serviceId = serviceFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await api.get('/applications', { params });
            setApplications(res.data.data);
            setPagination(res.data.pagination);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [search, statusFilter, serviceFilter, startDate, endDate]);

    useEffect(() => { fetchApps(1); }, [fetchApps]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); };

    const clearFilters = () => {
        setSearch(''); setSearchInput(''); setStatusFilter('all');
        setServiceFilter('all'); setStartDate(''); setEndDate('');
    };

    const updateStatus = async (status: string) => {
        if (!selected) return;
        if (status === 'rejected' && !statusNote.trim()) { alert('Rejection reason is required.'); return; }
        setUpdating(true);
        try {
            const payload: any = { status };
            if (status === 'rejected') payload.rejectionReason = statusNote;
            else payload.rejectionReason = '';
            await api.put(`/applications/${selected._id}`, payload);
            await fetchApps(pagination.page);
            setSelected((prev: any) => ({ ...prev, status, rejectionReason: status === 'rejected' ? statusNote : '' }));
            setStatusNote('');
        } catch { alert('Update failed'); }
        finally { setUpdating(false); }
    };

    const uploadCertificate = async () => {
        if (!selected || !certFile) return;
        setUpdating(true);
        try {
            const fd = new FormData();
            fd.append('certificate', certFile);
            const res = await api.post(`/applications/${selected._id}/certificate`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await fetchApps(pagination.page);
            setSelected(res.data.data);
            setCertFile(null);
            alert('Certificate uploaded successfully!');
        } catch { alert('Upload failed'); }
        finally { setUpdating(false); }
    };

    const downloadDocument = async (appId: string, docIndex: number, docName: string) => {
        setDownloadingDoc(docIndex);
        try {
            const response = await api.get(`/applications/${appId}/documents/${docIndex}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', docName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Document download failed. File may not exist on server.');
        } finally {
            setDownloadingDoc(null);
        }
    };

    const previewDocument = async (appId: string, docIndex: number) => {
        setPreviewDocIndex(docIndex);
        setPreviewLoading(true);
        setPreviewUrl(null);
        try {
            const response = await api.get(`/applications/${appId}/documents/${docIndex}/download`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch {
            alert('Document preview failed. File may not exist on server.');
            setPreviewDocIndex(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewDocIndex(null);
    };

    const downloadFromPreview = () => {
        if (!selected || previewDocIndex === null) return;
        const doc = selected.documents[previewDocIndex];
        downloadDocument(selected._id, previewDocIndex, doc.originalName || doc.fileName || `document_${previewDocIndex}`);
    };

    const hasActiveFilters = search || statusFilter !== 'all' || serviceFilter !== 'all' || startDate || endDate;

    return (
        <div className="space-y-4">
            {/* ── Search + Filters ── */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search row */}
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search applicant, tracking ID, mobile..."
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-800 placeholder:text-slate-400 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all" />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </div>
                        <button type="submit"
                            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                            Search
                        </button>
                    </form>

                    {/* Filter row */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Service filter */}
                        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
                            className="px-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-600 text-xs font-black uppercase tracking-widest outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all appearance-none min-w-[160px]">
                            <option value="all">All Services</option>
                            {SERVICES.map(svc => (
                                <option key={svc.id} value={svc.id}>{svc.title}</option>
                            ))}
                        </select>

                        {/* Date range */}
                        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-2 py-1.5 ring-2 ring-transparent">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} title="Start"
                                className="bg-transparent border-none text-slate-600 text-[10px] font-black uppercase tracking-widest outline-none px-2" />
                            <span className="text-slate-300">/</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="End"
                                className="bg-transparent border-none text-slate-600 text-[10px] font-black uppercase tracking-widest outline-none px-2" />
                        </div>

                        {hasActiveFilters && (
                            <button type="button" onClick={clearFilters}
                                className="p-3.5 bg-red-50 hover:bg-red-100 rounded-2xl text-red-500 transition-all active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status pills */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] self-center mr-2">Filter By Status:</p>
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${statusFilter === s
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600'
                                }`}>
                            {s === 'all' ? 'All Flow' : STATUS_LABELS[s] || s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/20 rounded-[2rem] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    {['Identification', 'Application Details', 'Payment Status', 'Current Flow', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {applications.map(app => (
                                    <tr key={app._id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                    #{app.trackingId.slice(-4)}
                                                </div>
                                                <div>
                                                    <p className="font-mono text-[11px] font-black text-slate-800 tracking-tighter">{app.trackingId}</p>
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">{new Date(app.createdAt).toLocaleDateString('en-GB')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{app.serviceName}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                    <p className="text-slate-500 text-[11px] font-bold">{app.userDetails?.fullName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl border ${app.paymentDetails?.paymentStatus === 'Paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-xs">₹{app.paymentDetails?.amount || 0}</p>
                                                    <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${app.paymentDetails?.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {app.paymentDetails?.paymentStatus || 'Incomplete'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 inline-flex items-center gap-2 ${STATUS_STYLES[app.status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'completed' ? 'bg-emerald-500' : 'bg-current animate-pulse'}`} />
                                                {STATUS_LABELS[app.status] || app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button onClick={() => { setSelected(app); setStatusNote(app.rejectionReason || ''); }}
                                                className="px-5 py-2.5 bg-slate-800 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/5 active:scale-95 group-hover:bg-indigo-600 group-hover:shadow-indigo-500/20">
                                                Review Focus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20 px-6">
                                            <div className="flex flex-col items-center opacity-30">
                                                <svg className="mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                                <span className="font-black uppercase tracking-[0.3em] text-xs">No entries found for current filter</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {(pagination.pages > 1 || pagination.total > 0) && (
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-xs font-bold">Showing {applications.length} of {pagination.total} applications</p>
                    {pagination.pages > 1 && (
                        <div className="flex gap-2">
                            <button disabled={pagination.page <= 1} onClick={() => fetchApps(pagination.page - 1)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-black text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                                ← Prev
                            </button>
                            <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-black text-blue-600">
                                {pagination.page} / {pagination.pages}
                            </span>
                            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchApps(pagination.page + 1)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-black text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Review Modal ── */}
            {selected && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] w-full max-w-[1200px] mx-auto h-[85vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Detailed Application Review</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                    Internal Admin Focus Mode
                                </p>
                            </div>
                            <button onClick={() => setSelected(null)}
                                className="p-3 rounded-2xl bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all active:scale-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Column: Info */}
                                <div className="lg:col-span-8 space-y-8">
                                    {/* ── Applicant ── */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Applicant Profile</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                ['Full Name', selected.userDetails?.fullName],
                                                ['Mobile', selected.userDetails?.mobile],
                                                ['Email', selected.userDetails?.email || 'NOT_PROVIDED'],
                                                ['Service', selected.serviceName],
                                                ['City', selected.userDetails?.city],
                                                ['State', selected.userDetails?.state],
                                            ].map(([k, v]) => (
                                                <div key={k} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 group hover:bg-white hover:border-indigo-100 transition-all">
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none mb-2">{k}</p>
                                                    <p className="text-slate-800 font-bold text-xs truncate uppercase tracking-tight">{v || '—'}</p>
                                                </div>
                                            ))}
                                            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 col-span-2 group hover:bg-white hover:border-indigo-100 transition-all">
                                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-2">Detailed Address</p>
                                                <p className="text-slate-800 font-bold text-xs uppercase tracking-tight">{selected.userDetails?.address || '—'}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* ── Documents ── */}
                                    {selected.documents?.length > 0 && (
                                        <section>
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Digital Assets ({selected.documents.length})</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selected.documents.map((doc: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                                        <div className="min-w-0 pr-4">
                                                            <p className="text-slate-800 text-xs font-black truncate uppercase tracking-tight mb-1">{doc.docType}</p>
                                                            <p className="text-slate-400 text-[9px] font-bold truncate opacity-60">{doc.originalName || doc.fileName}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <button
                                                                onClick={() => previewDocument(selected._id, i)}
                                                                className="p-3 bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white rounded-xl transition-all active:scale-90"
                                                                title="View Document"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => downloadDocument(selected._id, i, doc.originalName || doc.fileName || `document_${i}`)}
                                                                disabled={downloadingDoc === i}
                                                                className="p-3 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-xl transition-all active:scale-90 disabled:opacity-50"
                                                                title="Download Document"
                                                            >
                                                                {downloadingDoc === i ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* ── Status Management ── */}
                                    <section className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                                        <div className="flex items-center gap-3 mb-5">
                                            <span className="w-1.5 h-4 bg-red-500 rounded-full" />
                                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest text-red-500">Flow Orchestration</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {['received', 'review', 'verifying', 'completed', 'rejected'].map(s => (
                                                <button key={s} onClick={() => updateStatus(s)} disabled={updating}
                                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all disabled:opacity-50 ${selected.status === s
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-red-100 hover:text-red-500'
                                                        }`}>
                                                    {STATUS_LABELS[s] || s}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative group">
                                            <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)}
                                                placeholder="Internal notes or rejection justification..."
                                                className="w-full px-6 py-5 rounded-[1.5rem] bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 text-sm font-bold outline-none focus:border-red-200 transition-all resize-none h-24 shadow-inner" />
                                            {selected.status === 'rejected' && <p className="absolute -top-3 left-6 px-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full py-1">Required for rejection</p>}
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Stats & Actions */}
                                <div className="lg:col-span-4 space-y-8">
                                    {/* ── Master Tracking ── */}
                                    <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                            <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                        </div>
                                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Enterprise UUID</p>
                                        <p className="text-2xl font-black font-mono tracking-tighter mb-8 break-all">{selected.trackingId}</p>
                                        <div className="flex gap-2">
                                            <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                                            <span className="w-2 h-2 rounded-full bg-white/20" />
                                            <span className="w-2 h-2 rounded-full bg-white/20" />
                                        </div>
                                    </div>

                                    {/* ── Financial Summary ── */}
                                    <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 space-y-4">
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Treasury Link</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-4xl font-black text-slate-800 tracking-tighter">₹{selected.paymentDetails?.amount || 0}</span>
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${selected.paymentDetails?.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {selected.paymentDetails?.paymentStatus || 'UNPAID'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-50">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Gateway</p>
                                                <p className="text-[11px] font-black text-slate-600 uppercase mt-0.5">{selected.paymentDetails?.method || 'CASH'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tx ID</p>
                                                <p className="text-[11px] font-black text-slate-600 font-mono mt-0.5 truncate px-1">{selected.paymentDetails?.transactionId || 'INTERNAL'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Final Output ── */}
                                    <div className="bg-emerald-50 border-2 border-emerald-100/50 rounded-[2rem] p-6 text-center">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-6">Outcome Delivery</h4>

                                        {selected.certificateUrl ? (
                                            <div className="space-y-4">
                                                <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                                </div>
                                                <a href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}${selected.certificateUrl}`}
                                                    target="_blank" rel="noreferrer"
                                                    className="block w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95">
                                                    Sync Certificate
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="group relative w-full h-32 rounded-[1.5rem] bg-emerald-500/5 border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center hover:bg-emerald-500/10 transition-all cursor-pointer overflow-hidden"
                                                    onClick={() => (document.getElementById('c-up') as any).click()}>
                                                    <svg className="mb-2 text-emerald-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-7l5-5 5 5m-5-5v12" /></svg>
                                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                                                        {certFile ? certFile.name : 'Attach Certificate'}
                                                    </p>
                                                    <input id="c-up" type="file" className="hidden" onChange={e => setCertFile(e.target.files?.[0] || null)} />
                                                </div>
                                                <button onClick={uploadCertificate} disabled={!certFile || updating}
                                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 disabled:opacity-40 transition-all active:scale-95">
                                                    Deploy Result
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Document Preview Modal ── */}
            {previewDocIndex !== null && selected && (
                <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) closePreview(); }}>
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-[2rem] w-full max-w-4xl mx-auto h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                    {selected.documents[previewDocIndex]?.docType || 'Document'} Preview
                                </h3>
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                    {selected.documents[previewDocIndex]?.originalName || selected.documents[previewDocIndex]?.fileName}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={downloadFromPreview}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                                    <Download className="w-3.5 h-3.5" /> Download
                                </button>
                                <button onClick={closePreview}
                                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all active:scale-90">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-50 p-4 flex items-center justify-center">
                            {previewLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Preview...</p>
                                </div>
                            ) : previewUrl ? (
                                (() => {
                                    const doc = selected.documents[previewDocIndex];
                                    const mime = doc?.mimeType || '';
                                    const name = (doc?.originalName || doc?.fileName || '').toLowerCase();
                                    if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(name)) {
                                        return <img src={previewUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />;
                                    } else if (mime === 'application/pdf' || name.endsWith('.pdf')) {
                                        return <iframe src={previewUrl} className="w-full h-full rounded-xl border-0" title="PDF Preview" />;
                                    } else {
                                        return (
                                            <div className="text-center">
                                                <svg className="mx-auto mb-4 text-slate-300" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Preview not available for this file type</p>
                                                <p className="text-xs text-slate-400 mt-2">Use the download button to view this file.</p>
                                            </div>
                                        );
                                    }
                                })()
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationsManager;
