import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Application } from '../types';
import { SERVICES } from '../constants';
import api from '../src/api/axios';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
}

interface ChatbotProps {
  applications: Application[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'init-1',
    text: 'Hi 👋 Welcome to Digital Cyber Cafe! How can I help you today? You can ask about services, fees, required documents, or paste your Tracking ID (e.g. AAD-2026-274520).',
    sender: 'bot',
    timestamp: Date.now()
  }
];

const STATUS_LABELS: Record<string, string> = {
  received: 'Received (Pending Review)',
  review: 'Under Review',
  verifying: 'Verifying Details',
  completed: 'Completed ✅',
  rejected: 'Rejected ❌',
};

export const Chatbot: React.FC<ChatbotProps> = ({ applications }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('mangolpuri_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read chat history', e);
    }
    return INITIAL_MESSAGES;
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live synced website knowledge state
  const [liveServices, setLiveServices] = useState<any[]>(() => SERVICES);
  const [liveSettings, setLiveSettings] = useState<any>({
    siteName: 'Digital Cyber Cafe',
    contactNumber: '9911423881',
    whatsapp: '9911423881',
    email: 'digitalcybercafe@gmail.com',
    address: 'G-663, Mangolpuri, Delhi 110083',
  });
  const [liveNotices, setLiveNotices] = useState<any[]>([]);
  const lastSyncRef = useRef<number>(0);

  const syncWebsiteKnowledge = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastSyncRef.current < 20000) return; // avoid duplicate rapid calls within 20s
    lastSyncRef.current = now;

    try {
      const [svcRes, setRes, noticeRes] = await Promise.allSettled([
        api.get('/services'),
        api.get('/settings'),
        api.get('/hero/notices/active')
      ]);

      if (svcRes.status === 'fulfilled' && svcRes.value?.data?.success && Array.isArray(svcRes.value.data.data)) {
        setLiveServices(svcRes.value.data.data);
      }
      if (setRes.status === 'fulfilled' && setRes.value?.data?.data) {
        setLiveSettings((prev: any) => ({ ...prev, ...setRes.value.data.data }));
      }
      if (noticeRes.status === 'fulfilled' && noticeRes.value?.data?.success && Array.isArray(noticeRes.value.data.data)) {
        setLiveNotices(noticeRes.value.data.data);
      }
    } catch {
      // Keep existing synced/fallback state silently
    }
  }, []);

  // Sync on initial mount + whenever chat opens
  useEffect(() => {
    syncWebsiteKnowledge(false);
  }, [syncWebsiteKnowledge]);

  useEffect(() => {
    if (isOpen) {
      syncWebsiteKnowledge(true);
    }
  }, [isOpen, syncWebsiteKnowledge]);

  useEffect(() => {
    try {
      sessionStorage.setItem('mangolpuri_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save chat history', e);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const extractTrackingId = (rawText: string): string | null => {
    const trimmed = rawText.trim();
    // Standard Tracking ID format e.g. AAD-2026-274520, PAN-2026-X8291
    const patternMatch = trimmed.match(/\b([A-Za-z]{2,8}-\d{4}-[A-Za-z0-9]{4,12})\b/);
    if (patternMatch) return patternMatch[1].toUpperCase();

    // Explicit TRACK <ID> command
    const trackCmd = trimmed.match(/^track\s+(?:id\s*)?([A-Za-z0-9-]{6,30})$/i);
    if (trackCmd) return trackCmd[1].toUpperCase();

    return null;
  };

  const findMatchingService = (text: string) => {
    const lower = text.toLowerCase();
    return liveServices.find((s) => {
      const title = String(s.title || s.name || '').toLowerCase();
      if (!title) return false;
      if (lower.includes(title)) return true;
      // Match significant words (e.g. "aadhar", "aadhaar", "pan", "voter", "passport", "income", "caste")
      const words = title.split(/\s+/).filter((w: string) => w.length >= 3 && !['card', 'service', 'certificate', 'online', 'apply'].includes(w));
      return words.some((w: string) => lower.includes(w) || (w === 'aadhar' && lower.includes('aadhaar')) || (w === 'aadhaar' && lower.includes('aadhar')));
    });
  };

  const formatServiceDocs = (svc: any): string => {
    const parts: string[] = [];
    if (svc.mandatoryDocs?.length) parts.push(`• Mandatory: ${svc.mandatoryDocs.join(', ')}`);
    if (svc.idProofs?.length) parts.push(`• ID Proof (any 1): ${svc.idProofs.join(', ')}`);
    if (svc.addressProofs?.length) parts.push(`• Address Proof (any 1): ${svc.addressProofs.join(', ')}`);
    if (svc.otherDocs?.length) parts.push(`• Other Optional: ${svc.otherDocs.join(', ')}`);
    if (parts.length === 0 && svc.requiredDocs?.length) {
      parts.push(`• Required: ${svc.requiredDocs.join(', ')}`);
    }
    return parts.join('\n');
  };

  const generateBotResponse = async (userInput: string): Promise<string> => {
    const text = userInput.trim();
    const lower = text.toLowerCase();

    // Always ensure knowledge is reasonably fresh when responding
    await syncWebsiteKnowledge(false);

    // 1. Live Application Tracking Check (Direct API + local fallback)
    const trackingId = extractTrackingId(text);
    if (trackingId) {
      try {
        const res = await api.get(`/applications/track/${encodeURIComponent(trackingId)}`);
        if (res.data?.success && res.data.data) {
          const app = res.data.data;
          const statusLabel = STATUS_LABELS[app.status] || String(app.status || 'Received').toUpperCase();
          const updatedAt = app.updatedAt
            ? new Date(app.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';

          let reply = `📌 Tracking ID: ${app.trackingId}\n`;
          reply += `📄 Service: ${app.serviceName}\n`;
          if (app.userDetails?.fullName) reply += `👤 Applicant: ${app.userDetails.fullName}\n`;
          reply += `📊 Status: ${statusLabel}\n`;
          if (app.paymentDetails?.paymentStatus) {
            reply += `💳 Payment: ${app.paymentDetails.paymentStatus}${app.paymentDetails.amount ? ` (₹${app.paymentDetails.amount})` : ''}\n`;
          }
          if (updatedAt) reply += `🕒 Updated: ${updatedAt}`;
          if (app.status === 'rejected' && app.rejectionReason) {
            reply += `\n⚠️ Reason: ${app.rejectionReason}`;
          } else if (app.status === 'completed') {
            reply += `\n🎉 Your certificate/result is ready! Visit the "Tracker" page to download it.`;
          }
          return reply;
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return `❌ No application found for Tracking ID "${trackingId}".\nPlease check the spelling (example: AAD-2026-274520) or try the Tracker page.`;
        }
      }

      // Fallback check against prop applications if backend unreachable
      const localApp = applications.find(a => a.trackingId?.toUpperCase() === trackingId);
      if (localApp) {
        return `📌 Tracking ID: ${localApp.trackingId}\n📄 Service: ${localApp.serviceName}\n📊 Status: ${STATUS_LABELS[localApp.status] || localApp.status}`;
      }

      return `❌ Could not find Tracking ID "${trackingId}". Please verify your ID or check on the Tracker page.`;
    }

    // Track keyword without ID
    if (/track|status|kahan pahuncha|check application/i.test(lower)) {
      return `To track your application live, just send me your Tracking ID directly (for example: AAD-2026-274520) or visit the "Tracker" tab below!`;
    }

    // 2. Live Notices / Announcements
    if (/notice|update|news|announcement|offer/i.test(lower)) {
      if (liveNotices.length > 0) {
        const list = liveNotices.slice(0, 5).map(n => `• ${n.text || n.title || ''}`).filter(Boolean).join('\n');
        return `📢 Latest Announcements:\n${list}`;
      }
      return `📢 Check our home page ticker for the latest updates and government portal deadlines!`;
    }

    // 3. Specific Service Match (Documents / Fee / Time / Details)
    const matchedService = findMatchingService(text);
    if (matchedService) {
      const title = matchedService.title || matchedService.name;
      const fee = matchedService.fee !== undefined ? `₹${matchedService.fee}` : matchedService.price || 'Check portal';
      const time = matchedService.estimatedDays || matchedService.processingTime || '5-7 working days';
      const docs = formatServiceDocs(matchedService);

      if (/doc|document|kagaz|proof|chahiye|required/i.test(lower)) {
        return `📂 Documents for ${title} (Fee: ${fee}):\n${docs || 'Visit Services → Apply Now to view document checklist.'}`;
      }
      if (/price|fee|cost|charge|kitna|paisa|rate/i.test(lower)) {
        return `💰 The fee for ${title} is ${fee} (Estimated Time: ${time}).\nYou can apply directly from the "Services" section!`;
      }
      if (/time|days|how long|kitne din|duration/i.test(lower)) {
        return `⏱️ ${title} usually takes ${time}.\nFee: ${fee}.`;
      }
      return `✅ ${title}\n• Fee: ${fee}\n• Processing Time: ${time}${docs ? `\n${docs}` : ''}\n\nGo to Services → ${title} to apply online!`;
    }

    // 4. All Services List
    if (/service|what do you do|available|list|kaam/i.test(lower)) {
      if (liveServices.length > 0) {
        const list = liveServices.slice(0, 10).map(s => `• ${s.title || s.name} — ₹${s.fee ?? ''}`).join('\n');
        return `Here are our live available services:\n${list}${liveServices.length > 10 ? `\n...and ${liveServices.length - 10} more on the Services page!` : ''}\n\nAsk me about any service for documents & timing!`;
      }
    }

    // 5. General Pricing
    if (/price|fee|cost|charge|how much|rate/i.test(lower)) {
      const priceList = liveServices.slice(0, 8).map(s => `• ${s.title || s.name}: ₹${s.fee ?? ''}`).join('\n');
      return `💰 Current Service Pricing:\n${priceList}\n\nAsk a specific service name for exact document requirements!`;
    }

    // 6. General Processing Time
    if (/time|days|how long|duration|processing/i.test(lower)) {
      return `⏱️ Most standard services take 3-14 working days depending on the portal/authority. Ask a specific service name (like "PAN Card time") for exact days!`;
    }

    // 7. Live Contact & Location
    if (/contact|number|phone|call|whatsapp|where|location|address|email|support/i.test(lower)) {
      return `📍 Address: ${liveSettings.address || 'G-663, Mangolpuri, Delhi 110083'}\n📞 Phone / WhatsApp: ${liveSettings.contactNumber || liveSettings.whatsapp || '9911423881'}\n✉️ Email: ${liveSettings.email || 'digitalcybercafe@gmail.com'}`;
    }

    // 8. Applying Guidance
    if (/apply|need|create|banwana|form|kaise/i.test(lower)) {
      return `Applying is super easy:\n1. Go to the "Services" tab and pick your service.\n2. Fill details & upload documents (images are auto-compressed!).\n3. Scan QR / Download Barcode to pay & enter your 12-digit UTR.\n4. Download your official Acknowledgement Slip immediately!`;
    }

    // 9. Greeting
    if (/^(hi|hello|hey|namaste|hii|hy)\b/i.test(lower)) {
      return `Hello! 👋 Welcome to ${liveSettings.siteName || 'Digital Cyber Cafe'}. Ask me about any service, fees, required documents, or paste your Tracking ID to check live status!`;
    }

    // 10. Friendly Fallback
    return `I can help you with:\n• Live service list, fees & required documents\n• Tracking your application (just paste your Tracking ID like AAD-2026-274520)\n• Cafe address & contact details\n\nChoose a quick option below or type your question!`;
  };

  const processInput = async (textToProcess: string) => {
    if (!textToProcess.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: textToProcess,
      sender: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const [responseText] = await Promise.all([
        generateBotResponse(textToProcess),
        new Promise(resolve => setTimeout(resolve, 450))
      ]);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    processInput(input);
  };

  const handleQuickReply = (text: string) => {
    processInput(text);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const quickReplies = ["View Services", "Track Application", "Contact Support", "Prices", "Processing Time"];

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[150]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 md:bottom-20 right-0 w-[300px] h-[450px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col overflow-hidden luxury-shadow origin-bottom-right"
          >
            {/* Header */}
            <div className="p-4 bg-brand dark:bg-emerald-600 text-white flex items-center justify-between shadow-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs tracking-tight">Seva Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-100">Live Synced</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll bg-slate-50/80 dark:bg-slate-900/50"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white dark:bg-slate-800 text-emerald-500 border border-slate-100 dark:border-white/10'}`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[11px] md:text-[12px] font-medium leading-relaxed whitespace-pre-wrap shadow-sm ${msg.sender === 'user'
                      ? 'bg-brand dark:bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-white/5'
                      }`}>
                      {msg.text}
                    </div>
                  </div>
                  <span className={`text-[9px] text-slate-400 mt-1 font-bold ${msg.sender === 'user' ? 'mr-10' : 'ml-10'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 text-emerald-500 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-sm">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center gap-1 rounded-tl-sm shadow-sm">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            <div className="px-3 pb-2 pt-2 overflow-x-auto whitespace-nowrap custom-scroll bg-slate-50/80 dark:bg-slate-900/50 flex gap-2 shrink-0 border-t border-slate-100 dark:border-white/5">
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReply(reply)}
                  disabled={isTyping}
                  className="inline-block px-3 py-1.5 bg-white dark:bg-slate-800 border border-brand/20 dark:border-emerald-500/30 text-brand dark:text-emerald-400 text-[10px] font-bold rounded-full hover:bg-brand hover:text-white dark:hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 shrink-0"
            >
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask or paste Tracking ID..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] md:text-sm font-bold outline-none focus:ring-2 focus:ring-brand/20 dark:focus:ring-emerald-500/20 transition-all dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-3 bg-brand dark:bg-emerald-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-brand dark:bg-emerald-600'} text-white border-2 border-white/20`}
      >
        {isOpen ? <X className="w-5 h-5 md:w-8 md:h-8" /> : <MessageCircle className="w-5 h-5 md:w-8 md:h-8" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] md:text-[10px] font-black animate-bounce">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
};
