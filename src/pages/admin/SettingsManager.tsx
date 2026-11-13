import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

const labelCls = 'text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5';
const inputCls = 'w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold outline-none focus:border-blue-400 transition-colors';

const SettingsManager: React.FC = () => {
    const [form, setForm] = useState({
        siteName: '', contactNumber: '', whatsapp: '', email: '',
        address: '', slogan: '', footerText: '', instagramUrl: '', facebookUrl: '',
        threadsUrl: '', twitterUrl: '', youtubeUrl: '', googleMapsUrl: '',
        upiId: '8445221632@upi', upiPayeeName: 'Digital Cyber Cafe'
    });
    const [profileForm, setProfileForm] = useState({
        name: '', email: '', mobile: '', currentPassword: '', newPassword: '', newRecoveryPin: '', avatar: ''
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
                    setForm(sRes.data.data);
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
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [isSuperAdmin]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setSaved(false);
        try {
            await api.put('/settings', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { alert('Failed to save settings'); }
        finally { setSaving(false); }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setProfileSaving(true); setProfileSaved(false);
        try {
            const res = await api.put('/auth/profile', profileForm);
            setProfileSaved(true);
            setProfileForm(p => ({ ...p, currentPassword: '', newPassword: '', newRecoveryPin: '' }));
            if (res.data?.hasRecoveryPin !== undefined) setHasRecoveryPin(Boolean(res.data.hasRecoveryPin));

            // Sync new name/role/avatar to localStorage so the header can pick it up
            if (res.data) {
                localStorage.setItem('mangolpuri_admin_email', res.data.email);
                if (res.data.avatar) localStorage.setItem('mangolpuri_admin_avatar', res.data.avatar);
                window.location.reload(); // Refresh to apply changes across app
            } else {
                setTimeout(() => setProfileSaved(false), 3000);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update profile');
        }
        finally { setProfileSaving(false); }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteSaving(true);
        setInviteSavedMsg('');
        try {
            const res = await api.put('/admin/security-config', inviteForm);
            setHasInviteCode(Boolean(res.data?.hasInviteCode));
            setInviteForm({ inviteCode: '', currentPassword: '' });
            setInviteSavedMsg(res.data?.message || 'Security Invite Code updated!');
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
        const formData = new FormData();
        formData.append('avatar', file);

        setUploadingAvatar(true);
        try {
            // Note: Since auth logic dictates avatar routes, we'll use the proper route per backend layout
            // From adminController.js, the update avatar route is POST /api/admin/upload-avatar
            const res = await api.post('/admin/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success && res.data.avatar) {
                setProfileForm(p => ({ ...p, avatar: res.data.avatar }));
                localStorage.setItem('mangolpuri_admin_avatar', res.data.avatar);
                // Also sync avatar to the public About page so it reflects on main website
                try {
                    await api.put('/about', { imageUrl: res.data.avatar });
                } catch (_) { /* ignore if about update fails */ }
                window.location.reload();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
        }
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
            {/* ── LEFT COL: Profile & Logout ── */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden border-b-4 border-b-blue-600/10">
                    <div className="p-8 text-center flex flex-col items-center">
                        <div className="relative mb-4 group">
                            <img src={profileForm.avatar || `https://ui-avatars.com/api/?name=${profileForm.name || 'Admin'}&background=eff6ff&color=2563eb`} className="w-24 h-24 rounded-3xl object-cover ring-8 ring-slate-50" />
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
                                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all disabled:opacity-50"
                            >
                                {uploadingAvatar ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                )}
                            </button>
                        </div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{profileForm.name}</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Super Administrator</p>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="p-6 pt-0 space-y-4">
                        <div>
                            <label className={labelCls}>Display Name</label>
                            <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Login ID / Email</label>
                            <input value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                        </div>
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
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">6-Digit Recovery PIN</label>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${hasRecoveryPin ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {hasRecoveryPin ? 'PIN Active' : 'Not Set'}
                                </span>
                            </div>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={profileForm.newRecoveryPin}
                                onChange={e => setProfileForm(p => ({ ...p, newRecoveryPin: e.target.value.replace(/[^0-9]/g, '') }))}
                                placeholder={hasRecoveryPin ? 'Enter 6 digits to change PIN' : 'Set 6-digit PIN for Forgot Password'}
                                className={inputCls}
                            />
                        </div>
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
                                placeholder="Required for email/mobile/PIN/password"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>New Password (Optional)</label>
                            <input type="password" value={profileForm.newPassword} onChange={e => setProfileForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 8 chars (letters + numbers)" className={inputCls} />
                        </div>
                        <button type="submit" disabled={profileSaving} className="w-full py-3.5 bg-slate-800 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50">
                            {profileSaving ? 'Updating...' : 'Update Credentials'}
                        </button>
                        {profileSaved && <p className="text-[10px] font-black text-emerald-500 text-center uppercase tracking-widest">Profile Synced!</p>}
                    </form>
                </div>

                {isSuperAdmin && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 border-b-4 border-b-emerald-500/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Team Sign-Up Security Code</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Required to register new staff accounts</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${hasInviteCode ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                {hasInviteCode ? 'Configured' : 'Not Set'}
                            </span>
                        </div>
                        <form onSubmit={handleInviteSubmit} className="space-y-3">
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
                            <button type="submit" disabled={inviteSaving} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50">
                                {inviteSaving ? 'Saving...' : hasInviteCode ? 'Update Security Code' : 'Activate Security Code'}
                            </button>
                            {inviteSavedMsg && <p className="text-[10px] font-black text-emerald-600 text-center uppercase tracking-wider">{inviteSavedMsg}</p>}
                        </form>
                    </div>
                )}

                <button onClick={() => { localStorage.clear(); window.location.href = '/admin'; }} className="w-full p-5 bg-red-50 hover:bg-red-100 text-red-500 rounded-3xl flex items-center justify-between group transition-all">
                    <span className="font-black text-sm uppercase tracking-widest">Logout Admin</span>
                    <svg className="group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                </button>
            </div>

            {/* ── RIGHT COL: Website Settings ── */}
            <div className="lg:col-span-8">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Branding */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 border-b-4 border-b-blue-500/10">
                        <div className="flex items-center gap-3 pb-2">
                            <span className="w-1.5 h-5 bg-blue-600 rounded-full" />
                            <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Enterprise Branding</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Platform Name" field="siteName" placeholder="Digital Cyber Cafe" />
                            <Field label="Brand Slogan" field="slogan" />
                        </div>
                        <div>
                            <label className={labelCls}>Platform Footer Notice</label>
                            <textarea value={form.footerText || ''} onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))} className={`${inputCls} h-20 resize-none`} />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 border-b-4 border-b-emerald-500/10">
                        <div className="flex items-center gap-3 pb-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Communication Channels</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Primary Phone" field="contactNumber" />
                            <Field label="WhatsApp Help" field="whatsapp" />
                        </div>
                        <Field label="Support Email" field="email" type="email" />
                        <Field label="Physical HQ Address" field="address" />
                        <Field label="Google Maps Location URL (Find Our Hub)" field="googleMapsUrl" type="url" placeholder="https://maps.google.com/?q=..." />
                    </div>

                    {/* UPI & Payment Settings */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 border-b-4 border-b-purple-500/10">
                        <div className="flex items-center gap-3 pb-2">
                            <span className="w-1.5 h-5 bg-purple-600 rounded-full" />
                            <div>
                                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Direct UPI Payment Gateway</h3>
                                <p className="text-[11px] font-bold text-slate-400">0% Commission, Direct Bank Account QR Code Settings</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Business UPI ID (VPA)" field="upiId" placeholder="e.g. 8445221632@upi" />
                            <Field label="Payee Merchant Name" field="upiPayeeName" placeholder="Digital Cyber Cafe" />
                        </div>
                        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 text-xs font-medium">
                            💡 Customers scanning the QR code or clicking "Pay via UPI" will automatically pay the exact dynamic service fee directly to this UPI ID without any gateway charges.
                        </div>
                    </div>

                    {/* Socials */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 border-b-4 border-b-amber-500/10">
                        <div className="flex items-center gap-3 pb-2">
                            <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                            <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Social Presence</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Field label="Instagram URL" field="instagramUrl" type="url" placeholder="https://instagram.com/..." />
                            <Field label="Facebook Page" field="facebookUrl" type="url" placeholder="https://facebook.com/..." />
                            <Field label="Threads Profile" field="threadsUrl" type="url" placeholder="https://threads.net/@..." />
                            <Field label="X / Twitter Profile" field="twitterUrl" type="url" placeholder="https://x.com/..." />
                            <Field label="YouTube Channel (Right of WhatsApp)" field="youtubeUrl" type="url" placeholder="https://youtube.com/@..." />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-blue-50">
                        <button type="submit" disabled={saving} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all">
                            {saving ? 'Syncing...' : 'Save All Modifications'}
                        </button>
                        {saved && <span className="text-emerald-500 font-black text-xs uppercase tracking-widest animate-pulse">Changes Live!</span>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsManager;
