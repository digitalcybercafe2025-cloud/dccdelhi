import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { User, Image as ImageIcon, Briefcase, Plus, X, ShieldCheck, Sparkles, MapPin, Phone } from 'lucide-react';

const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5';
const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold outline-none focus:border-blue-400 transition-colors';

const AboutMeManager: React.FC = () => {
    const [form, setForm] = useState({
        title: '', subtitle: '', description: '', missionTitle: '', mission: '',
        visionTitle: '', vision: '', experience: '', address: '', phone: '',
        imageUrl: '', isVisible: true
    });
    const [expertise, setExpertise] = useState<string[]>([]);
    const [newExpertise, setNewExpertise] = useState('');

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
                        isVisible: data.isVisible !== false // default true
                    });
                    setExpertise(data.expertise || []);
                }
            } catch (e) { console.error('Failed to load About Me data', e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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

            const res = await api.put('/about', formData);

            if (res.data?.data?.imageUrl) {
                setForm(f => ({ ...f, imageUrl: res.data.data.imageUrl }));
            }
            setSelectedFile(null);

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to save settings');
        }
        finally { setSaving(false); }
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

    const Field = ({ label, field, type = 'text', placeholder = '' }: {
        label: string; field: keyof typeof form; type?: string; placeholder?: string;
    }) => (
        <div>
            <label className={labelCls}>{label}</label>
            <input type={type} value={(form as any)[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder} className={inputCls} />
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const displayImage = previewUrl || (form.imageUrl.startsWith('/') ? `http://127.0.0.1:5000${form.imageUrl}` : form.imageUrl);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20 animate-in fade-in duration-500">
            {/* ── LEFT COL: Image & Quick Info ── */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-b-4 border-b-blue-600/10">
                    <div className="p-8 text-center flex flex-col items-center relative">
                        <div className="w-48 h-48 rounded-full border-4 border-white shadow-xl overflow-hidden mb-6 relative group bg-slate-100 flex items-center justify-center">
                            {displayImage ? (
                                <img src={displayImage} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <User className="w-20 h-20 text-slate-300" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="w-10 h-10 text-white" />
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
                            className="px-6 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition-colors"
                        >
                            Change Profile Image
                        </button>

                        <div className="mt-6 w-full text-left space-y-3">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{form.title || 'Your Name'}</h2>
                            <p className="text-sm font-bold text-slate-500 text-center">{form.subtitle || 'Your Role'}</p>

                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-2 rounded-lg">
                                    <MapPin className="w-4 h-4 text-red-400" />
                                    <span className="text-xs font-bold">{form.address || 'Not Set'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-2 rounded-lg">
                                    <Phone className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-bold">{form.phone || 'Not Set'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 border-b-4 border-b-emerald-500/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.isVisible ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isVisible ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                            {form.isVisible ? 'Section Visible' : 'Section Hidden'}
                        </span>
                    </label>
                    <p className="text-[10px] text-slate-400 font-bold mt-2">Toggle to show or hide the About Me section on the public website.</p>
                </div>
            </div>

            {/* ── RIGHT COL: About Details ── */}
            <div className="lg:col-span-8">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 border-b-4 border-b-blue-500/10">
                        <div className="flex items-center gap-3 pb-2">
                            <span className="w-1.5 h-5 bg-blue-600 rounded-full" />
                            <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Identity & Role</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Full Name" field="title" placeholder="e.g. Pawan Gautam" />
                            <Field label="Professional Title" field="subtitle" placeholder="e.g. Full-Stack Developer" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Location / Address" field="address" />
                            <Field label="Phone Number" field="phone" />
                        </div>
                        <div>
                            <label className={labelCls}>About Description</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} h-32 resize-none`} placeholder="Write a short bio about yourself..." />
                        </div>
                        <Field label="Experience Title" field="experience" placeholder="e.g. Over 12 Years of Professional Integrity" />
                    </div>

                    {/* Mission & Vision */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 border-b-4 border-b-emerald-500/10">
                        <div className="flex items-center gap-3 pb-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Mission & Vision</h3>
                        </div>

                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                                <h4 className="font-black text-sm text-blue-900">Mission Statement</h4>
                            </div>
                            <Field label="Mission Title" field="missionTitle" />
                            <div>
                                <label className={labelCls}>Mission Content</label>
                                <textarea value={form.mission} onChange={e => setForm(f => ({ ...f, mission: e.target.value }))} className={`${inputCls} h-20 resize-none`} />
                            </div>
                        </div>

                        <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                <h4 className="font-black text-sm text-emerald-900">Vision Statement</h4>
                            </div>
                            <Field label="Vision Title" field="visionTitle" />
                            <div>
                                <label className={labelCls}>Vision Content</label>
                                <textarea value={form.vision} onChange={e => setForm(f => ({ ...f, vision: e.target.value }))} className={`${inputCls} h-20 resize-none`} />
                            </div>
                        </div>
                    </div>

                    {/* Expertise */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 border-b-4 border-b-amber-500/10">
                        <div className="flex items-center gap-3 pb-2">
                            <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                            <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Expertise Tags</h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {expertise.map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 font-bold text-xs py-1.5 pl-3 pr-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                                    <span>{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeExpertise(item)}
                                        className="p-1 hover:bg-slate-200 rounded-md text-slate-500 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mt-4 max-w-sm">
                            <input
                                type="text"
                                value={newExpertise}
                                onChange={(e) => setNewExpertise(e.target.value)}
                                className={inputCls}
                                placeholder="Add new expertise..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addExpertise();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={addExpertise}
                                className="w-12 h-12 shrink-0 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-blue-50">
                        <button type="submit" disabled={saving} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                            {saving ? 'Syncing...' : 'Save About Me Profile'}
                        </button>
                        {saved && <span className="text-emerald-500 font-black text-xs uppercase tracking-widest animate-pulse">Profile Updated!</span>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AboutMeManager;
