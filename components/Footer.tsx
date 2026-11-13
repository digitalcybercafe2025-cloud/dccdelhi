import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid,
    FileText,
    Tag,
    Search,
    Download,
    Laptop,
    Layers,
    Smartphone,
    Wrench,
    MapPin,
    PhoneCall,
    ChevronRight,
    ShieldCheck,
    Lock,
    Monitor,
    Printer,
    Code2,
    X,
    ExternalLink,
    CheckCircle2,
    Clock,
    HelpCircle
} from 'lucide-react';
import api from '../src/api/axios';
import { SERVICES } from '../constants';

interface FooterProps {
    onSecretAdminAuth?: () => void;
}

interface DigitalSolutionDetail {
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    turnaround: string;
    startingFee: string;
    whatsappMsg: string;
}

const DIGITAL_SOLUTIONS_DATA: Record<string, DigitalSolutionDetail> = {
    web: {
        title: 'Website Development',
        subtitle: 'Custom Modern Web Applications & Portfolios',
        description: 'High-performance, mobile-responsive, modern websites and e-commerce setups for local businesses, shops, entrepreneurs, and professionals.',
        features: [
            '100% Mobile & Tablet Responsive',
            'Fast Loading & Modern UI Design',
            'WhatsApp & Social Media Integrations',
            'Google Search & SEO Setup',
            'Secure Hosting & Domain Configuration'
        ],
        turnaround: '3 to 7 working days',
        startingFee: '₹2,999/- onwards',
        whatsappMsg: 'Hello Digital Cyber Cafe, I am inquiring about Website Development services.'
    },
    design: {
        title: 'Logo & Graphic Design',
        subtitle: 'Brand Identity, Banners & Social Creatives',
        description: 'Professional visual branding for shops, cafes, YouTube channels, invoices, letterheads, and festive marketing campaigns.',
        features: [
            'Vector Logo (PNG, SVG, PDF, High-Res JPG)',
            'Social Media Posts, Banners & Thumbnails',
            'Visiting Cards & Digital Identity Kits',
            'Pamphlets, Bill Books & Letterhead Formats',
            'Unlimited Revisions for Final Polish'
        ],
        turnaround: '24 to 48 hours',
        startingFee: '₹499/- onwards',
        whatsappMsg: 'Hello Digital Cyber Cafe, I am inquiring about Logo & Graphic Design services.'
    },
    app: {
        title: 'Mobile App Development',
        subtitle: 'Android & Hybrid Applications',
        description: 'Lightweight Android web-apps, Progressive Web Apps (PWA), and business utility apps tailored for community and customer engagement.',
        features: [
            'Android APK & Play Store Ready Architecture',
            'Push Notification Support',
            'Direct WhatsApp & Call Customer Flow',
            'Offline Caching & Fast Native Performance',
            'Admin Dashboard Integration'
        ],
        turnaround: '7 to 14 working days',
        startingFee: '₹4,999/- onwards',
        whatsappMsg: 'Hello Digital Cyber Cafe, I am inquiring about Mobile App Development services.'
    },
    tech: {
        title: 'Technical Support',
        subtitle: 'IT, Software, Printer & Digital Consultation',
        description: 'Comprehensive software installation, printer configuration, e-District portal token setup, digital signature (DSC) configuration, and tech troubleshooting.',
        features: [
            'Digital Signature Certificate (DSC) USB Token Setup',
            'e-District / Govt Portal Browser Configuration',
            'Printer, Biometric Scanner & Morpho/Mantra Drivers',
            'Windows Formatting & Anti-Virus Security Support',
            'Computer & Internet Troubleshooting'
        ],
        turnaround: 'Instant / Same-Day',
        startingFee: '₹150/- onwards',
        whatsappMsg: 'Hello Digital Cyber Cafe, I am inquiring about Technical & IT Support services.'
    }
};

