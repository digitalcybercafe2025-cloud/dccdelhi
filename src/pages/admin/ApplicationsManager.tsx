import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getMediaUrl } from '../../api/axios';
import { SERVICES } from '../../../constants';
import { Download, Eye, X, Trash2, AlertTriangle, Check, Loader2, Search, LayoutGrid, List, Settings, Plus, RefreshCw, FileText, Calendar } from 'lucide-react';

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
    const [searchParams] = useSearchParams();
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
    const [previewMimeType, setPreviewMimeType] = useState<string>('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Toolbar & Modal State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('admin_applications_view') as any) || 'list');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showNewAppModal, setShowNewAppModal] = useState(false);
    const [pageSize, setPageSize] = useState<number>(() => Number(localStorage.getItem('admin_applications_limit')) || 15);
    const [autoRefreshSec, setAutoRefreshSec] = useState<number>(() => Number(localStorage.getItem('admin_applications_refresh')) || 0);

    const [creatingApp, setCreatingApp] = useState(false);
    const [newAppForm, setNewAppForm] = useState({
        fullName: '',
        mobile: '',
        email: '',
        address: '',
        serviceId: SERVICES[0]?.id || '',
        serviceName: SERVICES[0]?.title || '',
        amount: SERVICES[0]?.price || 100,
        paymentStatus: 'Paid',
        paymentMethod: 'cash',
        notes: ''
    });

    useEffect(() => {
        localStorage.setItem('admin_applications_view', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('admin_applications_limit', String(pageSize));
    }, [pageSize]);

    useEffect(() => {
        localStorage.setItem('admin_applications_refresh', String(autoRefreshSec));
    }, [autoRefreshSec]);

    // Auto-open requested application if trackingId or id is in query params
    useEffect(() => {
        const trackingId = searchParams.get('trackingId');
        const appId = searchParams.get('id');
        if (trackingId) {
            setSearch(trackingId);
            setSearchInput(trackingId);
            api.get(`/applications?search=${encodeURIComponent(trackingId)}&limit=1`).then(res => {
                const found = res.data?.data?.[0];
                if (found) setSelected(found);
            }).catch(console.error);
        } else if (appId) {
            api.get(`/applications/${appId}`).then(res => {
                if (res.data?.data) setSelected(res.data.data);
            }).catch(console.error);
        }
    }, [searchParams]);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingTarget, setDeletingTarget] = useState<any | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchApps = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, limit: pageSize };
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
    }, [search, statusFilter, serviceFilter, startDate, endDate, pageSize]);

    useEffect(() => { fetchApps(1); }, [fetchApps]);

    // Auto-refresh interval
    useEffect(() => {
        if (!autoRefreshSec || autoRefreshSec <= 0) return;
        const interval = setInterval(() => {
            fetchApps(pagination.page);
        }, autoRefreshSec * 1000);
        return () => clearInterval(interval);
    }, [autoRefreshSec, pagination.page, fetchApps]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); };

    const clearFilters = () => {
        setSearch(''); setSearchInput(''); setStatusFilter('all');
        setServiceFilter('all'); setStartDate(''); setEndDate('');
    };

    const exportToCSV = () => {
        if (applications.length === 0) {
            alert('No applications to export.');
            return;
        }
        const headers = ['Tracking ID', 'Applicant Name', 'Mobile', 'Service Name', 'Amount', 'Payment Status', 'Payment Method', 'Flow Status', 'Date Applied'];
        const rows = applications.map(app => [
            `"${app.trackingId || ''}"`,
            `"${app.userDetails?.fullName || ''}"`,
            `"${app.userDetails?.mobile || ''}"`,
            `"${app.serviceName || ''}"`,
            `"${app.paymentDetails?.amount || 0}"`,
            `"${app.paymentDetails?.paymentStatus || ''}"`,
            `"${app.paymentDetails?.method || ''}"`,
            `"${app.status || ''}"`,
            `"${new Date(app.createdAt).toLocaleDateString('en-GB')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `applications_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCreateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppForm.fullName.trim() || !newAppForm.mobile.trim()) {
            alert('Applicant name and mobile number are required.');
            return;
        }
        setCreatingApp(true);
        try {
            const selectedService = SERVICES.find(s => s.id === newAppForm.serviceId);
            const sName = selectedService?.title || newAppForm.serviceName || 'Custom Cyber Cafe Service';
            const payload = {
                serviceName: sName,
                serviceId: newAppForm.serviceId || 'custom',
                userDetails: {
                    fullName: newAppForm.fullName.trim(),
                    mobile: newAppForm.mobile.trim(),
                    email: newAppForm.email.trim(),
                    address: newAppForm.address.trim() || 'Mangolpuri, New Delhi'
                },
                paymentDetails: {
                    amount: Number(newAppForm.amount) || 0,
                    method: newAppForm.paymentMethod,
                    paymentStatus: newAppForm.paymentStatus,
                    transactionId: newAppForm.paymentMethod === 'cash' ? `CASH-${Date.now()}` : `ADMIN-${Date.now()}`
                },
                serviceSpecificFields: {
                    notes: newAppForm.notes.trim()
                }
            };
            const res = await api.post('/applications', payload);
            if (res.data?.success) {
                setFeedback({ type: 'success', message: `Application #${res.data?.data?.trackingId || ''} created successfully!` });
                setShowNewAppModal(false);
                setNewAppForm({
                    fullName: '',
                    mobile: '',
                    email: '',
                    address: '',
                    serviceId: SERVICES[0]?.id || '',
                    serviceName: SERVICES[0]?.title || '',
                    amount: SERVICES[0]?.price || 100,
                    paymentStatus: 'Paid',
                    paymentMethod: 'cash',
                    notes: ''
                });
                await fetchApps(1);
                setTimeout(() => setFeedback(null), 3500);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create application.');
        } finally {
            setCreatingApp(false);
        }
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

    const inferMimeType = (doc: any, headerContentType?: string) => {
        if (headerContentType && headerContentType !== 'application/octet-stream') {
            return headerContentType.split(';')[0].trim().toLowerCase();
        }
        if (doc?.mimeType) return String(doc.mimeType).toLowerCase();
        const name = String(doc?.originalName || doc?.path || '').toLowerCase();
        if (name.endsWith('.pdf')) return 'application/pdf';
        if (name.endsWith('.png')) return 'image/png';
        if (name.endsWith('.webp')) return 'image/webp';
        if (name.endsWith('.gif')) return 'image/gif';
        if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
        return 'application/octet-stream';
    };

    const downloadDocument = async (appId: string, docIndex: number, docName: string) => {
        setDownloadingDoc(docIndex);
        const doc = selected?.documents?.[docIndex];
        const directUrl = doc?.filePath ? getMediaUrl(doc.filePath) : '';
        try {
            const response = await api.get(`/applications/${appId}/documents/${docIndex}/download`, {
                responseType: 'blob'
            });
            const mimeType = inferMimeType(doc, response.headers?.['content-type']);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', docName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            if (directUrl) {
                const link = document.createElement('a');
                link.href = directUrl;
                link.setAttribute('download', docName);
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                alert('Document download failed. File may not exist on server.');
            }
        } finally {
            setDownloadingDoc(null);
        }
    };

    const previewDocument = async (appId: string, docIndex: number) => {
        setPreviewDocIndex(docIndex);
        setPreviewLoading(true);
        setPreviewUrl(null);
        setPreviewMimeType('');
        setPreviewError(null);
        const doc = selected?.documents?.[docIndex];

        // 1. If document already contains base64 data URL
        if (doc?.filePath && doc.filePath.startsWith('data:')) {
            const mimeType = inferMimeType(doc, '');
            setPreviewMimeType(mimeType);
            setPreviewUrl(doc.filePath);
            setPreviewLoading(false);
            return;
        }

        try {
            const response = await api.get(`/applications/${appId}/documents/${docIndex}/download`, {
                responseType: 'blob'
            });
            const contentType = response.headers?.['content-type'] || '';
            // If the server returned JSON error instead of blob
            if (contentType.includes('application/json')) {
                const text = await (response.data as Blob).text();
                try {
                    const parsed = JSON.parse(text);
                    if (!parsed.success) {
                        setPreviewError(parsed.message || 'Document file is unavailable on server.');
                        setPreviewLoading(false);
                        return;
                    }
                } catch {}
            }
            const mimeType = inferMimeType(doc, contentType);
            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            setPreviewMimeType(mimeType);
            setPreviewUrl(url);
        } catch (err: any) {
            console.error('Document preview error:', err);
            setPreviewError('This document file is no longer available on the server (it may have been removed during server maintenance or was a previous test upload).');
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewMimeType('');
        setPreviewDocIndex(null);
        setPreviewError(null);
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
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* ── Top Toolbar (Matching exact reference screenshot layout) ── */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                {/* Left: Search input with Search Icon on the right side */}
                <div className="flex flex-1 items-center gap-3">
                    <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                        <input
                            value={searchInput}
                            onChange={e => {
                                setSearchInput(e.target.value);
                                if (!e.target.value.trim()) setSearch('');
                            }}
                            placeholder="Search applications..."
                            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 text-sm font-bold outline-none focus:border-blue-400 transition-colors shadow-sm"
                        />
                        <button
                            type="submit"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Search"
                        >
                            <Search size={16} />
                        </button>
                    </form>
                </div>

                {/* Right controls: [ Grid | List ] toggle -> [ ⚙ SETTINGS ] -> [ + NEW APPLICATION ] */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* 1. View Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
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
                        title="Application Settings"
                    >
                        <Settings size={15} className="text-slate-500" />
                        <span className="hidden sm:inline">Settings</span>
                    </button>

                    {/* 3. New Application Button */}
                    <button
                        type="button"
                        onClick={() => setShowNewAppModal(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-500/25 active:scale-95"
                    >
                        <Plus size={15} strokeWidth={3} />
                        <span>New Application</span>
                    </button>
                </div>
            </div>

            {/* ── Compact Single-Row Filter Bar: [Status Flow] [All Services] (DD-MM-YYYY [📅] TO(GREEN) DD-MM-YYYY [📅]) ── */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0">
                    {/* 1. Status Flow Pills */}
                    <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">STATUS:</span>
                        {STATUSES.map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${statusFilter === s
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                                    }`}
                            >
                                {s === 'all' ? 'All Flow' : STATUS_LABELS[s] || s}
                            </button>
                        ))}
                    </div>

                    {/* Vertical Divider */}
                    <div className="w-[1px] h-5 bg-slate-200 shrink-0 mx-0.5" />

                    {/* 2. Compact All Services Dropdown */}
                    <select
                        value={serviceFilter}
                        onChange={e => setServiceFilter(e.target.value)}
                        className="w-[110px] sm:w-[125px] px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold outline-none focus:border-blue-400 transition-all cursor-pointer shrink-0 truncate"
                        title="Filter by service"
                    >
                        <option value="all">All Services</option>
                        {SERVICES.map(svc => (
                            <option key={svc.id} value={svc.id}>{svc.title}</option>
                        ))}
                    </select>

                    {/* 3. Compact Date Range: DD-MM-YYYY [📅] TO(GREEN) DD-MM-YYYY [📅] */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shrink-0">
                        {/* Start Date */}
                        <div className="relative flex items-center shrink-0">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-[88px] sm:w-[94px] bg-transparent border-none text-slate-700 text-[10px] sm:text-[11px] font-bold outline-none cursor-pointer pr-3"
                                title="Start Date (DD-MM-YYYY)"
                            />
                            <Calendar size={12} className="text-slate-400 pointer-events-none -ml-4" />
                        </div>

                        {/* TO in GREEN COLOR */}
                        <span className="text-[10px] font-black uppercase text-emerald-600 px-0.5 tracking-wider shrink-0 select-none">
                            TO
                        </span>

                        {/* End Date */}
                        <div className="relative flex items-center shrink-0">
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-[88px] sm:w-[94px] bg-transparent border-none text-slate-700 text-[10px] sm:text-[11px] font-bold outline-none cursor-pointer pr-3"
                                title="End Date (DD-MM-YYYY)"
                            />
                            <Calendar size={12} className="text-slate-400 pointer-events-none -ml-4" />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="p-1 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition-all shrink-0 cursor-pointer"
                            title="Clear all filters"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0 ml-auto">
                    {pagination.total} Applications Total
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
                    <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70 cursor-pointer"><X size={14} /></button>
                </div>
            )}

            {/* ── Content View: Grid or List (Table) ── */}
            {loading ? (
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Applications...</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* ── GRID VIEW ── */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {applications.map(app => {
                        const canDelete = app.status === 'completed' || app.status === 'rejected';
                        return (
                            <div
                                key={app._id}
                                className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div>
                                    {/* Top Bar: Tracking ID + Status */}
                                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-mono font-black text-[10px] flex items-center justify-center">
                                                #{app.trackingId?.slice(-4)}
                                            </span>
                                            <div>
                                                <p className="font-mono text-xs font-black text-slate-800">{app.trackingId}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{new Date(app.createdAt).toLocaleDateString('en-GB')}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${STATUS_STYLES[app.status] || 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'completed' ? 'bg-emerald-500' : 'bg-current'}`} />
                                            {STATUS_LABELS[app.status] || app.status}
                                        </span>
                                    </div>

                                    {/* Applicant Details */}
                                    <div className="space-y-1 mb-4">
                                        <h4 className="font-black text-slate-900 text-sm leading-snug">{app.userDetails?.fullName}</h4>
                                        <p className="text-[11px] text-blue-600 font-bold">{app.serviceName}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">📞 {app.userDetails?.mobile || 'No mobile'}</p>
                                    </div>

                                    {/* Payment details pill */}
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl mb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fee & Payment</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-black text-slate-800 text-xs">₹{app.paymentDetails?.amount || 0}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${app.paymentDetails?.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {app.paymentDetails?.paymentStatus || 'Incomplete'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => { setSelected(app); setStatusNote(app.rejectionReason || ''); }}
                                        className="flex-1 py-2 bg-slate-800 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 text-center cursor-pointer"
                                    >
                                        Review Focus
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={() => openDeleteAppModal(app)}
                                            className="p-2 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all cursor-pointer"
                                            title="Delete Application"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {applications.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            No applications found for current filter.
                        </div>
                    )}
                </div>
            ) : (
                /* ── LIST VIEW (COMPACT TABLE) ── */
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
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
                                                    <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-mono font-black text-[10px]">
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
                                                        className="px-3 py-1 bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                                                    >
                                                        Review Focus
                                                    </button>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => openDeleteAppModal(app)}
                                                            className="p-1 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
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
                </div>
            )}

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
            {(previewUrl || previewLoading || previewError) && (
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
                                {previewUrl && !previewError && (
                                    <button
                                        onClick={downloadFromPreview}
                                        className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={closePreview}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/5 min-h-[280px]">
                            {previewLoading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-400">Loading document preview...</span>
                                </div>
                            ) : previewError ? (
                                <div className="p-8 text-center max-w-md mx-auto space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center shadow-sm">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Document File Unavailable</h4>
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                        {previewError}
                                    </p>
                                    <button
                                        onClick={closePreview}
                                        className="mt-2 px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-700 transition-colors"
                                    >
                                        Close Preview
                                    </button>
                                </div>
                            ) : previewMimeType.startsWith('image/') && previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Document Preview"
                                    className="max-w-full max-h-[68vh] mx-auto rounded-xl object-contain shadow-sm bg-white"
                                />
                            ) : previewUrl ? (
                                <iframe src={previewUrl} className="w-full h-[68vh] rounded-xl border border-slate-200 bg-white" title="Preview" />
                            ) : null}
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

            {/* ── Applications Settings Modal ── */}
            {showSettingsModal && (
                <div
                    className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowSettingsModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Settings size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Application Settings</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">Preferences & Export Controls</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Setting 1: Default View Mode */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Default View Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                                        viewMode === 'grid' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}
                                >
                                    <LayoutGrid size={15} /> Card Grid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                                        viewMode === 'list' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}
                                >
                                    <List size={15} /> List Table
                                </button>
                            </div>
                        </div>

                        {/* Setting 2: Items per page */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Items Per Page
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[10, 15, 25, 50].map(sz => (
                                    <button
                                        key={sz}
                                        type="button"
                                        onClick={() => { setPageSize(sz); fetchApps(1); }}
                                        className={`py-2 rounded-xl text-xs font-black border transition-all ${
                                            pageSize === sz ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        {sz}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Setting 3: Auto-Refresh */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Live Auto-Refresh Interval
                            </label>
                            <select
                                value={autoRefreshSec}
                                onChange={e => setAutoRefreshSec(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                            >
                                <option value={0}>Disabled (Manual refresh only)</option>
                                <option value={30}>Every 30 seconds</option>
                                <option value={60}>Every 1 minute</option>
                                <option value={300}>Every 5 minutes</option>
                            </select>
                        </div>

                        {/* Setting 4: Data Export */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-black text-slate-800">Export Applications</h4>
                                <p className="text-[10px] text-slate-400 font-medium">Download current list as CSV</p>
                            </div>
                            <button
                                type="button"
                                onClick={exportToCSV}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <Download size={14} /> Export CSV
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowSettingsModal(false)}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                            Close Settings
                        </button>
                    </div>
                </div>
            )}

            {/* ── New Application Modal ── */}
            {showNewAppModal && (
                <div
                    className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowNewAppModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/40">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                                    <Plus size={18} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Create New Application</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">Offline customer intake & manual registration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewAppModal(false)}
                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateApplication} className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                        Applicant Full Name *
                                    </label>
                                    <input
                                        required
                                        value={newAppForm.fullName}
                                        onChange={e => setNewAppForm({ ...newAppForm, fullName: e.target.value })}
                                        placeholder="e.g. Rahul Sharma"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                        Mobile Number *
                                    </label>
                                    <input
                                        required
                                        type="tel"
                                        maxLength={10}
                                        value={newAppForm.mobile}
                                        onChange={e => setNewAppForm({ ...newAppForm, mobile: e.target.value.replace(/\D/g, '') })}
                                        placeholder="10-digit number"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                    Service Required *
                                </label>
                                <select
                                    value={newAppForm.serviceId}
                                    onChange={e => {
                                        const s = SERVICES.find(x => x.id === e.target.value);
                                        setNewAppForm({
                                            ...newAppForm,
                                            serviceId: e.target.value,
                                            serviceName: s?.title || '',
                                            amount: s?.price || 100
                                        });
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                >
                                    {SERVICES.map(svc => (
                                        <option key={svc.id} value={svc.id}>
                                            {svc.title} — ₹{svc.price}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                        Application Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={newAppForm.amount}
                                        onChange={e => setNewAppForm({ ...newAppForm, amount: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                        Payment Method
                                    </label>
                                    <select
                                        value={newAppForm.paymentMethod}
                                        onChange={e => setNewAppForm({ ...newAppForm, paymentMethod: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                                    >
                                        <option value="cash">Cash (In-person)</option>
                                        <option value="upi">UPI / Online</option>
                                        <option value="card">Debit/Credit Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                        Payment Status
                                    </label>
                                    <select
                                        value={newAppForm.paymentStatus}
                                        onChange={e => setNewAppForm({ ...newAppForm, paymentStatus: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                                    >
                                        <option value="Paid">Paid</option>
                                        <option value="Pending">Payment Pending</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                    Customer Address / Locality
                                </label>
                                <input
                                    value={newAppForm.address}
                                    onChange={e => setNewAppForm({ ...newAppForm, address: e.target.value })}
                                    placeholder="e.g. Block O, Mangolpuri, New Delhi"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                    Internal Remarks / Special Notes (Optional)
                                </label>
                                <textarea
                                    value={newAppForm.notes}
                                    onChange={e => setNewAppForm({ ...newAppForm, notes: e.target.value })}
                                    placeholder="Any specific document notes or customer request..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none h-16 resize-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowNewAppModal(false)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingApp}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 flex items-center gap-2"
                                >
                                    {creatingApp ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} strokeWidth={3} />}
                                    Create Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationsManager;
