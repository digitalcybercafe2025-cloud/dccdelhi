import React, { useState, useRef } from 'react';
import { Search, Loader2, FileText, CheckCircle, Clock, Copy, XCircle, AlertTriangle, RefreshCw, Hash, Download, Image as ImageIcon } from 'lucide-react';
import api from '../api/axios';
import { generateReceiptFromElement } from '../utils/pdfGenerator';
import { AcknowledgementReceipt } from '../components/AcknowledgementReceipt';
import { toJpeg } from 'html-to-image';

interface Application {
    trackingId: string;
    serviceName: string;
    status: string;
    certificateUrl?: string;
    rejectionReason?: string;
    updatedAt: string;
    createdAt?: string;
    userDetails?: {
        fullName: string;
        mobile: string;
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; darkBg: string; darkColor: string }> = {
    received: { label: 'Received', color: 'text-blue-700', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-500/20', darkColor: 'dark:text-blue-400' },
    review: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-100', darkBg: 'dark:bg-amber-500/20', darkColor: 'dark:text-amber-400' },
    verifying: { label: 'Verifying', color: 'text-purple-700', bg: 'bg-purple-100', darkBg: 'dark:bg-purple-500/20', darkColor: 'dark:text-purple-400' },
    completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-500/20', darkColor: 'dark:text-emerald-400' },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', darkBg: 'dark:bg-red-500/20', darkColor: 'dark:text-red-400' },
};

const STEPS = [
    { key: 'received', label: 'Received', icon: <CheckCircle className="w-4 h-4" />, desc: 'Application received by our team.' },
    { key: 'review', label: 'Review', icon: <FileText className="w-4 h-4" />, desc: 'Documents being reviewed.' },
    { key: 'verifying', label: 'Verifying', icon: <Clock className="w-4 h-4" />, desc: 'Verification in progress.' },
    { key: 'completed', label: 'Completed', icon: <CheckCircle className="w-4 h-4" />, desc: 'Application processed successfully.' },
];

const getStatusStep = (status: string): number => {
    const map: Record<string, number> = { received: 0, review: 1, verifying: 2, completed: 3, rejected: 3 };
    return map[status] ?? 0;
};

export const TrackApplication: React.FC = () => {
    const [trackingId, setTrackingId] = useState('');
    const [application, setApplication] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [downloadingJpeg, setDownloadingJpeg] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setApplication(null);
        if (!trackingId.trim()) return;
        setLoading(true);
        try {
            const response = await api.get(`/applications/track/${trackingId.trim()}`);
            if (response.data.success) {
                setApplication(response.data.data);
            } else {
                setError('Application not found. Check your Tracking ID.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || '';
            setError(msg || 'No application found with this ID. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!application) return;
        try {
            setDownloadingPdf(true);
            await generateReceiptFromElement(receiptRef.current, application.trackingId, application);
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleDownloadJpeg = async () => {
        if (!receiptRef.current) return;
        try {
            setDownloadingJpeg(true);
            const dataUrl = await toJpeg(receiptRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            const link = document.createElement('a');
            link.download = `Receipt-${application?.trackingId || 'Application'}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to generate receipt image:', err);
            alert('Could not download image. Please use Download PDF instead.');
        } finally {
            setDownloadingJpeg(false);
        }
    };

    const handleCopy = () => {
        if (application?.trackingId) {
            navigator.clipboard.writeText(application.trackingId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadCertificate = async () => {
        if (!application) return;
        try {
            const response = await api.get(`/applications/${application.trackingId}/certificate/download`, {
                responseType: 'blob'
            });
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);

            // Detect extension from certificateUrl if possible, fallback to pdf
            const ext = application.certificateUrl?.split('.').pop() || 'pdf';
            const fileName = `Certificate-${application.trackingId}.${ext}`;

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Certificate Download Error:', err);
            alert('Failed to download certificate. It might not be ready yet.');
        }
    };

    const currentStepIdx = application ? getStatusStep(application.status) : -1;
    const isRejected = application?.status === 'rejected';
    const isCompleted = application?.status === 'completed';
    const conf = application ? STATUS_CONFIG[application.status] : null;

    return (
        <div className="min-h-screen py-12 px-4 transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
            <div className="max-w-2xl mx-auto">

                {/* ─── Header ─── */}
                <div className="text-center mb-12">
                    <div className="w-14 h-14 rounded-2xl bg-brand dark:bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand/30 dark:shadow-emerald-500/20">
                        <Search className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Track Your Application</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Enter your Tracking ID to see real-time status updates.</p>
                </div>

                {/* ─── Search Form ─── */}
                <form onSubmit={handleTrack} className="relative max-w-lg mx-auto mb-12">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="e.g. PAN-2026-X8291..."
                        className="w-full pl-12 pr-32 py-4 rounded-2xl border border-slate-200 dark:border-white/10 outline-none focus:ring-4 focus:ring-brand/20 dark:focus:ring-emerald-500/20 font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all shadow-xl text-sm"
                        style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !trackingId.trim()}
                        className="absolute inset-y-2 right-2 px-5 bg-brand dark:bg-emerald-600 rounded-xl text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Search className="w-3.5 h-3.5" /> Track</>}
                    </button>
                </form>

                {/* ─── Error ─── */}
                {error && (
                    <div className="p-5 mb-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold text-center border border-red-200 dark:border-red-500/20 animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        <p>{error}</p>
                        <button onClick={() => setError('')} className="text-xs underline opacity-70 hover:opacity-100">Dismiss</button>
                    </div>
                )}

                {/* ─── Result Card ─── */}
                {application && (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden animate-in zoom-in-95 duration-500">

                        {/* Card Header */}
                        <div className="p-8 pb-6 border-b border-slate-100 dark:border-white/5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                                        {application.serviceName}
                                    </h2>
                                    {application.userDetails?.fullName && (
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                            Applicant: {application.userDetails.fullName}
                                        </p>
                                    )}
                                </div>
                                {conf && (
                                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${conf.bg} ${conf.color} ${conf.darkBg} ${conf.darkColor}`}>
                                        {conf.label}
                                    </span>
                                )}
                            </div>

                            {/* Tracking ID with copy */}
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tracking ID</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-white font-mono tracking-wider">{application.trackingId}</p>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-brand dark:hover:bg-emerald-600 group transition-all"
                                    title="Copy tracking ID"
                                >
                                    {copied
                                        ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        : <Copy className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                    }
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* ─── STATUS STEPPER ─── */}
                            <div className="relative">
                                {/* Progress line */}
                                <div className="absolute left-4 top-4 right-4 h-1 bg-slate-100 dark:bg-white/5 rounded-full z-0">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isRejected ? 'bg-red-500' : 'bg-brand dark:bg-emerald-500'}`}
                                        style={{ width: `${isRejected ? 100 : (currentStepIdx / (STEPS.length - 1)) * 100}%` }}
                                    />
                                </div>

                                <div className="relative z-10 flex justify-between">
                                    {STEPS.map((step, idx) => {
                                        const isActive = idx <= currentStepIdx;
                                        const isCurrent = idx === currentStepIdx && !isRejected;
                                        const showReject = isRejected && idx === STEPS.length - 1;

                                        return (
                                            <div key={step.key} className="flex flex-col items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${showReject
                                                    ? 'bg-red-500 border-white dark:border-slate-900 text-white shadow-lg shadow-red-500/30'
                                                    : isActive
                                                        ? 'bg-brand dark:bg-emerald-500 border-white dark:border-slate-900 text-white shadow-lg shadow-brand/30 dark:shadow-emerald-500/30'
                                                        : 'bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-900 text-slate-300 dark:text-slate-600'
                                                    } ${isCurrent ? 'ring-4 ring-brand/20 dark:ring-emerald-500/20 scale-110' : ''}`}>
                                                    {showReject ? <XCircle className="w-4 h-4" /> : isActive ? step.icon : <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />}
                                                </div>
                                                <div className="text-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest block transition-colors ${showReject ? 'text-red-500' : isCurrent ? 'text-brand dark:text-emerald-400' : isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'
                                                        }`}>{showReject ? 'Rejected' : step.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ─── Current Status Description ─── */}
                            {!isRejected && !isCompleted && (
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand/10 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                        <RefreshCw className="w-4 h-4 text-brand dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{STEPS[currentStepIdx]?.label || 'Processing'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{STEPS[currentStepIdx]?.desc}</p>
                                    </div>
                                </div>
                            )}

                            {/* ─── COMPLETED: Certificate Download ─── */}
                            {isCompleted && (
                                <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 animate-in zoom-in-95 duration-500">
                                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                                    <h3 className="font-black text-emerald-700 dark:text-emerald-400 mb-1">Application Completed!</h3>
                                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 font-medium mb-4">Your documents have been processed successfully.</p>
                                    {application.certificateUrl ? (
                                        <button
                                            onClick={handleDownloadCertificate}
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 hover:-translate-y-1 transition-all active:scale-95 w-full justify-center sm:w-auto"
                                        >
                                            <FileText className="w-5 h-5" /> Download Certificate
                                        </button>
                                    ) : (
                                        <p className="text-sm text-emerald-600/60 font-bold italic">Certificate will be uploaded by admin shortly.</p>
                                    )}
                                </div>
                            )}

                            {/* ─── REJECTED: Reason Card ─── */}
                            {isRejected && (
                                <div className="p-6 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-red-700 dark:text-red-400 uppercase tracking-wider text-sm">Application Rejected</h3>
                                            <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest">Reason for rejection:</p>
                                        </div>
                                    </div>
                                    <div className="bg-red-100/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                                        <p className="text-sm text-red-700 dark:text-red-300 font-medium leading-relaxed">
                                            {application.rejectionReason || 'Documents were incomplete or unclear. Please contact us for details.'}
                                        </p>
                                    </div>
                                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            You may reapply by visiting a Digital Cyber Cafe center or call +91-8445221632.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ─── Receipt Downloads (PDF + JPEG) ─── */}
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDownloadPdf}
                                        disabled={downloadingPdf}
                                        className="py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                        {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        {downloadingPdf ? 'Generating PDF...' : 'Download PDF Receipt'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadJpeg}
                                        disabled={downloadingJpeg}
                                        className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                        {downloadingJpeg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                        {downloadingJpeg ? 'Generating...' : 'Download JPEG Slip'}
                                    </button>
                                </div>

                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    Last Updated: {new Date(application.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>

                                {/* Offscreen hidden receipt element captured for both PDF and JPEG downloads */}
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: 'fixed',
                                        left: '-9999px',
                                        top: 0,
                                        width: '720px',
                                        pointerEvents: 'none',
                                        backgroundColor: '#ffffff',
                                        zIndex: -1,
                                    }}
                                >
                                    <AcknowledgementReceipt ref={receiptRef} application={application} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
