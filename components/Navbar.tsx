
import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Search, Monitor, History, User, ShieldCheck, Landmark, CheckCircle } from 'lucide-react';

import { ThemeColor } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode, themeColor, setThemeColor, onNavigate, currentView }) => {
  const navItems = [
    { name: 'Home', view: 'home', icon: Monitor },
    { name: 'Services', view: 'services', icon: Search },
    { name: 'About Us', view: 'about', icon: User },
    { name: 'Tracker', view: 'tracker', icon: History },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-nav px-4 md:px-8 py-4 transition-all duration-500">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between">
        <div
          className="flex items-center gap-3 md:gap-4 cursor-pointer group"
          onClick={() => onNavigate('home')}
        >
          <div className="relative">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-brand flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg group-hover:scale-105 transition-transform duration-500">
              D
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm verified-badge-glow">
              <ShieldCheck className="w-2 md:w-2.5 h-2 md:h-2.5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg md:text-2xl tracking-tighter leading-none" style={{ color: 'var(--text-primary)' }}>
              Digital Cyber Cafe
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Official Seva Gateway</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8 lg:gap-12">
          {/* Desktop Nav - Right Aligned */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`relative group font-bold text-sm tracking-tight transition-all py-2 ${currentView === item.view
                    ? 'text-brand'
                    : 'text-slate-500 hover:text-brand'
                  }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-brand rounded-full transition-all duration-500 ${currentView === item.view ? 'opacity-100' : 'opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-100'}`} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4 border-l border-slate-200 dark:border-white/10 pl-4 md:pl-8">
            <ThemeToggle
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              themeColor={themeColor}
              setThemeColor={setThemeColor}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
