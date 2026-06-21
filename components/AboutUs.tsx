import React, { useState, useEffect } from 'react';
import {
  Phone, MapPin, Code, Smartphone, BarChart3,
  Cpu, Briefcase, Layers, X, Send, CheckCircle2, Loader2, Mail, ShieldCheck, Sparkles, User, ExternalLink
} from 'lucide-react';
import api from '../src/api/axios';
import { AboutContent, Enquiry } from '../types';

interface AboutUsProps {
  content?: AboutContent;
  onSendEnquiry: (enquiry: Omit<Enquiry, 'id' | 'timestamp' | 'isRead' | 'status'>) => Promise<boolean>;
}

export const AboutUs: React.FC<AboutUsProps> = ({ content, onSendEnquiry }) => {
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    message: ''
  });
  const [fetchedContent, setFetchedContent] = useState<AboutContent | null>(null);

  useEffect(() => {
    // Unconditionally fetch to ensure we always have the latest data from the admin panel
    api.get('/about').then(res => {
      if (res.data?.data) setFetchedContent(res.data.data);
    }).catch(console.error);
  }, []);

  const defaultContent: AboutContent = {
    title: 'Pawan Gautam',
    subtitle: 'Full-Stack Developer & Tech Innovator',
    description: 'I am a passionate developer and technology enthusiast dedicated to building high-quality, impactful digital solutions. With a strong foundation in modern web and mobile technologies, I help businesses and individuals achieve their goals through innovation and expertise.',
    missionTitle: 'Mission',
    mission: 'To bridge the gap between community and technology through transparent, rapid, and authorized digital service delivery.',
    visionTitle: 'Vision',
    vision: 'To be Delhi\'s most trusted digital gateway, recognized for absolute security and unmatched community empowerment.',
    experience: 'Over 12 Years of Professional Integrity',
    imageUrl: 'https://img.freepik.com/free-photo/handsome-young-man-with-new-hairstyle-wearing-blue-shirt-feeling-confident-isolated-white-background_176532-8097.jpg',
    address: 'Mangolpuri, Delhi',
    phone: '9911423881',
    expertise: ['Web Dev', 'App Dev', 'Analytics', 'AI/ML', 'Portfolios', 'Custom'],
    isVisible: true
  };

  const activeContent = fetchedContent || content || defaultContent;

  if (activeContent.isVisible === false) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict 10-digit mobile validation
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setError("Please enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Please enter a valid name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSendEnquiry(formData);
      if (success) {
        setIsSuccess(true);
        setFormData({ name: '', mobile: '', email: '', message: '' });
        setTimeout(() => {
          setIsSuccess(false);
          setShowEnquiryModal(false);
        }, 3000);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to submit enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    { title: 'Web Dev', icon: Code, color: 'text-blue-500' },
    { title: 'App Dev', icon: Smartphone, color: 'text-emerald-500' },
    { title: 'Analytics', icon: BarChart3, color: 'text-purple-500' },
    { title: 'AI/ML', icon: Cpu, color: 'text-slate-800' },
    { title: 'Portfolios', icon: Briefcase, color: 'text-orange-400' },
    { title: 'Custom', icon: Layers, color: 'text-blue-700' }
  ];

  return (
    <div className="min-h-screen py-6 px-4 md:px-8 flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
      <div className="max-w-6xl w-full rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col md:flex-row" style={{ backgroundColor: 'var(--card-bg)' }}>

        {/* Left Column: Profile & Contact */}
        <div className="md:w-1/3 p-6 md:p-8 flex flex-col items-center text-center border-r border-slate-200 dark:border-white/5 relative" style={{ backgroundColor: 'var(--card-bg)' }}>
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mb-6 relative group">
            <img
              src={activeContent.imageUrl?.startsWith('/') ? `${window.location.protocol}//${window.location.hostname}:5000${activeContent.imageUrl}` : activeContent.imageUrl}
              alt={activeContent.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">{activeContent.title}</h1>
          <p className="text-sm md:text-base font-bold text-brand dark:text-emerald-400 mb-6 uppercase tracking-wider">{activeContent.subtitle}</p>

          <div className="w-full space-y-3 mb-8">
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm">
              <MapPin className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold">{activeContent.address || defaultContent.address}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">{activeContent.phone || defaultContent.phone}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">{activeContent.experience || defaultContent.experience}</span>
            </div>
          </div>

          <button
            onClick={() => setShowEnquiryModal(true)}
            className="w-full py-4 bg-brand dark:bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-lg shadow-brand/20 dark:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Get In Touch <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: Details & Services */}
        <div className="md:w-2/3 p-6 md:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-brand dark:text-emerald-400" /> About Me
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed text-justify">
              {activeContent.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-blue-50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-blue-900 dark:text-blue-100">{activeContent.missionTitle || 'Mission'}</h3>
              </div>
              <p className="text-xs font-bold text-blue-800/70 dark:text-slate-300 leading-relaxed">{activeContent.mission}</p>
            </div>
            <div className="p-5 bg-emerald-50 dark:bg-slate-800/50 rounded-2xl border border-emerald-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-emerald-900 dark:text-emerald-100">{activeContent.visionTitle || 'Vision'}</h3>
              </div>
              <p className="text-xs font-bold text-emerald-800/70 dark:text-slate-300 leading-relaxed">{activeContent.vision}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand dark:text-emerald-400" /> Expertise
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(activeContent.expertise || defaultContent.expertise || []).map((ext, i) => {
                const s = services.find(service => service.title.toLowerCase() === ext.toLowerCase()) || services[0];
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 hover:border-brand/30 dark:hover:border-emerald-500/30 transition-colors">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ext}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowEnquiryModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Received!</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">We will contact you shortly.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Get In Touch</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">Start your digital journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-xs font-bold text-red-500 text-center bg-red-50 dark:bg-red-500/10 p-2 rounded-lg">{error}</p>}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand dark:focus:ring-emerald-500"
                      placeholder="Your Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Mobile</label>
                      <input
                        required
                        type="tel"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand dark:focus:ring-emerald-500"
                        placeholder="9876543210"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Email (Opt)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand dark:focus:ring-emerald-500"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Message</label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand dark:focus:ring-emerald-500 resize-none"
                      placeholder="How can we help?"
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-3 bg-brand dark:bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
