import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Service } from '../../types';
import { Loader2, LogOut, Search, Eye, Check, X, FileText, ChevronDown, Phone, Mail, Plus, Trash2, Edit, LayoutGrid, List } from 'lucide-react';

interface Application {
    _id: string;
    trackingId: string;
    serviceName: string;
    userDetails: {
        fullName: string;
        mobile: string;
        city: string;
    };
    status: string;
    createdAt: string;
    rejectionReason?: string;
    documents: { fileName: string, docType: string }[];
}

interface AdminService extends Omit<Service, 'id'> {
    _id: string;
}

export const AdminDashboard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [applications, setApplications] = useState<Application[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [services, setServices] = useState<AdminService[]>([]);
    const [activeTab, setActiveTab] = useState<'applications' | 'inquiries' | 'services'>('applications');
    const [loading, setLoading] = useState(false);
    const [reviewApp, setReviewApp] = useState<Application | null>(null);
    const [statusNote, setStatusNote] = useState('');

    // Service Management State
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const [editingService, setEditingService] = useState<AdminService | null>(null);
    const [serviceFormData, setServiceFormData] = useState({
        title: '',
        description: '',
        image: '',
        fee: 0,
        category: 'Government',
        color: 'blue',
        priority: 0,
        estimatedDays: '7-10 working days',
        requiredDocs: '', // comma separated for input
        externalLink: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('mangolpuri_admin_token');
        if (token) {
            setIsAuthenticated(true);
            fetchApplications();
            fetchInquiries();
            fetchServices();
        }
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin');
            if (res.data.success) {
                setApplications(res.data.data);
            }
        } catch (error) {
            console.error(error);
            if ((error as any).response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const fetchInquiries = async () => {
        try {
            const res = await api.get('/inquiries');
            if (res.data.success) {
                setInquiries(res.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            if (res.data.success) {
                setServices(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch services", error);
        }
    };

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...serviceFormData,
                requiredDocs: serviceFormData.requiredDocs.split(',').map(d => d.trim()).filter(d => d)
            };

            if (editingService) {
                await api.put(`/services/${editingService._id}`, payload);
            } else {
                await api.post('/services', payload);
            }

            setShowServiceModal(false);
            setEditingService(null);
            setServiceFormData({
                title: '', description: '', image: '', fee: 0, category: 'Government', color: 'blue', priority: 0, estimatedDays: '7-10 working days', requiredDocs: '', externalLink: ''
            });
            fetchServices();
        } catch (error) {
            console.error("Service save failed", error);
            alert("Failed to save service");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            await api.delete(`/services/${id}`);
            fetchServices();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const openServiceModal = (service?: AdminService) => {
        if (service) {
            setEditingService(service);
            setServiceFormData({
                title: service.title,
                description: service.description,
                image: service.image,
                fee: service.fee,
                category: service.category,
                color: service.color,
                priority: (service as any).priority || 0,
                estimatedDays: service.estimatedDays || '7-10 working days',
                requiredDocs: service.requiredDocs.join(', '),
                externalLink: service.externalLink || ''
            });
        } else {
            setEditingService(null);
            setServiceFormData({
                title: '', description: '', image: '', fee: 0, category: 'Government', color: 'blue', priority: 0, estimatedDays: '7-10 working days', requiredDocs: '', externalLink: ''
            });
        }
        setShowServiceModal(true);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/login', { email, password });
            localStorage.setItem('mangolpuri_admin_token', res.data.token);
            setIsAuthenticated(true);
            fetchApplications();
            fetchInquiries();
        } catch (error) {
            alert('Invalid Credentials');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('mangolpuri_admin_token');
        setIsAuthenticated(false);
        setApplications([]);
        setInquiries([]);
        navigate('/');
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/applications/${id}`, {
                status,
                rejectionReason: status === 'rejected' ? statusNote : undefined
            });
            setReviewApp(null);
            setStatusNote('');
            fetchApplications();
        } catch (error) {
            alert('Update failed');
        }
    };

    const updateInquiryStatus = async (id: string, status: string) => {
        try {
            await api.put(`/inquiries/${id}`, { status });
            fetchInquiries();
        } catch (error) {
            alert('Status update failed');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-700">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-slate-100 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col items-center mb-8 text-center">
                        <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png" className="h-14 w-auto mb-4" alt="Digital India" />
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Command Authorization</h2>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Identity Verification Gateway</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none outline-none font-black text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="ADMIN ID"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none outline-none font-black text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="••••••••"
                        />
                        <button type="submit" className="w-full py-4 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-base hover:opacity-90 dark:hover:bg-emerald-700 shadow-xl transition-all active:scale-95 uppercase tracking-widest">
                            Authorize Session
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-20">
            <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/5 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-black text-lg tracking-tight">Admin Dashboard</span>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5 text-slate-400" />
                </button>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`px-6 py-2 rounded-lg font-black text-sm uppercase tracking-wider transition-all ${activeTab === 'applications' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Applications
                        </button>
                        <button
                            onClick={() => setActiveTab('inquiries')}
                            className={`px-6 py-2 rounded-lg font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'inquiries' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Inquiries
                            {inquiries.filter(i => i.status === 'Pending').length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`px-6 py-2 rounded-lg font-black text-sm uppercase tracking-wider transition-all ${activeTab === 'services' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            Services
                        </button>
                    </div>

                    <button onClick={() => { fetchApplications(); fetchInquiries(); fetchServices(); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:rotate-180 transition-all duration-500">
                        <Loader2 className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {activeTab === 'applications' ? (
                    <div className="grid gap-4">
                        {applications.map(app => (
                            <div key={app._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-emerald-500/50 transition-all group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-black">{app.serviceName}</h3>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                }`}>{app.status}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">{app.userDetails.fullName} • {app.userDetails.mobile}</p>
                                        <p className="text-xs font-mono text-slate-500 mt-1">ID: {app.trackingId}</p>
                                    </div>
                                    <button onClick={() => setReviewApp(app)} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-brand hover:text-white dark:hover:bg-emerald-600 text-slate-600 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                                        Review
                                    </button>
                                </div>
                            </div>
                        ))}
                        {applications.length === 0 && !loading && (
                            <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest">No applications found</div>
                        )}
                    </div>
                ) : activeTab === 'inquiries' ? (
                    <div className="grid gap-4">
                        {inquiries.map(inq => (
                            <div key={inq._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-blue-500/50 transition-all">
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-black">{inq.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inq.status === 'Contacted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                                                {inq.status}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">{new Date(inq.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">{inq.message}</p>
                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {inq.mobile}</span>
                                            {inq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {inq.email}</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <a href={`https://wa.me/91${inq.mobile}?text=Hello ${inq.name}, receiving your inquiry regarding: ${inq.message}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-wider transition-colors">
                                            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center font-serif font-bold text-[8px]">W</span> WhatsApp
                                        </a>
                                        {inq.email && (
                                            <a href={`mailto:${inq.email}?subject=Regarding your inquiry&body=Hello ${inq.name},`} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-black text-xs uppercase tracking-wider transition-colors">
                                                <Mail className="w-3 h-3" /> Email
                                            </a>
                                        )}
                                        {inq.status === 'Pending' ? (
                                            <button onClick={() => updateInquiryStatus(inq._id, 'Contacted')} className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg font-black text-xs uppercase tracking-wider transition-all">
                                                Mark Contacted
                                            </button>
                                        ) : (
                                            <button onClick={() => updateInquiryStatus(inq._id, 'Pending')} className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg font-black text-xs uppercase tracking-wider transition-all opacity-50 hover:opacity-100">
                                                Mark Pending
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {inquiries.length === 0 && (
                            <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest">No inquiries found</div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button onClick={() => setViewType('grid')} className={`p-2 rounded-md transition-all ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-brand dark:text-emerald-500' : 'text-slate-400'}`}>
                                        <LayoutGrid className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setViewType('list')} className={`p-2 rounded-md transition-all ${viewType === 'list' ? 'bg-white dark:bg-slate-700 shadow text-brand dark:text-emerald-500' : 'text-slate-400'}`}>
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                                <button onClick={() => openServiceModal()} className="flex items-center gap-2 px-6 py-3 bg-brand dark:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all">
                                    <Plus className="w-4 h-4" /> Add New Service
                                </button>
                            </div>

                            {viewType === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {services.map((service) => (
                                        <div key={service._id} className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 hover:border-brand dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-xl relative">
                                            <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openServiceModal(service)} className="p-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-white rounded-lg shadow-lg hover:text-brand dark:hover:text-emerald-500">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteService(service._id)} className="p-2 bg-white dark:bg-slate-900 text-red-500 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="relative h-48 overflow-hidden">
                                                <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-4 left-4 text-white">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-${service.color === 'orange' ? 'orange-500' : service.color === 'green' ? 'emerald-500' : service.color === 'red' ? 'red-500' : 'blue-500'}`}>
                                                        {service.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-1">{service.title}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-4 h-10">{service.description}</p>
                                                <div className="flex items-center justify-between mt-4 text-xs font-bold text-slate-400">
                                                    <span>Fee: ₹{service.fee}</span>
                                                    <span>Priority: {(service as any).priority || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
                                            <tr>
                                                <th className="p-4 text-xs font-black uppercase text-slate-400">Service</th>
                                                <th className="p-4 text-xs font-black uppercase text-slate-400">Category</th>
                                                <th className="p-4 text-xs font-black uppercase text-slate-400">Fee</th>
                                                <th className="p-4 text-xs font-black uppercase text-slate-400">Priority</th>
                                                <th className="p-4 text-xs font-black uppercase text-slate-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {services.map((service) => (
                                                <tr key={service._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={service.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white">{service.title}</div>
                                                                <div className="text-xs text-slate-500">{service.description.substring(0, 30)}...</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-${service.color === 'orange' ? 'orange-100 text-orange-700' : service.color === 'green' ? 'emerald-100 text-emerald-700' : service.color === 'red' ? 'red-100 text-red-700' : 'blue-100 text-blue-700'}`}>
                                                            {service.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-bold text-slate-600 dark:text-slate-300">₹{service.fee}</td>
                                                    <td className="p-4 font-mono text-xs text-slate-500">{(service as any).priority || 0}</td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => openServiceModal(service)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand dark:hover:text-emerald-500 transition-colors">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDeleteService(service._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {
                showServiceModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-700">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black tracking-tight">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                                <button onClick={() => setShowServiceModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleServiceSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Title</label>
                                        <input required type="text" value={serviceFormData.title} onChange={e => setServiceFormData({ ...serviceFormData, title: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Category</label>
                                        <select value={serviceFormData.category} onChange={e => setServiceFormData({ ...serviceFormData, category: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20">
                                            <option value="Government">Government</option>
                                            <option value="Digital">Digital</option>
                                            <option value="Academic">Academic</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Description</label>
                                        <textarea required value={serviceFormData.description} onChange={e => setServiceFormData({ ...serviceFormData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20 h-24" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Fee (₹)</label>
                                        <input required type="number" value={serviceFormData.fee} onChange={e => setServiceFormData({ ...serviceFormData, fee: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Image URL</label>
                                        <input required type="text" value={serviceFormData.image} onChange={e => setServiceFormData({ ...serviceFormData, image: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Theme</label>
                                        <select value={serviceFormData.color} onChange={e => setServiceFormData({ ...serviceFormData, color: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20">
                                            <option value="blue">Blue</option>
                                            <option value="green">Green</option>
                                            <option value="orange">Orange</option>
                                            <option value="red">Red</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Priority (Higher shows first)</label>
                                        <input type="number" value={serviceFormData.priority} onChange={e => setServiceFormData({ ...serviceFormData, priority: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">External Link (Optional)</label>
                                        <input type="url" value={serviceFormData.externalLink} onChange={e => setServiceFormData({ ...serviceFormData, externalLink: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20" placeholder="https://..." />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Required Documents (comma separated)</label>
                                        <input type="text" value={serviceFormData.requiredDocs} onChange={e => setServiceFormData({ ...serviceFormData, requiredDocs: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20" placeholder="Aadhar Card, Pan Card, Photo..." />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-brand dark:bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {editingService ? 'Update Service' : 'Create Service'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                reviewApp && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-700">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black tracking-tight">Application Review</h2>
                                <button onClick={() => setReviewApp(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-400 font-bold text-xs uppercase">Applicant</p>
                                        <p className="font-bold text-lg">{reviewApp.userDetails.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold text-xs uppercase">Service</p>
                                        <p className="font-bold text-lg">{reviewApp.serviceName}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold text-xs uppercase">Mobile</p>
                                        <p className="font-bold">{reviewApp.userDetails.mobile}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-bold text-xs uppercase">Location</p>
                                        <p className="font-bold">{reviewApp.userDetails.city}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5">
                                    <p className="text-slate-400 font-bold text-xs uppercase mb-3">Attached Documents</p>
                                    <div className="space-y-2">
                                        {reviewApp.documents.map((doc, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                                                <span className="text-sm font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {doc.encodedName || `Document ${idx + 1}`}</span>
                                                <a href={`http://localhost:5000/${doc.filePath.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="text-xs font-black text-brand dark:text-emerald-500 uppercase tracking-wider hover:underline">View</a>
                                            </div>
                                        ))}
                                        {reviewApp.documents.length === 0 && <p className="text-sm text-slate-500 italic">No documents attached.</p>}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5">
                                    <p className="text-slate-400 font-bold text-xs uppercase">Update Status</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['review', 'verifying', 'completed', 'rejected'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => updateStatus(reviewApp._id, s)}
                                                disabled={s === 'rejected' && !statusNote}
                                                className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest border transition-all ${reviewApp.status === s ? 'bg-slate-800 text-white border-slate-800' :
                                                    'bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-400'
                                                    } ${s === 'completed' ? 'hover:text-emerald-500 hover:border-emerald-500' : ''} ${s === 'rejected' ? 'hover:text-red-500 hover:border-red-500' : ''}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add rejection reason or notes (Required for Rejection)"
                                        value={statusNote}
                                        onChange={e => setStatusNote(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
