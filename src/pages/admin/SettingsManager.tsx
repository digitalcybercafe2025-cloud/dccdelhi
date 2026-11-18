import React, { useState, useEffect, useRef } from 'react';
import api, { getMediaUrl } from '../../api/axios';
import {
    MapPin, Sliders, CreditCard, Share2, ShieldCheck,
    Save, ExternalLink, Check, Smartphone, Laptop,
    Palette, Wrench, FileText, AlertCircle, LogOut,
    Building2, Phone, Mail, Globe, Sparkles
} from 'lucide-react';

const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5';
const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold outline-none focus:border-blue-400 transition-colors';

const SettingsManager: React.FC = () => {
    // Top-level tab state
    const [activeTab, setActiveTab] = useState<'footer' | 'general' | 'payment' | 'social' | 'profile'>('footer');

    // Footer sub-tab state
    const [footerSubTab, setFooterSubTab] = useState<'location' | 'costs' | 'legal'>('location');

    const [form, setForm] = useState({
        siteName: '',
        contactNumber: '',
        whatsapp: '',
        email: '',
        address: '',
        slogan: '',
        footerText: '',
        instagramUrl: '',
        facebookUrl: '',
        threadsUrl: '',
        twitterUrl: '',
        youtubeUrl: '',
        googleMapsUrl: '',
        upiId: '8445221632@upi',
        upiPayeeName: 'Digital Cyber Cafe',
        appStartingFee: '₹4,999/- onwards',
        webStartingFee: '₹2,999/- onwards',
        designStartingFee: '₹499/- onwards',
        techStartingFee: '₹150/- onwards',
        privacyPolicy: '',
        termsAndConditions: '',
        disclaimer: ''
    });

    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        mobile: '',
        currentPassword: '',
        newPassword: '',
        newRecoveryPin: '',
        avatar: ''
    });

    const [originalProfile, setOriginalProfile] = useState({ email: '', mobile: '' });
    const [hasRecoveryPin, setHasRecoveryPin] = useState(false);
    const [hasInviteCode, setHasInviteCode] = useState(false);
    const [inviteForm, setInviteForm] = useState({ inviteCode: '', currentPassword: '' });
    const [inviteSaving, setInviteSaving] = useState(false);
    const [inviteSavedMsg, setInviteSavedMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isSuperAdmin = (localStorage.getItem('mangolpuri_admin_role') || 'admin') === 'admin';

    useEffect(() => {
        const load = async () => {
            try {
                const reqs: Promise<any>[] = [api.get('/settings'), api.get('/auth/me')];
                if (isSuperAdmin) {
                    reqs.push(api.get('/admin/security-config').catch(() => ({ data: null })));
                }
                const [sRes, aRes, secRes] = await Promise.all(reqs);
                if (sRes.data?.data) {
                    setForm(prev => ({
                        ...prev,
                        ...sRes.data.data
                    }));
                }
                const profileData = aRes.data;
                if (profileData) {
                    setProfileForm(p => ({
                        ...p,
                        name: profileData.name || '',
                        email: profileData.email || '',
                        mobile: profileData.mobile || '',
                        avatar: profileData.avatar || ''
                    }));
                    setOriginalProfile({
                        email: profileData.email || '',
                        mobile: profileData.mobile || ''
                    });
                    setHasRecoveryPin(Boolean(profileData.hasRecoveryPin));
                }
                if (secRes?.data) {
                    setHasInviteCode(Boolean(secRes.data.hasInviteCode));
                }
            } catch (e) {
                console.error('Settings load error:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isSuperAdmin]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await api.put('/settings', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3500);
        } catch {
            alert('Failed to save settings. Please verify server connection.');
        } finally {
            setSaving(false);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileSaved(false);
        try {
            const res = await api.put('/auth/profile', profileForm);
            setProfileSaved(true);
            setProfileForm(p => ({ ...p, currentPassword: '', newPassword: '', newRecoveryPin: '' }));
            if (res.data?.hasRecoveryPin !== undefined) setHasRecoveryPin(Boolean(res.data.hasRecoveryPin));

            if (res.data) {
                localStorage.setItem('mangolpuri_admin_email', res.data.email);
                if (res.data.avatar) localStorage.setItem('mangolpuri_admin_avatar', res.data.avatar);
                window.dispatchEvent(new Event('storage'));
                setTimeout(() => setProfileSaved(false), 3500);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteSaving(true);
        setInviteSavedMsg('');
        try {
            const res = await api.put('/admin/security-config', inviteForm);
            setHasInviteCode(Boolean(res.data?.hasInviteCode));
            setInviteForm({ inviteCode: '', currentPassword: '' });
            setInviteSavedMsg(res.data?.message || 'Security Invite Code updated successfully!');
            setTimeout(() => setInviteSavedMsg(''), 4000);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update security invite code');
        } finally {
            setInviteSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPG, PNG, or WebP)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('Image must be under 10MB');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setUploadingAvatar(true);
        try {
            const res = await api.post('/admin/upload-avatar', formData);
            if (res.data && res.data.avatar) {
                const newAvatar = res.data.avatar;
                setProfileForm(p => ({ ...p, avatar: newAvatar }));
                localStorage.setItem('mangolpuri_admin_avatar', newAvatar);

                try {
                    await api.put('/about', { imageUrl: newAvatar });
                } catch (_) { /* ignore if about sync fails */ }

                window.dispatchEvent(new Event('storage'));
            } else {
                throw new Error(res.data?.message || 'Failed to upload avatar');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const Field = ({ label, field, type = 'text', placeholder = '', help = '' }: {
        label: string; field: keyof typeof form; type?: string; placeholder?: string; help?: string;
    }) => (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>{label}</label>
                {help && <span className="text-[9px] font-bold text-slate-400">{help}</span>}
            </div>
            <input
                type={type}
                value={(form as any)[field] || ''}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className={inputCls}
            />
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-24">
            {/* ── HEADER & GLOBAL SAVE STATUS BAR ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                        <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block" />
                        Settings & Configuration Hub
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Control Footer, Location, Service Rates, Branding & Security in compact view
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {saved && (
                        <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black animate-in fade-in">
                            <Check size={14} /> Saved & Synced!
                        </div>
                    )}
                    {activeTab !== 'profile' && (
                        <button
                            type="button"
                            onClick={() => handleSave()}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={15} />
                            )}
                            Save Settings
                        </button>
                    )}
                </div>
            </div>

            {/* ── TOP NAVIGATION TABS ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2 flex flex-wrap gap-2 items-center">
                {[
                    { id: 'footer', label: 'Footer & Location Hub', icon: MapPin, badge: 'Dukaan, Rates & Legal' },
                    { id: 'general', label: 'General Branding', icon: Sliders, badge: 'Name & Slogan' },
                    { id: 'payment', label: 'Payment Gateway', icon: CreditCard, badge: 'UPI & QR' },
                    { id: 'social', label: 'Social & Links', icon: Share2, badge: 'Channels' },
                    { id: 'profile', label: 'Admin Security', icon: ShieldCheck, badge: 'Credentials & PIN' },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                            <span>{tab.label}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {tab.badge}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── TAB 1: FOOTER & LOCATION HUB (WITH SUB-TABS) ── */}
            {activeTab === 'footer' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
                    {/* Sub-tab Pill Switcher */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl max-w-fit">
                        <button
                            type="button"
                            onClick={() => setFooterSubTab('location')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                footerSubTab === 'location'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Building2 size={14} /> Dukaan Location & Contacts
                        </button>
                        <button
                            type="button"
                            onClick={() => setFooterSubTab('costs')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                footerSubTab === 'costs'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Smartphone size={14} /> Service & App Starting Costs
                        </button>
                        <button
                            type="button"
                            onClick={() => setFooterSubTab('legal')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                footerSubTab === 'legal'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <FileText size={14} /> Legal Policies & Disclaimers
                        </button>
                    </div>

                    {/* Sub-tab 1: Dukaan Location & Contacts */}
                    {footerSubTab === 'location' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                                <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                    Shop Physical Location & Contact Points
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Physical Shop / HQ Address</label>
                                    <textarea
                                        value={form.address || ''}
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                        rows={3}
                                        placeholder="e.g. G-663, Mangolpuri, Delhi - 110083"
                                        className={`${inputCls} resize-none`}
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                                        Yeh address website ke footer me "Address" ke samne display hoga.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Google Maps Location Link ("Find Our Hub")
                                            </label>
                                            {form.googleMapsUrl && (
                                                <a
                                                    href={form.googleMapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    Test Link <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            value={form.googleMapsUrl || ''}
                                            onChange={e => setForm(f => ({ ...f, googleMapsUrl: e.target.value }))}
                                            placeholder="https://maps.google.com/?q=..."
                                            className={inputCls}
                                        />
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                                            Jab customer footer me "Find Our Hub" click karega to yeh location Google Maps par khulegi.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                                <Field label="Customer Care Number (Call Us)" field="contactNumber" placeholder="e.g. 8445221632" help="Footer Call Us link" />
                                <Field label="WhatsApp Support Number" field="whatsapp" placeholder="e.g. 8445221632" help="Footer WhatsApp link" />
                                <Field label="Official Support Email" field="email" type="email" placeholder="e.g. digitalcybercafe@gmail.com" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                <div>
                                    <label className={labelCls}>Platform Slogan / Tagline</label>
                                    <input
                                        type="text"
                                        value={form.slogan || ''}
                                        onChange={e => setForm(f => ({ ...f, slogan: e.target.value }))}
                                        placeholder="Bridging the digital divide with security and speed."
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Platform Footer Notice</label>
                                    <input
                                        type="text"
                                        value={form.footerText || ''}
                                        onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))}
                                        placeholder="© 2026 Digital Cyber Cafe Mangolpuri • Powered by Digital Cyber Zone"
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sub-tab 2: Service & Mobile App Starting Costs */}
                    {footerSubTab === 'costs' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                        Digital Services & Mobile App Starting Fees
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-bold">
                                        Yeh rates customer ko footer ke "Digital Solutions" cards me "Starting Price" me dikhai denge.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <Smartphone size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase">Mobile App Development</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">Android, PWA & Utility Apps</p>
                                        </div>
                                    </div>
                                    <Field label="Starting Price Tag" field="appStartingFee" placeholder="₹4,999/- onwards" />
                                </div>

                                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Laptop size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase">Website Development</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">Modern Web Portfolios & Stores</p>
                                        </div>
                                    </div>
                                    <Field label="Starting Price Tag" field="webStartingFee" placeholder="₹2,999/- onwards" />
                                </div>

                                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                                            <Palette size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase">Logo & Graphic Design</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">Brand Kits, Visiting Cards & Banners</p>
                                        </div>
                                    </div>
                                    <Field label="Starting Price Tag" field="designStartingFee" placeholder="₹499/- onwards" />
                                </div>

                                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                            <Wrench size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase">Technical Support & Drivers</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">DSC, Morpho/Mantra, Windows & Printers</p>
                                        </div>
                                    </div>
                                    <Field label="Starting Price Tag" field="techStartingFee" placeholder="₹150/- onwards" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sub-tab 3: Legal Policies & Disclaimers */}
                    {footerSubTab === 'legal' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-1.5 h-4 bg-purple-600 rounded-full" />
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                            Legal Policies & Public Disclaimers
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-bold">
                                            Footer ke niche bane "Privacy Policy", "Terms & Conditions" aur "Disclaimer" links ke live rules
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href="/privacy-policy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg"
                                    >
                                        Privacy <ExternalLink size={10} />
                                    </a>
                                    <a
                                        href="/terms-and-conditions"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg"
                                    >
                                        Terms <ExternalLink size={10} />
                                    </a>
                                    <a
                                        href="/disclaimer"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg"
                                    >
                                        Disclaimer <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className={labelCls}>Privacy Policy Special Note / Announcement (Optional)</label>
                                    <textarea
                                        value={form.privacyPolicy || ''}
                                        onChange={e => setForm(f => ({ ...f, privacyPolicy: e.target.value }))}
                                        rows={3}
                                        placeholder="Apne customers ke liye data privacy ya document security ka koi special note yahan dalein..."
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>Terms & Conditions Special Note / Service Rules (Optional)</label>
                                    <textarea
                                        value={form.termsAndConditions || ''}
                                        onChange={e => setForm(f => ({ ...f, termsAndConditions: e.target.value }))}
                                        rows={3}
                                        placeholder="Application submission, turnaround time ya refund policy se judi terms yahan dalein..."
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>Legal Disclaimer Notice (Optional)</label>
                                    <textarea
                                        value={form.disclaimer || ''}
                                        onChange={e => setForm(f => ({ ...f, disclaimer: e.target.value }))}
                                        rows={3}
                                        placeholder="Government portal facilitation aur third-party disclaimer guidelines yahan dalein..."
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 2: GENERAL ENTERPRISE BRANDING ── */}
            {activeTab === 'general' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                            Enterprise Branding & Identity
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Platform Display Name" field="siteName" placeholder="Digital Cyber Cafe" help="Used in header & page titles" />
                        <Field label="Brand Slogan / Tagline" field="slogan" placeholder="Official assistance for Aadhaar, PAN..." />
                    </div>

                    <div>
                        <label className={labelCls}>Platform Footer Notice</label>
                        <textarea
                            value={form.footerText || ''}
                            onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))}
                            rows={3}
                            className={`${inputCls} resize-none`}
                            placeholder="© 2026 Digital Cyber Cafe Mangolpuri • Powered by Digital Cyber Zone"
                        />
                    </div>
                </div>
            )}

            {/* ── TAB 3: DIRECT UPI PAYMENT GATEWAY ── */}
            {activeTab === 'payment' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <span className="w-1.5 h-4 bg-purple-600 rounded-full" />
                        <div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                Direct UPI Payment Gateway
                            </h3>
                            <p className="text-[11px] text-slate-400 font-bold">
                                0% Commission Direct Bank QR Code Settings
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-4">
                            <Field
                                label="Business UPI ID (VPA)"
                                field="upiId"
                                placeholder="e.g. 8445221632@upi"
                                help="Funds land directly in this UPI account"
                            />
                            <Field
                                label="Payee / Account Name"
                                field="upiPayeeName"
                                placeholder="Digital Cyber Cafe"
                                help="Shown to customer on GooglePay, PhonePe, Paytm"
                            />
                        </div>

                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center flex flex-col items-center">
                            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                                <CreditCard size={20} />
                            </div>
                            <h4 className="text-xs font-black text-slate-800 uppercase">Live QR Preview</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-4">
                                Customer payment page par yahi UPI parameters render honge.
                            </p>
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                                <p className="font-mono text-xs font-black text-purple-600">{form.upiId || 'Not Set'}</p>
                                <p className="text-[11px] font-bold text-slate-700 mt-0.5">{form.upiPayeeName || 'Digital Cyber Cafe'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 4: SOCIAL MEDIA & COMMUNITY ── */}
            {activeTab === 'social' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <span className="w-1.5 h-4 bg-pink-500 rounded-full" />
                        <div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                Social Media & Official Channels
                            </h3>
                            <p className="text-[11px] text-slate-400 font-bold">
                                Footer me clickable icons inhi links par redirect karenge
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Instagram Profile Link" field="instagramUrl" placeholder="https://instagram.com/yourcafe" />
                        <Field label="Facebook Page Link" field="facebookUrl" placeholder="https://facebook.com/yourcafe" />
                        <Field label="Threads Profile Link" field="threadsUrl" placeholder="https://threads.net/@yourcafe" />
                        <Field label="X (formerly Twitter) Link" field="twitterUrl" placeholder="https://x.com/yourcafe" />
                        <Field label="YouTube Channel Link" field="youtubeUrl" placeholder="https://youtube.com/@yourcafe" />
                    </div>
                </div>
            )}

            {/* ── TAB 5: ADMIN PROFILE, SECURITY & INVITE CODE ── */}
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
                    {/* Left: Avatar & Identity Card */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 text-center flex flex-col items-center">
                        <div className="relative mb-5 group cursor-pointer">
                            <div
                                className="p-[3.5px] rounded-full transition-all duration-500 shadow-md group-hover:shadow-[0_0_25px_rgba(37,99,235,0.45),0_0_20px_rgba(16,185,129,0.35),0_0_20px_rgba(249,115,22,0.35),0_0_20px_rgba(239,68,68,0.35)] group-hover:scale-[1.02]"
                                style={{
                                    background: 'conic-gradient(from 45deg, #2563eb 0deg, #10b981 90deg, #f97316 180deg, #ef4444 270deg, #2563eb 360deg)'
                                }}
                            >
                                <div className="w-28 h-28 rounded-full overflow-hidden bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 shadow-inner relative">
                                    <img
                                        src={profileForm.avatar ? getMediaUrl(profileForm.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.name || 'Admin')}&background=eff6ff&color=2563eb`}
                                        alt={profileForm.name || 'Admin'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.name || 'Admin')}&background=eff6ff&color=2563eb`;
                                        }}
                                    />
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                title="Change Profile Photo"
                                className="absolute bottom-0 right-0 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 border-2 border-white"
                            >
                                {uploadingAvatar ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                )}
                            </button>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{profileForm.name || 'Admin'}</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Super Administrator</p>

                        <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-3 text-left">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-400">Login ID:</span>
                                <span className="font-mono font-bold text-slate-700 truncate max-w-[180px]">{profileForm.email}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-400">Registered Mobile:</span>
                                <span className="font-mono font-bold text-slate-700">{profileForm.mobile || 'Not Linked'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-400">Recovery PIN:</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${hasRecoveryPin ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {hasRecoveryPin ? 'Active' : 'Not Set'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => { localStorage.clear(); window.location.href = '/admin'; }}
                            className="w-full mt-6 p-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all"
                        >
                            <LogOut size={16} /> Logout Administrator
                        </button>
                    </div>

                    {/* Right: Update Profile & Security Code */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Profile & Credentials Form */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-4">
                            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                                <span className="w-1.5 h-4 bg-slate-800 rounded-full" />
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                    Update Admin Credentials & PIN
                                </h3>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Display Name</label>
                                        <input
                                            value={profileForm.name}
                                            onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Login ID / Email</label>
                                        <input
                                            value={profileForm.email}
                                            onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Registered Mobile (10 Digits)</label>
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            value={profileForm.mobile}
                                            onChange={e => setProfileForm(p => ({ ...p, mobile: e.target.value.replace(/[^0-9]/g, '') }))}
                                            placeholder="e.g. 9911423881"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>6-Digit Recovery PIN (Forgot Password)</label>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={profileForm.newRecoveryPin}
                                            onChange={e => setProfileForm(p => ({ ...p, newRecoveryPin: e.target.value.replace(/[^0-9]/g, '') }))}
                                            placeholder={hasRecoveryPin ? 'Enter 6 digits to change PIN' : 'Set 6-digit PIN'}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Current Password</label>
                                        <input
                                            type="password"
                                            required={
                                                Boolean(profileForm.newPassword) ||
                                                Boolean(profileForm.newRecoveryPin) ||
                                                profileForm.email !== originalProfile.email ||
                                                profileForm.mobile !== originalProfile.mobile
                                            }
                                            value={profileForm.currentPassword}
                                            onChange={e => setProfileForm(p => ({ ...p, currentPassword: e.target.value }))}
                                            placeholder="Required for any sensitive change"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>New Password (Optional)</label>
                                        <input
                                            type="password"
                                            value={profileForm.newPassword}
                                            onChange={e => setProfileForm(p => ({ ...p, newPassword: e.target.value }))}
                                            placeholder="Min 8 chars (letters + numbers)"
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between">
                                    <button
                                        type="submit"
                                        disabled={profileSaving}
                                        className="px-6 py-3.5 bg-slate-800 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                        {profileSaving ? 'Updating...' : 'Save Profile Changes'}
                                    </button>
                                    {profileSaved && (
                                        <p className="text-xs font-black text-emerald-600 flex items-center gap-1 animate-in fade-in">
                                            <Check size={14} /> Profile Synced!
                                        </p>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Security Invite Code (Super Admin) */}
                        {isSuperAdmin && (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-4 border-b-4 border-b-emerald-500/10">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                                            Team Sign-Up Security Invite Code
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                            Naye staff accounts register karne ke liye yeh code zaroori hota hai
                                        </p>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${hasInviteCode ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                        {hasInviteCode ? 'Code Active' : 'Not Set'}
                                    </span>
                                </div>

                                <form onSubmit={handleInviteSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>New Security Invite Code (Min 6 chars)</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={inviteForm.inviteCode}
                                                onChange={e => setInviteForm(f => ({ ...f, inviteCode: e.target.value }))}
                                                placeholder="Set secret code for staff signup"
                                                className={inputCls}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Your Current Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={inviteForm.currentPassword}
                                                onChange={e => setInviteForm(f => ({ ...f, currentPassword: e.target.value }))}
                                                placeholder="Confirm admin password"
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <button
                                            type="submit"
                                            disabled={inviteSaving}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                        >
                                            {inviteSaving ? 'Saving...' : hasInviteCode ? 'Update Security Code' : 'Activate Security Code'}
                                        </button>
                                        {inviteSavedMsg && (
                                            <p className="text-xs font-black text-emerald-600 flex items-center gap-1 animate-in fade-in">
                                                <Check size={14} /> {inviteSavedMsg}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsManager;
