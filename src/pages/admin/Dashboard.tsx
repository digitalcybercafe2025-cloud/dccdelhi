import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ── Types (100% Real Database Schema) ─────────────────────────────────────────
interface Stats {
    total: number;
    totalServices: number;
    newToday: number;
    pending: number;
    reviewing: number;
    verifying: number;
    completed: number;
    rejected: number;
    totalEarnings: number;
    thisMonthEarnings: number;
    monthlyEarnings: Array<{ m: string; v: number }>;
    popularServices: Array<{ name: string; count: number }>;
    recentTestimonials: Array<{ name: string; message: string; createdAt: string }>;
    recentMessages: Array<{ name: string; message: string; createdAt: string }>;
    successRate: string;
    recent: any[];
}

// ── Color tokens matching screenshot ─────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
    received: 'bg-orange-100 text-orange-600',
    review: 'bg-blue-100 text-blue-600',
    verifying: 'bg-purple-100 text-purple-600',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
};
const STATUS_LABEL: Record<string, string> = {
    received: 'Pending', review: 'Process', verifying: 'In Process', completed: 'Accepted', rejected: 'Rejected'
};

// Deterministic avatar initials from name
const initials = (name: string) => name ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : 'U?';
const avatarBg = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-rose-500', 'bg-teal-500'];
    const idx = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[idx];
};

