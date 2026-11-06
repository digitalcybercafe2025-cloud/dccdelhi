import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ServiceForm from '../components/ServiceForm';
import { PaymentSection } from '../components/PaymentSection';
import { AcknowledgementReceipt } from '../components/AcknowledgementReceipt';
import { SERVICES } from '../../constants';
import api from '../api/axios';
import { generateReceipt } from '../utils/pdfGenerator';
import { toJpeg } from 'html-to-image';
import { Loader2, ArrowLeft, CheckCircle, Download, Image as ImageIcon, Hash } from 'lucide-react';

type Step = 'form' | 'payment' | 'success';

const STEP_LABELS = [
    { key: 'form', n: 1, label: 'Details' },
    { key: 'form', n: 2, label: 'Documents' },
    { key: 'payment', n: 3, label: 'Payment' },
    { key: 'success', n: 4, label: 'Complete' },
];

export const ApplyService: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [service, setService] = useState<typeof SERVICES[0] | null>(null);
    const [serviceLoading, setServiceLoading] = useState(true);
    const [step, setStep] = useState<Step>('form');
    const [isProcessing, setIsProcessing] = useState(false);
    const [applicationResult, setApplicationResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [downloadingJpeg, setDownloadingJpeg] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Collected from ServiceForm
    const [collectedUserDetails, setCollectedUserDetails] = useState<any>(null);
    const [collectedFiles, setCollectedFiles] = useState<File[]>([]);
    const [collectedSpecificFields, setCollectedSpecificFields] = useState<Record<string, string>>({});

    useEffect(() => {
        setServiceLoading(true);

        const fetchServiceData = async () => {
            try {
                const res = await api.get(`/services/${id}`);
                const data = res.data.data || res.data;
                if (data) {
                    if (data.externalLink) {
                        window.location.href = data.externalLink;
                        return;
                    }
                    setService({ ...data, id: data._id || data.id });
                    return;
                }
            } catch (_) {
                // Fallback to local constants if backend is offline or service is static
            }

            const foundLocal = SERVICES.find(s => s.id === id);
            if (foundLocal) {
                if (foundLocal.externalLink) {
                    window.location.href = foundLocal.externalLink;
                    return;
                }
                setService(foundLocal);
            } else {
                navigate('/services');
            }
        };

        fetchServiceData().finally(() => setServiceLoading(false));
    }, [id, navigate]);

    // Called when ServiceForm completes both user details + document upload
    const handleFormComplete = (
        userDetails: any,
        documents: File[],
        serviceSpecificData: Record<string, string>
    ) => {
        setCollectedUserDetails(userDetails);
        setCollectedFiles(documents);
        setCollectedSpecificFields(serviceSpecificData);
        setStep('payment');
    };

    const handlePaymentComplete = async (paymentDetails: { transactionId: string; method: string }) => {
        if (!service || !collectedUserDetails) return;
        setIsProcessing(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('serviceName', service.title);
            formDataToSend.append('serviceId', service.id);
            formDataToSend.append('userDetails', JSON.stringify({
                fullName: collectedUserDetails.fullName,
                mobile: collectedUserDetails.mobile,
                email: collectedUserDetails.email || '',
                address: collectedUserDetails.address,
                city: collectedUserDetails.city,
                state: collectedUserDetails.state,
                pincode: collectedUserDetails.pincode
            }));
            formDataToSend.append('paymentDetails', JSON.stringify({
                amount: service.fee,
                transactionId: paymentDetails.transactionId,
                method: paymentDetails.method,
                paymentStatus: 'Paid',
                paymentDate: new Date().toISOString()
            }));

            // Append service-specific fields as JSON
            if (Object.keys(collectedSpecificFields).length > 0) {
                formDataToSend.append('serviceSpecificFields', JSON.stringify(collectedSpecificFields));
            }

            // Append document types array for clean names (e.g. Aadhaar Card, PAN Card)
            const docTypes = collectedFiles.map((file, index) => (file as any).docType || file.name || `Document ${index + 1}`);
            formDataToSend.append('documentTypes', JSON.stringify(docTypes));

            // Append uploaded files
            collectedFiles.forEach((file, index) => {
                formDataToSend.append(`document_${index}`, file, file.name);
            });

            const response = await api.post('/applications', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setApplicationResult(response.data.data);
                setStep('success');
            } else {
                alert(`Submission failed: ${response.data.message}`);
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.message || error.message || 'An error occurred.';
            alert(`Error: ${errMsg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (!applicationResult || !service) return;
        await generateReceipt({
            ...applicationResult,
            paymentDetails: {
                ...applicationResult.paymentDetails,
                paymentDate: applicationResult.paymentDetails?.paymentDate || new Date()
            }
        });
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
            link.download = `Receipt-${applicationResult?.trackingId || 'Application'}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate receipt image:', err);
            alert('Could not download image. Please use Download PDF instead.');
        } finally {
            setDownloadingJpeg(false);
        }
    };

    const handleCopyId = () => {
        if (applicationResult?.trackingId) {
            navigator.clipboard.writeText(applicationResult.trackingId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Compute which global step number is active (1-4)
    const getGlobalStep = (): number => {
        if (step === 'form') return 1;
        if (step === 'payment') return 3;
        return 4;
    };
    const currentGlobalStep = getGlobalStep();

    if (serviceLoading || !service) return (
        <div className="h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
            <Loader2 className="animate-spin w-8 h-8 text-brand dark:text-emerald-500" />
        </div>
    );

    return (
        <div className="min-h-screen py-8 px-4 transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
            <div className="max-w-3xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => step === 'form' ? navigate(-1) : step === 'payment' ? setStep('form') : navigate('/services')}
                    className="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {step === 'success' ? 'Back to Services' : 'Back'}
                </button>

                <div className="rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5" style={{ backgroundColor: 'var(--background)' }}>
                    {/* ── Service Header ── */}
                    <div className="bg-brand dark:bg-emerald-600 p-7 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight relative z-10">{service.title}</h1>
                        <p className="opacity-90 font-bold text-sm mt-1 relative z-10">{service.description}</p>
                        <div className="mt-4 flex items-center gap-3 relative z-10">
                            <span className="inline-flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                                Fee: ₹{service.fee}
                            </span>
                            <span className="inline-flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                                ⏱ {service.estimatedDays}
                            </span>
                        </div>
                    </div>

                    {/* ── 4-Step Global Progress Bar ── */}
                    {step !== 'success' && (
                        <div className="px-8 pt-7 pb-1">
                            <div className="flex items-center justify-between">
                                {STEP_LABELS.map(({ n, label }) => (
                                    <React.Fragment key={n}>
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all duration-500 ${currentGlobalStep > n
                                                ? 'bg-brand dark:bg-emerald-500 border-brand dark:border-emerald-500 text-white shadow-lg shadow-brand/20'
                                                : currentGlobalStep === n
                                                    ? 'border-brand dark:border-emerald-500 bg-brand/10 dark:bg-emerald-500/10 text-brand dark:text-emerald-400 ring-4 ring-brand/10 dark:ring-emerald-500/10'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 bg-transparent'
                                                }`}>
                                                {currentGlobalStep > n ? <CheckCircle className="w-4 h-4" /> : n}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors hidden sm:block ${currentGlobalStep >= n ? 'text-brand dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                                                }`}>{label}</span>
                                        </div>
                                        {n < 4 && (
                                            <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-700 ${currentGlobalStep > n ? 'bg-brand dark:bg-emerald-500' : 'bg-slate-200 dark:bg-white/5'
                                                }`} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-7 md:p-8 pt-6">
                        {/* ── FORM STEPS ── */}
                        {step === 'form' && (
                            <ServiceForm
                                serviceName={service.title}
                                requiredDocs={service.requiredDocs}
                                mandatoryDocs={service.mandatoryDocs}
                                idProofs={service.idProofs}
                                addressProofs={service.addressProofs}
                                otherDocs={service.otherDocs}
                                serviceSpecificFields={service.serviceSpecificFields}
                                onComplete={handleFormComplete}
                            />
                        )}

                        {/* ── PAYMENT ── */}
                        {step === 'payment' && (
                            <PaymentSection
                                serviceName={service.title}
                                amount={service.fee}
                                onPaymentComplete={handlePaymentComplete}
                                isProcessing={isProcessing}
                            />
                        )}

                        {/* ── SUCCESS ── */}
                        {step === 'success' && applicationResult && (
                            <div className="text-center py-6 animate-in zoom-in-95 duration-500 space-y-6">
                                {/* Success icon */}
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                                    <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                                </div>

                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">
                                        Application Submitted Successfully!
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                                        Your application for <strong className="text-slate-700 dark:text-slate-200">{service.title}</strong> has been received with verified payment.
                                    </p>
                                </div>

                                {/* Tracking ID Bar */}
                                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-slate-800/80 dark:to-emerald-500/10 p-4 sm:p-5 rounded-2xl border border-blue-200/60 dark:border-white/10 inline-flex flex-col sm:flex-row items-center gap-4 justify-between w-full max-w-xl shadow-sm">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                                            <Hash className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tracking Reference ID</p>
                                            <p className="text-xl sm:text-2xl font-black text-brand dark:text-emerald-400 font-mono tracking-wider">
                                                {applicationResult.trackingId}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCopyId}
                                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 text-xs font-black uppercase tracking-wider hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
                                    >
                                        {copied ? '✓ Copied' : 'Copy ID'}
                                    </button>
                                </div>

                                {/* Two Download Buttons (PDF + JPEG) */}
                                <div className="flex flex-wrap gap-3 justify-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadReceipt}
                                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Download className="w-4 h-4" /> Download PDF Receipt
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadJpeg}
                                        disabled={downloadingJpeg}
                                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {downloadingJpeg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                        {downloadingJpeg ? 'Saving JPEG...' : 'Download JPEG Slip'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/track')}
                                        className="px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Track Application
                                    </button>
                                </div>

                                {/* Visual Slip Preview matching Reference Image */}
                                <div className="pt-4 overflow-x-auto pb-4">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 text-center">
                                        Official Acknowledgement Receipt Preview
                                    </p>
                                    <AcknowledgementReceipt ref={receiptRef} application={applicationResult} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