const REQUIRED_DOCS_LIST = [
    {
        service: 'New PAN Card (Instant / Regular)',
        category: 'Identity',
        docs: ['Aadhaar Card with linked mobile', 'Passport-size Photograph', 'Proof of Date of Birth (10th marksheet or Birth cert)'],
        tips: 'Original Aadhaar OTP enables instant 10-minute e-PAN issuance.'
    },
    {
        service: 'Voter ID Registration / Correction',
        category: 'Elections',
        docs: ['Aadhaar Card', 'Passport-size Photograph', 'Address Proof (Electricity Bill / Rent Agreement)', 'Age Proof (DOB certificate or school cert)'],
        tips: 'Keep existing EPIC voter number handy for correction requests.'
    },
    {
        service: 'Passport Application & Renewal',
        category: 'Travel',
        docs: ['Aadhaar Card', '10th / 12th Certificate for Non-ECR proof', 'Electricity Bill / Bank Passbook with 1-year transaction', 'Old Passport (for renewal)'],
        tips: 'Original documents required on PSK appointment day.'
    },
    {
        service: 'Aadhaar Demographic Correction',
        category: 'Identity',
        docs: ['Aadhaar Card Copy', 'Valid Supporting Proof (Gazette, Marksheet, or Passport for Name; Utility bill for Address)'],
        tips: 'Biometric update (Fingerprint/Iris/Photo) requires physical visit to official Aadhaar Seva Kendra.'
    },
    {
        service: 'Income / Domicile / Caste Certificate (Delhi e-District)',
        category: 'Revenue',
        docs: ['Aadhaar Card', 'Continuous Delhi Residence Proof (3+ Years)', 'Electricity Bill / Ration Card', 'Salary Slip / Self Declaration Affidavit', 'Family Aadhaar Cards'],
        tips: 'Affidavit must be notarized before portal upload.'
    },
    {
        service: 'ITR (Income Tax Return) Filing',
        category: 'Taxation',
        docs: ['PAN Card', 'Aadhaar Card', 'Form 16 / Salary Certificates', 'Bank Statement of all active accounts (FY April - March)', 'Investment Proofs (80C / 80D / Mediclaim)'],
        tips: 'Avoid penalties by filing before deadline.'
    },
    {
        service: 'Driving License (Learner / Permanent)',
        category: 'Transport',
        docs: ['Aadhaar Card', 'Blood Group Test Report', 'Passport-size Photos', 'Learner License Copy (for permanent DL)'],
        tips: 'Online test slot booking assistance is provided.'
    }
];

let cachedFooterSettings: any = null;
let cachedFooterServices: any[] | null = null;
let cachedFooterServerStatus: 'checking' | 'online' | 'offline' = 'online';

