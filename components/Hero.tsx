
import React, { useState, useEffect } from 'react';
import { CAROUSEL_IMAGES } from '../constants';
import { Message } from '../types';
import { ChevronRight, BellRing, Sparkles, ShieldCheck, Zap, AlertTriangle, Briefcase, Megaphone, CreditCard, Info, Clock, X } from 'lucide-react';
import { getMediaUrl } from '../src/api/axios';

interface HeroProps {
  messages?: any[];
  slides?: any[];
}

export const Hero: React.FC<HeroProps> = ({ messages = [], slides = [] }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const displaySlides = slides.length > 0 ? slides : CAROUSEL_IMAGES.map(img => ({
    image: img,
    title: 'Gateway to Secure Digital Seva.',
    subtitle: 'Advanced processing for government and academic documentation with end-to-end security.',
    badge: 'Official Gateway'
  }));

  const allActiveMessages = messages
    .filter(m => m.status !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const safeMessageIndex = activeMessageIndex % Math.max(1, allActiveMessages.length);
  const displayMessages = allActiveMessages.length <= 2
    ? allActiveMessages
    : [
      allActiveMessages[safeMessageIndex],
      allActiveMessages[(safeMessageIndex + 1) % allActiveMessages.length]
    ].filter(Boolean);

  useEffect(() => {
    if (allActiveMessages.length <= 2) return;
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveMessageIndex((prev) => (prev + 2) % allActiveMessages.length);
        setIsAnimating(false);
      }, 500); // 500ms fade duration
    }, 4000); // 4s interval
    return () => clearInterval(timer);
  }, [allActiveMessages.length]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displaySlides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[.*?\]|\[\/.*?\])/);
    let currentColorClass = '';

    return parts.map((part, i) => {
      if (part === '[blue]') { currentColorClass = 'text-blue-600'; return null; }
      if (part === '[green]') { currentColorClass = 'text-emerald-600'; return null; }
      if (part === '[orange]') { currentColorClass = 'text-orange-600'; return null; }
      if (part === '[red]') { currentColorClass = 'text-rose-600'; return null; }
      if (part.startsWith('[/')) { currentColorClass = ''; return null; }

      return currentColorClass ? (
        <span key={i} className={`${currentColorClass} font-black`}>{part}</span>
      ) : part;
    });
  };

  const getNoticeIcon = (iconName: string, text: string) => {
    const name = iconName || text?.toLowerCase() || '';
    if (name.includes('Briefcase')) return <Briefcase className="w-6 h-6 text-orange-500" />;
    if (name.includes('Megaphone')) return <Megaphone className="w-6 h-6 text-blue-500" />;
    if (name.includes('CreditCard')) return <CreditCard className="w-6 h-6 text-emerald-500" />;
    if (name.includes('AlertTriangle')) return <AlertTriangle className="w-6 h-6 text-red-500" />;
    return <Zap className="w-6 h-6 text-yellow-500" />;
  };

  return (
    <section className="py-4 md:py-10 px-4 md:px-8 max-w-[1500px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Carousel Container - Refined with smoother transitions */}
        <div
          className="lg:w-[65%] relative h-[380px] sm:h-[450px] md:h-[440px] rounded-[2.5rem] md:rounded-[3.5rem] p-[1px] shadow-2xl luxury-shadow flex flex-col group transition-all duration-700"
          style={{ background: 'linear-gradient(135deg, rgba(241, 26, 26, 0.61), rgba(34,197,94,0.4), rgba(7, 90, 224, 0.4), rgba(8, 234, 200, 0.4))' }}
        >
          <div className="w-full h-full bg-[#fcfdfd] dark:bg-slate-900 rounded-[calc(2.5rem-1px)] md:rounded-[calc(3.5rem-1px)] relative overflow-hidden">
            {displaySlides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 p-2 md:p-3 transition-all duration-[2500ms] ease-in-out ${idx === activeSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.05] z-0'}`}
              >
                <div className="w-full h-full relative rounded-[2rem] md:rounded-[44px] overflow-hidden bg-slate-100/50 dark:bg-slate-900/50">
                  <img
                    src={getMediaUrl(slide.image)}
                    alt={slide.title}
                    className="w-full h-full object-contain brightness-[1.02]"
                  />
                  {/* Ultra-smooth multi-stop light overlay for better text blending */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 via-white/10 to-transparent dark:from-slate-950 dark:via-slate-900/60 dark:to-transparent flex items-end p-5 md:p-10 lg:p-12">
                    <div className="text-slate-900 dark:text-white max-w-2xl animate-in slide-in-from-bottom-8 duration-1000">
                      <div className="flex items-center gap-4 mb-3 md:mb-5 bg-brand/5 dark:bg-white/10 backdrop-blur-3xl w-fit px-4 py-2 rounded-2xl border border-brand/10 dark:border-white/10 shadow-sm">
                        <ShieldCheck className="w-3.5 md:w-4 h-3.5 md:h-4 text-brand dark:text-emerald-400 verified-badge-glow" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand dark:text-white">{slide.badge || 'Official Gateway'}</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 tracking-tighter leading-[1.1] md:leading-[1] text-brand dark:text-white">
                        {renderHighlightedText(slide.title)}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm lg:text-base font-bold leading-relaxed opacity-90 max-w-lg">
                        {slide.subtitle}
                      </p>
                      {slide.buttonText && (
                        <a href={slide.buttonLink || '#'} className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-black text-xs hover:opacity-90 transition-all">
                          {slide.buttonText} <ChevronRight size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="absolute bottom-6 md:bottom-11 left-6 md:left-12 flex gap-2 md:gap-3 z-20">
              {displaySlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1 md:h-1.5 rounded-full transition-all duration-1000 ${idx === activeSlide ? 'bg-brand dark:bg-emerald-500 w-12 md:w-16 shadow-lg' : 'bg-slate-300 dark:bg-white/40 w-3 md:w-4 hover:bg-slate-400'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Important Live Notices Box - Match exact reference design */}
        <div
          className="lg:w-[35%] min-h-[350px] md:h-[440px] rounded-[28px] md:rounded-[32px] p-[1px] shadow-2xl luxury-shadow flex flex-col relative group transition-all duration-700"
          style={{ background: 'linear-gradient(135deg, rgba(255,75,75,0.4), rgba(34,197,94,0.4), rgba(59,130,246,0.4), rgba(234,179,8,0.4))' }}
        >
          <div className="w-full h-full bg-[#fcfdfd] dark:bg-slate-900 rounded-[26px] md:rounded-[30px] flex flex-col p-5 md:p-7 relative overflow-hidden shadow-inner flex-1">

            {/* HEADER AREA */}
            <div className="flex items-center justify-between mb-5 shrink-0 relative z-10 px-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-2xl shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={2} />
                </div>
                <h3 className="font-extrabold text-[#1e293b] dark:text-white text-[22px] tracking-tight leading-none">Live Notices</h3>
              </div>
              <div className="relative">
                <BellRing className="w-8 h-8 text-orange-400 drop-shadow-sm animate-bounce" strokeWidth={2} />
                {allActiveMessages.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-[#f97316] text-white text-[11px] font-bold w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                    {allActiveMessages.length}
                  </div>
                )}
              </div>
            </div>

            {/* NOTICE CARDS */}
            <div className={`flex-1 flex flex-col gap-4 overflow-hidden relative z-10 pb-2 px-1 transition-opacity duration-500 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              {displayMessages.length > 0 ? (
                displayMessages.map((msg, idx) => {
                  const originalIdx = allActiveMessages.findIndex(m => m._id === msg._id);
                  const displayIdx = originalIdx !== -1 ? originalIdx : idx;
                  const timeAgo = displayIdx === 0 ? 'Just Now' : `${(displayIdx + 1) * 2} min ago`;

                  return (
                    <div
                      key={msg._id || idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex gap-4 items-center relative overflow-hidden"
                    >
                      {/* Subtle gradient glow on the left edge inside card */}
                      <div className={`absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r ${idx % 2 === 0 ? 'from-[#fef08a]/60 via-[#bbf7d0]/20' : 'from-[#bfdbfe]/60 via-[#a7f3d0]/20'} to-transparent z-0`} />

                      <div className="shrink-0 p-3 bg-white dark:bg-slate-900 rounded-[14px] shadow-sm z-10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-[#eab308]" strokeWidth={2} />
                      </div>

                      <div className="flex-1 z-10">
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                          <h4 className="text-[#1e293b] dark:text-white font-extrabold text-[15px] uppercase tracking-tight">{msg.title}</h4>

                          <div className="flex items-center gap-3">
                            <span className="bg-[#fff1f2] dark:bg-rose-500/10 text-[#f43f5e] dark:text-rose-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">{msg.badge || 'LIVE'}</span>
                          </div>
                        </div>

                        <div className="flex items-start justify-between">
                          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 pr-4 leading-relaxed">
                            {renderHighlightedText(msg.description)}
                          </p>
                          <span className="text-[12px] font-semibold text-slate-400 whitespace-nowrap pt-0.5">
                            {timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Sparkles className="w-10 h-10 text-slate-200 dark:text-white/10 mb-4" />
                  <p className="text-slate-400 dark:text-slate-600 font-bold italic text-sm">System synchronized. No alerts.</p>
                </div>
              )}
            </div>

            {/* BUTTON */}
            <div className="mt-auto pt-4 z-10 px-1">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-[14px] rounded-full font-bold text-white text-[16px] shadow-[0_8px_20px_rgba(251,113,133,0.25)] flex items-center justify-center gap-2 relative overflow-hidden group/btn transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(to right, #f43f5e, #f97316, #eab308, #10b981, #0ea5e9)' }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                See All Notices <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ALL NOTICES MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-white">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#fcfdfd] dark:bg-slate-900 rounded-[28px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 md:p-7 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl shadow-sm">
                  <BellRing className="w-6 h-6 text-blue-500" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[22px] tracking-tight leading-none">All Notices</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{allActiveMessages.length} total active notices</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4 custom-scroll">
              {allActiveMessages.length > 0 ? (
                allActiveMessages.map((msg, idx) => {
                  const timeAgo = idx === 0 ? 'Just Now' : `${(idx + 1) * 2} min ago`;
                  return (
                    <div
                      key={msg._id || idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex gap-4 items-center relative overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r ${idx % 2 === 0 ? 'from-[#fef08a]/60 via-[#bbf7d0]/20' : 'from-[#bfdbfe]/60 via-[#a7f3d0]/20'} to-transparent z-0`} />

                      <div className="shrink-0 p-3 bg-white dark:bg-slate-900 rounded-[14px] shadow-sm z-10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-[#eab308]" strokeWidth={2} />
                      </div>

                      <div className="flex-1 z-10">
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                          <h4 className="text-[#1e293b] dark:text-white font-extrabold text-[15px] uppercase tracking-tight">{msg.title}</h4>
                          <span className="bg-[#fff1f2] dark:bg-rose-500/10 text-[#f43f5e] dark:text-rose-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">{msg.badge || 'LIVE'}</span>
                        </div>
                        <div className="flex items-start justify-between">
                          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed pr-4">
                            {renderHighlightedText(msg.description)}
                          </p>
                          <span className="text-[12px] font-semibold text-slate-400 whitespace-nowrap pt-0.5">
                            {timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <Info className="w-12 h-12 text-slate-400 mb-4" />
                  <p className="text-lg font-bold">No historical notices.</p>
                </div>
              )}
            </div>
            {/* Modal Bottom gradient decoration */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#f43f5e] via-[#f97316] to-[#0ea5e9]"></div>
          </div>
        </div>
      )}
    </section>
  );
};
