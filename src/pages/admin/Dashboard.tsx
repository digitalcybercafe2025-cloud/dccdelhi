import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
interface Stats {
    total: number; pending: number; reviewing: number; verifying: number;
    completed: number; rejected: number; totalEarnings: number;
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

// ── Stat Card (matches screenshot gradient style) ─────────────────────────────
const StatCard: React.FC<{ label: string; value: number | string; gradient: string; iconPath: string; sub?: string }> = ({ label, value, gradient, iconPath, sub }) => {
    const [displayValue, setDisplayValue] = useState<any>(0);

    useEffect(() => {
        if (typeof value === 'number') {
            let start = 0;
            const end = value;
            const duration = 1000;
            const stepTime = Math.abs(Math.floor(duration / end));
            const timer = setInterval(() => {
                start += 1;
                setDisplayValue(start);
                if (start >= end) clearInterval(timer);
            }, stepTime || 50);
            return () => clearInterval(timer);
        } else {
            setDisplayValue(value);
        }
    }, [value]);

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
                    <p className="text-4xl font-black tracking-tighter tabular-nums">{displayValue}</p>
                    {sub && <p className="text-white/60 text-[11px] font-bold mt-1">{sub}</p>}
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

// ── Earnings mock monthly data ────────────────────────────────────────────────
const EARNING_DATA = [
    { m: 'Jan', v: 8500 }, { m: 'Feb', v: 12000 }, { m: 'Mar', v: 9800 },
    { m: 'Apr', v: 14200 }, { m: 'May', v: 18750 },
];

// ── popular services (mocked from app data) ───────────────────────────────────
const POPULAR_SERVICES = [
    { name: 'Income Certificate', count: 8 },
    { name: 'New PAN Card', count: 3 },
    { name: 'Driving License', count: 12 },
    { name: 'E-Shram Card', count: 3 },
];

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All Status');

    useEffect(() => {
        api.get('/admin/dashboard')
            .then(res => setStats(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!stats) return <div className="text-red-500 text-center py-20 font-bold">Failed to load dashboard data.</div>;

    const pendingCount = stats.pending;
    const inProcessCount = stats.reviewing + stats.verifying;
    const acceptedCount = stats.completed;

    const donutData = [
        { name: 'Pending', value: Math.max(pendingCount, 1), color: '#f59e0b' },
        { name: 'In Process', value: Math.max(inProcessCount, 1), color: '#3b82f6' },
        { name: 'Accepted', value: Math.max(acceptedCount, 1), color: '#10b981' },
    ];

    const filteredApps = statusFilter === 'All Status'
        ? stats.recent
        : stats.recent.filter((a: any) => STATUS_LABEL[a.status]?.toLowerCase() === statusFilter.toLowerCase());

    return (
        <div className="space-y-5">

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Services"
                    value={stats.total}
                    gradient="stat-card-blue"
                    iconPath="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
                <StatCard
                    label="New Applications"
                    value={stats.recent.filter((a: any) => {
                        const date = new Date(a.createdAt);
                        const now = new Date();
                        return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                    gradient="stat-card-green"
                    iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
                <StatCard
                    label="Pending Applications"
                    value={stats.pending}
                    gradient="stat-card-orange"
                    iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <StatCard
                    label="Total Earnings"
                    value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`}
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
                            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 outline-none"
                        >
                            {['All Status', 'Pending', 'Process', 'Accepted', 'Rejected'].map(s => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                        {/* This Month pill */}
                        <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 bg-white">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            This Month
                        </div>
                        {/* Export */}
                        <button className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                            Export ₹
                        </button>
                        {/* Add New */}
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-xs font-bold transition-colors"
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
                                        <td className="px-4 py-3">
                                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1">
                                                View
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-70"><path d="M7 10l5 5 5-5z" /></svg>
                                            </button>
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

            {/* ── BOTTOM ROW: 3 columns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Col 1: Popular Services (Corrected Heading) ── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-b-4 border-b-blue-500/10">
                    <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
                            Popular Services
                        </h3>
                        <div className="flex gap-2">
                            <button className="text-[10px] font-black uppercase tracking-widest border border-slate-100 rounded-xl px-3 py-1.5 text-slate-400 hover:bg-slate-50 transition-colors">Export</button>
                            <button onClick={() => navigate('/admin/services')} className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-xl px-3 py-1.5 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Manage</button>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-slate-50/50">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                            <span>Service Title</span>
                            <span className="flex items-center gap-1">Volume</span>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {POPULAR_SERVICES.map((s, i) => (
                            <div key={s.name} className="px-6 py-4 flex items-center justify-between hover:bg-blue-50/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black text-slate-300 group-hover:text-blue-500 transition-colors">0{i + 1}</span>
                                    <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        {s.count}
                                    </div>
                                    <button className="p-1.5 rounded-lg text-slate-300 hover:bg-white hover:text-blue-500 hover:shadow-sm transition-all active:scale-90">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Col 2: Applications Summary (Donut) + Earnings Summary ── */}
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
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0} paddingAngle={5}>
                                            {donutData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: 10, fontWeight: 900, borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Total</span>
                                    <span className="text-xl font-black text-slate-800">{stats.total}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 flex-1 max-w-[120px]">
                                {donutData.map(d => (
                                    <div key={d.name} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{ background: d.color }} />
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{d.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 tabular-nums">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Success Rate</span>
                                <span className="text-sm font-black text-emerald-600 mt-1">94.2%</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Monthly Avg</span>
                                <span className="text-sm font-black text-blue-600 mt-1">128</span>
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
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase">+12% vs LY</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">This Month</p>
                                <p className="text-base font-black text-slate-800">₹{(18750).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-blue-600 border border-blue-500 shadow-lg shadow-blue-500/20">
                                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Fiscal Year</p>
                                <p className="text-base font-black text-white">₹{stats.totalEarnings.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        <div className="h-32 -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={EARNING_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                                    <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={2000} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── Col 3: Testimonials + Messages ── */}
                <div className="flex flex-col gap-5">
                    {/* Recent Testimonials */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex-1">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full" />
                                Recent Testimonials
                            </h3>
                            <button className="text-slate-300 hover:text-slate-500 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[
                                { name: 'Meera Patel', time: '1 week ago', text: 'Excellent service, very helpful stat...' },
                                { name: 'Sameer Khan', time: '2 weeks ago', text: 'Highly recommend this cyber cafe...' },
                                { name: 'Pooja Sharma', time: '2 weeks ago', text: 'Quick and easy process, very happy...' }
                            ].map((t, i) => (
                                <div key={i} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between mb-0.5">
                                        <span className="text-sm font-bold text-blue-600">{i + 1}. {t.name}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">{t.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{t.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* New Messages */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-1 h-4 bg-orange-500 rounded-full" />
                                New Messages
                            </h3>
                            <button className="text-slate-300 hover:text-slate-500 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[
                                { name: 'Rajesh Verma', time: '3 hours ago', text: 'I need help with my PAN card appli...' },
                                { name: 'Sneha Kapoor', time: '1 day ago', text: 'Can I apply for multiple services a...' },
                                { name: 'Vikash Thakur', time: '2 days ago', text: 'Please call me regarding my inc...' }
                            ].map((m, i) => (
                                <div key={i} className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-purple-500'][i]} flex items-center justify-center text-white text-[10px] font-black flex-shrink-0`}>
                                        {initials(m.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-xs font-bold text-slate-700">{m.name}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{m.time}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate">{m.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] text-slate-400 pt-2">© 2024 ⊕ Digital Cyber Cafe</p>
        </div>
    );
};

export default Dashboard;
