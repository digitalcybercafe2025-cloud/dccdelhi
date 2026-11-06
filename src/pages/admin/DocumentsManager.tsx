import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, Loader2, Calendar, Trash2, AlertTriangle, X, Check } from 'lucide-react';
import api, { getMediaUrl } from '../../api/axios';

interface Doc {
    docType: string;
    fileName: string;
    filePath: string;
    originalName: string;
}

interface Application {
    _id: string;
    trackingId: string;
    serviceName: string;
    userDetails: {
        fullName: string;
    };
    documents: Doc[];
    createdAt: string;
}

interface Props {
    viewMode?: 'grid' | 'list';
}

const getCleanDocLabel = (doc: Doc, index: number) => {
    if (doc.docType && !doc.docType.toLowerCase().startsWith('document_') && !doc.docType.toLowerCase().startsWith('documents_')) {
        return doc.docType;
    }
    if (doc.originalName) {
        return doc.originalName.replace(/\.[^/.]+$/, '');
    }
    return `Document ${index + 1}`;
};

const DocumentsManager: React.FC<Props> = ({ viewMode = 'list' }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Confirmation State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deletingTarget, setDeletingTarget] = useState<{ appId: string; docIndex: number; docName: string; applicant: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/applications?limit=100');
            setApplications(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const filteredApps = applications.filter(app =>
        app.userDetails?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = (path: string, name: string) => {
        const fullUrl = getMediaUrl(path);
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = name || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleView = (path: string) => {
        const fullUrl = getMediaUrl(path);
        window.open(fullUrl, '_blank');
    };

    const openDeleteConfirm = (appId: string, docIndex: number, docName: string, applicant: string) => {
        setDeletingTarget({ appId, docIndex, docName, applicant });
        setConfirmText('');
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingTarget || confirmText.trim().toUpperCase() !== 'DELETE') return;
        setDeleting(true);
        try {
            await api.delete(`/applications/${deletingTarget.appId}/documents/${deletingTarget.docIndex}`);
            setFeedback({ type: 'success', message: `Document "${deletingTarget.docName}" deleted permanently.` });
            setDeleteModalOpen(false);
            setDeletingTarget(null);
            setConfirmText('');
            await fetchDocuments();
            setTimeout(() => setFeedback(null), 3000);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete document.' });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Header + Search - Ultra Compact */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Document Archives</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Artifact Fulfillment Center</p>
                </div>
                <div className="relative group w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search applicant, ID, service..."
                        className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 shadow-sm transition-all"
                    />
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

            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Documents Archive...</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredApps.map(app => (
                        app.documents && app.documents.length > 0 ? (
                            app.documents.map((doc, idx) => {
                                const cleanLabel = getCleanDocLabel(doc, idx);
                                return (
                                    <div key={`${app.trackingId}-${idx}`} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm transition-all hover:shadow-md group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black text-blue-600 font-mono">#{app.trackingId.slice(-6)}</span>
                                        </div>
                                        <div className="space-y-1 mb-3">
                                            <p className="text-xs font-black text-slate-800 line-clamp-1">{app.userDetails?.fullName}</p>
                                            <p className="text-[10px] text-slate-500 font-semibold line-clamp-1">{app.serviceName}</p>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[10px] font-black text-slate-700 uppercase bg-slate-50 px-2 py-0.5 rounded-md truncate max-w-[140px]">{cleanLabel}</span>
                                                <span className="text-[9px] text-slate-400 font-bold">{new Date(app.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => handleView(doc.filePath)}
                                                className="p-1.5 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="View Document"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(doc.filePath, doc.originalName || cleanLabel)}
                                                className="p-1.5 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Download Document"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteConfirm(app._id, idx, cleanLabel, app.userDetails?.fullName)}
                                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Document"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : null
                    ))}
                    {filteredApps.length === 0 && !loading && (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100">
                            <p className="text-slate-400 font-bold text-xs">No documents matched your search query.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Tracking ID</th>
                                    <th className="py-2.5 px-3">Applicant Name</th>
                                    <th className="py-2.5 px-3">Service & Document</th>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs">
                                {filteredApps.map(app => (
                                    app.documents?.map((doc, idx) => {
                                        const cleanLabel = getCleanDocLabel(doc, idx);
                                        return (
                                            <tr key={`${app.trackingId}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-2.5 px-4 font-mono font-black text-blue-600 text-xs">#{app.trackingId}</td>
                                                <td className="py-2.5 px-3 font-bold text-slate-800">{app.userDetails?.fullName}</td>
                                                <td className="py-2.5 px-3">
                                                    <p className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">{app.serviceName}</p>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{cleanLabel}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-[10px] font-semibold text-slate-500">
                                                    {new Date(app.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleView(doc.filePath)}
                                                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                                                            title="View Document"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(doc.filePath, doc.originalName || cleanLabel)}
                                                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                                                            title="Download Document"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteConfirm(app._id, idx, cleanLabel, app.userDetails?.fullName)}
                                                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                                            title="Delete Document"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ))}
                                {filteredApps.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-slate-400 font-bold text-xs">No documents found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Strict Confirmation Delete Modal ── */}
            {deleteModalOpen && deletingTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
                            <div className="flex items-center gap-2.5 text-red-600">
                                <div className="p-2 bg-red-100 rounded-xl">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Confirm Document Deletion</h3>
                                    <p className="text-[10px] text-slate-500 font-bold">Irreversible Action</p>
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
                                <p className="text-slate-500 font-medium">Applicant: <span className="font-bold text-slate-800">{deletingTarget.applicant}</span></p>
                                <p className="text-slate-500 font-medium">Document: <span className="font-bold text-slate-800">{deletingTarget.docName}</span></p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                                    Type <span className="text-red-600 font-mono font-black">DELETE</span> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={e => setConfirmText(e.target.value)}
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
                                    disabled={confirmText.trim().toUpperCase() !== 'DELETE' || deleting}
                                    onClick={handleConfirmDelete}
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

export default DocumentsManager;
