import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CAROUSEL_IMAGES } from '../constants';
import { ChevronRight, BellRing, Sparkles, ShieldCheck, Zap, AlertTriangle, Briefcase, Megaphone, CreditCard, Info, Clock, X, ExternalLink } from 'lucide-react';
import { getMediaUrl } from '../src/api/axios';
import api from '../src/api/axios';

interface HeroProps {
  messages?: any[];
  slides?: any[];
}

interface NoticeSettings {
  visibleCount: number;
  autoAnimation: boolean;
  animationType: 'scroll' | 'fade' | 'slide' | 'fade-slide' | 'instant';
  animationDirection: 'up' | 'down' | 'left' | 'right';
  animationSpeed: 'slow' | 'normal' | 'fast' | 'custom';
  animationDuration: number;
  pauseInterval: number;
  autoRotation: boolean;
  hoverPause: boolean;
  resumeAfterHover: boolean;
  touchPause: boolean;
  infiniteLoop: boolean;
}

const DEFAULT_SETTINGS: NoticeSettings = {
  visibleCount: 2,
  autoAnimation: true,
  animationType: 'scroll',
  animationDirection: 'up',
  animationSpeed: 'normal',
  animationDuration: 600,
  pauseInterval: 4,
  autoRotation: true,
  hoverPause: true,
  resumeAfterHover: true,
  touchPause: true,
  infiniteLoop: true,
};

const hasValidText = (val: any): boolean => {
  return typeof val === 'string' && val.trim().length > 0;
};

