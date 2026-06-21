import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Download, CheckCircle, Clock, CreditCard, Search, X } from 'lucide-react';

const inputCls = 'px-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-800 placeholder:text-slate-400 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all';

const PaymentsManager: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    const fetchPayments = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/payments', { params: { search, status: statusFilter, method: methodFilter, startDate, endDate, page, limit: 15 } });
            setPayments(res.data.data);
            setPagination(res.data.pagination);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [search, statusFilter, methodFilter, startDate, endDate]);

    useEffect(() => { fetchPayments(1); }, [fetchPayments]);

    const toggleStatus = async (payment: any) => {
        const newStatus = payment.status === 'Paid' ? 'Pending' : 'Paid';
        try {
            await api.patch(`/payments/${payment._id}/status`, { status: newStatus });
            fetchPayments(pagination.page);
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('mangolpuri_admin_token');
        const params = new URLSearchParams({ status: statusFilter, method: methodFilter });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const url = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/payments/export?${params.toString()}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.setAttribute('download', 'payments.csv');
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const stats = {
        total: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paid: payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0),
        pending: payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + (p.amount || 0), 0)
    };

    return (
        <div className="space-y-6 pb-12">
            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Treasury', value: `₹${stats.total}`, icon: <CreditCard className="w-5 h-5" />, color: 'bg-indigo-600' },
                    { label: 'Verified Flow', value: `₹${stats.paid}`, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-emerald-500' },
                    { label: 'Awaiting Action', value: `₹${stats.pending}`, icon: <Clock className="w-5 h-5" />, color: 'bg-amber-500' },
                    { label: 'Cycle Count', value: pagination.total, icon: <Search className="w-5 h-5" />, color: 'bg-slate-800' }
                ].map((s, i) => (
                    <div key={i} className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 group hover:translate-y-[-4px] transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl text-white shadow-lg ${s.color} transition-transform group-hover:rotate-6`}>
                                {s.icon}
                            </div>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{s.label}</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</h3>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Find application ID, name, or amount..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-800 placeholder:text-slate-400 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all font-mono" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-600 text-xs font-black uppercase tracking-widest outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all appearance-none min-w-[140px]">
                            <option value="all">All Status</option>
                            <option value="Paid">Verified</option>
                            <option value="Pending">Awaiting</option>
                        </select>
                        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
                            className="px-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-600 text-xs font-black uppercase tracking-widest outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all appearance-none min-w-[140px]">
                            <option value="all">Any Gateway</option>
                            <option value="online">Online</option>
                            <option value="cash">Internal/Cash</option>
                        </select>
                        <button onClick={handleExport}
                            className="px-6 py-3.5 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95">
                            Export Signals
                        </button>
                    </div>
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
                                    {['Treasury ID', 'Flow Origin', 'Amount', 'Gateway', 'Verification', 'Action'].map(h => (
                                        <th key={h} className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payments.map(pay => (
                                    <tr key={pay._id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] font-mono">
                                                    ID
                                                </div>
                                                <div>
                                                    <p className="font-mono text-[11px] font-black text-slate-800 tracking-tighter truncate max-w-[120px]">{pay.applicationId}</p>
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">{new Date(pay.createdAt).toLocaleDateString('en-GB')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{pay.serviceName || 'Internal Flow'}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                    <p className="text-slate-500 text-[11px] font-bold truncate max-w-[150px]">{pay.userName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-base font-black text-slate-800">₹{pay.amount}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-600 uppercase tracking-widest leading-none">{pay.method}</span>
                                                <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase truncate max-w-[100px]">{pay.transactionId || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 inline-flex items-center gap-2 ${pay.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${pay.status === 'Paid' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                                                {pay.status === 'Paid' ? 'Success' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button onClick={() => toggleStatus(pay)}
                                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pay.status === 'Paid'
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95'
                                                    }`}>
                                                {pay.status === 'Paid' ? 'Revert' : 'Verify'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 px-6">
                                            <div className="flex flex-col items-center opacity-30">
                                                <div className="w-12 h-12 mb-4 text-slate-300" />
                                                <span className="font-black uppercase tracking-[0.3em] text-xs text-slate-400">No Treasury records found</span>
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
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Showing {payments.length} Signal Seeds</p>
                    <div className="flex gap-2">
                        <button disabled={pagination.page <= 1} onClick={() => fetchPayments(pagination.page - 1)}
                            className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest disabled:opacity-40 hover:border-indigo-100 hover:text-indigo-600 transition-all">
                            Prev
                        </button>
                        <span className="px-4 py-2 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {pagination.page} / {pagination.pages}
                        </span>
                        <button disabled={pagination.page >= pagination.pages} onClick={() => fetchPayments(pagination.page + 1)}
                            className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest disabled:opacity-40 hover:border-indigo-100 hover:text-indigo-600 transition-all">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsManager;
