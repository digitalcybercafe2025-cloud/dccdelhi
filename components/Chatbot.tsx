import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, ShieldCheck } from 'lucide-react';
import { processBotCommand } from '../services/whatsappService';
import { Application } from '../types';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
}

interface ChatbotProps {
  applications: Application[];
}

const websiteData = {
  services: [
    { name: "PAN Card", price: "₹199", description: "Apply for new PAN card, correction, or reprint.", processingTime: "5-7 days" },
    { name: "Voter ID", price: "₹99", description: "New registration and correction services.", processingTime: "10-15 days" },
    { name: "Passport", price: "₹1499", description: "New passport application and renewal assistance.", processingTime: "15-30 days" },
    { name: "Income Certificate", price: "₹199", description: "Delhi district income certificate issuance.", processingTime: "14 days" },
    { name: "Caste Certificate", price: "₹199", description: "SC/ST/OBC Delhi district certificate issuance.", processingTime: "14 days" },
  ],
  contact: {
    phone: "9911423881",
    location: "G-663, Mangolpuri, Delhi 110083"
  }
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'init-1',
    text: 'Hi 👋 Welcome to Digital Cyber Cafe! How can I help you today?',
    sender: 'bot',
    timestamp: Date.now()
  }
];

export const Chatbot: React.FC<ChatbotProps> = ({ applications }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('mangolpuri_chat_history');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem('mangolpuri_chat_history', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const generateBotResponse = (userInput: string): string => {
    const text = userInput.toLowerCase();

    // 1. Services
    if (/service|what do you do|available|list/i.test(text)) {
      const list = websiteData.services.map(s => `• ${s.name}`).join('\n');
      return `Here are the services we provide:\n${list}\n\nGo to the "Services" page to apply!`;
    }

    // 2. Pricing
    if (/price|fee|cost|charge|how much/i.test(text)) {
      const match = websiteData.services.find(s => text.includes(s.name.toLowerCase()));
      if (match) return `The fee for ${match.name} is ${match.price}.`;

      const priceList = websiteData.services.map(s => `• ${s.name}: ${s.price}`).join('\n');
      return `Here is our pricing:\n${priceList}`;
    }

    // 3. Processing Time
    if (/time|days|how long|duration|processing/i.test(text)) {
      const match = websiteData.services.find(s => text.includes(s.name.toLowerCase()));
      if (match) return `The processing time for ${match.name} is approx ${match.processingTime}.`;
      return "Most of our standard services take 5-14 working days depending on the district authorities. Which service are you asking about?";
    }

    // 4. Contact & Location
    if (/contact|number|phone|call|whatsapp|where|location|address/i.test(text)) {
      return `You can visit us at: ${websiteData.contact.location}.\nOr WhatsApp us directly at: ${websiteData.contact.phone}`;
    }

    // 5. Guidance (Applying)
    if (/i want|apply|need|create/i.test(text)) {
      const match = websiteData.services.find(s => text.includes(s.name.toLowerCase()));
      if (match) return `Sure! Please go to Services → ${match.name} and click "Apply Now".`;
      return `Sure! Please click on the "Services" tab below and find what you need.`;
    }

    // 6. Unknown Fallback
    return "Sorry, I didn't clearly understand. Please choose one of the options below, or use the 'TRACK [ID]' format.";
  };

  const processInput = (textToProcess: string) => {
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

    // Give visual typing delay
    setTimeout(() => {
      // Check command first (e.g. TRACK)
      const botResult = processBotCommand(textToProcess, applications);
      let responseText = "";

      if (botResult.found) {
        responseText = botResult.message;
      } else {
        responseText = generateBotResponse(textToProcess);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
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
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-100">Online</span>
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
                  placeholder="Ask anything..."
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

