import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone, FileRejection } from 'react-dropzone';
import { FileText, CheckCircle, ChevronRight, AlertCircle, X, Upload, Eye, ShieldCheck, MapPin, Files, Loader2 } from 'lucide-react';
import type { ServiceSpecificField } from '../../types';
import type { ServiceDocumentConfig, DocumentConfigItem } from '../constants/documentCatalog';
import { INDIAN_STATES, VOTER_CORRECTION_CATEGORIES } from '../constants/documentCatalog';
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
    documentConfigs?: ServiceDocumentConfig[];
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
    documentConfigs = [],
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
    const [skippedOptionalDocs, setSkippedOptionalDocs] = useState<string[]>([]);

    // Sub-service / Voter Form 6 vs Form 8 detection
    const isVoterStyle = /voter/i.test(serviceName) ||
        documentConfigs.some(c => c.subTypeKey === 'new' || c.subTypeKey.startsWith('correction'));

    const nonDefaultConfigs = useMemo(
        () => documentConfigs.filter(c => c.subTypeKey !== 'default' && c.documents && c.documents.length > 0),
        [documentConfigs]
    );
    const hasCustomSubTypes = !isVoterStyle && nonDefaultConfigs.length > 0;

    const [serviceType, setServiceType] = useState<string>(() => {
        if (initialDraft?.specificFields?.serviceTypeKey) return initialDraft.specificFields.serviceTypeKey;
        if (isVoterStyle) return 'new';
        if (nonDefaultConfigs.length > 0) return nonDefaultConfigs[0].subTypeKey;
        return 'default';
    });
    const [existingEpicNumber, setExistingEpicNumber] = useState<string>(initialDraft?.specificFields?.existingEpicNumber || '');
    const [correctionCategories, setCorrectionCategories] = useState<string[]>(() => {
        if (initialDraft?.specificFields?.correctionCategoryKeys) {
            return initialDraft.specificFields.correctionCategoryKeys.split(',').filter(Boolean);
        }
        return [];
    });
    const [remarks, setRemarks] = useState<string>(initialDraft?.specificFields?.remarks || '');
    const [step1CustomError, setStep1CustomError] = useState<string>('');

    // Legacy category resolution & normalization (fallback when Admin hasn't created dynamic configs yet)
    const hasCategorized = (mandatoryDocs && mandatoryDocs.length > 0) ||
        (idProofs && idProofs.length > 0) ||
        (addressProofs && addressProofs.length > 0) ||
        (otherDocs && otherDocs.length > 0);

    const activeMandatory = hasCategorized ? mandatoryDocs : requiredDocs;
    const activeIdProofs = idProofs || [];
    const activeAddressProofs = addressProofs || [];
    const activeOtherDocs = otherDocs || [];

    const [selectedIdProof, setSelectedIdProof] = useState<string>(activeIdProofs[0] || '');
    const [selectedAddressProof, setSelectedAddressProof] = useState<string>(activeAddressProofs[0] || '');
    const [selectedOtherDoc, setSelectedOtherDoc] = useState<string>(activeOtherDocs[0] || '');

    // Resolve Dynamic Admin Document Slots based on chosen service type & correction options
    const resolvedDynamicDocs = useMemo<DocumentConfigItem[] | null>(() => {
        if (!Array.isArray(documentConfigs) || documentConfigs.length === 0) return null;

        const docsByName = new Map<string, boolean>();
        const pushDocs = (cfg?: ServiceDocumentConfig) => {
            if (!cfg || !Array.isArray(cfg.documents)) return;
            cfg.documents.forEach(d => {
                const name = String(d.name || '').trim();
                if (!name) return;
                // If multiple selected categories include the same doc, Mandatory takes priority over Optional
                const existing = docsByName.get(name);
                docsByName.set(name, existing === true || d.required !== false);
            });
        };

        if (isVoterStyle && serviceType === 'correction') {
            pushDocs(documentConfigs.find(c => c.subTypeKey === 'correction'));
            correctionCategories.forEach(catKey => {
                pushDocs(documentConfigs.find(c => c.subTypeKey === catKey));
            });
            // Fallback to default config if correction sub-types have no docs configured yet
            if (docsByName.size === 0) {
                pushDocs(documentConfigs.find(c => c.subTypeKey === 'default'));
            }
        } else {
            const matched = documentConfigs.find(c => c.subTypeKey === serviceType);
            if (matched && matched.documents.length > 0) {
                pushDocs(matched);
            } else {
                const fallbackDefault = documentConfigs.find(c => c.subTypeKey === 'default') || documentConfigs[0];
                pushDocs(fallbackDefault);
            }
        }

        const list = Array.from(docsByName.entries()).map(([name, required]) => ({ name, required }));
        return list.length > 0 ? list : null;
    }, [documentConfigs, isVoterStyle, serviceType, correctionCategories]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UserDetails & Record<string, string>>({
        defaultValues: {
            state: 'Delhi',
            ...(initialDraft?.userDetails || {}),
            ...(initialDraft?.specificFields || {}),
        }
    });

    useEffect(() => {
        if (initialDraft?.userDetails) {
            reset({
                state: 'Delhi',
                ...initialDraft.userDetails,
                ...(initialDraft.specificFields || {}),
            });
            setCollectedDetails(initialDraft.userDetails);
            setCollectedSpecific(initialDraft.specificFields || {});
            if (initialDraft.specificFields?.serviceTypeKey) {
                setServiceType(initialDraft.specificFields.serviceTypeKey);
            }
            if (initialDraft.specificFields?.existingEpicNumber) {
                setExistingEpicNumber(initialDraft.specificFields.existingEpicNumber);
            }
            if (initialDraft.specificFields?.correctionCategoryKeys) {
                setCorrectionCategories(initialDraft.specificFields.correctionCategoryKeys.split(',').filter(Boolean));
            }
            if (initialDraft.specificFields?.remarks) {
                setRemarks(initialDraft.specificFields.remarks);
            }
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

    const toggleCorrectionCategory = (key: string) => {
        setStep1CustomError('');
        setCorrectionCategories(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const onDetailsSubmit = (data: UserDetails & Record<string, string>) => {
        setStep1CustomError('');

        if (isVoterStyle && serviceType === 'correction') {
            if (!existingEpicNumber.trim()) {
                setStep1CustomError('Please enter your Existing Voter ID (EPIC) Number for Correction / Form 8.');
                return;
            }
            if (correctionCategories.length === 0) {
                setStep1CustomError('Please select at least 1 change category (Name, DOB, Address, Photo/Mobile, or Relation).');
                return;
            }
        }

        const specificData: Record<string, string> = {};
        serviceSpecificFields.forEach(f => {
            if (data[f.name] !== undefined) specificData[f.name] = data[f.name];
        });

        if (isVoterStyle) {
            specificData.serviceType = serviceType === 'new' ? 'New Voter ID (Form 6)' : 'Correction / Update (Form 8)';
            specificData.serviceTypeKey = serviceType;
            if (serviceType === 'correction') {
                specificData.existingEpicNumber = existingEpicNumber.trim().toUpperCase();
                specificData.correctionCategories = correctionCategories
                    .map(k => VOTER_CORRECTION_CATEGORIES.find(c => c.key === k)?.label || k)
                    .join(', ');
                specificData.correctionCategoryKeys = correctionCategories.join(',');
            }
        } else if (hasCustomSubTypes) {
            const matchedCfg = nonDefaultConfigs.find(c => c.subTypeKey === serviceType);
            if (matchedCfg) {
                specificData.serviceType = matchedCfg.subTypeLabel;
                specificData.serviceTypeKey = serviceType;
            }
        }

        if (remarks.trim()) {
            specificData.remarks = remarks.trim();
        }

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
        setSkippedOptionalDocs(prev => prev.filter(d => d !== docType));
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

    const handleSkipOptional = (docName: string) => {
        removeFileForDoc(docName);
        setSkippedOptionalDocs(prev => prev.includes(docName) ? prev : [...prev, docName]);
    };

    const handleUnskipOptional = (docName: string) => {
        setSkippedOptionalDocs(prev => prev.filter(d => d !== docName));
    };

    // Validation checks (Dynamic Config OR Legacy Category fallback)
    const usingDynamicDocs = resolvedDynamicDocs !== null;

    const dynamicMandatoryMissing = usingDynamicDocs
        ? resolvedDynamicDocs.filter(d => d.required && !getFileForDoc(d.name)).map(d => d.name)
        : [];

    const mandatoryMissing = usingDynamicDocs ? dynamicMandatoryMissing : activeMandatory.filter(doc => !getFileForDoc(doc));
    const hasUploadedId = usingDynamicDocs ? true : (activeIdProofs.length === 0 || activeIdProofs.some(doc => !!getFileForDoc(doc)));
    const hasUploadedAddress = usingDynamicDocs ? true : (activeAddressProofs.length === 0 || activeAddressProofs.some(doc => !!getFileForDoc(doc)));
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
    const totalRequiredCount = usingDynamicDocs
        ? resolvedDynamicDocs.filter(d => d.required).length
        : activeMandatory.length + (activeIdProofs.length > 0 ? 1 : 0) + (activeAddressProofs.length > 0 ? 1 : 0);
    const completedRequiredCount = usingDynamicDocs
        ? resolvedDynamicDocs.filter(d => d.required && !!getFileForDoc(d.name)).length
        : (activeMandatory.length - mandatoryMissing.length) + (hasUploadedId && activeIdProofs.length > 0 ? 1 : 0) + (hasUploadedAddress && activeAddressProofs.length > 0 ? 1 : 0);
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

                {/* Service Type Radio Selector (Voter ID Form 6 / Form 8 OR Custom Sub-Types) */}
                {isVoterStyle && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                        <label className={labelClass}>Application Service Type <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { value: 'new', title: 'New Voter ID (Form 6)', sub: 'First-time voter registration' },
                                { value: 'correction', title: 'Correction / Update (Form 8)', sub: 'Name, DOB, Address, Photo, Relation' },
                            ].map(opt => (
                                <label
                                    key={opt.value}
                                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                        serviceType === opt.value
                                            ? 'border-brand dark:border-emerald-500 bg-brand/5 dark:bg-emerald-500/10'
                                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 hover:border-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="voterServiceType"
                                        value={opt.value}
                                        checked={serviceType === opt.value}
                                        onChange={() => { setServiceType(opt.value); setStep1CustomError(''); }}
                                        className="mt-0.5 accent-[#003380]"
                                    />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">{opt.title}</p>
                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{opt.sub}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Dynamic Correction Fields (When Form 8 / Correction is selected) */}
                        {serviceType === 'correction' && (
                            <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-3 animate-in fade-in duration-300">
                                <div className="space-y-1">
                                    <label className={labelClass}>Existing Voter ID (EPIC) Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={existingEpicNumber}
                                        onChange={e => { setExistingEpicNumber(e.target.value.toUpperCase()); setStep1CustomError(''); }}
                                        placeholder="e.g. DL/01/023/123456 or ABC1234567"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={labelClass}>What needs to be corrected/updated? <span className="text-red-500">*</span></label>
                                    <div className="flex flex-wrap gap-2">
                                        {VOTER_CORRECTION_CATEGORIES.map(cat => {
                                            const checked = correctionCategories.includes(cat.key);
                                            return (
                                                <label
                                                    key={cat.key}
                                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                                        checked
                                                            ? 'bg-brand text-white border-brand shadow-xs dark:bg-emerald-600 dark:border-emerald-600'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-brand/40'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleCorrectionCategory(cat.key)}
                                                        className="accent-white"
                                                    />
                                                    <span>{cat.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {hasCustomSubTypes && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2.5">
                        <label className={labelClass}>Select Application Type <span className="text-red-500">*</span></label>
                        <div className="flex flex-wrap gap-2">
                            {nonDefaultConfigs.map(cfg => (
                                <label
                                    key={cfg.subTypeKey}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all ${
                                        serviceType === cfg.subTypeKey
                                            ? 'border-brand dark:border-emerald-500 bg-brand/5 dark:bg-emerald-500/10 text-brand dark:text-emerald-400'
                                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="customServiceType"
                                        value={cfg.subTypeKey}
                                        checked={serviceType === cfg.subTypeKey}
                                        onChange={() => setServiceType(cfg.subTypeKey)}
                                        className="accent-[#003380]"
                                    />
                                    <span>{cfg.subTypeLabel}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

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
                        <select {...register('state', { required: 'State is required' })} className={inputClass} defaultValue="Delhi">
                            {INDIAN_STATES.map(st => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
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
                    <div className="md:col-span-2 space-y-1">
                        <label className={labelClass}>Remarks / Additional Info (Optional)</label>
                        <input
                            type="text"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            className={inputClass}
                            placeholder="Any special instruction, father/husband name, or note (optional)"
                        />
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

                {step1CustomError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{step1CustomError}</span>
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

            {/* ── DYNAMIC ADMIN-DRIVEN DOCUMENT SLOTS ── */}
            {usingDynamicDocs && resolvedDynamicDocs && (
                <div className="space-y-3">
                    {collectedSpecific?.serviceType && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10">
                            <span>Selected Type:</span>
                            <span className="px-2 py-0.5 rounded-md bg-brand/10 dark:bg-emerald-500/20 text-brand dark:text-emerald-300 font-black">
                                {collectedSpecific.serviceType}
                            </span>
                            {collectedSpecific.correctionCategories && (
                                <span className="text-slate-500 dark:text-slate-400">
                                    • Updates: {collectedSpecific.correctionCategories}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {resolvedDynamicDocs.map((docItem) => {
                            const fileObj = getFileForDoc(docItem.name);
                            const isSkipped = !docItem.required && skippedOptionalDocs.includes(docItem.name);

                            return (
                                <div
                                    key={docItem.name}
                                    className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                                        docItem.required
                                            ? 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/80'
                                            : 'border-amber-200/80 dark:border-amber-500/20 bg-amber-50/20 dark:bg-amber-500/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                                {docItem.name}
                                            </span>
                                            {docItem.required && (
                                                <span className="text-red-500 font-black text-sm leading-none" title="Mandatory">*</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {docItem.required ? (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                    fileObj
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-50 text-red-600 border border-red-200'
                                                }`}>
                                                    {fileObj ? '✓ Ready' : 'Mandatory'}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                                        Optional
                                                    </span>
                                                    {!fileObj && !isSkipped && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSkipOptional(docItem.name)}
                                                            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                                        >
                                                            Skip for now
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {isSkipped ? (
                                        <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                Skipped for now (Optional)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleUnskipOptional(docItem.name)}
                                                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Upload instead
                                            </button>
                                        </div>
                                    ) : (
                                        <DocDropzone
                                            docName={docItem.name}
                                            file={fileObj?.file}
                                            onFileAccepted={(f) => setFileForDoc(docItem.name, f)}
                                            onRemove={() => removeFileForDoc(docItem.name)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── LEGACY CATEGORIZED FALLBACK (When Dynamic Builder not configured) ── */}
            {!usingDynamicDocs && (
                <>
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
                </>
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