export const Hero: React.FC<HeroProps> = ({ messages = [], slides = [] }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [settings, setSettings] = useState<NoticeSettings>(DEFAULT_SETTINGS);

  // Fetch live notice animation settings from backend
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await api.get('/hero/notices/settings');
        if (res.data?.success && res.data.data && isMounted) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...res.data.data,
            visibleCount: Math.min(6, Math.max(2, Number(res.data.data.visibleCount) || 2))
          });
        }
      } catch (err) {
        // Silently use defaults if offline
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  // Periodic timer for client-side auto-expiry filtering
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const displaySlides = Array.isArray(slides) && slides.length > 0 ? slides : CAROUSEL_IMAGES.map(img => ({
    image: img,
    title: 'Gateway to Secure Digital Seva.',
    subtitle: 'Advanced processing for government and academic documentation with end-to-end security.',
    badge: 'Official Gateway'
  }));

  // Real-time unexpired and scheduled notices filter
  const allActiveMessages = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    return list.filter(m => {
      if (!m || typeof m !== 'object') return false;
      if (m.status === false) return false;

      // Start date check
      if (m.startDate) {
        const start = new Date(m.startDate).getTime();
        if (!isNaN(start) && start > currentTime) return false;
      }

      // Expiry check
      if (m.isLifetime === true) return true;
      if (m.expiryDate) {
        const exp = new Date(m.expiryDate).getTime();
        if (!isNaN(exp) && exp <= currentTime) return false;
      }
      return true;
    }).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }, [messages, currentTime]);

  const totalNotices = allActiveMessages.length;
  const visibleCount = Math.min(settings.visibleCount || 2, Math.max(1, totalNotices));

  // Determine currently visible notices slice
  const displayMessages = useMemo(() => {
    if (totalNotices === 0) return [];
    if (totalNotices <= visibleCount) return allActiveMessages;

    const items: any[] = [];
    for (let i = 0; i < visibleCount; i++) {
      const idx = (startIndex + i) % totalNotices;
      items.push(allActiveMessages[idx]);
    }
    return items;
  }, [allActiveMessages, startIndex, visibleCount, totalNotices]);

  // Animation controller
  useEffect(() => {
    if (!settings.autoAnimation || !settings.autoRotation) return;
    if (totalNotices <= visibleCount) return;
    if (expandedNoticeId !== null) return; // Pause when notice is expanded
    if (isHovered && settings.hoverPause) return; // Pause on hover
    if (isTouched && settings.touchPause) return; // Pause on mobile touch

    const intervalMs = Math.max(2, settings.pauseInterval || 4) * 1000;
    const durationMs = Math.max(200, settings.animationDuration || 600);

    const timer = setInterval(() => {
      if (settings.animationType === 'instant') {
        setStartIndex(prev => {
          const step = visibleCount;
          return settings.animationDirection === 'down'
            ? (prev - step + totalNotices) % totalNotices
            : (prev + step) % totalNotices;
        });
      } else {
        setIsAnimating(true);
        setTimeout(() => {
          setStartIndex(prev => {
            const step = visibleCount;
            return settings.animationDirection === 'down'
              ? (prev - step + totalNotices) % totalNotices
              : (prev + step) % totalNotices;
          });
          setIsAnimating(false);
        }, durationMs);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    totalNotices,
    visibleCount,
    expandedNoticeId,
    isHovered,
    isTouched,
    settings.autoAnimation,
    settings.autoRotation,
    settings.hoverPause,
    settings.touchPause,
    settings.pauseInterval,
    settings.animationDuration,
    settings.animationType,
    settings.animationDirection,
  ]);

  // Slide Carousel interval
  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displaySlides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  // Modal lock body
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  const renderHighlightedText = (text: any) => {
    if (!text || typeof text !== 'string') return text || null;
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

  // Helper to render icon (custom upload, emoji, or Lucide fallback)
  const renderNoticeIcon = (msg: any) => {
    if (msg.iconImage) {
      return (
        <img
          src={getMediaUrl(msg.iconImage)}
          alt={msg.title}
          className="w-7 h-7 object-contain rounded-lg"
        />
      );
    }

    const iconStr = (msg.icon || '').trim();
    // Check if it's an emoji (character length / unicode match)
    if (/\p{Emoji}/u.test(iconStr)) {
      return <span className="text-2xl leading-none select-none">{iconStr}</span>;
    }

    // Keyword heuristics for automatic contextual emoji
    const titleLower = (msg.title || '').toLowerCase();
    if (titleLower.includes('diwali')) return <span className="text-2xl leading-none select-none">🪔</span>;
    if (titleLower.includes('pan card') || titleLower.includes('pan')) return <span className="text-2xl leading-none select-none">🪪</span>;
    if (titleLower.includes('birthday') || titleLower.includes('bday')) return <span className="text-2xl leading-none select-none">🎂</span>;
    if (titleLower.includes('festival') || titleLower.includes('holi')) return <span className="text-2xl leading-none select-none">🎉</span>;
    if (titleLower.includes('offer') || titleLower.includes('discount')) return <span className="text-2xl leading-none select-none">🎁</span>;
    if (titleLower.includes('alert') || titleLower.includes('urgent')) return <span className="text-2xl leading-none select-none">⚡</span>;

    // Lucide Icon Fallback
    switch (iconStr) {
      case 'Briefcase': return <Briefcase className="w-6 h-6 text-orange-500" />;
      case 'Megaphone': return <Megaphone className="w-6 h-6 text-blue-500" />;
      case 'CreditCard': return <CreditCard className="w-6 h-6 text-emerald-500" />;
      case 'AlertTriangle': return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default: return <Zap className="w-6 h-6 text-amber-500" />;
    }
  };

  // Dynamic animation transition class based on configured animationType & direction
  const getAnimationClasses = () => {
    if (!isAnimating || settings.animationType === 'instant') return 'opacity-100 transform-none';

    switch (settings.animationType) {
      case 'fade':
        return 'opacity-0 transition-opacity';
      case 'slide':
        if (settings.animationDirection === 'up') return '-translate-y-6 opacity-80';
        if (settings.animationDirection === 'down') return 'translate-y-6 opacity-80';
        if (settings.animationDirection === 'left') return '-translate-x-6 opacity-80';
        if (settings.animationDirection === 'right') return 'translate-x-6 opacity-80';
        return '-translate-y-6 opacity-80';
      case 'fade-slide':
        if (settings.animationDirection === 'up') return '-translate-y-5 opacity-0';
        if (settings.animationDirection === 'down') return 'translate-y-5 opacity-0';
        if (settings.animationDirection === 'left') return '-translate-x-5 opacity-0';
        if (settings.animationDirection === 'right') return 'translate-x-5 opacity-0';
        return '-translate-y-5 opacity-0';
      case 'scroll':
      default:
        return settings.animationDirection === 'down'
          ? 'translate-y-6 opacity-0'
          : '-translate-y-6 opacity-0';
    }
  };

  const getCardHeightClass = () => {
    if (visibleCount <= 2) return 'p-3.5 sm:p-4 min-h-[95px]';
    if (visibleCount === 3) return 'p-2.5 sm:p-3 min-h-[72px]';
    return 'p-2 sm:p-2.5 min-h-[58px]';
  };

  return (
    <section className="py-4 md:py-10 px-4 md:px-8 max-w-[1500px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* CAROUSEL CONTAINER (LEFT 65%) */}
        <div
          className="lg:w-[65%] relative h-[380px] sm:h-[450px] md:h-[440px] rounded-[28px] md:rounded-[32px] p-[1.5px] shadow-2xl luxury-shadow flex flex-col group transition-all duration-700"
          style={{ background: 'linear-gradient(135deg, rgba(241, 26, 26, 0.61), rgba(34,197,94,0.4), rgba(7, 90, 224, 0.4), rgba(8, 234, 200, 0.4))' }}
        >
          <div className="w-full h-full bg-[#fcfdfd] dark:bg-slate-900 rounded-[26px] md:rounded-[30px] relative overflow-hidden">
            {displaySlides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 p-2 md:p-3 transition-all duration-[2500ms] ease-in-out ${idx === activeSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.05] z-0'}`}
              >
                <div className="w-full h-full relative rounded-[20px] md:rounded-[24px] overflow-hidden bg-slate-100/50 dark:bg-slate-900/50">
                  <img
                    src={getMediaUrl(slide.image)}
                    alt={slide.title || 'Slide'}
                    className="w-full h-full object-contain brightness-[1.02]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = CAROUSEL_IMAGES[idx % CAROUSEL_IMAGES.length];
                    }}
                  />
                  {(hasValidText(slide.title) || hasValidText(slide.subtitle) || hasValidText(slide.buttonText)) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 via-white/10 to-transparent dark:from-slate-950 dark:via-slate-900/60 dark:to-transparent flex items-end p-5 md:p-10 lg:p-12 pointer-events-none">
                      <div className="text-slate-900 dark:text-white max-w-2xl animate-in slide-in-from-bottom-8 duration-1000 pointer-events-auto">
                        {hasValidText(slide.badge) && (
                          <div className="flex items-center gap-4 mb-3 md:mb-5 bg-brand/5 dark:bg-white/10 backdrop-blur-3xl w-fit px-4 py-2 rounded-2xl border border-brand/10 dark:border-white/10 shadow-sm">
                            <ShieldCheck className="w-3.5 md:w-4 h-3.5 md:h-4 text-brand dark:text-emerald-400 verified-badge-glow" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand dark:text-white">{slide.badge}</span>
                          </div>
                        )}
                        {hasValidText(slide.title) && (
                          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 tracking-tighter leading-[1.1] md:leading-[1] text-brand dark:text-white">
                            {renderHighlightedText(slide.title)}
                          </h2>
                        )}
                        {hasValidText(slide.subtitle) && (
                          <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm lg:text-base font-bold leading-relaxed opacity-90 max-w-lg">
                            {slide.subtitle}
                          </p>
                        )}
                        {hasValidText(slide.buttonText) && (
                          <a href={slide.buttonLink || '#'} className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-black text-xs hover:opacity-90 transition-all">
                            {slide.buttonText} <ChevronRight size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
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

        {/* IMPORTANT LIVE NOTICES BOX (RIGHT 35%) - EXACT MATCH WITH REFERENCE IMAGE */}
        <div
          className="lg:w-[35%] min-h-[350px] md:h-[440px] rounded-[28px] md:rounded-[32px] p-[1.5px] shadow-2xl luxury-shadow flex flex-col relative group transition-all duration-700"
          style={{ background: 'linear-gradient(135deg, rgba(255,75,75,0.7), rgba(234,179,8,0.7), rgba(34,197,94,0.7), rgba(59,130,246,0.7))' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsTouched(true)}
          onTouchEnd={() => setIsTouched(false)}
        >
          <div className="w-full h-full bg-[#fcfdfd] dark:bg-slate-900 rounded-[26px] md:rounded-[30px] flex flex-col p-4 md:p-6 relative overflow-hidden shadow-inner flex-1">

            {/* 1. HEADER AREA */}
            <div className="flex items-center justify-between mb-4 shrink-0 relative z-10 px-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-2xl shadow-sm text-red-500 border border-red-100/60 dark:border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={2.2} />
                </div>
                <h3 className="font-extrabold text-[#1e293b] dark:text-white text-[22px] tracking-tight leading-none">
                  Live Notices
                </h3>
              </div>
              
              <div className="relative">
                <BellRing className="w-8 h-8 text-amber-500 drop-shadow-sm animate-bounce" strokeWidth={2.2} />
                {totalNotices > 0 && (
                  <div className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[11px] font-black w-[20px] h-[20px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                    {totalNotices}
                  </div>
                )}
              </div>
            </div>

            {/* 2. NOTICE CARDS AREA (ANIMATED / EXPANDABLE) */}
            <div
              className={`flex-1 flex flex-col gap-3 overflow-hidden relative z-10 pb-1 px-0.5 transition-all duration-500 ease-out ${getAnimationClasses()}`}
              style={{ transitionDuration: `${settings.animationDuration || 600}ms` }}
            >
              {displayMessages.length > 0 ? (
                displayMessages.map((msg, idx) => {
                  const noticeId = msg._id || msg.id || String(idx);
                  const isExpanded = expandedNoticeId === noticeId;
                  const noticeTitle = msg.title || (msg.text?.includes(':') ? msg.text.split(':')[0] : msg.text) || 'OFFICIAL NOTICE';
                  const descriptionText = msg.description || msg.shortDescription || (msg.text?.includes(':') ? msg.text.split(':')[1] : msg.text) || '';

                  return (
                    <div
                      key={noticeId}
                      className={`${getCardHeightClass()} rounded-[20px] bg-white dark:bg-slate-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700/80 flex gap-3 sm:gap-4 items-center relative overflow-hidden transition-all duration-300`}
                    >
                      {/* Soft ambient tint on left matching reference cards */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r pointer-events-none ${
                          idx % 2 === 0
                            ? 'from-amber-100/50 via-emerald-100/20'
                            : 'from-sky-100/50 via-teal-100/20'
                        } to-transparent z-0`}
                      />

                      {/* Icon Container */}
                      <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10">
                        {renderNoticeIcon(msg)}
                      </div>

                      {/* Vertical separator line matching reference screenshot */}
                      <div className="h-8 sm:h-10 w-[1.5px] bg-slate-200/80 dark:bg-slate-700 shrink-0 z-10" />

                      {/* Notice Content */}
                      <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
                        {/* Title and Live Badge */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-[#0f172a] dark:text-white font-extrabold text-[14px] sm:text-[15px] uppercase tracking-tight line-clamp-1">
                            {noticeTitle}
                          </h4>
                        </div>

                        <div className="mb-1">
                          <span className="bg-[#fff1f2] dark:bg-rose-500/15 text-[#f43f5e] dark:text-rose-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                            {msg.badge || 'LIVE'}
                          </span>
                        </div>

                        {/* Description Preview or Expanded */}
                        <div className="flex items-end justify-between gap-2">
                          <p
                            className={`text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium leading-snug ${
                              isExpanded ? 'max-h-32 overflow-y-auto pr-1' : 'line-clamp-2'
                            }`}
                          >
                            {renderHighlightedText(descriptionText)}
                          </p>

                          {/* See More / See Less Toggle */}
                          {descriptionText.length > 50 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedNoticeId(isExpanded ? null : noticeId);
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold text-[12px] sm:text-[13px] inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer select-none transition-colors ml-auto pl-1"
                            >
                              {isExpanded ? 'See Less <' : 'See More >'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <Sparkles className="w-9 h-9 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-xs">All services operational. No alerts.</p>
                </div>
              )}
            </div>

            {/* 3. RAINBOW ACTION BUTTON: "See All Notices >" */}
            <div className="mt-auto pt-3 z-10 px-0.5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-[13px] sm:py-[14px] rounded-full font-bold text-white text-[15px] sm:text-[16px] shadow-[0_8px_20px_rgba(251,113,133,0.25)] flex items-center justify-center gap-2 relative overflow-hidden group/btn transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: 'linear-gradient(to right, #f43f5e, #f97316, #eab308, #10b981, #0ea5e9)' }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none" />
                <span>See All Notices</span>
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ALL NOTICES MODAL (FULL VIEW) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-white">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#fcfdfd] dark:bg-slate-900 rounded-[28px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-2xl shadow-sm text-red-500">
                  <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[22px] tracking-tight leading-none">Active Notices</h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                    {totalNotices} official broadcast{totalNotices !== 1 ? 's' : ''} currently live
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-4 custom-scroll">
              {allActiveMessages.length > 0 ? (
                allActiveMessages.map((msg, idx) => {
                  return (
                    <div
                      key={msg._id || msg.id || idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex gap-4 items-start relative overflow-hidden"
                    >
                      <div className="shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex items-center justify-center z-10">
                        {renderNoticeIcon(msg)}
                      </div>

                      <div className="flex-1 min-w-0 z-10">
                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                          <h4 className="text-[#0f172a] dark:text-white font-extrabold text-[15px] uppercase tracking-tight">
                            {msg.title || (msg.text?.includes(':') ? msg.text.split(':')[0] : msg.text) || 'OFFICIAL NOTICE'}
                          </h4>
                          <span className="bg-[#fff1f2] dark:bg-rose-500/15 text-[#f43f5e] dark:text-rose-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            {msg.badge || 'LIVE'}
                          </span>
                        </div>

                        <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                          {renderHighlightedText(msg.description || msg.shortDescription || (msg.text?.includes(':') ? msg.text.split(':')[1] : msg.text) || '')}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 flex-wrap gap-2 text-[11px] text-slate-400 font-semibold">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {msg.isLifetime ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Lifetime Active</span>
                            ) : msg.expiryDate ? (
                              <span>Expires: {new Date(msg.expiryDate).toLocaleDateString()}</span>
                            ) : (
                              <span>Active</span>
                            )}
                          </div>

                          {msg.actionUrl && (
                            <a
                              href={msg.actionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                            >
                              {msg.actionText || 'Take Action'}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <Info className="w-12 h-12 text-slate-400 mb-4" />
                  <p className="text-base font-bold">No active notices at this moment.</p>
                </div>
              )}
            </div>

            {/* Modal Bottom gradient decoration */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#f43f5e] via-[#f97316] to-[#0ea5e9]" />
          </div>
        </div>
      )}
    </section>
  );
};
