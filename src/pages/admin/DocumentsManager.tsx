import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, ExternalLink, Loader2, Calendar } from 'lucide-react';
import api from '../../api/axios';

interface Doc {
    docType: string;
    fileName: string;
    filePath: string;
    originalName: string;
}

interface Application {
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

const DocumentsManager: React.FC<Props> = ({ viewMode = 'list' }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            // Fetching from applications list to get all documents
            const res = await api.get('/applications?limit=50');
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
        app.userDetails.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = (path: string, name: string) => {
        const link = document.createElement('a');
        const baseUrl = 'http://127.0.0.1:5000';
        const fullUrl = path.startsWith('http') ? path : `${baseUrl}/${path.startsWith('/') ? path.slice(1) : path}`;
        link.href = fullUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleView = (path: string) => {
        const baseUrl = 'http://127.0.0.1:5000';
        const fullUrl = path.startsWith('http') ? path : `${baseUrl}/${path.startsWith('/') ? path.slice(1) : path}`;
        window.open(fullUrl, '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Document Archives</h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Global Artifact Fulfillment Center</p>
                </div>
                <div className="relative group w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 transition-colors group-focus-within:text-blue-500" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search Artifacts..."
                        className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-100 text-[10px] font-black outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Decrypting Archivist Repository...</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredApps.map(app => (
                        app.documents && app.documents.length > 0 ? (
                            app.documents.map((doc, idx) => (
                                <div key={`${app.trackingId}-${idx}`} className="bg-white rounded-[2.5rem] p-5 border border-slate-100 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl group">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Receipt ID</p>
                                            <p className="text-xs font-black text-blue-600 font-mono">#{app.trackingId}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Applicant Identity</p>
                                            <p className="text-sm font-black text-slate-900">{app.userDetails.fullName}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Service Tier</p>
                                                <p className="text-[11px] font-bold text-slate-600 line-clamp-1">{app.serviceName}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Submitted On</p>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">{new Date(app.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-800 uppercase max-w-[140px] truncate">{doc.docType || 'Official Artifact'}</p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleView(doc.filePath)}
                                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                    title="Secure Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(doc.filePath, doc.originalName)}
                                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Export Document"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : null
                    ))}
                    {filteredApps.length === 0 && !loading && (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-slate-400 font-bold text-sm">No artifacts matched your search query.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
                    <div className="overflow-x-auto rounded-3xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="p-4 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking ID</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service & Doc</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-4 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApps.map(app => (
                                    app.documents?.map((doc, idx) => (
                                        <tr key={`${app.trackingId}-${idx}`} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6 text-xs font-black text-blue-600 font-mono">#{app.trackingId}</td>
                                            <td className="p-4 text-sm font-black text-slate-900">{app.userDetails.fullName}</td>
                                            <td className="p-4">
                                                <p className="text-[11px] font-bold text-slate-600 mb-0.5 max-w-[150px] truncate">{app.serviceName}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{doc.docType || 'Official Artifact'}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">{new Date(app.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleView(doc.filePath)} className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100 rounded-lg transition-all" title="Secure Preview"><Eye className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDownload(doc.filePath, doc.originalName)} className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 rounded-lg transition-all" title="Export Document"><Download className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                        </table>
                        {filteredApps.length === 0 && !loading && (
                            <div className="p-10 text-center">
                                <p className="text-slate-400 font-bold text-sm">No artifacts matched your search query.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsManager;
