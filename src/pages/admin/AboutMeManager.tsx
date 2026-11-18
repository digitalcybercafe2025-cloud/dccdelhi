import React, { useState, useEffect, useRef } from 'react';
import api, { getMediaUrl } from '../../api/axios';
import { User, Image as ImageIcon, Briefcase, Plus, X, ShieldCheck, Sparkles, MapPin, Phone, Check, Save, Eye, EyeOff } from 'lucide-react';

const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1';
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold outline-none focus:border-blue-500 transition-colors';

const AboutMeManager: React.FC = () => {
    const [form, setForm] = useState({
        title: '', subtitle: '', description: '', missionTitle: '', mission: '',
        visionTitle: '', vision: '', experience: '', address: '', phone: '',
        imageUrl: '', isVisible: true
    });
    const [expertise, setExpertise] = useState<string[]>([]);
    const [newExpertise, setNewExpertise] = useState('');
    const [activeTab, setActiveTab] = useState<'identity' | 'mission' | 'expertise'>('identity');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/about');
                if (res.data?.data) {
                    const data = res.data.data;
                    setForm({
                        title: data.title || '',
                        subtitle: data.subtitle || '',
                        description: data.description || '',
                        missionTitle: data.missionTitle || '',
                        mission: data.mission || '',
                        visionTitle: data.visionTitle || '',
                        vision: data.vision || '',
                        experience: data.experience || '',
                        address: data.address || '',
                        phone: data.phone || '',
                        imageUrl: data.imageUrl || '',
                        isVisible: data.isVisible !== false
                    });
                    setExpertise(data.expertise || []);
                }
            } catch (e) {
                console.error('Failed to load About Me data', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('subtitle', form.subtitle);
            formData.append('description', form.description);
            formData.append('missionTitle', form.missionTitle);
            formData.append('mission', form.mission);
            formData.append('visionTitle', form.visionTitle);
            formData.append('vision', form.vision);
            formData.append('experience', form.experience);
            formData.append('address', form.address);
            formData.append('phone', form.phone);
            formData.append('isVisible', form.isVisible.toString());
            formData.append('expertise', JSON.stringify(expertise));

            if (selectedFile) {
                formData.append('image', selectedFile);
            }
            if (form.imageUrl) {
                formData.append('imageUrl', form.imageUrl);
            }

            const res = await api.put('/about', formData);

            if (res.data?.data) {
                const updated = res.data.data;
                setForm(f => ({
                    ...f,
                    ...updated,
                    imageUrl: updated.imageUrl || f.imageUrl
                }));
                if (updated.imageUrl) {
                    setPreviewUrl(null);
                }
            }
            setSelectedFile(null);

            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            console.error(err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const addExpertise = () => {
        if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
            setExpertise([...expertise, newExpertise.trim()]);
            setNewExpertise('');
        }
    };

    const removeExpertise = (item: string) => {
        setExpertise(expertise.filter(e => e !== item));
    };

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const displayImage = previewUrl || (form.imageUrl ? getMediaUrl(form.imageUrl) : '');

    return (
        <div className="space-y-4">
            {/* ── Compact Top Bar ── */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-slate-800 font-black text-base uppercase tracking-tight">About Me Manager</h2>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">
                            Personal profile & public information
                        </p>
                    </div>

                    {/* Section Visibility Toggle */}
                    <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isVisible: !f.isVisible }))}
                        className={`ml-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                            form.isVisible ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Toggle Section Visibility on Website"
                    >
                        {form.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{form.isVisible ? 'Public: Visible' : 'Hidden'}</span>
                    </button>
                </div>

                {/* Primary Save Button in Header (No need to scroll!) */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-60"
                    >
                        {saving ? (
                            <span>Syncing...</span>
                        ) : saved ? (
                            <>
                                <Check size={15} strokeWidth={3} />
                                <span>Saved!</span>
                            </>
                        ) : (
                            <>
                                <Save size={15} />
                                <span>Save Profile</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Compact 2-Column Dashboard ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* ── Left Column: Profile Card & Photo ── */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 text-center flex flex-col items-center">
                    {/* 4-Color Gradient Ring Container */}
                    <div className="relative mb-3 group cursor-pointer">
                        <div
                            className="p-[3px] rounded-full transition-all duration-300 shadow-sm group-hover:shadow-[0_0_18px_rgba(37,99,235,0.4),0_0_15px_rgba(16,185,129,0.3),0_0_15px_rgba(249,115,22,0.3),0_0_15px_rgba(239,68,68,0.3)] group-hover:scale-[1.02]"
                            style={{
                                background: 'conic-gradient(from 45deg, #2563eb 0deg, #10b981 90deg, #f97316 180deg, #ef4444 270deg, #2563eb 360deg)'
                            }}
                        >
                            <div className="w-28 h-28 rounded-full border-2 border-white shadow-inner overflow-hidden relative bg-slate-100 flex items-center justify-center">
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt="Profile"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = 'https://img.freepik.com/free-photo/handsome-young-man-with-new-hairstyle-wearing-blue-shirt-feeling-confident-isolated-white-background_176532-8097.jpg';
                                        }}
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-slate-300" />
                                )}
                                <div
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-blue-100 transition-colors"
                    >
                        Change Photo
                    </button>

                    <div className="mt-3 w-full text-left">
                        <label className={labelCls}>Direct Image Link (Optional)</label>
                        <input
                            type="text"
                            value={form.imageUrl}
                            onChange={e => {
                                setForm(f => ({ ...f, imageUrl: e.target.value }));
                                setPreviewUrl(null);
                            }}
                            placeholder="https://... or /uploads/..."
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:border-blue-400 font-medium"
                        />
                    </div>

                    {/* Quick Profile Summary */}
                    <div className="mt-4 pt-3 border-t border-slate-100 w-full text-left space-y-2">
                        <div>
                            <h3 className="text-base font-black text-slate-800 tracking-tight text-center">
                                {form.title || 'Your Name'}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 text-center">
                                {form.subtitle || 'Professional Title'}
                            </p>
                        </div>

                        <div className="pt-2 space-y-1.5 text-[11px]">
                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                <MapPin size={13} className="text-red-500 shrink-0" />
                                <span className="font-semibold truncate">{form.address || 'Address not configured'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                <Phone size={13} className="text-emerald-500 shrink-0" />
                                <span className="font-semibold truncate">{form.phone || 'Phone not configured'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Compact Sub-Tabs & Details ── */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                    {/* Sub-Tabs Navigation */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
                        <button
                            type="button"
                            onClick={() => setActiveTab('identity')}
                            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'identity' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <User size={14} />
                            <span>Identity & Bio</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('mission')}
                            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'mission' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <ShieldCheck size={14} />
                            <span>Mission & Vision</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('expertise')}
                            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'expertise' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Sparkles size={14} />
                            <span>Skills & Tags ({expertise.length})</span>
                        </button>
                    </div>

                    {/* Tab 1: Identity & Bio */}
                    {activeTab === 'identity' && (
                        <div className="space-y-3.5 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Full Name</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Vikas Sharma"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Professional Title</label>
                                    <input
                                        type="text"
                                        value={form.subtitle}
                                        onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                                        placeholder="e.g. Founder & Digital Consultant"
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Location / Address</label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                        placeholder="e.g. Mangolpuri, Delhi"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Contact Phone</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="e.g. 9911423881"
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Experience Highlight Tag</label>
                                <input
                                    type="text"
                                    value={form.experience}
                                    onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                                    placeholder="e.g. Over 12+ Years of Trusted Digital Services"
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Bio / About Summary</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={4}
                                    placeholder="Brief introduction or background..."
                                    className={`${inputCls} resize-none leading-relaxed`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Mission & Vision */}
                    {activeTab === 'mission' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                            {/* Mission Card */}
                            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2.5">
                                <div className="flex items-center gap-2 text-blue-900 pb-1 border-b border-blue-100">
                                    <ShieldCheck size={16} className="text-blue-600" />
                                    <h4 className="font-black text-xs uppercase tracking-wider">Mission Statement</h4>
                                </div>
                                <div>
                                    <label className={labelCls}>Mission Title</label>
                                    <input
                                        type="text"
                                        value={form.missionTitle}
                                        onChange={e => setForm(f => ({ ...f, missionTitle: e.target.value }))}
                                        placeholder="e.g. Reliable Digital Services"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Mission Details</label>
                                    <textarea
                                        value={form.mission}
                                        onChange={e => setForm(f => ({ ...f, mission: e.target.value }))}
                                        rows={4}
                                        placeholder="Describe your primary mission..."
                                        className={`${inputCls} resize-none leading-relaxed`}
                                    />
                                </div>
                            </div>

                            {/* Vision Card */}
                            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2.5">
                                <div className="flex items-center gap-2 text-emerald-900 pb-1 border-b border-emerald-100">
                                    <Sparkles size={16} className="text-emerald-600" />
                                    <h4 className="font-black text-xs uppercase tracking-wider">Vision Statement</h4>
                                </div>
                                <div>
                                    <label className={labelCls}>Vision Title</label>
                                    <input
                                        type="text"
                                        value={form.visionTitle}
                                        onChange={e => setForm(f => ({ ...f, visionTitle: e.target.value }))}
                                        placeholder="e.g. Empowering Every Citizen"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Vision Details</label>
                                    <textarea
                                        value={form.vision}
                                        onChange={e => setForm(f => ({ ...f, vision: e.target.value }))}
                                        rows={4}
                                        placeholder="Describe your future vision..."
                                        className={`${inputCls} resize-none leading-relaxed`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Expertise & Skills */}
                    {activeTab === 'expertise' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div>
                                <label className={labelCls}>Active Skills & Expertise Tags</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 min-h-[80px]">
                                    {expertise.length === 0 ? (
                                        <p className="text-xs text-slate-400 font-medium">No expertise tags added yet.</p>
                                    ) : (
                                        expertise.map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-1.5 bg-white text-slate-700 font-bold text-xs py-1 pl-3 pr-1.5 rounded-lg border border-slate-200 shadow-sm"
                                            >
                                                <span>{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExpertise(item)}
                                                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-400 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 max-w-md">
                                <input
                                    type="text"
                                    value={newExpertise}
                                    onChange={e => setNewExpertise(e.target.value)}
                                    placeholder="Type new skill (e.g. CSC Certification, PAN Portal)..."
                                    className={inputCls}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addExpertise();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addExpertise}
                                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 shadow-sm active:scale-95"
                                >
                                    <Plus size={15} />
                                    <span>Add</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AboutMeManager;