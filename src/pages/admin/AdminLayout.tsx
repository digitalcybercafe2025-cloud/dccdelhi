import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Sun, Moon, Bell, LogOut, Search, User, Settings, LayoutGrid, ClipboardList, Star, CreditCard, List } from 'lucide-react';
import Dashboard from './Dashboard';
import ApplicationsManager from './ApplicationsManager';
import ServicesManager from './ServicesManager';
import PaymentsManager from './PaymentsManager';
import EnquiriesManager from './EnquiriesManager';
import TestimonialsManager from './TestimonialsManager';
import SettingsManager from './SettingsManager';
import DocumentsManager from './DocumentsManager';
import HeroCarouselManager from './HeroCarouselManager';
import LiveNoticesManager from './LiveNoticesManager';
import AboutMeManager from './AboutMeManager';
import NotificationsManager from './NotificationsManager';
import api from '../../api/axios';

const NAV_ITEMS = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/admin/services', label: 'Services', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { path: '/admin/applications', label: 'Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/admin/documents', label: 'Documents', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { path: '/admin/about-me', label: 'About Me', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { path: '/admin/testimonials', label: 'Testimonials', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { path: '/admin/payments', label: 'Payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { path: '/admin/hero-carousel', label: 'Hero Carousel', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/admin/live-notices', label: 'Live Notices', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { path: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

// ── SVG Icon Helper ──────────────────────────────────────────────────────────
const Icon: React.FC<{ d: string; size?: number; className?: string }> = ({ d, size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${className}`}>
        <path d={d} />
    </svg>
);

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [adminDarkMode, setAdminDarkMode] = useState(() => localStorage.getItem('mangolpuri_admin_theme') === 'dark');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('mangolpuri_admin_sidebar') === 'collapsed');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('mangolpuri_admin_view_mode') as 'grid' | 'list') || 'list');
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unread');
            setUnreadCount(res.data.data);
        } catch (error) {
            console.error('Failed to fetch unread count');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('mangolpuri_admin_token');
        if (token) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('mangolpuri_admin_sidebar', sidebarCollapsed ? 'collapsed' : 'expanded');
    }, [sidebarCollapsed]);

    useEffect(() => {
        localStorage.setItem('mangolpuri_admin_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        if (adminDarkMode) {
            document.body.classList.add('admin-dark-mode');
            localStorage.setItem('mangolpuri_admin_theme', 'dark');
        } else {
            document.body.classList.remove('admin-dark-mode');
            localStorage.setItem('mangolpuri_admin_theme', 'light');
        }
    }, [adminDarkMode]);

    const token = localStorage.getItem('mangolpuri_admin_token');
    const adminRole = localStorage.getItem('mangolpuri_admin_role') || 'Admin';
    const adminEmail = localStorage.getItem('mangolpuri_admin_email') || 'admin@dcc.in';
    const adminAvatar = localStorage.getItem('mangolpuri_admin_avatar');
    const adminName = adminEmail.split('@')[0].charAt(0).toUpperCase() + adminEmail.split('@')[0].slice(1);

    useEffect(() => {
        if (!token) navigate('/admin', { replace: true });
    }, [token, navigate]);

    useEffect(() => {
        if (token && location.pathname === '/admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [token, location.pathname, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('mangolpuri_admin_token');
        localStorage.removeItem('mangolpuri_admin_role');
        localStorage.removeItem('mangolpuri_admin_email');
        navigate('/admin', { replace: true });
    };

    if (!token) return null;

    const currentPage = location.pathname.split('/')[2] || 'dashboard';

    // ── Sidebar ───────────────────────────────────────────────────────────────
    const Sidebar = () => (
        <aside className={`bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 z-40 shadow-sm transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-44'}`}>
            {/* Logo Area */}
            <div className={`px-4 py-5 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-2'} border-b border-slate-100 overflow-hidden`}>
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                    title="Toggle Sidebar"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                </button>
                {!sidebarCollapsed && <span className="text-xs font-black text-slate-800 whitespace-nowrap">Menu</span>}
            </div>

            {/* Nav */}
            <nav className={`flex-1 ${sidebarCollapsed ? 'py-4 px-2' : 'py-4 px-3'} space-y-0.5 overflow-y-auto overflow-x-hidden`}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 py-2.5 rounded-lg transition-all text-sm font-semibold ${isActive
                                ? 'bg-blue-50 text-blue-700 border-blue-600'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent'
                            } ${sidebarCollapsed ? 'justify-center px-0 flex-col gap-1 border-b-[3px] rounded-b-none' : 'px-3 border-l-[3px] rounded-l-none'}`
                        }
                        title={sidebarCollapsed ? item.label : undefined}
                    >
                        <Icon d={item.icon} size={16} />
                        {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Footer copyright */}
            <div className="px-4 py-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium">© 2024 Digital Cyber Cafe</p>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <div className="relative z-50"><Sidebar /></div>
                </div>
            )}

            {/* Main */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-44'}`}>
                {/* ── TOP NAVBAR (matches screenshot) ── */}
                <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
                    {/* Left: Mobile burger + Logo Text */}
                    <div className="flex items-center gap-3">
                        <button className="md:hidden p-1.5 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(!mobileOpen)}>
                            <Icon d="M4 6h16M4 12h16M4 18h16" size={20} className="text-slate-600" />
                        </button>
                        {/* Logo + Name */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-baseline gap-2">
                                <span className="font-black text-slate-800 text-base leading-none hidden sm:block">Digital Cyber Cafe</span>
                                <span className="text-xs text-slate-400 font-semibold hidden sm:block">
                                    Admin | <span className="text-blue-600 font-bold capitalize">{adminName}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Icons + Admin + Logout */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setAdminDarkMode(!adminDarkMode)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-all active:scale-90"
                        >
                            {adminDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                        </button>
                        {/* Messages icon replaced by Grid/List view toggle */}
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors"
                            title={viewMode === 'grid' ? "Switch to List View" : "Switch to Grid View"}
                        >
                            {viewMode === 'grid' ? <List className="w-[17px] h-[17px]" /> : <LayoutGrid className="w-[17px] h-[17px]" />}
                        </button>
                        {/* Notification bell */}
                        <button
                            onClick={() => navigate('/admin/notifications')}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 relative transition-colors"
                        >
                            <Bell className="w-[17px] h-[17px]" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-red-500 rounded-full border border-white text-[8px] font-black text-white flex items-center justify-center leading-none">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        {/* Admin Avatar Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                onBlur={() => setTimeout(() => setProfileDropdownOpen(false), 200)}
                                className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-black overflow-hidden shadow-inner ring-2 ring-white">
                                    {adminAvatar ? (
                                        <img src={adminAvatar.startsWith('/') ? `http://127.0.0.1:5000${adminAvatar}` : adminAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        adminName.slice(0, 2).toUpperCase()
                                    )}
                                </div>
                            </button>

                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                                        <p className="text-sm font-black text-slate-800 capitalize truncate">{adminName}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">{adminRole}</p>
                                    </div>
                                    <button onClick={() => navigate('/admin/settings')} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2.5">
                                        <User size={14} className="opacity-70" /> View Profile
                                    </button>
                                    <button onClick={() => navigate('/admin/settings')} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2.5">
                                        <Settings size={14} className="opacity-70" /> Update Profile
                                    </button>
                                    <button onClick={() => navigate('/admin/settings')} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2.5">
                                        <LayoutGrid size={14} className="opacity-70" /> Change Password
                                    </button>
                                    <div className="border-t border-slate-50 my-1" />
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5">
                                        <LogOut size={14} className="opacity-70" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-5">
                    <Routes>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="applications" element={<ApplicationsManager />} />
                        <Route path="services" element={<ServicesManager />} />
                        <Route path="documents" element={<DocumentsManager viewMode={viewMode} />} />
                        <Route path="payments" element={<PaymentsManager />} />
                        <Route path="enquiries" element={<EnquiriesManager />} />
                        <Route path="testimonials" element={<TestimonialsManager />} />
                        <Route path="about-me" element={<AboutMeManager />} />
                        <Route path="hero-carousel" element={<HeroCarouselManager viewMode={viewMode} />} />
                        <Route path="live-notices" element={<LiveNoticesManager />} />
                        <Route path="notifications" element={<NotificationsManager />} />
                        <Route path="settings" element={<SettingsManager />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
