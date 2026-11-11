import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone, FileRejection } from 'react-dropzone';
import { FileText, CheckCircle, ChevronRight, AlertCircle, X, Upload, Eye, ShieldCheck, MapPin, Files, Loader2 } from 'lucide-react';
import type { ServiceSpecificField } from '../../types';
import { compressDocumentFile } from '../utils/fileCompressor';
import { saveApplicationDraft } from '../utils/draftStorage';

interface UserDetails {
    fullName: string;
    mobile: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    [key: string]: string;
}

interface ServiceFormProps {
    serviceId?: string;
    serviceName: string;
    requiredDocs: string[];
    mandatoryDocs?: string[];
    idProofs?: string[];
    addressProofs?: string[];
    otherDocs?: string[];
    serviceSpecificFields?: ServiceSpecificField[];
    initialDraft?: {
        formSubStep?: 'details' | 'documents';
        userDetails?: UserDetails | null;
        specificFields?: Record<string, string>;
        files?: File[];
    } | null;
    onComplete: (
        userDetails: UserDetails,
        documents: File[],
        serviceSpecificData: Record<string, string>
    ) => void;
}

// Per-document dropzone with smart HD image compression
const DocDropzone: React.FC<{
    docName: string;
    file: File | undefined;
    onFileAccepted: (file: File) => void;
    onRemove: () => void;
}> = ({ docName, file, onFileAccepted, onRemove }) => {
    const [compressing, setCompressing] = useState(false);

    const onDrop = useCallback(async (accepted: File[], rejected: FileRejection[]) => {
        if (accepted.length > 0) {
            const rawFile = accepted[0];
            if (rawFile.type === 'application/pdf' && rawFile.size > 5 * 1024 * 1024) {
                alert('PDF file is too large. Max 5MB allowed for PDFs.');
                return;
            }
            setCompressing(true);
            try {
                const result = await compressDocumentFile(rawFile);
                if (result.wasCompressed) {
                    (result.file as any).originalSize = result.originalSize;
                }
                onFileAccepted(result.file);
            } finally {
                setCompressing(false);
            }
        } else if (rejected.length > 0) {
            const reason = rejected[0]?.errors[0]?.code;
            if (reason === 'file-too-large') alert('File is too large. Max 15MB allowed.');
            else alert('Invalid file type. Use JPG, PNG, WEBP, GIF, or PDF.');
        }
    }, [onFileAccepted]);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'image/gif': ['.gif'],
            'application/pdf': ['.pdf'],
        },
        maxSize: 15 * 1024 * 1024,
        multiple: false,
    });

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (compressing) {
        return (
            <div className="w-full h-24 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-500/10 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Optimizing HD quality & size...</p>
            </div>
        );
    }

    if (file) {
        const origSize = (file as any).originalSize;
        return (
            <div className="w-full rounded-xl border-2 border-emerald-400/50 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 p-4 flex items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    {file.type === 'application/pdf'
                        ? <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        : <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">{file.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase">
                        {formatSize(file.size)}
                        {origSize && origSize > file.size ? ` (compressed from ${formatSize(origSize)})` : ''}
                        {' • '}
                        {file.type.includes('pdf') ? 'PDF' : 'HD Compressed Image'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <button
                        type="button"
                        onClick={onRemove}
                        className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-500/30 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors group"
                    >
                        <X className="w-3 h-3 text-emerald-600 group-hover:text-red-500" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${isDragActive
                ? 'border-brand dark:border-emerald-400 bg-brand/5 dark:bg-emerald-500/10 scale-[1.02]'
                : 'border-slate-300 dark:border-slate-600 hover:border-brand/60 dark:hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
        >
            <input {...getInputProps()} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragActive ? 'bg-brand/10 dark:bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/5'}`}>
                <Upload className={`w-5 h-5 transition-colors ${isDragActive ? 'text-brand dark:text-emerald-400' : 'text-slate-400'}`} />
            </div>
            {isDragActive
                ? <p className="text-xs font-bold text-brand dark:text-emerald-400">Drop here!</p>
                : <p className="text-xs font-bold text-slate-400 text-center px-4">
                    Drag & drop or <span className="text-brand dark:text-emerald-400">browse</span><br />
                    <span className="text-[10px] font-semibold text-slate-400">JPG, PNG, WEBP (Auto-Compressed HD) or PDF • Max 5MB</span>
                </p>
            }
        </div>
    );
};

const ServiceForm: React.FC<ServiceFormProps> = ({
    serviceId,
    serviceName,
    requiredDocs = [],
    mandatoryDocs = [],
    idProofs = [],
    addressProofs = [],
    otherDocs = [],
    serviceSpecificFields = [],
    initialDraft = null,
    onComplete,
}) => {
    const [step, setStep] = useState<'details' | 'documents'>(
        initialDraft?.formSubStep === 'documents' && initialDraft?.userDetails ? 'documents' : 'details'
    );
    const [collectedDetails, setCollectedDetails] = useState<UserDetails | null>(initialDraft?.userDetails || null);
    const [collectedSpecific, setCollectedSpecific] = useState<Record<string, string>>(initialDraft?.specificFields || {});
    const [uploadedFiles, setUploadedFiles] = useState<{ docType: string; file: File }[]>(() => {
        if (!initialDraft?.files?.length) return [];
        return initialDraft.files.map(f => ({
            docType: (f as any).docType || f.name,
            file: f,
        }));
    });

    // Category resolution & normalization
    const hasCategorized = (mandatoryDocs && mandatoryDocs.length > 0) ||
        (idProofs && idProofs.length > 0) ||
        (addressProofs && addressProofs.length > 0) ||
        (otherDocs && otherDocs.length > 0);

    const activeMandatory = hasCategorized ? mandatoryDocs : requiredDocs;
    const activeIdProofs = idProofs || [];
    const activeAddressProofs = addressProofs || [];
    const activeOtherDocs = otherDocs || [];

    // Selected proof types from dropdowns/pills
    const [selectedIdProof, setSelectedIdProof] = useState<string>(activeIdProofs[0] || '');
    const [selectedAddressProof, setSelectedAddressProof] = useState<string>(activeAddressProofs[0] || '');
    const [selectedOtherDoc, setSelectedOtherDoc] = useState<string>(activeOtherDocs[0] || '');

    // Current active slot for single-slot viewing (or fallback)
    const initialSlot = activeMandatory[0] || selectedIdProof || selectedAddressProof || selectedOtherDoc || 'Document';
    const [activeDocSlot, setActiveDocSlot] = useState<string>(initialSlot);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UserDetails & Record<string, string>>({
        defaultValues: {
            ...(initialDraft?.userDetails || {}),
            ...(initialDraft?.specificFields || {}),
        }
    });

    useEffect(() => {
        if (initialDraft?.userDetails) {
            reset({
                ...initialDraft.userDetails,
                ...(initialDraft.specificFields || {}),
            });
            setCollectedDetails(initialDraft.userDetails);
            setCollectedSpecific(initialDraft.specificFields || {});
            if (initialDraft.files?.length) {
                setUploadedFiles(initialDraft.files.map(f => ({
                    docType: (f as any).docType || f.name,
                    file: f,
                })));
            }
            if (initialDraft.formSubStep === 'documents') {
                setStep('documents');
            }
        }
    }, [initialDraft, reset]);

    // Auto-save form draft (details + compressed files) to IndexedDB whenever files/step change
    useEffect(() => {
        if (!serviceId || !collectedDetails) return;
        saveApplicationDraft({
            serviceId,
            step: 'form',
            formSubStep: step,
            userDetails: collectedDetails,
            specificFields: collectedSpecific,
            files: uploadedFiles.map(u => {
                (u.file as any).docType = u.docType;
                return u.file;
            }),
            updatedAt: Date.now(),
        });
    }, [serviceId, step, collectedDetails, collectedSpecific, uploadedFiles]);

    const onDetailsSubmit = (data: UserDetails & Record<string, string>) => {
        const specificData: Record<string, string> = {};
        serviceSpecificFields.forEach(f => {
            if (data[f.name] !== undefined) specificData[f.name] = data[f.name];
        });
        const nextDetails: UserDetails = {
            fullName: data.fullName,
            mobile: data.mobile,
            email: data.email || '',
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
        };
        setCollectedDetails(nextDetails);
        setCollectedSpecific(specificData);
        setStep('documents');
    };

    const getFileForDoc = (docType: string) => uploadedFiles.find(f => f.docType === docType);

    const setFileForDoc = (docType: string, file: File) => {
        setUploadedFiles(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(f => f.docType === docType);
            if (idx >= 0) updated[idx] = { docType, file };
            else updated.push({ docType, file });
            return updated;
        });
    };

    const removeFileForDoc = (docType: string) => {
        setUploadedFiles(prev => prev.filter(f => f.docType !== docType));
    };

    // Validation checks
    const mandatoryMissing = activeMandatory.filter(doc => !getFileForDoc(doc));
    const hasUploadedId = activeIdProofs.length === 0 || activeIdProofs.some(doc => !!getFileForDoc(doc));
    const hasUploadedAddress = activeAddressProofs.length === 0 || activeAddressProofs.some(doc => !!getFileForDoc(doc));
    const isReadyToSubmit = mandatoryMissing.length === 0 && hasUploadedId && hasUploadedAddress;

    const handleFinalSubmit = () => {
        if (!collectedDetails) return;
        if (mandatoryMissing.length > 0) {
            alert(`Please upload mandatory documents: ${mandatoryMissing.join(', ')}`);
            return;
        }
        if (!hasUploadedId) {
            alert(`Please select and upload at least 1 Identity Proof.`);
            return;
        }
        if (!hasUploadedAddress) {
            alert(`Please select and upload at least 1 Address Proof.`);
            return;
        }

        onComplete(
            collectedDetails,
            uploadedFiles.map(f => {
                const fl = f.file;
                (fl as any).docType = f.docType;
                return fl;
            }),
            collectedSpecific
        );
    };

    // Progress counter
    const totalRequiredCount = activeMandatory.length + (activeIdProofs.length > 0 ? 1 : 0) + (activeAddressProofs.length > 0 ? 1 : 0);
    const completedRequiredCount = (activeMandatory.length - mandatoryMissing.length) + (hasUploadedId && activeIdProofs.length > 0 ? 1 : 0) + (hasUploadedAddress && activeAddressProofs.length > 0 ? 1 : 0);
    const progressPercent = totalRequiredCount > 0 ? Math.round((completedRequiredCount / totalRequiredCount) * 100) : 100;

    const inputClass = "theme-input w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand/20 dark:focus:ring-emerald-500/20 focus:border-brand/50 dark:focus:border-emerald-500/50 font-bold transition-all";
    const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 ml-1";

    /* ── STEP: DETAILS ── */
    if (step === 'details') {
        return (
            <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onDetailsSubmit)(e);
            }} className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                        <input {...register('fullName', { required: 'Full name is required' })} className={inputClass} placeholder="As per Aadhaar card" />
                        {errors.fullName && <span className="text-red-500 text-[10px] font-bold ml-1">⚠ {errors.fullName.message}</span>}
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
                        <input {...register('mobile', { required: 'Mobile is required', pattern: { value: /^[6-9][0-9]{9}$/, message: 'Enter valid 10-digit mobile' } })} className={inputClass} placeholder="10-digit mobile" maxLength={10} />
                        {errors.mobile && <span className="text-red-500 text-[10px] font-bold ml-1">⚠ {errors.mobile.message}</span>}
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>Email Address</label>
                        <input {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} type="email" className={inputClass} placeholder="Email (optional)" />
                        {errors.email && <span className="text-red-500 text-[10px] font-bold ml-1">⚠ {errors.email.message}</span>}
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>City <span className="text-red-500">*</span></label>
                        <input {...register('city', { required: 'City is required' })} className={inputClass} placeholder="City" />
                        {errors.city && <span className="text-red-500 text-[10px] font-bold ml-1">⚠ {errors.city.message}</span>}
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>State <span className="text-red-500">*</span></label>
                        <input {...register('state', { required: 'State is required' })} className={inputClass} placeholder="State" defaultValue="Delhi" />
                        {errors.state && <span className="text-red-500 text-[10px] font-bold ml-1">⚠ {errors.state.message}</span>}
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>Pincode <span className="text-red-500">*</span></label>
                        <input {...register('pincode', { required: 'Pincode is required', pattern: { value: /^[0-9]{6}$/, message: 'Enter valid 6-digit pincode' } })} className={inputClass} placeholder="6-digit pincode" maxLength={6} />
                        {errors.pincode && <span className="text-red-500 text-[10px] font-bold ml-1">⚠ {errors.pincode.message}</span>}
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className={labelClass}>Full Address <span className="text-red-500">*</span></label>
                        <textarea {...register('address', { required: 'Address is required' })} rows={2} className={`${inputClass} resize-none`} placeholder="House No, Street, Locality, Landmark" />
                        {errors.address && <span className="text-red-500 text-[10px] font-bold ml-1">⚠ {errors.address.message}</span>}
                    </div>
                </div>

                {/* Service-Specific Fields */}
                {serviceSpecificFields.length > 0 && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{serviceName} — Additional Details</span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {serviceSpecificFields.map(field => (
                                <div key={field.name} className="space-y-1">
                                    <label className={labelClass}>
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.type === 'select' ? (
                                        <select
                                            {...register(field.name as any, { required: field.required ? `${field.label} is required` : false })}
                                            className={inputClass}
                                        >
                                            <option value="">Select {field.label}</option>
                                            {field.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            {...register(field.name as any, { required: field.required ? `${field.label} is required` : false })}
                                            type={field.type}
                                            placeholder={field.placeholder || ''}
                                            className={inputClass}
                                        />
                                    )}
                                    {errors[field.name as keyof typeof errors] && (
                                        <span className="text-red-500 text-[10px] font-bold ml-1">
                                            ⚠ {(errors[field.name as keyof typeof errors] as any)?.message}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button type="submit" onClick={(e) => { if (Object.keys(errors).length > 0) e.preventDefault(); }} className="w-full py-4 mt-2 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand/20 flex justify-center items-center gap-2 active:scale-95">
                    Next: Upload Documents <ChevronRight className="w-4 h-4" />
                </button>
            </form>
        );
    }

    /* ── STEP: DOCUMENTS ── */
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">Document Upload for {serviceName}</h4>
                    <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-0.5">Please upload clear photos or PDF scans. JPG, PNG, PDF accepted (Max 5MB each).</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {completedRequiredCount}/{totalRequiredCount} Required Sections Ready
                </span>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand dark:bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <span className="text-xs font-black text-brand dark:text-emerald-400">{progressPercent}%</span>
            </div>

            {/* 1. MANDATORY DOCUMENTS */}
            {activeMandatory.length > 0 && (
                <div className="p-4 rounded-2xl border border-red-200/80 bg-red-50/30 dark:bg-red-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <h5 className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                                1. Mandatory Documents (अनिवार्य दस्तावेज *)
                            </h5>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                            Compulsory
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeMandatory.map(doc => {
                            const fileObj = getFileForDoc(doc);
                            return (
                                <div key={doc} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc} *</span>
                                        {fileObj && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Ready</span>}
                                    </div>
                                    <DocDropzone
                                        docName={doc}
                                        file={fileObj?.file}
                                        onFileAccepted={(f) => setFileForDoc(doc, f)}
                                        onRemove={() => removeFileForDoc(doc)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. IDENTITY PROOFS */}
            {activeIdProofs.length > 0 && (
                <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 dark:bg-blue-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h5 className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                2. Identity Proof (पहचान पत्र - Choose Any 1)
                            </h5>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasUploadedId ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {hasUploadedId ? '✓ Verified' : 'Required (Any 1)'}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Select Document Type to Upload:</label>
                        <div className="flex flex-wrap gap-2">
                            {activeIdProofs.map(doc => {
                                const isUploaded = !!getFileForDoc(doc);
                                const isSelected = selectedIdProof === doc;
                                return (
                                    <button
                                        key={doc}
                                        type="button"
                                        onClick={() => setSelectedIdProof(doc)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : isUploaded
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-blue-300'
                                            }`}
                                    >
                                        {isUploaded && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                                        {doc}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedIdProof && (
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Upload Selected ID: <strong className="text-blue-600">{selectedIdProof}</strong>
                                </span>
                                {getFileForDoc(selectedIdProof) && (
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Ready
                                    </span>
                                )}
                            </div>
                            <DocDropzone
                                docName={selectedIdProof}
                                file={getFileForDoc(selectedIdProof)?.file}
                                onFileAccepted={(f) => setFileForDoc(selectedIdProof, f)}
                                onRemove={() => removeFileForDoc(selectedIdProof)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 3. ADDRESS PROOFS */}
            {activeAddressProofs.length > 0 && (
                <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 dark:bg-emerald-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h5 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                3. Address Proof (पते का प्रमाण - Choose Any 1)
                            </h5>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasUploadedAddress ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-800'}`}>
                            {hasUploadedAddress ? '✓ Verified' : 'Required (Any 1)'}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Select Document Type to Upload:</label>
                        <div className="flex flex-wrap gap-2">
                            {activeAddressProofs.map(doc => {
                                const isUploaded = !!getFileForDoc(doc);
                                const isSelected = selectedAddressProof === doc;
                                return (
                                    <button
                                        key={doc}
                                        type="button"
                                        onClick={() => setSelectedAddressProof(doc)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : isUploaded
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-emerald-300'
                                            }`}
                                    >
                                        {isUploaded && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                                        {doc}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedAddressProof && (
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Upload Selected Address Proof: <strong className="text-emerald-600">{selectedAddressProof}</strong>
                                </span>
                                {getFileForDoc(selectedAddressProof) && (
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Ready
                                    </span>
                                )}
                            </div>
                            <DocDropzone
                                docName={selectedAddressProof}
                                file={getFileForDoc(selectedAddressProof)?.file}
                                onFileAccepted={(f) => setFileForDoc(selectedAddressProof, f)}
                                onRemove={() => removeFileForDoc(selectedAddressProof)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 4. OTHER SUPPORTING PROOFS (OPTIONAL) */}
            {activeOtherDocs.length > 0 && (
                <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 dark:bg-amber-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Files className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <h5 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                4. Other Supporting Proofs (अन्य सहायक दस्तावेज़ - Optional)
                            </h5>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Optional
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {activeOtherDocs.map(doc => {
                                const isUploaded = !!getFileForDoc(doc);
                                const isSelected = selectedOtherDoc === doc;
                                return (
                                    <button
                                        key={doc}
                                        type="button"
                                        onClick={() => setSelectedOtherDoc(doc)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected
                                            ? 'bg-amber-600 text-white shadow-md'
                                            : isUploaded
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 hover:border-amber-300'
                                            }`}
                                    >
                                        {isUploaded && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                                        {doc}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {selectedOtherDoc && (
                        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Upload: <strong className="text-amber-600">{selectedOtherDoc}</strong>
                                </span>
                                {getFileForDoc(selectedOtherDoc) && (
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Ready
                                    </span>
                                )}
                            </div>
                            <DocDropzone
                                docName={selectedOtherDoc}
                                file={getFileForDoc(selectedOtherDoc)?.file}
                                onFileAccepted={(f) => setFileForDoc(selectedOtherDoc, f)}
                                onRemove={() => removeFileForDoc(selectedOtherDoc)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-4 pt-2">
                <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="flex-1 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={!isReadyToSubmit}
                    className="flex-[2] py-4 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                >
                    {isReadyToSubmit ? 'Proceed to Payment →' : 'Complete Required Documents'}
                </button>
            </div>
        </div>
    );
};

export default ServiceForm;
