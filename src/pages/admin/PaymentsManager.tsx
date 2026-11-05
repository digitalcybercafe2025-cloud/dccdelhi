import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Download, CheckCircle, Clock, CreditCard, Search, X, Copy, Check, MessageSquare, AlertCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';

const PaymentsManager: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    // Modal state for verifying payment with UTR and Remarks
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [adminRemark, setAdminRemark] = useState('');
    const [copiedUtr, setCopiedUtr] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchPayments = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/payments', { params: { search, status: statusFilter, method: methodFilter, startDate, endDate, page, limit: 15 } });
            setPayments(res.data.data || []);
            setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, methodFilter, startDate, endDate]);

    useEffect(() => {
        fetchPayments(1);
    }, [fetchPayments]);

    const openVerifyModal = (payment: any) => {
        setSelectedPayment(payment);
        setAdminRemark(payment.adminRemarks || '');
        setCopiedUtr(false);
    };

    const closeVerifyModal = () => {
        setSelectedPayment(null);
        setAdminRemark('');
        setCopiedUtr(false);
    };

    const handleCopyUtr = (utr: string) => {
        if (!utr) return;
        navigator.clipboard.writeText(utr);
        setCopiedUtr(true);
        setTimeout(() => setCopiedUtr(false), 2000);
    };

    const handleUpdateStatus = async (newStatus: 'Paid' | 'Pending') => {
        if (!selectedPayment) return;
        setIsUpdating(true);
        try {
            await api.patch(`/payments/${selectedPayment._id}/status`, {
                status: newStatus,
                adminRemarks: adminRemark.trim()
            });
            // Update local item
            setSelectedPayment((prev: any) => prev ? { ...prev, status: newStatus, paymentStatus: newStatus, adminRemarks: adminRemark.trim() } : null);
            fetchPayments(pagination.page);
        } catch (e: any) {
            console.error('Failed to update status', e);
            alert(e?.response?.data?.message || 'Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendWhatsApp = () => {
        if (!selectedPayment) return;
        let mobile = (selectedPayment.userMobile || '').replace(/[^0-9]/g, '');
        if (mobile.length === 10) mobile = '91' + mobile;

        const isPaid = (selectedPayment.status === 'Paid' || selectedPayment.paymentStatus === 'Paid');
        const statusText = isPaid ? '✅ VERIFIED & APPROVED (Paid)' : '⏳ AWAITING VERIFICATION / PENDING';
        const remarkText = adminRemark.trim() ? `\n📝 *Admin Remark:* ${adminRemark.trim()}` : '';

        const message = `*Digital Cyber Cafe - Payment Notification*\n\nNamaste *${selectedPayment.userName || 'Customer'}*,\n\nAapki application *${selectedPayment.applicationId || selectedPayment.trackingId}* (${selectedPayment.serviceName || 'Service'}) ke liye payment status update:\n\n💰 *Amount:* ₹${selectedPayment.amount}\n💳 *UTR / Txn ID:* ${selectedPayment.transactionId || 'N/A'}\n📊 *Status:* ${statusText}${remarkText}\n\n🔍 Aap website par apni application track kar sakte hain: https://digitalcybercafe.com/track\n\nDhanyawad!\n*Digital Cyber Cafe*`;

        const waUrl = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const stats = {
        total: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paid: payments.filter(p => (p.status === 'Paid' || p.paymentStatus === 'Paid')).reduce((sum, p) => sum + (p.amount || 0), 0),
        pending: payments.filter(p => (p.status !== 'Paid' && p.paymentStatus !== 'Paid')).reduce((sum, p) => sum + (p.amount || 0), 0)
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
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Find tracking ID, customer name, or UTR number..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-800 placeholder:text-slate-400 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all font-mono"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-600 text-xs font-black uppercase tracking-widest outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all appearance-none min-w-[140px]"
                        >
                            <option value="all">All Status</option>
                            <option value="Paid">Verified</option>
                            <option value="Pending">Awaiting</option>
                        </select>
                        <select
                            value={methodFilter}
                            onChange={e => setMethodFilter(e.target.value)}
                            className="px-4 py-3.5 rounded-2xl bg-slate-50 border-none text-slate-600 text-xs font-black uppercase tracking-widest outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all appearance-none min-w-[140px]"
                        >
                            <option value="all">All Gateways</option>
                            <option value="upi">UPI / QR Code</option>
                            <option value="card">Card / NetBanking</option>
                            <option value="cash">Counter Cash</option>
                        </select>
                        <button
                            onClick={handleExport}
                            className="px-6 py-3.5 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export CSV
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
                                    {['Tracking ID', 'Customer & Service', 'Amount', 'UTR / Method', 'Verification', 'Action'].map(h => (
                                        <th key={h} className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payments.map(pay => {
                                    const isPaid = (pay.status === 'Paid' || pay.paymentStatus === 'Paid');
                                    const rawDate = pay.paymentDate || pay.createdAt;
                                    const dateObj = rawDate ? new Date(rawDate) : null;
                                    const dateStr = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB') : 'Recent';

                                    return (
                                        <tr key={pay._id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] font-mono">
                                                        ID
                                                    </div>
                                                    <div>
                                                        <p className="font-mono text-[11px] font-black text-slate-800 tracking-tighter truncate max-w-[130px]">
                                                            {pay.applicationId || pay.trackingId || 'N/A'}
                                                        </p>
                                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">{dateStr}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{pay.serviceName || 'Service'}</p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                        <p className="text-slate-500 text-[11px] font-bold truncate max-w-[160px]">{pay.userName}</p>
                                                        {pay.userMobile && (
                                                            <span className="text-[10px] font-mono text-slate-400">({pay.userMobile})</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-base font-black text-slate-800">₹{pay.amount}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest leading-none">
                                                        {pay.method || 'UPI'}
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold text-indigo-600 mt-1 uppercase truncate max-w-[150px] bg-indigo-50/60 px-2 py-0.5 rounded-md inline-block">
                                                        {pay.transactionId || 'No UTR'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 inline-flex items-center gap-2 ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                                    {isPaid ? 'Success' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <button
                                                    onClick={() => openVerifyModal(pay)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer ${isPaid
                                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95'
                                                        }`}
                                                >
                                                    {isPaid ? 'Details / Edit' : 'Review & Verify'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 px-6">
                                            <div className="flex flex-col items-center opacity-40">
                                                <Clock className="w-12 h-12 mb-3 text-slate-300" />
                                                <span className="font-black uppercase tracking-[0.2em] text-xs text-slate-400">No Payment Records Found</span>
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
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Showing {payments.length} Payments</p>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchPayments(pagination.page - 1)}
                            className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest disabled:opacity-40 hover:border-indigo-100 hover:text-indigo-600 transition-all cursor-pointer"
                        >
                            Prev
                        </button>
                        <span className="px-4 py-2 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => fetchPayments(pagination.page + 1)}
                            className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest disabled:opacity-40 hover:border-indigo-100 hover:text-indigo-600 transition-all cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ── VERIFICATION & AUDIT MODAL (POPUP) ── */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-indigo-300" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base tracking-tight">Payment Verification & Audit</h3>
                                    <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase">
                                        ID: {selectedPayment.applicationId || selectedPayment.trackingId}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeVerifyModal}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                            {/* Service & Amount Highlight Card */}
                            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Service Name</p>
                                    <h4 className="font-black text-base text-slate-900 mt-0.5">{selectedPayment.serviceName}</h4>
                                    <p className="text-xs text-slate-500 font-medium">Customer: <strong className="text-slate-700">{selectedPayment.userName}</strong> ({selectedPayment.userMobile || 'No Phone'})</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Fee</p>
                                    <p className="text-2xl font-black text-indigo-600 font-mono">₹{selectedPayment.amount}</p>
                                </div>
                            </div>

                            {/* UTR / Transaction Reference Box */}
                            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200/80">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Submitted UPI Reference / UTR Number
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                        Method: {selectedPayment.method || 'UPI'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                                    <span className="font-mono text-base font-black text-slate-900 tracking-wider break-all">
                                        {selectedPayment.transactionId || 'NO UTR PROVIDED'}
                                    </span>
                                    {selectedPayment.transactionId && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopyUtr(selectedPayment.transactionId)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                                        >
                                            {copiedUtr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedUtr ? 'Copied' : 'Copy'}
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium mt-2">
                                    💡 Apne PhonePe/Paytm Soundbox ya Bank Statement me is 12-digit UTR ko match karein.
                                </p>
                            </div>

                            {/* Current Status Badge */}
                            <div className="flex items-center justify-between px-2">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Current Payment Status:</span>
                                <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 inline-flex items-center gap-1.5 ${(selectedPayment.status === 'Paid' || selectedPayment.paymentStatus === 'Paid')
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${(selectedPayment.status === 'Paid' || selectedPayment.paymentStatus === 'Paid') ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                    {(selectedPayment.status === 'Paid' || selectedPayment.paymentStatus === 'Paid') ? 'VERIFIED (PAID)' : 'PENDING APPROVAL'}
                                </span>
                            </div>

                            {/* Admin Remark Input */}
                            <div>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1.5">
                                    Admin Verification Remark / Note
                                </label>
                                <textarea
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                    placeholder="e.g. Payment verified via Soundbox / UTR matched with HDFC account..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none"
                                />
                            </div>

                            {/* Actions Buttons */}
                            <div className="pt-2 border-t border-slate-100 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() => handleUpdateStatus('Paid')}
                                        className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Pass / Verify (Paid)
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() => handleUpdateStatus('Pending')}
                                        className="py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        Decline / Mark Pending
                                    </button>
                                </div>

                                {/* Send WhatsApp Revert / Notification Button */}
                                {selectedPayment.userMobile && (
                                    <button
                                        type="button"
                                        onClick={handleSendWhatsApp}
                                        className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Send Update to Customer WhatsApp ({selectedPayment.userMobile})
                                        <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={closeVerifyModal}
                                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsManager;