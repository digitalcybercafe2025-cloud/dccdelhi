import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Eye, EyeOff, Lock, Smartphone, User, Mail, KeyRound,
    ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, ArrowRight
} from 'lucide-react';
import api from '../../api/axios';

type AuthMode = 'login' | 'signup' | 'forgot';

const inputBaseCls =
    'w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-semibold text-sm outline-none focus:bg-white focus:border-[#003380] focus:ring-4 focus:ring-blue-500/10 transition-all [&:-webkit-autofill]:shadow-[0_0_0_100px_#f8fafc_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]';

const labelCls = 'text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Login state
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Signup state (No OTP required; requires Mobile + 6-digit Recovery PIN + Security Invite Code)
    const [signupForm, setSignupForm] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        recoveryPin: '',
        securityCode: ''
    });
    const [showSignupPwd, setShowSignupPwd] = useState(false);

    // Forgot Password state (Step 1: Mobile + 6-digit PIN -> Step 2: New Password)
    const [forgotStep, setForgotStep] = useState<1 | 2>(1);
    const [forgotMobile, setForgotMobile] = useState('');
    const [forgotPin, setForgotPin] = useState('');
    const [showForgotPin, setShowForgotPin] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [verifiedAccountName, setVerifiedAccountName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPwd, setShowNewPwd] = useState(false);

    const switchMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        setError('');
        setSuccessMsg('');
        if (nextMode === 'forgot') {
            setForgotStep(1);
            setForgotPin('');
            setNewPassword('');
            setConfirmPassword('');
            setResetToken('');
        }
    };

    const persistSessionAndRedirect = (data: any) => {
        localStorage.setItem('mangolpuri_admin_token', data.token);
        localStorage.setItem('mangolpuri_admin_role', data.role || 'admin');
        localStorage.setItem('mangolpuri_admin_email', data.email || data.mobile || '');
        if (data.avatar) {
            localStorage.setItem('mangolpuri_admin_avatar', data.avatar);
        } else {
            localStorage.removeItem('mangolpuri_admin_avatar');
        }
        navigate('/admin/dashboard', { replace: true });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            const res = await api.post('/admin/login', {
                identifier: identifier.trim(),
                password
            });
            persistSessionAndRedirect(res.data);
        } catch (err: any) {
            if (!err?.response) {
                setError('Server is waking up or unreachable. Please wait 20 seconds and try again.');
            } else {
                setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!/^[6-9]\d{9}$/.test(signupForm.mobile.trim())) {
            setError('Please enter a valid 10-digit Indian mobile number.');
            return;
        }
        if (signupForm.password.length < 8 || !/[A-Za-z]/.test(signupForm.password) || !/\d/.test(signupForm.password)) {
            setError('Password must be at least 8 characters with both letters and numbers.');
            return;
        }
        if (!/^\d{6}$/.test(signupForm.recoveryPin.trim())) {
            setError('Secret Recovery PIN must be exact 6 numeric digits.');
            return;
        }
        if (!signupForm.securityCode.trim()) {
            setError('Security Invite Code is required to register.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/admin/signup', {
                name: signupForm.name.trim(),
                mobile: signupForm.mobile.trim(),
                email: signupForm.email.trim(),
                password: signupForm.password,
                recoveryPin: signupForm.recoveryPin.trim(),
                securityCode: signupForm.securityCode.trim()
            });
            persistSessionAndRedirect(res.data);
        } catch (err: any) {
            if (!err?.response) {
                setError('Server is waking up or unreachable. Please wait 20 seconds and try again.');
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please check your details.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyRecoveryPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!/^\d{10}$/.test(forgotMobile.trim())) {
            setError('Enter your registered 10-digit mobile number.');
            return;
        }
        if (!/^\d{6}$/.test(forgotPin.trim())) {
            setError('Enter your 6-digit Secret Recovery PIN.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/admin/forgot-password/verify', {
                mobile: forgotMobile.trim(),
                recoveryPin: forgotPin.trim()
            });
            if (res.data?.resetToken) {
                setResetToken(res.data.resetToken);
                setVerifiedAccountName(res.data.accountName || 'Admin');
                setForgotStep(2);
            }
        } catch (err: any) {
            if (!err?.response) {
                setError('Server is waking up or unreachable. Please try again.');
            } else {
                setError(err.response?.data?.message || 'Verification failed. Check Mobile and PIN.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
            setError('New password must be at least 8 characters with both letters and numbers.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please re-enter carefully.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/admin/forgot-password/reset', {
                resetToken,
                newPassword
            });
            setSuccessMsg(res.data?.message || 'Password updated successfully! Please sign in.');
            setIdentifier(forgotMobile.trim());
            setPassword('');
            setTimeout(() => {
                setMode('login');
                setForgotStep(1);
                setError('');
            }, 1600);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Please restart recovery.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_24px_60px_-15px_rgba(15,23,42,0.16)] border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">

                {/* ── LEFT BRAND & SECURITY PANEL (Desktop) ── */}
                <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#002154] via-[#003380] to-[#0b1933] text-white p-9 flex-col justify-between relative overflow-hidden">
                    {/* Subtle geometric background accents */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                <span className="font-black text-lg tracking-tight text-white">D</span>
                            </div>
                            <div>
                                <h2 className="font-black text-base tracking-tight leading-none">Digital Cyber Cafe</h2>
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.18em] mt-1">
                                    Admin Command Portal
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-4">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Strict Security Active
                        </div>

                        <h1 className="text-2xl font-black tracking-tight leading-snug mb-3">
                            {mode === 'login' && 'Welcome back to your Seva Desk.'}
                            {mode === 'signup' && 'Create an Authorized Staff Account.'}
                            {mode === 'forgot' && 'Secure Account Password Recovery.'}
                        </h1>
                        <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                            {mode === 'login' && 'Sign in using your registered mobile number or Admin ID to manage applications, documents, services, and payments.'}
                            {mode === 'signup' && 'Register with your mobile number and Cafe Security Code. Set a 6-digit Recovery PIN for future password resets.'}
                            {mode === 'forgot' && 'Verify your registered mobile number along with your 6-digit Secret Recovery PIN to safely set a new password.'}
                        </p>
                    </div>

                    <div className="relative z-10 space-y-3 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3 text-xs text-blue-100/90">
                            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                <Lock className="w-3.5 h-3.5 text-emerald-300" />
                            </div>
                            <span>Encrypted JWT & Bcrypt credential protection</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-blue-100/90">
                            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                            </div>
                            <span>Brute-force lockout after 5 wrong attempts</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-blue-100/90">
                            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                            </div>
                            <span>Mangolpuri, Delhi • Official Seva Gateway</span>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT FORM PANEL ── */}
                <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between bg-white">
                    <div>
                        {/* Mobile Compact Brand Header */}
                        <div className="flex items-center justify-between mb-6 lg:hidden">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#003380] flex items-center justify-center text-white font-black text-base shadow-sm">
                                    D
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-sm leading-none">Digital Cyber Cafe</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Admin Portal</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" /> Secured
                            </span>
                        </div>

                        {/* Top Segmented Tabs for Sign In / Sign Up */}
                        {mode !== 'forgot' ? (
                            <div className="bg-slate-100 p-1 rounded-2xl grid grid-cols-2 gap-1 mb-6">
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                        mode === 'login'
                                            ? 'bg-white text-[#003380] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMode('signup')}
                                    className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                        mode === 'signup'
                                            ? 'bg-white text-[#003380] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Create Account
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#003380] transition-colors cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to Sign In
                                </button>
                                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#003380] text-[10px] font-extrabold uppercase tracking-wider">
                                    Step {forgotStep} of 2
                                </span>
                            </div>
                        )}

                        {/* Alerts */}
                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2 animate-in fade-in duration-200">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                                <span>{error}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-start gap-2 animate-in fade-in duration-200">
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {/* ── SIGN IN FORM ── */}
                        {mode === 'login' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Sign In to Admin Panel</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Enter your registered Mobile Number, Admin ID, or Email
                                    </p>
                                </div>

                                <div>
                                    <label className={labelCls}>Mobile Number / Admin ID</label>
                                    <div className="relative">
                                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={e => setIdentifier(e.target.value)}
                                            required
                                            autoComplete="username"
                                            placeholder="e.g. 9911423881"
                                            className={inputBaseCls}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => switchMode('forgot')}
                                            className="text-[11px] font-bold text-[#003380] hover:underline cursor-pointer"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            className={`${inputBaseCls} pr-11`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-[#003380] hover:bg-[#00255c] text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-blue-900/15 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
                                >
                                    {loading ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    ) : (
                                        <>
                                            <span>Authorize & Sign In</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ── SIGN UP FORM (No OTP, with Mobile + 6-Digit Recovery PIN + Security Invite Code) ── */}
                        {mode === 'signup' && (
                            <form onSubmit={handleSignup} className="space-y-3.5">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Register Staff Account</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        No OTP required at signup — Security Invite Code required
                                    </p>
                                </div>

                                <div>
                                    <label className={labelCls}>Full Name *</label>
                                    <div className="relative">
                                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={signupForm.name}
                                            onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                                            required
                                            placeholder="e.g. Rahul Sharma"
                                            className={inputBaseCls}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Mobile Number (10 Digits) *</label>
                                        <div className="relative">
                                            <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                value={signupForm.mobile}
                                                onChange={e => setSignupForm(f => ({ ...f, mobile: e.target.value.replace(/[^0-9]/g, '') }))}
                                                required
                                                placeholder="10-digit mobile"
                                                className={inputBaseCls}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Email (Optional)</label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="email"
                                                value={signupForm.email}
                                                onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                                                placeholder="Optional email"
                                                className={inputBaseCls}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>Create Strong Password *</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type={showSignupPwd ? 'text' : 'password'}
                                            value={signupForm.password}
                                            onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                                            required
                                            placeholder="Min 8 chars (letters + numbers)"
                                            className={`${inputBaseCls} pr-11`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSignupPwd(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                                        >
                                            {showSignupPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>6-Digit Recovery PIN *</label>
                                        <div className="relative">
                                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={signupForm.recoveryPin}
                                                onChange={e => setSignupForm(f => ({ ...f, recoveryPin: e.target.value.replace(/[^0-9]/g, '') }))}
                                                required
                                                placeholder="6-digit secret PIN"
                                                className={inputBaseCls}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Forgot password ke liye yaad rakhein</p>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Security Invite Code *</label>
                                        <div className="relative">
                                            <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="password"
                                                value={signupForm.securityCode}
                                                onChange={e => setSignupForm(f => ({ ...f, securityCode: e.target.value }))}
                                                required
                                                placeholder="Admin Security Code"
                                                className={inputBaseCls}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Admin Settings se set hota hai</p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-[#003380] hover:bg-[#00255c] text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-blue-900/15 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-1"
                                >
                                    {loading ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    ) : (
                                        <>
                                            <span>Create Verified Account</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ── FORGOT PASSWORD (Step 1: Mobile + 6-digit PIN | Step 2: New Password) ── */}
                        {mode === 'forgot' && (
                            <>
                                {forgotStep === 1 ? (
                                    <form onSubmit={handleVerifyRecoveryPin} className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Reset Password via Mobile & PIN</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                Enter your registered Mobile Number and 6-digit Secret Recovery PIN
                                            </p>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Registered Mobile Number</label>
                                            <div className="relative">
                                                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="tel"
                                                    maxLength={10}
                                                    value={forgotMobile}
                                                    onChange={e => setForgotMobile(e.target.value.replace(/[^0-9]/g, ''))}
                                                    required
                                                    placeholder="10-digit registered mobile"
                                                    className={inputBaseCls}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>6-Digit Secret Recovery PIN</label>
                                            <div className="relative">
                                                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type={showForgotPin ? 'text' : 'password'}
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={forgotPin}
                                                    onChange={e => setForgotPin(e.target.value.replace(/[^0-9]/g, ''))}
                                                    required
                                                    placeholder="••••••"
                                                    className={`${inputBaseCls} pr-11 tracking-widest`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotPin(p => !p)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                                                >
                                                    {showForgotPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                                Strict security: 5 galat attempts par recovery 15 min ke liye lock ho jayegi.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-xl bg-[#003380] hover:bg-[#00255c] text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-blue-900/15 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {loading ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            ) : (
                                                <>
                                                    <span>Verify Identity</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-2 border border-emerald-200">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Identity Verified • {verifiedAccountName} ({forgotMobile})
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Set Your New Password</h3>
                                        </div>

                                        <div>
                                            <label className={labelCls}>New Password</label>
                                            <div className="relative">
                                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type={showNewPwd ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    required
                                                    placeholder="Min 8 chars (letters + numbers)"
                                                    className={`${inputBaseCls} pr-11`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPwd(p => !p)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                                                >
                                                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Confirm New Password</label>
                                            <div className="relative">
                                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    required
                                                    placeholder="Re-enter new password"
                                                    className={inputBaseCls}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/15 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {loading ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span>Save New Password</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <Link to="/" className="hover:text-[#003380] transition-colors">
                            ← Back to Public Website
                        </Link>
                        <span>Protected Admin Access</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
