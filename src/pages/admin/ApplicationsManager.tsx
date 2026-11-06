import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { SERVICES } from '../../../constants';
import { Download, Eye, X, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react';

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

const getCleanDocName = (doc: any, index: number) => {
    if (doc.docType && !doc.docType.toLowerCase().startsWith('document_') && !doc.docType.toLowerCase().startsWith('documents_')) {
        return doc.docType;
    }
    if (doc.originalName) {
        return doc.originalName.replace(/\.[^/.]+$/, '');
    }
    return `Document ${index + 1}`;
};

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

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingTarget, setDeletingTarget] = useState<any | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
            setApplications(res.data.data || []);
            setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
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
        const cleanName = getCleanDocName(doc, previewDocIndex);
        downloadDocument(selected._id, previewDocIndex, doc.originalName || cleanName);
    };

    const openDeleteAppModal = (app: any) => {
        setDeletingTarget(app);
        setDeleteConfirmText('');
        setDeleteModalOpen(true);
    };

    const handleConfirmDeleteApp = async () => {
        if (!deletingTarget || deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
        setDeleting(true);
        try {
            await api.delete(`/applications/${deletingTarget._id}`);
            setFeedback({ type: 'success', message: `Application #${deletingTarget.trackingId} deleted permanently.` });
            setDeleteModalOpen(false);
            if (selected?._id === deletingTarget._id) {
                setSelected(null);
            }
            setDeletingTarget(null);
            setDeleteConfirmText('');
            await fetchApps(pagination.page);
            setTimeout(() => setFeedback(null), 3000);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete application.' });
        } finally {
            setDeleting(false);
        }
    };

    const hasActiveFilters = search || statusFilter !== 'all' || serviceFilter !== 'all' || startDate || endDate;

    return (
        <div className="space-y-3 animate-in fade-in duration-300">
            {/* ── Search + Filters (Compact) ── */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 space-y-3">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search row */}
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search applicant, tracking ID, mobile..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                        >
                            Search
                        </button>
                    </form>

                    {/* Filter row */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <select
                            value={serviceFilter}
                            onChange={e => setServiceFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all min-w-[140px]"
                        >
                            <option value="all">All Services</option>
                            {SERVICES.map(svc => (
                                <option key={svc.id} value={svc.id}>{svc.title}</option>
                            ))}
                        </select>

                        {/* Date range */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-slate-600 text-[10px] font-bold outline-none"
                            />
                            <span className="text-slate-300">/</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-slate-600 text-[10px] font-bold outline-none"
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-all"
                                title="Clear filters"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status pills - Compact */}
                <div className="flex gap-1.5 flex-wrap pt-2 border-t border-slate-100 items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                    {STATUSES.map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${statusFilter === s
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                        >
                            {s === 'all' ? 'All Flow' : STATUS_LABELS[s] || s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notification / Feedback */}
            {feedback && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in slide-in-from-top-2 ${
                    feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70"><X size={14} /></button>
                </div>
            )}

            {/* ── Table (Zero Scrolling Optimized, Compact Height) ── */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/60 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3.5">Identification</th>
                                    <th className="py-2.5 px-3">Applicant & Service</th>
                                    <th className="py-2.5 px-3">Payment</th>
                                    <th className="py-2.5 px-3">Flow Status</th>
                                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs">
                                {applications.map(app => {
                                    const canDelete = app.status === 'completed' || app.status === 'rejected';
                                    return (
                                        <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-mono font-black text-[10px]">
                                                        #{app.trackingId?.slice(-4)}
                                                    </span>
                                                    <div>
                                                        <p className="font-mono text-xs font-black text-slate-800">{app.trackingId}</p>
                                                        <p className="text-slate-400 text-[9px] font-bold">{new Date(app.createdAt).toLocaleDateString('en-GB')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <p className="font-bold text-slate-900 text-xs leading-snug">{app.userDetails?.fullName}</p>
                                                <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[180px]">{app.serviceName}</p>
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <span className="font-black text-slate-800 text-xs">₹{app.paymentDetails?.amount || 0}</span>
                                                <span className={`ml-1.5 text-[9px] font-black uppercase ${app.paymentDetails?.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                    ({app.paymentDetails?.paymentStatus || 'Incomplete'})
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${STATUS_STYLES[app.status] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'completed' ? 'bg-emerald-500' : 'bg-current'}`} />
                                                    {STATUS_LABELS[app.status] || app.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => { setSelected(app); setStatusNote(app.rejectionReason || ''); }}
                                                        className="px-3 py-1 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95"
                                                    >
                                                        Review Focus
                                                    </button>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => openDeleteAppModal(app)}
                                                            className="p-1 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all"
                                                            title="Delete Application"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 px-4 text-slate-400 font-bold text-xs">
                                            No entries found for current filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination (Compact) ── */}
            {(pagination.pages > 1 || pagination.total > 0) && (
                <div className="flex items-center justify-between text-xs px-1">
                    <p className="text-slate-500 text-[11px] font-semibold">Showing {applications.length} of {pagination.total} entries</p>
                    {pagination.pages > 1 && (
                        <div className="flex gap-1.5">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchApps(pagination.page - 1)}
                                className="px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                            >
                                ← Prev
                            </button>
                            <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[11px] font-bold text-blue-600">
                                {pagination.page} / {pagination.pages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => fetchApps(pagination.page + 1)}
                                className="px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Review Focus Modal ── */}
            {selected && (
                <div
                    className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
                >
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-[1000px] mx-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-slate-900 uppercase">Application Review</h2>
                                    <span className="font-mono font-black text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded-md">#{selected.trackingId}</span>
                                </div>
                                <p className="text-slate-400 text-[10px] font-bold mt-0.5">{selected.serviceName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {(selected.status === 'completed' || selected.status === 'rejected') && (
                                    <button
                                        onClick={() => openDeleteAppModal(selected)}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                                        title="Delete this Application"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelected(null)}
                                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column: Info & Documents */}
                                <div className="lg:col-span-8 space-y-5">
                                    {/* Applicant Details */}
                                    <div>
                                        <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-2.5">Applicant Information</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {[
                                                ['Full Name', selected.userDetails?.fullName],
                                                ['Mobile', selected.userDetails?.mobile],
                                                ['Email', selected.userDetails?.email || 'N/A'],
                                                ['City', selected.userDetails?.city],
                                                ['State', selected.userDetails?.state],
                                                ['Pincode', selected.userDetails?.pincode],
                                            ].map(([k, v]) => (
                                                <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">{k}</p>
                                                    <p className="text-slate-800 font-bold text-xs truncate mt-0.5">{v || '—'}</p>
                                                </div>
                                            ))}
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 col-span-2 sm:col-span-3">
                                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Address</p>
                                                <p className="text-slate-800 font-bold text-xs mt-0.5">{selected.userDetails?.address || '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Specific Fields if any */}
                                    {selected.serviceSpecificFields && Object.keys(selected.serviceSpecificFields).length > 0 && (
                                        <div>
                                            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-2.5">Form Specific Data</h3>
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {Object.entries(selected.serviceSpecificFields).map(([k, v]) => (
                                                    <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider">{k}</p>
                                                        <p className="text-slate-800 font-bold text-xs truncate mt-0.5">{String(v || '—')}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents List with Real Names */}
                                    {selected.documents?.length > 0 && (
                                        <div>
                                            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-2.5 flex items-center justify-between">
                                                <span>Uploaded Documents ({selected.documents.length})</span>
                                                <span className="text-[10px] text-emerald-600 font-bold">Original File Identifiers</span>
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {selected.documents.map((doc: any, i: number) => {
                                                    const cleanDocName = getCleanDocName(doc, i);
                                                    return (
                                                        <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-indigo-300 transition-all">
                                                            <div className="min-w-0 pr-2">
                                                                <p className="text-slate-900 text-xs font-black truncate uppercase tracking-tight">{cleanDocName}</p>
                                                                <p className="text-slate-400 text-[10px] font-medium truncate mt-0.5">{doc.originalName || doc.fileName}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                <button
                                                                    onClick={() => previewDocument(selected._id, i)}
                                                                    className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-colors"
                                                                    title="Preview Document"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => downloadDocument(selected._id, i, doc.originalName || cleanDocName)}
                                                                    disabled={downloadingDoc === i}
                                                                    className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                                                                    title="Download Document"
                                                                >
                                                                    {downloadingDoc === i ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Status & Delivery */}
                                <div className="lg:col-span-4 space-y-4">
                                    {/* Payment Box */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Information</p>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <span className="text-2xl font-black text-slate-900">₹{selected.paymentDetails?.amount || 0}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selected.paymentDetails?.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {selected.paymentDetails?.paymentStatus || 'UNPAID'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-500 mt-2 truncate">Tx: {selected.paymentDetails?.transactionId || 'N/A'}</p>
                                    </div>

                                    {/* Status Updater */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Change Application Status</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {['received', 'review', 'verifying', 'completed', 'rejected'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => updateStatus(s)}
                                                    disabled={updating}
                                                    className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${selected.status === s
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    {STATUS_LABELS[s] || s}
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            value={statusNote}
                                            onChange={e => setStatusNote(e.target.value)}
                                            placeholder="Reason if rejecting or internal remarks..."
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold outline-none focus:border-indigo-400 h-16 resize-none"
                                        />
                                    </div>

                                    {/* Delivery Certificate Upload */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Upload Completed Certificate</p>
                                        <input
                                            type="file"
                                            onChange={e => setCertFile(e.target.files?.[0] || null)}
                                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                                        />
                                        {certFile && (
                                            <button
                                                onClick={uploadCertificate}
                                                disabled={updating}
                                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                            >
                                                Upload Certificate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Document Preview Modal ── */}
            {previewUrl && (
                <div
                    className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={closePreview}
                >
                    <div
                        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-800">
                                {selected?.documents?.[previewDocIndex || 0] ? getCleanDocName(selected.documents[previewDocIndex || 0], previewDocIndex || 0) : 'Document'} Preview
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={downloadFromPreview}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/5">
                            {previewLoading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            ) : (
                                <iframe src={previewUrl} className="w-full h-[65vh] rounded-xl border border-slate-200" title="Preview" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Strict Confirmation Delete Application Modal ── */}
            {deleteModalOpen && deletingTarget && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
                            <div className="flex items-center gap-2.5 text-red-600">
                                <div className="p-2 bg-red-100 rounded-xl">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Delete Application</h3>
                                    <p className="text-[10px] text-slate-500 font-bold">Permanent removal of application & records</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setDeleteModalOpen(false); setDeletingTarget(null); }}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                                <p className="text-slate-500 font-medium">Tracking ID: <span className="font-mono font-black text-indigo-600">#{deletingTarget.trackingId}</span></p>
                                <p className="text-slate-500 font-medium">Applicant: <span className="font-bold text-slate-800">{deletingTarget.userDetails?.fullName}</span></p>
                                <p className="text-slate-500 font-medium">Service: <span className="font-bold text-slate-800">{deletingTarget.serviceName}</span></p>
                                <p className="text-slate-500 font-medium">Status: <span className="font-bold text-red-600 uppercase">{deletingTarget.status}</span></p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                                    Type <span className="text-red-600 font-mono font-black">DELETE</span> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-400 transition-all text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setDeleteModalOpen(false); setDeletingTarget(null); }}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || deleting}
                                    onClick={handleConfirmDeleteApp}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Permanent Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationsManager;