export const Footer: React.FC<FooterProps> = ({ onSecretAdminAuth }) => {
    const navigate = useNavigate();
    const longPressTimer = useRef<number | null>(null);

    // Dynamic settings state
    const [settings, setSettings] = useState(() => cachedFooterSettings || ({
        siteName: 'Digital Cyber Cafe',
        contactNumber: '8445221632',
        whatsapp: '8445221632',
        email: 'digitalcybercafe@gmail.com',
        address: 'Mangolpuri, Delhi',
        slogan: 'Official assistance for Aadhaar, PAN, Passport, and Academic documentation. Bridging the digital divide with security and speed.',
        footerText: '© 2026 Digital Cyber Cafe Mangolpuri • Powered by Digital Cyber Zone',
        instagramUrl: '',
        facebookUrl: '',
        threadsUrl: '',
        twitterUrl: '',
        youtubeUrl: '',
        googleMapsUrl: 'https://maps.google.com/?q=Digital+Cyber+Cafe+Mangolpuri+Delhi'
    }));

    // Real server health monitoring
    const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>(() => cachedFooterServerStatus);
    const [allServices, setAllServices] = useState<any[]>(() => cachedFooterServices || SERVICES);

    // Modals
    const [activeSolutionKey, setActiveSolutionKey] = useState<string | null>(null);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [showChargesModal, setShowChargesModal] = useState(false);
    const [docsSearch, setDocsSearch] = useState('');
    const [chargesSearch, setChargesSearch] = useState('');

    useEffect(() => {
        let isMounted = true;

        const checkServerAndLoadSettings = async (full = true) => {
            try {
                if (full || !cachedFooterSettings) {
                    const [healthRes, settingsRes, servicesRes] = await Promise.allSettled([
                        api.get('/health'),
                        api.get('/settings'),
                        api.get('/services')
                    ]);

                    if (!isMounted) return;

                    if (healthRes.status === 'fulfilled' && (healthRes.value?.data?.success || healthRes.value?.status === 200)) {
                        cachedFooterServerStatus = 'online';
                        setServerStatus('online');
                    } else if (settingsRes.status === 'fulfilled' && settingsRes.value?.status === 200) {
                        cachedFooterServerStatus = 'online';
                        setServerStatus('online');
                    } else {
                        cachedFooterServerStatus = 'offline';
                        setServerStatus('offline');
                    }

                    if (settingsRes.status === 'fulfilled' && settingsRes.value?.data?.data) {
                        cachedFooterSettings = settingsRes.value.data.data;
                        setSettings(prev => ({
                            ...prev,
                            ...settingsRes.value.data.data
                        }));
                    }

                    if (servicesRes.status === 'fulfilled' && servicesRes.value?.data?.data && Array.isArray(servicesRes.value.data.data)) {
                        cachedFooterServices = servicesRes.value.data.data;
                        setAllServices(servicesRes.value.data.data);
                    }
                } else {
                    // Periodic heartbeat: only check lightweight health endpoint
                    const healthRes = await api.get('/health').catch(() => null);
                    if (!isMounted) return;
                    if (healthRes && (healthRes.data?.success || healthRes.status === 200)) {
                        cachedFooterServerStatus = 'online';
                        setServerStatus('online');
                    } else {
                        cachedFooterServerStatus = 'offline';
                        setServerStatus('offline');
                    }
                }
            } catch (e) {
                if (isMounted) setServerStatus('offline');
            }
        };

        checkServerAndLoadSettings(true);

        // Real heartbeat check every 60 seconds (lightweight /health only)
        const heartbeat = setInterval(() => checkServerAndLoadSettings(false), 60000);
        return () => {
            isMounted = false;
            clearInterval(heartbeat);
        };
    }, []);

    // Filtered services for Charges modal
    const filteredServices = allServices.filter(s =>
        (s.title || '').toLowerCase().includes(chargesSearch.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(chargesSearch.toLowerCase())
    );

    // Filtered docs
    const filteredDocs = REQUIRED_DOCS_LIST.filter(d =>
        d.service.toLowerCase().includes(docsSearch.toLowerCase()) ||
        d.category.toLowerCase().includes(docsSearch.toLowerCase()) ||
        d.docs.some(doc => doc.toLowerCase().includes(docsSearch.toLowerCase()))
    );

    const whatsappBase = `https://wa.me/91${(settings.whatsapp || '8445221632').replace(/[^0-9]/g, '')}`;

    return (
        <>
            <footer
                className="border-t border-slate-200 dark:border-white/10 pt-10 pb-28 md:pb-8 px-4 md:px-8 transition-colors duration-500 bg-white dark:bg-slate-950"
                style={{ backgroundColor: 'var(--section-bg, #ffffff)' }}
            >
                <div className="max-w-[1500px] mx-auto">
                    {/* ── TOP SECTION: Multi-column Header Grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10">

                        {/* BRAND COLUMN */}
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/digital-india-logo.png"
                                    className="h-10 w-auto object-contain"
                                    alt="Digital India"
                                />
                                <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-white/10" />
                                <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight leading-none">
                                    {settings.siteName || 'Digital Cyber Cafe'}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs leading-relaxed max-w-sm">
                                {settings.slogan || 'Official assistance for Aadhaar, PAN, Passport, and Academic documentation. Bridging the digital divide with security and speed.'}
                            </p>

                            {/* Service Online Indicator - Positioned directly below slogan */}
                            <div className="pt-1.5">
                                {serverStatus === 'online' ? (
                                    <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center gap-2 max-w-full">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <div className="text-[10px] font-black tracking-tight text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                                            <span className="uppercase tracking-wider">SERVERS ONLINE</span>
                                            <span className="text-emerald-400 dark:text-emerald-600">|</span>
                                            <span className="font-semibold text-emerald-700/90 dark:text-emerald-300/90">Services running smoothly.</span>
                                        </div>
                                    </div>
                                ) : serverStatus === 'checking' ? (
                                    <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 inline-flex items-center gap-2 max-w-full">
                                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse shrink-0" />
                                        <div className="text-[10px] font-bold tracking-tight text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            CONNECTING | Verifying server heartbeat...
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 inline-flex items-center gap-2 max-w-full">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                        <div className="text-[10px] font-bold tracking-tight text-amber-800 dark:text-amber-400 whitespace-nowrap">
                                            OFFLINE / STANDBY | Reconnecting...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QUICK LINKS COLUMN */}
                        <div className="lg:col-span-2 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                Quick Links
                            </h4>
                            <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <li>
                                    <button
                                        onClick={() => { navigate('/services'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <LayoutGrid className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Our Services
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setShowDocsModal(true)}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Required Documents
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setShowChargesModal(true)}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Service Charges
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { navigate('/track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Track Application
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { navigate('/track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Download Certificate
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* DIGITAL SOLUTIONS COLUMN */}
                        <div className="lg:col-span-2 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                Digital Solutions
                            </h4>
                            <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <li>
                                    <button
                                        onClick={() => setActiveSolutionKey('web')}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Laptop className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Website Development
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setActiveSolutionKey('design')}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Logo & Graphic Design
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setActiveSolutionKey('app')}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Smartphone className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Mobile App Development
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setActiveSolutionKey('tech')}
                                        className="w-full flex items-center justify-between text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Wrench className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            Technical Support
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* CONNECT COLUMN */}
                        <div className="lg:col-span-2 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                Connect
                            </h4>
                            <ul className="space-y-2 text-xs font-bold">
                                <li>
                                    <a
                                        href={`${whatsappBase}?text=${encodeURIComponent('Hello Digital Cyber Cafe, I need assistance with online documentation and services.')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.044-2.128-.549-1.833-.759-3.003-2.614-3.094-2.736-.091-.122-.741-.986-.741-1.88 0-.895.469-1.336.637-1.517.168-.182.368-.228.491-.228.123 0 .245.002.353.007.113.005.263-.042.412.316.153.367.522 1.272.568 1.364.046.092.077.2.015.323-.061.123-.092.2-.184.307-.092.107-.193.24-.276.323-.092.092-.187.192-.08.376.107.184.478.788 1.025 1.274.704.628 1.297.821 1.481.913.184.092.292.077.4-.046.107-.123.461-.537.584-.721.123-.184.246-.153.414-.092.169.061 1.074.507 1.258.599.184.092.307.138.353.215.046.077.046.445-.098.85z" />
                                            </svg>
                                        </span>
                                        <span>WhatsApp Support</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={settings.googleMapsUrl || 'https://maps.google.com/?q=Digital+Cyber+Cafe+Mangolpuri+Delhi'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <MapPin className="w-3.5 h-3.5" />
                                        </span>
                                        <span>Find Our Hub</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href={`tel:+91${(settings.contactNumber || '8445221632').replace(/[^0-9]/g, '')}`}
                                        className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                            <PhoneCall className="w-3.5 h-3.5" />
                                        </span>
                                        <span>Call Us</span>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* FOLLOW US COLUMN */}
                        <div className="lg:col-span-2 space-y-3">
                            {/* FOLLOW US ICONS */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2.5">
                                    Follow Us
                                </h4>
                                <div className="flex items-center gap-2">
                                    {/* Instagram */}
                                    <a
                                        href={settings.instagramUrl || 'https://instagram.com/'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Follow on Instagram"
                                        className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 hover:border-pink-500 transition-all text-pink-600"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>

                                    {/* Facebook */}
                                    <a
                                        href={settings.facebookUrl || 'https://facebook.com/'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Follow on Facebook"
                                        className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 hover:border-blue-600 transition-all text-[#1877F2]"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    </a>

                                    {/* Threads */}
                                    <a
                                        href={settings.threadsUrl || 'https://threads.net/'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Follow on Threads"
                                        className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 hover:border-slate-800 transition-all text-slate-800 dark:text-white"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M12.186 24C5.545 24 0 18.622 0 12.004 0 5.374 5.539 0 12.186 0c6.48 0 11.758 5.097 12.04 11.517l-2.617.135c-.244-5.17-4.49-9.288-9.423-9.288-5.308 0-9.613 4.305-9.613 9.64 0 5.334 4.305 9.64 9.613 9.64 3.738 0 6.945-2.079 8.529-5.184l-2.091-1.393c-1.196 2.37-3.701 3.972-6.438 3.972-4.004 0-7.25-3.246-7.25-7.25s3.246-7.25 7.25-7.25c2.977 0 5.617 1.802 6.702 4.542l.09.227h-6.792v2.531h8.775l.08.382c.164.78.252 1.58.252 2.39 0 6.628-5.545 12.004-12.186 12.004z" />
                                        </svg>
                                    </a>

                                    {/* X (formerly Twitter) */}
                                    <a
                                        href={settings.twitterUrl || 'https://x.com/'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Follow on X"
                                        className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 hover:border-black transition-all text-slate-900 dark:text-white"
                                    >
                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </a>

                                    {/* YouTube */}
                                    <a
                                        href={settings.youtubeUrl || 'https://youtube.com/'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Watch on YouTube"
                                        className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 hover:border-red-600 transition-all text-[#FF0000]"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── 3. TRUST & SERVICE HIGHLIGHTS (Slim Horizontal Feature Strip) ── */}
                    <div className="mt-2 mb-8 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40 shadow-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 items-center">
                            {/* Fast & Reliable */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Fast & Reliable</p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Quick Processing</p>
                                </div>
                            </div>

                            {/* Secure & Private */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100/70 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Secure & Private</p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Your data is always safe</p>
                                </div>
                            </div>

                            {/* Online Applications */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-sky-100/70 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Online Applications</p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Government & Utility Services</p>
                                </div>
                            </div>

                            {/* Print, Scan & Photos */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-100/70 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Print, Scan & Photos</p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Documents & Forms</p>
                                </div>
                            </div>

                            {/* Digital Solutions */}
                            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                                <div className="w-9 h-9 rounded-xl bg-orange-100/70 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                    <Code2 className="w-5 h-5" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Digital Solutions</p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Web, Design & App Services</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 4. BOTTOM FOOTER BAR ── */}
                    <div className="pt-5 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                        {/* Copyright */}
                        <div className="text-slate-500 dark:text-slate-400 font-bold text-[11px] tracking-tight flex items-center justify-center sm:justify-start gap-1">
                            <span
                                className="copyright-glow cursor-default select-none"
                                title="Digital Cyber Cafe"
                                onMouseDown={() => {
                                    if (onSecretAdminAuth) {
                                        longPressTimer.current = window.setTimeout(onSecretAdminAuth, 3000);
                                    }
                                }}
                                onMouseUp={() => {
                                    if (longPressTimer.current) {
                                        clearTimeout(longPressTimer.current);
                                        longPressTimer.current = null;
                                    }
                                }}
                            >
                                ©
                            </span>
                            <span>{new Date().getFullYear()} Digital Cyber Cafe Mangolpuri</span>
                            <span className="mx-1">•</span>
                            <span>
                                Powered by{' '}
                                <span
                                    className="font-black tracking-wide transition-colors duration-300"
                                    style={{ color: 'var(--brand-primary)' }}
                                >
                                    Digital Cyber Zone
                                </span>
                            </span>
                        </div>

                        {/* Legal Links */}
                        <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            <button
                                onClick={() => { navigate('/privacy-policy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                                Privacy Policy
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                                onClick={() => { navigate('/terms-and-conditions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                                Terms & Conditions
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button
                                onClick={() => { navigate('/disclaimer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                                Disclaimer
                            </button>
                        </div>
                    </div>

                </div>
            </footer>

            {/* ── MODAL 1: DIGITAL SOLUTIONS DETAILS ── */}
            {activeSolutionKey && DIGITAL_SOLUTIONS_DATA[activeSolutionKey] && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-white/10 shadow-2xl relative">
                        <button
                            onClick={() => setActiveSolutionKey(null)}
                            className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Code2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                                    Digital Solutions
                                </span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {DIGITAL_SOLUTIONS_DATA[activeSolutionKey].title}
                                </h3>
                            </div>
                        </div>

                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                            {DIGITAL_SOLUTIONS_DATA[activeSolutionKey].description}
                        </p>

                        <div className="space-y-2 mb-5">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Deliverables:</h5>
                            <div className="space-y-1.5">
                                {DIGITAL_SOLUTIONS_DATA[activeSolutionKey].features.map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        <span>{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 mb-6 text-xs font-bold">
                            <div>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Estimated Delivery</span>
                                <span className="text-slate-800 dark:text-slate-200">{DIGITAL_SOLUTIONS_DATA[activeSolutionKey].turnaround}</span>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-black">Starting Price</span>
                                <span className="text-blue-600 dark:text-blue-400">{DIGITAL_SOLUTIONS_DATA[activeSolutionKey].startingFee}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <a
                                href={`${whatsappBase}?text=${encodeURIComponent(DIGITAL_SOLUTIONS_DATA[activeSolutionKey].whatsappMsg)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                            >
                                Inquire on WhatsApp <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <a
                                href={`tel:+91${(settings.contactNumber || '8445221632').replace(/[^0-9]/g, '')}`}
                                className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider transition-all"
                            >
                                Call Desk
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: REQUIRED DOCUMENTS GUIDE ── */}
            {showDocsModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 dark:border-white/10 shadow-2xl relative max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => setShowDocsModal(false)}
                            className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4 shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                                    Documentation Help
                                </span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Required Documents Checklist
                                </h3>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4 shrink-0">
                            <input
                                type="text"
                                placeholder="Search document requirements (e.g. PAN, Voter, Domicile)..."
                                value={docsSearch}
                                onChange={e => setDocsSearch(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Scrollable list */}
                        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
                            {filteredDocs.length > 0 ? (
                                filteredDocs.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.service}</h4>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                                {item.category}
                                            </span>
                                        </div>
                                        <div className="space-y-1 mb-2">
                                            {item.docs.map((doc, dIdx) => (
                                                <div key={dIdx} className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                    <span>{doc}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>{item.tips}</span>
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs font-bold text-slate-400 py-6">No matching documents found.</p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500">Need help preparing documents?</span>
                            <a
                                href={`${whatsappBase}?text=${encodeURIComponent('Hello Digital Cyber Cafe, which documents do I need for my application?')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wide flex items-center gap-2"
                            >
                                Ask on WhatsApp <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 3: SERVICE CHARGES & PRICING LIST ── */}
            {showChargesModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 dark:border-white/10 shadow-2xl relative max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => setShowChargesModal(false)}
                            className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4 shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                                    Transparent Pricing
                                </span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Official Service Charges
                                </h3>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4 shrink-0">
                            <input
                                type="text"
                                placeholder="Search by service name or category..."
                                value={chargesSearch}
                                onChange={e => setChargesSearch(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Scrollable list */}
                        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((svc, idx) => (
                                    <div
                                        key={svc.id || svc._id || idx}
                                        className="p-3.5 rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-black text-slate-900 dark:text-white">{svc.title}</h4>
                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                    {svc.category || 'General'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span>Est: {svc.estimatedDays || '3-7 working days'}</span>
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 flex items-center gap-3">
                                            <span className="text-base font-black text-slate-900 dark:text-white">
                                                ₹{svc.fee}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setShowChargesModal(false);
                                                    navigate(`/apply/${svc.id || svc._id}`);
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider transition-all"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs font-bold text-slate-400 py-6">No matching services found.</p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500">Government portal charges included as per actuals</span>
                            <button
                                onClick={() => {
                                    setShowChargesModal(false);
                                    navigate('/services');
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wide"
                            >
                                View All Services
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
