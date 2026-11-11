
import React from 'react';
import { Service } from '../types';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { getMediaUrl } from '../src/api/axios';

interface ServiceCardProps {
  service: Service;
  onApply: (service: Service) => void;
}

// Button colors exactly matching reference (blue, green, orange, dark-red/purple)
const BTN_COLORS: Record<string, string> = {
  blue: 'bg-[#1e40af] hover:bg-[#1e3a8a]',
  green: 'bg-[#059669] hover:bg-[#047857]',
  orange: 'bg-[#ea580c] hover:bg-[#c2410c]',
  red: 'bg-[#9f1239] hover:bg-[#881337]',
  purple: 'bg-[#6d28d9] hover:bg-[#5b21b6]',
};

// Badge dot colors per category/color
const DOT_COLORS: Record<string, string> = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
  red: 'bg-rose-500',
  purple: 'bg-violet-500',
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onApply }) => {
  const btnColor = BTN_COLORS[service.color] ?? BTN_COLORS.blue;
  const dotColor = DOT_COLORS[service.color] ?? DOT_COLORS.blue;

  const handleClick = () => {
    if (service.externalLink) {
      window.open(service.externalLink, '_blank', 'noopener,noreferrer');
    } else {
      onApply(service);
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.13)] transition-shadow duration-300 flex flex-col border border-slate-100 dark:border-white/5">

      {/* ── Top Image ── */}
      <div className="relative h-28 md:h-40 p-1 md:p-2 overflow-hidden shrink-0">
        <img
          src={getMediaUrl(service.image)}
          alt={service.title}
          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
          onError={e => (e.currentTarget.src = 'https://placehold.co/400x200/f8fafc/94a3b8?text=Load+Error')}
        />
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            {service.category}
          </span>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="px-2 pt-2 pb-2 md:px-4 md:pt-3 md:pb-4 flex flex-col flex-1">

        {/* Title + golden shield icon */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[12px] md:text-[15px] font-black text-slate-900 dark:text-white leading-snug tracking-tight line-clamp-1">
            {service.title}
          </h3>
          <ShieldCheck className="w-4 h-4 text-amber-500 fill-amber-400/25 dark:text-amber-400 dark:fill-amber-400/20 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)] shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        <p className="text-[10px] md:text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-2 md:mb-4 font-medium">
          {service.description}
        </p>

        {/* ── Footer: Fee + Button ── */}
        <div className="mt-auto flex items-center justify-between gap-1 md:gap-2">
          <div>
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0 md:mb-0.5">
              Fee Starts
            </p>
            <p className="text-[13px] md:text-[17px] mt-0.5 md:mt-0 font-black text-slate-900 dark:text-white leading-none font-mono">
              ₹{service.fee}
            </p>
          </div>

          <button
            onClick={handleClick}
            className={`${btnColor} text-white flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-wide transition-all hover:scale-105 active:scale-95 shadow-md whitespace-nowrap`}
          >
            {service.externalLink ? 'Visit Site' : 'Apply Now'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
