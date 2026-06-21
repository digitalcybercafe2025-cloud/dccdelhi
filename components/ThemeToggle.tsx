
import React from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { ThemeColor } from '../types';

interface ThemeToggleProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, setDarkMode, themeColor, setThemeColor }) => {
  const colors: { id: ThemeColor; class: string }[] = [
    { id: 'blue', class: 'bg-[#003380]' },
    { id: 'green', class: 'bg-[#059669]' },
    { id: 'red', class: 'bg-[#be123c]' },
    { id: 'orange', class: 'bg-[#c2410c]' },
  ];

  return (
    <div className="flex items-center gap-4">
      {/* Theme Color Selector */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => setThemeColor(color.id)}
            className={`w-5 h-5 rounded-full transition-all duration-300 ${color.class} ${
              themeColor === color.id 
                ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' 
                : 'opacity-40 hover:opacity-100 hover:scale-110'
            }`}
            title={`Switch to ${color.id} theme`}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="group relative p-3 rounded-2xl transition-all duration-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 active:scale-90 overflow-hidden"
        aria-label="Toggle Theme"
      >
        <div className="relative z-10">
          {darkMode ? (
            <Sun className="w-6 h-6 text-orange-400 group-hover:rotate-45 transition-transform duration-500" />
          ) : (
            <Moon className="w-6 h-6 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
};
