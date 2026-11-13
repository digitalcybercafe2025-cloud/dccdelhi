import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ArrowLeft, ShieldAlert, Award, RefreshCw, HelpCircle } from 'lucide-react';

export const TermsConditions: React.FC = () => {
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
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">Service Agreement</span>
                            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Terms & Conditions</h1>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                        Updated for 2026 • Digital Cyber Cafe Mangolpuri
                    </p>
                </div>

                {/* Content Cards */}
                <div className="space-y-6 text-slate-700 dark:text-slate-300">
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <Award className="w-5 h-5 text-indigo-600" />
                            <h2>1. Nature of Services</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Digital Cyber Cafe functions as an authorized documentation assistance facilitator. We assist citizens, students, and businesses in preparing, uploading, formatting, and tracking their applications on respective government, regulatory, and public portals.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <ShieldAlert className="w-5 h-5 text-amber-600" />
                            <h2>2. Accuracy of Submitted Information</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            The applicant certifies that all documents, personal identifiers, and certificates submitted to Digital Cyber Cafe are original, authentic, and legally valid. The applicant remains solely responsible for the authenticity of their submitted documents.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <RefreshCw className="w-5 h-5 text-blue-600" />
                            <h2>3. Service Charges & Government Fees</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Charges displayed on this website cover professional service facilitation, document scanning, formatting, and portal submission. Government portal statutory fees (where applicable) are collected strictly as mandated by official departmental norms.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <HelpCircle className="w-5 h-5 text-emerald-600" />
                            <h2>4. Processing Timelines & Approvals</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Estimated turnaround days are indicative and depend upon departmental verification times, server uptime of governmental bodies, and verification of original physical documents where mandated by authorities.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};