const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ── Stat Card (matches screenshot gradient style) ─────────────────────────────
const StatCard: React.FC<{ label: string; value: number | string; gradient: string; iconPath: string; isCurrency?: boolean }> = ({ label, value, gradient, iconPath, isCurrency }) => {
    const [displayValue, setDisplayValue] = useState<number>(0);
    const numValue = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, '')) || 0;

    useEffect(() => {
        if (numValue === 0) {
            setDisplayValue(0);
            return;
        }
        let start = 0;
        const end = numValue;
        const duration = 800;
        const stepTime = Math.max(Math.floor(duration / Math.min(end, 50)), 15);
        const increment = Math.ceil(end / 40) || 1;
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(start);
            }
        }, stepTime);
        return () => clearInterval(timer);
    }, [numValue]);

    return (
        <div className={`${gradient} rounded-3xl p-6 text-white flex flex-col gap-4 min-w-0 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
            {/* Background Icon Decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                    <path d={iconPath} />
                </svg>
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                    <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.15em]">{label}</p>
                    <p className="text-4xl font-black tracking-tighter tabular-nums">
                        {isCurrency ? `₹${displayValue.toLocaleString('en-IN')}` : displayValue}
                    </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={iconPath} />
                    </svg>
                </div>
            </div>

            {/* Indicator Dots */}
            <div className="flex items-center gap-1.5 relative z-10">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                <span className="text-[10px] font-black text-white/40 ml-1 uppercase tracking-widest">Live Flow</span>
            </div>
        </div>
    );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [dateFilter, setDateFilter] = useState('this_month');
    const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

    const fetchDashboardStats = () => {
        api.get('/admin/dashboard')
            .then(res => setStats(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!stats) return <div className="text-red-500 text-center py-20 font-bold">Failed to load dashboard data.</div>;

    const pendingCount = stats.pending || 0;
    const inProcessCount = (stats.reviewing || 0) + (stats.verifying || 0);
    const acceptedCount = stats.completed || 0;
    const totalAppsInPie = pendingCount + inProcessCount + acceptedCount;

    // Donut chart: 100% Real counts without artificial minimums
    const donutData = totalAppsInPie > 0 ? [
        { name: 'Pending', value: pendingCount, color: '#f59e0b' },
        { name: 'In Process', value: inProcessCount, color: '#3b82f6' },
        { name: 'Accepted', value: acceptedCount, color: '#10b981' },
    ] : [
        { name: 'No Applications', value: 1, color: '#e2e8f0' }
    ];

    const now = new Date();
    const filteredApps = (stats.recent || []).filter((app: any) => {
        // Status filter
        if (statusFilter !== 'All Status') {
            const label = STATUS_LABEL[app.status] || app.status;
            if (label.toLowerCase() !== statusFilter.toLowerCase()) return false;
        }

        // Date filter
        if (dateFilter === 'all') return true;
        if (!app.createdAt) return true;
        const appDate = new Date(app.createdAt);

        if (dateFilter === 'this_month') {
            return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'today') {
            return (
                appDate.getDate() === now.getDate() &&
                appDate.getMonth() === now.getMonth() &&
                appDate.getFullYear() === now.getFullYear()
            );
        }
        if (dateFilter === 'this_week') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return appDate >= sevenDaysAgo;
        }
        return true;
    });

    const handleExport = () => {
        if (!filteredApps.length) {
            alert('No applications found to export for the selected filter.');
            return;
        }
        const headers = ['Tracking ID', 'Applicant', 'Service', 'Payment', 'Status', 'Date Applied'];
        const rows = filteredApps.map((a: any) => [
            `"${a.trackingId || ''}"`,
            `"${a.userDetails?.fullName || ''}"`,
            `"${a.serviceName || ''}"`,
            `"${a.paymentDetails?.paymentStatus || 'Paid'}"`,
            `"${STATUS_LABEL[a.status] || a.status}"`,
            `"${new Date(a.createdAt).toLocaleDateString('en-IN')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `applications_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-5">
            {/* ── TOP 4 STAT CARDS (Gradient Style - Real DB Data) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Services"
                    value={stats.totalServices || 0}
                    gradient="stat-card-blue"
                    iconPath="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
                <StatCard
                    label="New Applications"
                    value={stats.newToday || 0}
                    gradient="stat-card-green"
                    iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
                <StatCard
                    label="Pending Applications"
                    value={stats.pending || 0}
                    gradient="stat-card-orange"
                    iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <StatCard
                    label="Total Earnings"
                    value={stats.totalEarnings || 0}
                    isCurrency={true}
                    gradient="stat-card-dark"
                    iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </div>

            {/* ── RECENT APPLICATIONS TABLE ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-b-4 border-b-blue-500/10">
                {/* Table header bar */}
                <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/30">
                    <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-600 rounded-full inline-block" />
                        Incoming Applications
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 outline-none hover:border-blue-400 transition-colors cursor-pointer"
                        >
                            {['All Status', 'Pending', 'Process', 'Accepted', 'Rejected'].map(s => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                        {/* This Month / Date filter */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-400 transition-colors shadow-xs">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 text-slate-500 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <select
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer text-slate-700 font-bold"
                            >
                                <option value="this_month">This Month</option>
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="this_week">This Week</option>
                            </select>
                        </div>
                        {/* Export */}
                        <button
                            onClick={handleExport}
                            title="Export filtered applications"
                            className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
                        >
                            Export ₹
                        </button>
                        {/* Add New */}
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-xs font-bold transition-colors active:scale-95"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                            Add New
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Application ID', 'User', 'Service', 'Payment', 'Status', 'Date Applied', 'Date', 'Action'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredApps.slice(0, 6).map((app: any) => {
                                const name = app.userDetails?.fullName || 'User';
                                const dateApplied = new Date(app.createdAt);
                                return (
                                    <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{app.trackingId}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full ${avatarBg(name)} flex items-center justify-center text-white text-[9px] font-black shrink-0`}>
                                                    {initials(name)}
                                                </div>
                                                <span className="font-semibold text-slate-700 text-xs whitespace-nowrap">{name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-700 text-xs whitespace-nowrap max-w-[120px] truncate">
                                            {app.serviceName}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-md">
                                                {app.paymentDetails?.paymentStatus || 'Paid'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md whitespace-nowrap ${STATUS_BADGE[app.status] || 'bg-slate-100 text-slate-500'}`}>
                                                {STATUS_LABEL[app.status] || app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {dateApplied.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                            {dateApplied.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </td>
                                        <td className="px-4 py-3 relative">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    type="button"
                                                    onClick={() => setActionMenuOpenId(actionMenuOpenId === app._id ? null : app._id)}
                                                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                                                    title="View & Actions"
                                                >
                                                    View
                                                    <svg
                                                        width="10"
                                                        height="10"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        className={`opacity-70 transition-transform duration-200 ${actionMenuOpenId === app._id ? 'rotate-180' : ''}`}
                                                    >
                                                        <path d="M7 10l5 5 5-5z" />
                                                    </svg>
                                                </button>

                                                {actionMenuOpenId === app._id && (
                                                    <div
                                                        className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActionMenuOpenId(null);
                                                                navigate(`/admin/applications?trackingId=${app.trackingId}`);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                            Review Application
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActionMenuOpenId(null);
                                                                navigate(`/admin/documents?search=${app.trackingId}`);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                            View Documents
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActionMenuOpenId(null);
                                                                window.open(`/track?id=${app.trackingId}`, '_blank');
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                            Track Live Status
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActionMenuOpenId(null);
                                                                navigator.clipboard.writeText(app.trackingId);
                                                                alert(`Tracking ID #${app.trackingId} copied!`);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                            Copy Tracking ID
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredApps.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-400 font-bold text-sm">
                                        No applications found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── BOTTOM ROW: 3 columns (Real Data from MongoDB) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── Col 1: Popular Services ── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-b-4 border-b-blue-500/10">
                    <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
                            Popular Services
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => navigate('/admin/services')} className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-xl px-3 py-1.5 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                                Manage
                            </button>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-slate-50/50">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                            <span>Service Title</span>
                            <span>Applications</span>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {(stats.popularServices && stats.popularServices.length > 0) ? (
                            stats.popularServices.map((s, i) => (
                                <div key={s.name || i} className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-slate-300 group-hover:text-blue-500 transition-colors">0{i + 1}</span>
                                        <span className="text-sm font-bold text-slate-700 truncate max-w-[160px]">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            {s.count}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-xs text-slate-400 font-bold">
                                No service applications yet
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Col 2: Applications Summary (Donut) + Earnings Trends ── */}
                <div className="flex flex-col gap-5">
                    {/* Donut chart */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex-1 flex flex-col justify-between border-b-4 border-b-emerald-500/10">
                        <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                            Applications Summary
                        </h3>
                        <div className="flex items-center justify-around gap-4 py-2">
                            <div className="w-32 h-32 flex-shrink-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0} paddingAngle={totalAppsInPie > 0 ? 5 : 0}>
                                            {donutData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: 10, fontWeight: 900, borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Total</span>
                                    <span className="text-xl font-black text-slate-800">{stats.total || 0}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 flex-1 max-w-[120px]">
                                {[
                                    { name: 'Pending', count: pendingCount, color: '#f59e0b' },
                                    { name: 'In Process', count: inProcessCount, color: '#3b82f6' },
                                    { name: 'Accepted', count: acceptedCount, color: '#10b981' }
                                ].map(d => (
                                    <div key={d.name} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{ background: d.color }} />
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{d.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 tabular-nums">{d.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Success Rate</span>
                                <span className="text-sm font-black text-emerald-600 mt-1">{stats.successRate || 100}%</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Inflow</span>
                                <span className="text-sm font-black text-blue-600 mt-1">{stats.total || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Earnings Summary with mini line chart */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 border-b-4 border-b-slate-800/10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-slate-800 rounded-full" />
                                Earnings Trends
                            </h3>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase">Live DB</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">This Month</p>
                                <p className="text-base font-black text-slate-800">₹{(stats.thisMonthEarnings || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-blue-600 border border-blue-500 shadow-lg shadow-blue-500/20">
                                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Total Revenue</p>
                                <p className="text-base font-black text-white">₹{(stats.totalEarnings || 0).toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        <div className="h-32 -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.monthlyEarnings || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="m" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ fontSize: 10, fontWeight: 900, borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                                    />
                                    <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1000} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── Col 3: Testimonials + Messages (Real Data from DB) ── */}
                <div className="flex flex-col gap-5">
                    {/* Recent Testimonials */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1 border-b-4 border-b-amber-500/10">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                Recent Testimonials
                            </h3>
                            <button onClick={() => navigate('/admin/testimonials')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                                View All
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {(stats.recentTestimonials && stats.recentTestimonials.length > 0) ? (
                                stats.recentTestimonials.map((t, i) => (
                                    <div key={i} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-xs font-bold text-slate-800">{i + 1}. {t.name}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{formatTimeAgo(t.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 italic">"{t.message}"</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400 font-bold">
                                    No client testimonials yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* New Messages / Inquiries */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-b-4 border-b-blue-500/10">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
                                Customer Messages
                            </h3>
                            <button onClick={() => navigate('/admin/settings')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
                                Inquiries
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {(stats.recentMessages && stats.recentMessages.length > 0) ? (
                                stats.recentMessages.map((m, i) => (
                                    <div key={i} className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-purple-500'][i % 3]} flex items-center justify-center text-white text-[10px] font-black flex-shrink-0`}>
                                            {initials(m.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-0.5">
                                                <span className="text-xs font-bold text-slate-800">{m.name}</span>
                                                <span className="text-[10px] text-slate-400 font-semibold">{formatTimeAgo(m.createdAt)}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">{m.message || 'Customer inquiry submitted'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400 font-bold">
                                    No new customer messages
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] text-slate-400 pt-2">© 2026 Digital Cyber Cafe Mangolpuri • Real-Time Database Synchronized</p>
        </div>
    );
};

export default Dashboard;