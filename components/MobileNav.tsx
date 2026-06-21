
import React from 'react';
import { Home, Search, User, History, ShieldCheck } from 'lucide-react';

interface MobileNavProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onNavigate, currentView }) => {
  const navItems = [
    { name: 'Home', view: 'home', icon: Home },
    { name: 'Services', view: 'services', icon: Search },
    { name: 'About', view: 'about', icon: User },
    { name: 'Tracker', view: 'tracker', icon: History },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-100 dark:border-white/10 px-6 py-3 pb-8 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]" style={{ backgroundColor: 'var(--app-bg)' }}>
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => onNavigate(item.view)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 transform ${currentView === item.view ? 'text-brand scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:scale-105'
            }`}
        >
          <item.icon className={`w-6 h-6 transition-colors ${currentView === item.view ? 'fill-brand/10 text-brand dark:text-emerald-400' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
          {currentView === item.view && (
            <div className="w-1 h-1 bg-brand dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_0_8px_rgba(59,130,246,0.8)] dark:shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          )}
        </button>
      ))}
    </div>
  );
};
