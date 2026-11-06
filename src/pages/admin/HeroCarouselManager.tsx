import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Image as ImageIcon, Save, X, MoveUp, MoveDown, Check, AlertCircle, Loader2, Link as LinkIcon, Upload, Sparkles } from 'lucide-react';
import api, { getMediaUrl } from '../../api/axios';

interface Slide {
    _id: string;
    image: string;
    title: string;
    subtitle?: string;
    badge?: string;
    buttonText?: string;
    buttonLink?: string;
    active: boolean;
    order: number;
}

interface Props {
    viewMode?: 'grid' | 'list';
}

const formatExternalImageUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    // Convert Google Drive view/open links to direct high-res image CDN format
    if (trimmed.includes('drive.google.com')) {
        const idMatch = trimmed.match(/(?:file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
    }
    return trimmed;
};

const HeroCarouselManager: React.FC<Props> = ({ viewMode = 'grid' }) => {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
    const [formData, setFormData] = useState<any>({
        title: '',
        subtitle: '',
        badge: '',
        buttonText: '',
        buttonLink: '',
        order: 0,
        active: true,
        image: ''
    });
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await api.get('/hero/slides');
            if (res.data.success) {
                setSlides(res.data.data);
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError('Failed to fetch carousel slides');
        } finally {
            setLoading(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setImageUrlInput(raw);
        const formatted = formatExternalImageUrl(raw);
        if (formatted) {
            setFormData((prev: any) => ({ ...prev, image: formatted }));
            setImagePreview(formatted);
            setImageFile(null);
            setError(null);
        } else if (!imageFile && !editingSlide) {
            setImagePreview(null);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setImageUrlInput('');
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        // Validate image: at least one image source must exist
        const hasImage = Boolean(imageFile || imageUrlInput.trim() || formData.image || editingSlide?.image);
        if (!hasImage) {
            setError('Please provide an image URL or upload an image file');
            setSubmitting(false);
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== undefined && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        if (imageUrlInput.trim()) {
            const formatted = formatExternalImageUrl(imageUrlInput);
            data.set('image', formatted);
        }

        if (imageFile) {
            data.append('image', imageFile);
            try {
                const base64: string = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
                data.append('imageBase64', base64);
            } catch (err) {
                console.error('Base64 conversion error', err);
            }
        }

        try {
            let res;
            if (editingSlide) {
                res = await api.put(`/hero/slides/${editingSlide._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post('/hero/slides', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (res.data.success) {
                setSuccess(editingSlide ? 'Slide updated successfully!' : 'Slide published successfully!');
                fetchSlides();
                setTimeout(() => {
                    setIsModalOpen(false);
                    resetForm();
                }, 1200);
            }
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.response?.data?.message || 'Failed to save slide.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingSlide(null);
        // Count / auto-determine next order
        const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order || 0)) + 1 : 0;
        setFormData({
            title: '',
            subtitle: '',
            badge: '',
            buttonText: '',
            buttonLink: '',
            order: nextOrder,
            active: true,
            image: ''
        });
        setImageFile(null);
        setImagePreview(null);
        setImageUrlInput('');
    };

    const openEdit = (slide: Slide) => {
        setEditingSlide(slide);
        setFormData({
            title: slide.title || '',
            subtitle: slide.subtitle || '',
            badge: slide.badge || '',
            buttonText: slide.buttonText || '',
            buttonLink: slide.buttonLink || '',
            order: slide.order !== undefined ? slide.order : 0,
            active: slide.active !== false,
            image: slide.image || ''
        });
        const isExternal = slide.image && (slide.image.startsWith('http://') || slide.image.startsWith('https://'));
        setImageUrlInput(isExternal ? slide.image : '');
        setImagePreview(getMediaUrl(slide.image));
        setImageFile(null);
        setIsModalOpen(true);
        setError(null);
        setSuccess(null);
    };

    const deleteSlide = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;
        try {
            await api.delete(`/hero/slides/${id}`);
            fetchSlides();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const moveSlide = async (id: string, direction: 'up' | 'down') => {
        const index = slides.findIndex(s => s._id === id);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === slides.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const currentSlide = slides[index];
        const targetSlide = slides[targetIndex];

        try {
            await api.put(`/hero/slides/${currentSlide._id}`, { order: targetSlide.order });
            await api.put(`/hero/slides/${targetSlide._id}`, { order: currentSlide.order });
            fetchSlides();
        } catch (err) {
            console.error('Reorder error:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hero Carousel Manager</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Full control over landing page visuals</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> ADD NEW SLIDE
                </button>
            </div>

            {error && !isModalOpen && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold animate-in slide-in-from-top-4">
                    <AlertCircle size={20} />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slides.map((slide) => (
                        <div key={slide._id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-100">
                                <img
                                    src={getMediaUrl(slide.image)}
                                    alt={slide.title || 'Slide'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Image+Load+Error')}
                                />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${slide.active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                        {slide.active ? 'ACTIVE' : 'DISABLED'}
                                    </span>
                                    {slide.badge && (
                                        <span className="px-3 py-1 bg-blue-600/90 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                                            {slide.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white px-2 py-0.5 rounded-md text-[9px] font-black">
                                    #{slide.order}
                                </div>
                            </div>
                            <h3 className="font-black text-slate-800 mb-1 line-clamp-1">{slide.title || '(No Title / Banner Only)'}</h3>
                            <p className="text-xs font-bold text-slate-400 mb-4 line-clamp-1">{slide.subtitle || 'Clean visual banner'}</p>

                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => moveSlide(slide._id, 'up')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600"><MoveUp size={16} /></button>
                                    <button onClick={() => moveSlide(slide._id, 'down')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600"><MoveDown size={16} /></button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEdit(slide)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Edit3 size={18} /></button>
                                    <button onClick={() => deleteSlide(slide._id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
                    <div className="overflow-x-auto rounded-3xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="p-4 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Image</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Badge</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Order</th>
                                    <th className="p-4 pr-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slides.map((slide) => (
                                    <tr key={slide._id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6 w-32">
                                            <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 w-24">
                                                <img
                                                    src={getMediaUrl(slide.image)}
                                                    alt={slide.title || 'Slide'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Error')}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <h3 className="font-black text-slate-800 text-sm mb-0.5 line-clamp-1">{slide.title || '(No Title / Banner Only)'}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{slide.subtitle || 'Clean visual banner'}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${slide.active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                                    {slide.active ? 'ACTIVE' : 'DISABLED'}
                                                </span>
                                                {slide.badge && (
                                                    <span className="px-2 py-0.5 bg-blue-600/90 text-white rounded-lg text-[8px] font-black uppercase tracking-widest line-clamp-1 max-w-[100px]">
                                                        {slide.badge}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-xs text-slate-600">
                                            #{slide.order}
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(slide)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Edit3 size={16} /></button>
                                                <button onClick={() => deleteSlide(slide._id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {slides.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-slate-400 font-bold text-sm">No slides available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{editingSlide ? 'EDIT SLIDE' : 'NEW SLIDE'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Hero Carousel Configuration</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-90"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            {error && (
                                <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold">
                                    <AlertCircle size={18} />
                                    <p className="text-xs">{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 font-bold">
                                    <Check size={18} />
                                    <p className="text-xs">{success}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Left Column: Text fields (ALL OPTIONAL) */}
                                <div className="space-y-3.5">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Title</label>
                                            <span className="text-[9px] font-bold text-slate-400 italic">Optional</span>
                                        </div>
                                        <input
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                                            placeholder="Leave empty if banner has text"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtitle</label>
                                            <span className="text-[9px] font-bold text-slate-400 italic">Optional</span>
                                        </div>
                                        <input
                                            value={formData.subtitle}
                                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                                            placeholder="Short text description (optional)"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Badge</label>
                                            <input
                                                value={formData.badge}
                                                onChange={e => setFormData({ ...formData, badge: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                                                placeholder="e.g. Official Gateway"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</label>
                                                <span className="text-[9px] font-bold text-blue-500">Auto #{formData.order}</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={formData.order}
                                                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Active toggle */}
                                    <div className="pt-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Status</label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, active: !formData.active })}
                                            className={`w-full py-3 rounded-2xl border text-[10px] font-black transition-all ${formData.active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                        >
                                            {formData.active ? '● SLIDE IS ENABLED' : '○ SLIDE IS DISABLED'}
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Visual Backdrop with URL & Upload */}
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                                <LinkIcon size={12} className="text-blue-500" /> Image URL (Drive / Blogger)
                                            </label>
                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">0% Storage</span>
                                        </div>
                                        <input
                                            value={imageUrlInput}
                                            onChange={handleUrlChange}
                                            placeholder="Paste Google Drive, Blogger, or Image URL..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white transition-all text-slate-700"
                                        />
                                    </div>

                                    <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                        — OR UPLOAD FILE —
                                    </div>

                                    <div
                                        onClick={() => document.getElementById('slide-image')?.click()}
                                        className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-50/20 transition-all overflow-hidden relative group"
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                className="w-full h-full object-cover"
                                                alt="Preview"
                                                onError={() => setError('Image link could not be loaded. Please verify the URL.')}
                                            />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Upload size={24} className="text-slate-400 mx-auto mb-1.5 group-hover:text-blue-500 transition-colors" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Click to Select File</p>
                                                <p className="text-[9px] text-slate-400 mt-0.5">JPG, PNG, WEBP</p>
                                            </div>
                                        )}
                                        <input type="file" id="slide-image" hidden onChange={handleImageChange} accept="image/*" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                                    {editingSlide ? 'UPDATE SLIDE DATA' : 'PUBLISH NEW SLIDE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroCarouselManager;
