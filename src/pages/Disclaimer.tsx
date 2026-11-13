import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, ShieldCheck, Scale } from 'lucide-react';

export const Disclaimer: React.FC = () => {
    return (
        <div className="min-h-screen py-10 px-4 md:px-8 transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-emerald-400 transition-colors mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                {/* Header Banner */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">Notice & Clarification</span>
                            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Public Disclaimer</h1>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                        Official Disclaimer Notice • Digital Cyber Cafe Mangolpuri
                    </p>
                </div>

                {/* Content Cards */}
                <div className="space-y-6 text-slate-700 dark:text-slate-300">
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <h2>1. Non-Government Private Entity</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Digital Cyber Cafe Mangolpuri is a private facilitation center. We are <strong>NOT</strong> an official governmental department, statutory authority, or agency of the Government of India or the Government of NCT of Delhi.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <Scale className="w-5 h-5 text-purple-600" />
                            <h2>2. Facilitation & Assistance Only</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            We assist clients by navigating official public portals (such as UIDAI, NSDL/UTIITSL, NVSP, Passport Seva, e-District Delhi, Income Tax Portal) on their behalf, based on information and documents provided by them. Final approval, rejection, issuance, or delay of any document or certificate is solely determined by the respective government authority.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <h2>3. Intellectual Property & Official Logos</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            All third-party trademarks, service marks, department seals, and program names (such as "Digital India", "Aadhaar", "PAN") displayed on this website belong to their respective statutory owners. Their presence on this site signifies service assistance areas and does not imply direct government ownership of this facility.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <h2>4. Verification & Inquiries</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Citizens may always apply directly through government portals free of charge (save for statutory fees). For questions or guidance on choosing the right official service, contact our support desk directly at <strong>+91 8445221632</strong>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};
