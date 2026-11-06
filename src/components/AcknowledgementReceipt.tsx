import React, { forwardRef } from 'react';
import { FileText, Phone, MapPin } from 'lucide-react';

interface AcknowledgementReceiptProps {
    application: {
        trackingId: string;
        serviceName: string;
        userDetails: {
            fullName: string;
            mobile: string;
            email?: string;
            address: string;
            city: string;
            state: string;
            pincode: string;
        };
        paymentDetails: {
            amount: number;
            transactionId?: string;
            paymentStatus: string;
            paymentDate?: string | Date;
        };
        documents?: Array<{
            docType?: string;
            originalName?: string;
            fileName?: string;
        }>;
        createdAt?: string | Date;
    };
}

export const AcknowledgementReceipt = forwardRef<HTMLDivElement, AcknowledgementReceiptProps>(
    ({ application }, ref) => {
        const { userDetails, paymentDetails, documents = [] } = application;
        const formattedDate = new Date(application.createdAt || paymentDetails.paymentDate || Date.now()).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return (
            <div
                ref={ref}
                className="w-full max-w-[680px] mx-auto bg-white text-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200/90 font-sans select-none text-left"
                style={{ backgroundColor: '#ffffff', color: '#1e293b' }}
            >
                {/* Top Accent Lines */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500 rounded-full mb-6" />

                {/* Header Branding */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                            D
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-[#003366]">
                            Digital <span className="text-blue-600">Cyber</span> Cafe
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold mt-1">
                        <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-blue-600 inline" />
                            Mobile: <strong>9911423881</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 inline" />
                            Address: <strong>G-663, Mangolpuri, Delhi 110083</strong>
                        </span>
                    </div>

                    <p className="text-[11px] font-bold text-slate-500 italic mt-2">
                        — Trusted Digital Services, Fast, Secure & Reliable. —
                    </p>
                </div>

                {/* Navy Blue Title Bar */}
                <div className="my-5 py-2.5 px-4 bg-[#1e3a5f] rounded-lg text-center shadow-sm">
                    <h2 className="text-sm sm:text-base font-black tracking-widest text-white uppercase">
                        ACKNOWLEDGEMENT RECEIPT
                    </h2>
                </div>

                {/* Table Fields */}
                <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
                    <div className="grid grid-cols-12 bg-slate-100/90 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <div className="col-span-5 sm:col-span-4">Field</div>
                        <div className="col-span-7 sm:col-span-8">Value</div>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
                        <div className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-50/50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Application ID:</div>
                            <div className="col-span-7 sm:col-span-8 font-mono font-bold text-blue-700 tracking-wider">
                                {application.trackingId}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-slate-50/40 hover:bg-slate-50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Service Applied:</div>
                            <div className="col-span-7 sm:col-span-8 font-bold text-slate-900">
                                {application.serviceName}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-50/50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Applicant Name:</div>
                            <div className="col-span-7 sm:col-span-8 font-bold text-slate-900 uppercase">
                                {userDetails?.fullName || 'N/A'}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-slate-50/40 hover:bg-slate-50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Mobile Number:</div>
                            <div className="col-span-7 sm:col-span-8 font-bold text-slate-900">
                                {userDetails?.mobile || 'N/A'}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-start hover:bg-slate-50/50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Address:</div>
                            <div className="col-span-7 sm:col-span-8 text-slate-700 uppercase font-semibold leading-relaxed">
                                {[userDetails?.address, userDetails?.city, userDetails?.state, userDetails?.pincode].filter(Boolean).join(', ')}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-slate-50/40 hover:bg-slate-50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Payment Status:</div>
                            <div className="col-span-7 sm:col-span-8">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {paymentDetails?.paymentStatus === 'Paid' ? 'Paid Successfully' : paymentDetails?.paymentStatus || 'Paid'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-50/50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Transaction ID:</div>
                            <div className="col-span-7 sm:col-span-8 font-mono font-bold text-slate-800">
                                {paymentDetails?.transactionId || 'N/A'}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-slate-50/40 hover:bg-slate-50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Payment Amount:</div>
                            <div className="col-span-7 sm:col-span-8 font-black text-slate-900 text-base">
                                ₹ {Number(paymentDetails?.amount || 0).toFixed(2)}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-50/50">
                            <div className="col-span-5 sm:col-span-4 font-bold text-slate-600">Date & Time:</div>
                            <div className="col-span-7 sm:col-span-8 font-semibold text-slate-700">
                                {formattedDate}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attached Documents List */}
                <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Attached Documents:
                    </h3>
                    {documents.length > 0 ? (
                        <ol className="space-y-1.5 text-xs text-slate-700 font-medium list-none">
                            {documents.map((doc, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <span className="font-bold text-slate-400">{idx + 1}.</span>
                                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="truncate">{doc.docType || doc.originalName || doc.fileName || `Document ${idx + 1}`}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No documents attached.</p>
                    )}
                </div>

                {/* Thank You & Footer Banner */}
                <div className="text-center pt-2">
                    <h4 className="text-base font-black text-[#003366]">Thank You!</h4>
                    <p className="text-xs text-slate-500 font-medium mb-4">We appreciate your business.</p>

                    <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-center">
                        <p className="text-xs font-black text-blue-900">
                            Trusted Digital Services, Fast, Secure & Reliable.
                        </p>
                        <p className="text-[11px] font-bold text-blue-700 mt-0.5">
                            For any assistance, contact: 9911423881 | www.digitalcybercafe.in
                        </p>
                    </div>
                </div>
            </div>
        );
    }
);

AcknowledgementReceipt.displayName = 'AcknowledgementReceipt';
