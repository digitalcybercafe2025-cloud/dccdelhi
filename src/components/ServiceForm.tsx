import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone, FileRejection } from 'react-dropzone';
import { FileText, CheckCircle, ChevronRight, AlertCircle, X, Upload, Eye } from 'lucide-react';
import type { ServiceSpecificField } from '../../types';

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
    serviceName: string;
    requiredDocs: string[];
    serviceSpecificFields?: ServiceSpecificField[];
    onComplete: (
        userDetails: UserDetails,
        documents: File[],
        serviceSpecificData: Record<string, string>
    ) => void;
}

// Per-document dropzone
const DocDropzone: React.FC<{
    docName: string;
    file: File | undefined;
    onFileAccepted: (file: File) => void;
    onRemove: () => void;
}> = ({ docName, file, onFileAccepted, onRemove }) => {
    const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
        if (accepted.length > 0) {
            onFileAccepted(accepted[0]);
        } else if (rejected.length > 0) {
            const reason = rejected[0]?.errors[0]?.code;
            if (reason === 'file-too-large') alert('File is too large. Max 5MB allowed.');
            else alert('Invalid file type. Use JPG, PNG, GIF, or PDF.');
        }
    }, [onFileAccepted]);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'application/pdf': ['.pdf'],
        },
        maxSize: 5 * 1024 * 1024,
        multiple: false,
    });

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (file) {
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
                    <p className="text-[10px] font-bold text-emerald-500/70 uppercase">{formatSize(file.size)} • {file.type.includes('pdf') ? 'PDF' : 'Image'}</p>
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
                    <span className="text-[10px] font-semibold text-slate-300 dark:text-slate-600">JPG, PNG, GIF, PDF • Max 5MB</span>
                </p>
            }
        </div>
    );
};

const ServiceForm: React.FC<ServiceFormProps> = ({
    serviceName,
    requiredDocs,
    serviceSpecificFields = [],
    onComplete,
}) => {
    const [step, setStep] = useState<'details' | 'documents'>('details');
    const [collectedDetails, setCollectedDetails] = useState<UserDetails | null>(null);
    const [collectedSpecific, setCollectedSpecific] = useState<Record<string, string>>({});
    const [uploadedFiles, setUploadedFiles] = useState<{ docType: string; file: File }[]>([]);
    const [currentDocIndex, setCurrentDocIndex] = useState(0);

    const { register, handleSubmit, formState: { errors } } = useForm<UserDetails & Record<string, string>>();

    const onDetailsSubmit = (data: UserDetails & Record<string, string>) => {
        // Separate standard fields from service-specific ones
        const standardKeys = ['fullName', 'mobile', 'email', 'address', 'city', 'state', 'pincode'];
        const specificData: Record<string, string> = {};
        serviceSpecificFields.forEach(f => {
            if (data[f.name] !== undefined) specificData[f.name] = data[f.name];
        });
        setCollectedDetails({
            fullName: data.fullName,
            mobile: data.mobile,
            email: data.email || '',
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
        });
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

    const handleFinalSubmit = () => {
        if (!collectedDetails) return;
        const missing = requiredDocs.filter(doc => !getFileForDoc(doc));
        if (missing.length > 0) {
            alert(`Please upload: ${missing.join(', ')}`);
            return;
        }
        onComplete(collectedDetails, uploadedFiles.map(f => f.file), collectedSpecific);
    };

    const uploadedCount = uploadedFiles.filter(f => requiredDocs.includes(f.docType)).length;
    const totalDocs = requiredDocs.length;

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
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">Required Documents for {serviceName}</h4>
                    <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-0.5">Upload clear photos or PDF scans. Max 5MB per file. GIF, JPG, PNG, PDF accepted.</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{uploadedCount}/{totalDocs} Uploaded</span>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand dark:bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${totalDocs ? (uploadedCount / totalDocs) * 100 : 0}%` }}
                    />
                </div>
                <span className="text-xs font-black text-brand dark:text-emerald-400">{totalDocs ? Math.round((uploadedCount / totalDocs) * 100) : 0}%</span>
            </div>

            {/* Document tabs */}
            <div className="flex flex-wrap gap-2">
                {requiredDocs.map((doc, idx) => {
                    const uploaded = !!getFileForDoc(doc);
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentDocIndex(idx)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${currentDocIndex === idx
                                ? 'bg-brand dark:bg-emerald-600 text-white shadow-md'
                                : uploaded
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                }`}
                        >
                            {uploaded && <CheckCircle className="inline w-3 h-3 mr-1" />}
                            {doc}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    Uploading: <span className="text-brand dark:text-emerald-400">{requiredDocs[currentDocIndex]}</span>
                    <span className="text-red-500 font-black ml-1">*</span>
                </p>
                <DocDropzone
                    docName={requiredDocs[currentDocIndex]}
                    file={getFileForDoc(requiredDocs[currentDocIndex])?.file}
                    onFileAccepted={(file) => setFileForDoc(requiredDocs[currentDocIndex], file)}
                    onRemove={() => removeFileForDoc(requiredDocs[currentDocIndex])}
                />
            </div>

            {/* Doc navigation */}
            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={() => setCurrentDocIndex(Math.max(0, currentDocIndex - 1))}
                    disabled={currentDocIndex === 0}
                    className="text-sm font-bold text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                    ← Previous
                </button>
                {currentDocIndex < requiredDocs.length - 1 ? (
                    <button
                        type="button"
                        onClick={() => setCurrentDocIndex(currentDocIndex + 1)}
                        className="text-sm font-bold text-brand dark:text-emerald-400 hover:opacity-70 transition"
                    >
                        Next Document →
                    </button>
                ) : null}
            </div>

            <div className="flex gap-4 pt-2">
                <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="flex-1 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={uploadedCount < totalDocs}
                    className="flex-[2] py-4 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    {uploadedCount < totalDocs ? `Upload ${totalDocs - uploadedCount} More Doc(s)` : 'Proceed to Payment →'}
                </button>
            </div>
        </div>
    );
};

export default ServiceForm;
