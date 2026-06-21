import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Chatbot } from './components/Chatbot';
import { Home } from './src/pages/Home';
import { AllServices } from './src/pages/AllServices';
import { ApplyService } from './src/pages/ApplyService';
import { TrackApplication } from './src/pages/TrackApplication';
import { AboutUs } from './components/AboutUs';
import { ThemeColor, AboutContent, Enquiry, EnquiryStatus } from './types';
import { MessageCircle, MapPin, X } from 'lucide-react';
import { sendWhatsAppNotification, formatMessageFromTemplate } from './services/whatsappService';
import api from './src/api/axios';
import AdminLogin from './src/pages/admin/AdminLogin';
import AdminLayout from './src/pages/admin/AdminLayout';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    return (localStorage.getItem('mangolpuri_theme_color') as ThemeColor) || 'blue';
  });
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    title: 'Pawan Gautam',
    subtitle: 'Full-Stack Developer & Tech Innovator',
    description: 'I am a passionate developer and technology enthusiast dedicated to building high-quality, impactful digital solutions. With a strong foundation in modern web and mobile technologies, I help businesses and individuals achieve their goals through innovation and expertise.',
    experience: 'Over 12 Years of Professional Integrity',
    mission: 'To bridge the gap between community and technology through transparent, rapid, and authorized digital service delivery.',
    vision: 'To be Delhi\'s most trusted digital gateway, recognized for absolute security and unmatched community empowerment.',
    imageUrl: 'https://img.freepik.com/free-photo/handsome-young-man-with-new-hairstyle-wearing-blue-shirt-feeling-confident-isolated-white-background_176532-8097.jpg',
    isVisible: true
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.classList.remove("light", "dark");
    document.documentElement.classList.remove("light", "dark");

    if (darkMode) {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeColor);
    localStorage.setItem('mangolpuri_theme_color', themeColor);
  }, [themeColor]);

  useEffect(() => {
    const savedAbout = localStorage.getItem('mangolpuri_cms_about');
    if (savedAbout) setAboutContent(JSON.parse(savedAbout));
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed', err));
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);


  useEffect(() => {
    const savedAbout = localStorage.getItem('mangolpuri_cms_about');
    if (savedAbout) setAboutContent(JSON.parse(savedAbout));
  }, []);

  const handleSendEnquiry = async (data: Omit<Enquiry, 'id' | 'timestamp' | 'isRead' | 'status'>) => {
    try {
      await api.post('/inquiries', data).catch(err => {
        console.error("API Error", err);
        throw err;
      });
      return true;
    } catch (error) {
      console.error("Failed to send inquiry", error);
      return false;
    }
  };

  // Only simplified Admin login for "Command Authorization" modal if needed for legacy/other purposes, 
  // but actual Admin Dashboard has its own login.
  // We keep this solely if the footer "secret" copyright click is used.
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a "backdoor" or secondary auth from the footer.
    // We can redirect to /admin or handle it.
    // For now, let's redirect to /admin if creds match simplified check
    if ((loginForm.username === "8445221632" && loginForm.password === "Admin@2026") ||
      (loginForm.username === "Staff" && loginForm.password === "Staff@2026")) {
      setShowLoginModal(false);
      setLoginForm({ username: '', password: '' });
      navigate('/admin');
    } else {
      setLoginError('Authorization failed.');
    }
  }

  const handleNavigate = (view: string) => {
    if (view === 'home') navigate('/');
    else if (view === 'services') navigate('/services');
    else if (view === 'tracker') navigate('/track');
    else if (view === 'about') navigate('/about');
    else if (view === 'admin') navigate('/admin');
  };

  const isHiddenLayout = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen transition-colors duration-500 flex flex-col">
      {!isHiddenLayout && (
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          onNavigate={handleNavigate}
          currentView={location.pathname === '/' ? 'home' : location.pathname.replace('/', '')}
        />
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<AllServices />} />
          <Route path="/apply/:id" element={<ApplyService />} />
          <Route path="/track" element={<TrackApplication />} />
          <Route path="/about" element={<AboutUs content={aboutContent} onSendEnquiry={handleSendEnquiry} />} />
          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </main>

      {!isHiddenLayout && (
        <footer className="border-t border-slate-200 dark:border-white/5 py-8 px-8 pb-32 md:pb-8 transition-colors duration-500" style={{ backgroundColor: 'var(--section-bg)' }}>
          <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png" className="h-8 w-auto" alt="Digital India" />
                <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-white/10 mx-1" />
                <span className="font-black text-xl tracking-tighter leading-none" style={{ color: 'var(--text-primary)' }}>Digital Cyber Cafe</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-3 font-bold text-xs leading-relaxed">Official assistance for Aadhaar, PAN, Passport, and Academic documentation. Bridging the digital divide with security and speed.</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Connect</h4>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 font-bold text-xs hover:text-brand dark:hover:text-emerald-400 cursor-pointer transition-colors"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp Support</li>
                <li className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 font-bold text-xs hover:text-brand dark:hover:text-emerald-400 cursor-pointer transition-colors"><MapPin className="w-3.5 h-3.5" /> Find Our Hub</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Status</h4>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Servers Online</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-800/60 dark:text-emerald-400/60 leading-tight">Optimal processing throughput.</p>
              </div>
            </div>
          </div>
          <div className="max-w-[1500px] mx-auto mt-6 pt-4 border-t border-slate-200 dark:border-white/5 text-center">
            <span className="text-slate-400 font-bold text-[9px] tracking-tight flex items-center justify-center gap-1">
              <span className="copyright-glow cursor-default" onMouseDown={() => { longPressTimer.current = window.setTimeout(() => setShowLoginModal(true), 3000); }} onMouseUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}>©</span>
              {new Date().getFullYear()} Digital Cyber Cafe mangolpuri • Powered by SevaCore
            </span>
          </div>
        </footer>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-700">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-md shadow-2xl border border-slate-100 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-500">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"><X className="w-5 h-5 text-slate-300" /></button>
            <div className="flex flex-col items-center mb-8 text-center">
              <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png" className="h-14 w-auto mb-4" alt="Digital India" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Command Authorization</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Identity Verification Gateway</p>
            </div>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none outline-none font-black text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Role ID" />
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required className="w-full px-6 py-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none outline-none font-black text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="••••••••" />
              {loginError && <p className="text-red-600 text-[9px] font-black uppercase tracking-widest text-center">{loginError}</p>}
              <button type="submit" className="w-full py-4 rounded-xl bg-brand dark:bg-emerald-600 text-white font-black text-base hover:opacity-90 dark:hover:bg-emerald-700 shadow-xl transition-all active:scale-95 uppercase tracking-widest">Authorize Session</button>
            </form>
          </div>
        </div>
      )}

      {showInstallPrompt && (
        <div className="fixed bottom-24 md:bottom-4 left-0 right-0 p-4 z-[100] animate-in slide-in-from-bottom-full duration-500">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-sm mx-auto">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-brand text-white rounded-xl flex flex-col items-center justify-center font-black leading-none shrink-0 shadow-md">
                <span className="text-[10px]">DCC</span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                Install Digital Cyber Cafe on your device?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto w-full md:w-auto justify-end">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="px-4 py-2 rounded-lg text-slate-500 text-[10px] font-bold uppercase tracking-wide hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowInstallPrompt(false);
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                      setDeferredPrompt(null);
                    }
                  }
                }}
                className="px-4 py-2 rounded-lg bg-brand text-white text-[10px] font-bold uppercase tracking-wide hover:opacity-90 transition-opacity shadow-sm"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {!isHiddenLayout && <Chatbot applications={[]} />} {/* Chatbot needs updated legacy apps? Passing empty for now to avoid complexity or update Chatbot later */}
      {!isHiddenLayout && (
        <MobileNav
          currentView={location.pathname === '/' ? 'home' : location.pathname.replace('/', '')}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default App;