import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen py-10 px-4 md:px-8 transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb / Back */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-emerald-400 transition-colors mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                {/* Header Banner */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Legal & Compliance</span>
                            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Privacy Policy</h1>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                        Effective Date: January 1, 2026 • Digital Cyber Cafe Mangolpuri
                    </p>
                </div>

                {/* Content Cards */}
                <div className="space-y-6 text-slate-700 dark:text-slate-300">
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <Lock className="w-5 h-5 text-blue-600" />
                            <h2>1. Commitment to Data Privacy</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Digital Cyber Cafe Mangolpuri respects and values your privacy. In assisting citizens with documentation (Aadhaar correction, PAN card creation, Voter ID registration, Passport applications, Academic form submissions, and utility services), we adhere to strict confidentiality and data protection standards.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            <h2>2. Information We Collect</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            To process your requested services, we may collect the following personal information provided directly by you:
                        </p>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
                            <li>Identity details (Full Name, Date of Birth, Father’s/Husband’s Name, Gender).</li>
                            <li>Contact details (Mobile number, WhatsApp number, Email address, Physical address).</li>
                            <li>Identity document proofs (Aadhaar copy, PAN copy, Voter ID, Marksheets, Electricity bills, photographs).</li>
                            <li>Application transaction reference numbers and tracking identifiers.</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <Eye className="w-5 h-5 text-purple-600" />
                            <h2>3. How We Use & Protect Your Documents</h2>
                        </div>
                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <p>
                                <strong>Exclusive Purpose:</strong> Your documents and details are used solely to fill and submit your authorized applications on government and educational portals.
                            </p>
                            <p>
                                <strong>No Sale or Third-Party Sharing:</strong> We never sell, lease, rent, or trade your personal data or document copies with any third parties or advertisers.
                            </p>
                            <p>
                                <strong>Secure Storage & Deletion:</strong> Uploaded temporary files and drafts are kept in protected storage and routinely scrubbed after service completion or application fulfillment.
                            </p>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <h2>4. Contact & Redressal</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            If you have questions regarding your data privacy, or wish to request document deletion once your application is complete, please reach out to us:
                        </p>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs font-bold space-y-1 text-slate-700 dark:text-slate-300">
                            <p>📍 Location: Mangolpuri, Delhi - 110083</p>
                            <p>📞 Phone / WhatsApp: +91 8445221632</p>
                            <p>✉️ Email: digitalcybercafe@gmail.com</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
