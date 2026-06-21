import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Search, Grid, List,
  Settings, LogOut, Download, Filter,
  FileText, CreditCard, Star, Clock, CheckCircle2,
  TrendingUp, Activity, ShieldCheck, Trash2, Edit3, Eye,
  BrainCircuit, Sparkles, X, Check, Upload, Calendar, ArrowUpRight, ChevronRight, FileSearch, FilterX, Archive, Plus,
  ToggleLeft, ToggleRight, ImageIcon, Globe, EyeOff, Hash, Layers, MoreHorizontal, Mail, MessageSquare, BookOpen, User,
  Loader2, AlertCircle, FileCheck, ExternalLink, MapPin, Smartphone, CreditCard as CardIcon, Send, Copy, CalendarDays,
  Image as LucideImage, Link as LucideLink, MoveUp, MoveDown, Info, ClipboardList, ShieldAlert, XCircle, Menu, ChevronLeft
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Application, ApplicationStatus, Service, Testimonial, Message, ServiceCategory, Enquiry, EnquiryStatus, AboutContent } from '../types';
import { getSmartPriority } from '../services/geminiService';
import { getMessageTemplates, saveMessageTemplates } from '../services/whatsappService';

interface AdminDashboardProps {
  applications: Application[];
  services: Service[];
  categories: ServiceCategory[];
  messages: Message[];
  testimonials: Testimonial[];
  aboutContent: AboutContent;
  enquiries: Enquiry[];
  viewMode: 'grid' | 'list';
  onUpdateViewMode: (mode: 'grid' | 'list') => void;
  onUpdateStatus: (id: string, status: ApplicationStatus, remarks?: string, certUrl?: string) => void;
  onUpdateServices: (services: Service[]) => void;
  onUpdateCategories: (categories: ServiceCategory[]) => void;
  onUpdateMessages: (messages: Message[]) => void;
  onUpdateTestimonials: (testimonials: Testimonial[]) => void;
  onUpdateAbout: (content: AboutContent) => void;
  onUpdateEnquiries: (enquiries: Enquiry[]) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  applications, services, categories, messages, testimonials, aboutContent, enquiries, viewMode, onUpdateViewMode,
  onUpdateStatus, onUpdateServices, onUpdateCategories, onUpdateMessages, onUpdateTestimonials, onUpdateAbout, onUpdateEnquiries, onLogout
}) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  // Application Module States
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('ALL');
  const [appServiceFilter, setAppServiceFilter] = useState<string>('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(ApplicationStatus.PENDING);
  const [remarks, setRemarks] = useState('');
  const [certFile, setCertFile] = useState<string | null>(null);
  const [isCertUploading, setIsCertUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const appsPerPage = 10;

  // Enquiry Module States
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isUpdatingEnquiry, setIsUpdatingEnquiry] = useState(false);

  // Testimonial Module States
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialFormData, setTestimonialFormData] = useState<Partial<Testimonial>>({});
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('url');

  // Service Module States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState<Partial<Service>>({});
  const [serviceSearch, setServiceSearch] = useState('');

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  // New Global Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('mangolpuri_sidebar_collapsed') === 'true');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : { name: 'Admin', avatar: '', email: '' };
  });

  useEffect(() => {
    localStorage.setItem('mangolpuri_sidebar_collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const stats = {
    totalServices: services.length,
    newApplications: applications.filter(a => Date.now() - a.timestamp < 86400000).length,
    pendingApplications: applications.filter(a => a.status === ApplicationStatus.PENDING).length,
    totalEarnings: applications.reduce((acc, curr) => acc + curr.amount, 0),
    totalEnquiries: enquiries.length,
    unreadEnquiries: enquiries.filter(e => e.status === EnquiryStatus.PENDING || !e.isRead).length,
    completedApplications: applications.filter(a => a.status === ApplicationStatus.COMPLETED).length
  };

  const fetchAiInsight = async () => {
    setIsAiLoading(true);
    const insight = await getSmartPriority(stats.pendingApplications, stats.totalEarnings);
    setAiInsight(insight || "Prioritize pending Voter ID renewals for faster turnaround.");
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (activeMenu === 'Dashboard') fetchAiInsight();
    if (activeMenu === 'Settings') {
      const logs = JSON.parse(localStorage.getItem('mangolpuri_logs') || '[]');
      setNotificationLogs(logs);
      setMessageTemplates(getMessageTemplates());
    }
  }, [activeMenu]);

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Applications', icon: ClipboardList, badge: stats.pendingApplications > 0 ? stats.pendingApplications : null },
    { name: 'Services', icon: Grid },
    { name: 'Enquiries', icon: Mail, badge: stats.unreadEnquiries > 0 ? stats.unreadEnquiries : null },
    { name: 'Testimonials', icon: Star },
    { name: 'Settings', icon: Settings },
  ];

  const handleLogoutClick = () => {
    onLogout();
    setProfileDropdownOpen(false);
  };

  // Application Actions
  const handleOpenAppDetails = (app: Application) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setRemarks(app.remarks || '');
    setCertFile(app.certificateUrl || null);
  };

  const handleUpdateAppStatus = async () => {
    if (!selectedApp) return;

    if (newStatus === ApplicationStatus.REJECTED && !remarks.trim()) {
      alert("A remark is mandatory for the rejection protocol.");
      return;
    }

    setStatusUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    onUpdateStatus(selectedApp.id, newStatus, remarks, certFile || undefined);
    setStatusUpdating(false);
    setSelectedApp(null);
  };

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'application/pdf'].includes(file.type)) {
        alert("Only JPEG and PDF artifacts are permitted for issuance.");
        return;
      }
      setIsCertUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertFile(reader.result as string);
        setIsCertUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Service Management
  const handleOpenServiceModal = (s?: Service) => {
    if (s) {
      setEditingService(s);
      setServiceFormData(s);
    } else {
      setEditingService(null);
      setServiceFormData({
        id: `srv-${Math.random().toString(36).substr(2, 5)}`,
        title: '',
        description: '',
        image: 'https://picsum.photos/seed/service/400/300',
        fee: 0,
        requiredDocs: [],
        category: 'Government',
        color: 'blue',
        estimatedDays: '5-7 working days',
        active: true
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceFormData.title || !serviceFormData.fee) {
      alert("Required fields: Service Title and Base Fee.");
      return;
    }

    const formData = new FormData();
    Object.keys(serviceFormData).forEach(key => {
      if (key === 'requiredDocs') {
        formData.append(key, JSON.stringify(serviceFormData[key]));
      } else if (key !== 'imageFile') {
        formData.append(key, (serviceFormData as any)[key]);
      }
    });

    if (serviceFormData.imageFile) {
      formData.append('image', serviceFormData.imageFile);
    }

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        // Refresh services list (assuming parent logic will handle this or we refetch)
        // For now, let's update local state if onUpdateServices is just a mock
        let updated;
        if (editingService) {
          updated = services.map(s => s.id === editingService.id ? result.data : s);
        } else {
          updated = [...services, result.data];
        }
        onUpdateServices(updated);
        setIsServiceModalOpen(false);
      } else {
        alert(result.message || "Failed to save service");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("An error occurred while saving the service.");
    }
  };

  const handleServiceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setServiceFormData(prev => ({
          ...prev,
          image: reader.result as string, // For preview
          imageFile: file // For actual upload
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleServiceStatus = (id: string) => {
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    onUpdateServices(updated);
  };

  const deleteService = (id: string) => {
    if (window.confirm("Are you sure you want to permanently decommission this service?")) {
      const updated = services.filter(s => s.id !== id);
      onUpdateServices(updated);
    }
  };

  // Testimonial Logic
  const handleOpenTestimonialModal = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setTestimonialFormData({ ...testimonial });
      setImageSource(testimonial.photo ? 'upload' : 'url');
    } else {
      setEditingTestimonial(null);
      setTestimonialFormData({ status: true, display_order: testimonials.length + 1 });
      setImageSource('url');
    }
    setIsTestimonialModalOpen(true);
  };

  const handleTestimonialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTestimonialFormData(prev => ({
          ...prev,
          photo: reader.result as string, // Preview
          photoFile: file // Actual file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTestimonial = async () => {
    if (!testimonialFormData.name || !testimonialFormData.comment) {
      alert("Name and Comment are required.");
      return;
    }

    const formData = new FormData();
    Object.keys(testimonialFormData).forEach(key => {
      if (key !== 'photoFile' && key !== 'photo') {
        formData.append(key, (testimonialFormData as any)[key]);
      }
    });

    if (testimonialFormData.photoFile) {
      formData.append('image', testimonialFormData.photoFile);
    } else if (testimonialFormData.photo_url) {
      formData.append('photo_url', testimonialFormData.photo_url);
    }

    try {
      const url = editingTestimonial ? `/api/testimonials/${editingTestimonial.id}` : '/api/testimonials';
      const method = editingTestimonial ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        let updated;
        if (editingTestimonial) {
          updated = testimonials.map(t => t.id === editingTestimonial.id ? result.data : t);
        } else {
          updated = [...testimonials, result.data];
        }
        onUpdateTestimonials(updated);
        setIsTestimonialModalOpen(false);
      } else {
        alert(result.message || "Failed to save testimonial");
      }
    } catch (error) {
      console.error("Error saving testimonial:", error);
      alert("An error occurred while saving the testimonial.");
    }
  };

  const reorderTestimonial = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...testimonials].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex(t => t.id === id);
    if (direction === 'up' && index > 0) {
      const currentOrder = sorted[index].display_order;
      const prevOrder = sorted[index - 1].display_order;
      sorted[index].display_order = prevOrder;
      sorted[index - 1].display_order = currentOrder;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const currentOrder = sorted[index].display_order;
      const nextOrder = sorted[index + 1].display_order;
      sorted[index].display_order = nextOrder;
      sorted[index + 1].display_order = currentOrder;
    }
    onUpdateTestimonials(sorted);
  };

  const toggleTestimonialStatus = (id: string) => {
    const updated = testimonials.map(item => item.id === id ? { ...item, status: !item.status } : item);
    onUpdateTestimonials(updated);
  };

  const deleteTestimonial = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this testimonial?")) {
      const updated = testimonials.filter(item => item.id !== id);
      onUpdateTestimonials(updated);
    }
  };

  // Profile Management Handlers
  const [profileFormData, setProfileFormData] = useState({
    name: profile.name,
    email: profile.email,
    currentPassword: '',
    newPassword: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileFormData)
      });

      const result = await response.json();
      if (response.ok) {
        setProfile(result);
        localStorage.setItem('admin_user', JSON.stringify(result));
        alert("Profile updated successfully!");
        setProfileFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (error) {
      alert("Error updating profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        const updatedProfile = { ...profile, avatar: result.avatar };
        setProfile(updatedProfile);
        localStorage.setItem('admin_user', JSON.stringify(updatedProfile));
        alert("Avatar updated!");
      } else {
        alert(result.message || "Failed to upload avatar");
      }
    } catch (error) {
      alert("Error uploading avatar");
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.customerName.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.mobile.includes(appSearch) ||
      app.id.toLowerCase().includes(appSearch.toLowerCase());
    const matchesStatus = appStatusFilter === 'ALL' || app.status === appStatusFilter;
    const matchesService = appServiceFilter === 'ALL' || app.serviceName === appServiceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const paginatedApps = filteredApplications.slice(
    (currentPage - 1) * appsPerPage,
    currentPage * appsPerPage
  );

  const downloadArtifact = (doc: { name: string, base64?: string, url: string }) => {
    const link = document.createElement('a');
    link.href = doc.base64 || doc.url;
    link.download = `Doc_${doc.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderServicesModule = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Service Catalog</h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Digital Seva Inventory Control</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => onUpdateViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View Layout"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View Layout"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={serviceSearch}
              onChange={e => setServiceSearch(e.target.value)}
              placeholder="Filter Services..."
              className="w-full sm:w-64 pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-100 text-[10px] font-black outline-none focus:ring-4 focus:ring-brand/10 shadow-sm transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenServiceModal()}
            className="px-6 py-3 bg-brand text-white rounded-2xl text-xs font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Service
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        {services.filter(s => s.title.toLowerCase().includes(serviceSearch.toLowerCase())).map(service => (
          viewMode === 'grid' ? (
            <div key={service.id} className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm luxury-shadow group transition-all duration-500 hover:scale-[1.02] flex flex-col h-fit">
              <div className="relative h-28 rounded-[2rem] overflow-hidden mb-4 border border-slate-50 bg-slate-50 p-1.5">
                <div className="w-full h-full rounded-[1.6rem] overflow-hidden">
                  <img
                    src={service.image.startsWith('/') ? `http://localhost:5000${service.image}` : service.image}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={service.title}
                  />
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white ${service.active ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    {service.active ? 'Active' : 'Offline'}
                  </div>
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-900 line-clamp-1 mb-1">{service.title}</h3>
              <p className="text-[9px] font-bold text-slate-400 mb-4 line-clamp-2 leading-relaxed">{service.description}</p>
              <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-50">
                <span className="text-xs font-black text-brand">₹{service.fee}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => handleOpenServiceModal(service)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit Service"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggleServiceStatus(service.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Toggle Status">{service.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}</button>
                  <button onClick={() => deleteService(service.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Delete Service"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ) : (
            <div key={service.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between group transition-all hover:bg-slate-50">
              <div className="flex items-center gap-6">
                <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-200">
                  <img src={service.image.startsWith('/') ? `http://localhost:5000${service.image}` : service.image} className="w-full h-full object-cover" alt={service.title} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">{service.title}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{service.category} • ₹{service.fee}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${service.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                  {service.active ? 'Active' : 'Offline'}
                </span>
                <div className="flex gap-1 border-l border-slate-200 pl-4">
                  <button onClick={() => handleOpenServiceModal(service)} className="p-2 text-blue-400 hover:bg-white rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => toggleServiceStatus(service.id)} className="p-2 text-slate-300 hover:text-brand transition-all">{service.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}</button>
                  <button onClick={() => deleteService(service.id)} className="p-2 text-red-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingService ? 'Edit Service Dossier' : 'New Service Integration'}</h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scroll">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Title</label><input value={serviceFormData.title || ''} onChange={e => setServiceFormData({ ...serviceFormData, title: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-black text-xs outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Fee (INR)</label><input type="number" value={serviceFormData.fee || 0} onChange={e => setServiceFormData({ ...serviceFormData, fee: Number(e.target.value) })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-black text-xs outline-none" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label><textarea rows={3} value={serviceFormData.description || ''} onChange={e => setServiceFormData({ ...serviceFormData, description: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-bold text-xs outline-none resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Stream</label>
                  <select value={serviceFormData.category} onChange={e => setServiceFormData({ ...serviceFormData, category: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-black text-xs outline-none appearance-none">
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Theme Palette</label>
                  <select value={serviceFormData.color} onChange={e => setServiceFormData({ ...serviceFormData, color: e.target.value as any })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-black text-xs outline-none appearance-none">
                    <option value="blue">Blue (Primary)</option>
                    <option value="green">Green (Digital)</option>
                    <option value="red">Red (Urgent)</option>
                    <option value="orange">Orange (Academic)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Image</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {serviceFormData.image ? (
                      <img
                        src={serviceFormData.image.startsWith('data:') ? serviceFormData.image : (serviceFormData.image.startsWith('/') ? `http://localhost:5000${serviceFormData.image}` : serviceFormData.image)}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:text-brand transition-all shadow-sm">
                      <Upload className="w-4 h-4" /> Choose from Local PC
                      <input type="file" className="hidden" accept="image/*" onChange={handleServiceImageChange} />
                    </label>
                    <p className="text-[9px] font-bold text-slate-400 mt-2">Recommended: 800x600px, max 5MB</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mandatory Artifacts (Comma Separated)</label>
                <input
                  value={serviceFormData.requiredDocs?.join(', ') || ''}
                  onChange={e => setServiceFormData({ ...serviceFormData, requiredDocs: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                  placeholder="Aadhar Card, Photo, Address Proof..."
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none"
                />
              </div>
              <button onClick={handleSaveService} className="w-full py-5 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">Synchronize Service Dossier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderApplicationsModule = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Application Dossier</h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Global Fulfillment Registry</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#003380] transition-colors" />
            <input
              value={appSearch}
              onChange={e => { setAppSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search Case ID..."
              className="w-full sm:w-64 pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-100 text-[10px] font-black outline-none focus:ring-4 focus:ring-brand/10 shadow-sm transition-all"
            />
          </div>
          <select
            value={appStatusFilter}
            onChange={e => { setAppStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-6 py-3 bg-white rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm"
          >
            <option value="ALL">All Status</option>
            {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm luxury-shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Case ID</th>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Applicant</th>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Stream</th>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Stage</th>
              <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedApps.map(app => (
              <tr key={app.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="px-8 py-5"><span className="font-mono text-[10px] font-black text-brand">#{app.id}</span></td>
                <td className="px-8 py-5"><div className="flex flex-col"><span className="text-xs font-black text-slate-900">{app.customerName}</span><span className="text-[10px] font-bold text-slate-400">+91 {app.mobile}</span></div></td>
                <td className="px-8 py-5"><div className="flex flex-col"><span className="text-xs font-black text-slate-700">{app.serviceName}</span><span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(app.timestamp).toLocaleDateString()}</span></div></td>
                <td className="px-8 py-5"><div className="flex flex-col"><span className="text-xs font-black text-slate-900">₹{app.amount}</span><span className="text-[8px] font-black uppercase text-emerald-500">{app.paymentStatus}</span></div></td>
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase border ${app.status === ApplicationStatus.PENDING ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    app.status === ApplicationStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right"><button onClick={() => handleOpenAppDetails(app)} className="p-2.5 text-[#003380] hover:bg-slate-50 rounded-xl transition-all"><Eye className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredApplications.length > appsPerPage && (
          <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">Showing {paginatedApps.length} of {filteredApplications.length} cases</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase disabled:opacity-50">Prev</button>
              <button disabled={currentPage * appsPerPage >= filteredApplications.length} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[3.5rem] w-full max-w-6xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#003380] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20"><ClipboardList /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Dossier Detail</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reference: {selectedApp.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-3 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-7 h-7" /></button>
            </div>

            <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10 max-h-[75vh] overflow-y-auto">
              <div className="lg:col-span-2 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-[#003380] uppercase tracking-widest mb-6">Identity Profile</h4>
                    <div className="space-y-4">
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Legal Name</p><p className="text-base font-black text-slate-900">{selectedApp.customerName}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Channel</p><p className="text-base font-black text-slate-900">+91 {selectedApp.mobile}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Verification Address</p><p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{selectedApp.address}"</p></div>
                    </div>
                  </div>
                  <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-[#003380] uppercase tracking-widest mb-4">Financial Log</h4>
                      <div className="flex justify-between items-center mb-2"><span className="text-[11px] font-bold text-slate-400 uppercase">Service Fee</span><span className="text-xl font-black text-slate-900">₹{selectedApp.amount}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-400 uppercase">Payment Token</span><span className="text-xs font-black text-slate-700">{selectedApp.paymentId}</span></div>
                    </div>
                    <div className={`mt-6 px-4 py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest ${selectedApp.paymentStatus === 'PAID' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg'}`}>Payment Status: {selectedApp.paymentStatus}</div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Artifact Manifest ({selectedApp.documents.length})</h4></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedApp.documents.map((doc, i) => (
                      <div key={i} className="group p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-500/30 transition-all flex items-center justify-between shadow-sm hover:shadow-xl">
                        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">{doc.type.includes('image') ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}</div><div><p className="text-xs font-black text-slate-900 line-clamp-1">{doc.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{doc.type.split('/')[1]}</p></div></div>
                        <div className="flex items-center gap-2"><button onClick={() => downloadArtifact(doc)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors" title="Download Source"><Download className="w-4 h-4" /></button><button onClick={() => window.open(doc.base64 || doc.url, '_blank')} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors" title="Launch Preview"><ExternalLink className="w-4 h-4" /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 opacity-5"><ShieldCheck className="w-48 h-48" /></div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-3"><ShieldAlert className="w-3.5 h-3.5" /> Stage Transition Control</h4>
                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Update Status To</label><select value={newStatus} onChange={e => setNewStatus(e.target.value as ApplicationStatus)} className="w-full px-5 py-4 bg-white/10 rounded-2xl font-black text-xs outline-none border border-white/5 focus:border-white/20 transition-all text-white appearance-none">{Object.values(ApplicationStatus).map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Administrative Feedback</label><textarea rows={4} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder={newStatus === ApplicationStatus.REJECTED ? "Mandatory: Enter rejection grounds..." : "Internal notes or client instructions..."} className="w-full px-5 py-4 bg-white/10 rounded-2xl font-bold text-xs outline-none border border-white/5 focus:border-white/20 transition-all text-white resize-none" /></div>
                    {newStatus === ApplicationStatus.COMPLETED && (
                      <div className="space-y-3 animate-in slide-in-from-top-4">
                        <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1">Issuance Deliverable</label>
                        <div className={`p-6 rounded-[2rem] border-2 border-dashed ${certFile ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-white/10'} transition-all group/upload`}>
                          {isCertUploading ? (<div className="flex flex-col items-center gap-3 py-4"><Loader2 className="w-6 h-6 animate-spin text-white" /><span className="text-[10px] font-black uppercase tracking-widest">Encrypting Artifact...</span></div>) : certFile ? (<div className="flex flex-col items-center gap-4 text-center"><div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileCheck className="w-8 h-8" /></div><p className="text-[10px] font-black text-white uppercase tracking-widest">Artifact Ready</p><button onClick={() => setCertFile(null)} className="text-[9px] font-black text-red-400 uppercase hover:underline transition-all">Revoke Artifact</button></div>) : (<label className="cursor-pointer flex flex-col items-center gap-4 py-2"><div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover/upload:text-white group-hover/upload:bg-white/10 transition-all"><Upload className="w-6 h-6" /></div><div className="text-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upload Issued Artifact</span></div><input type="file" className="hidden" accept="image/jpeg,application/pdf" onChange={handleCertUpload} /></label>)}
                        </div>
                      </div>
                    )}
                    <button onClick={handleUpdateAppStatus} disabled={statusUpdating || isCertUploading} className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${statusUpdating ? 'bg-white/10 text-white/40 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}>{statusUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Commit Log Entry</>}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboardOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Platform Portfolio', value: stats.totalServices, icon: Grid, gradient: 'from-blue-600 to-indigo-700' },
          { label: 'Active Pipeline', value: stats.pendingApplications, icon: Clock, gradient: 'from-orange-400 to-amber-500' },
          { label: 'Citizen Inquiries', value: stats.unreadEnquiries, icon: Mail, gradient: 'from-red-500 to-rose-600' },
          { label: 'Fulfillment Total', value: stats.completedApplications, icon: CheckCircle2, gradient: 'from-emerald-600 to-teal-700' }
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.gradient} p-6 rounded-[2rem] text-white shadow-xl h-40 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 shadow-2xl`}>
            <div className="absolute top-0 right-0 p-3 opacity-10"><card.icon className="w-20 h-20" /></div>
            <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em] mb-1">{card.label}</p>
            <h3 className="text-3xl font-black tracking-tighter">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 luxury-shadow">
          <div className="flex justify-between items-center mb-10">
            <div><h3 className="text-lg font-black text-slate-900 tracking-tight">Intelligence Matrix</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global System Synchronization</p></div>
            <button onClick={fetchAiInsight} className="p-3 bg-blue-50 text-[#003380] rounded-xl hover:rotate-180 transition-all duration-700"><Activity className="w-5 h-5" /></button>
          </div>
          <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative overflow-hidden min-h-[300px]">
            {isAiLoading ? (<div className="flex flex-col items-center justify-center h-full py-10"><div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[#003380] animate-spin" /><p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing with Gemini-3 Pro...</p></div>) : (<div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000"><div className="flex items-center gap-3 mb-6"><div className="px-3 py-1 bg-[#003380] text-white rounded-lg text-[9px] font-black tracking-widest uppercase">Strategic Priority</div><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /></div><p className="text-slate-600 font-bold text-lg leading-relaxed italic whitespace-pre-line">"{aiInsight}"</p></div>)}
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 luxury-shadow"><h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Active Load</h3><div className="h-64 relative mb-6"><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />)}</Pie><Tooltip /></RePieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-black text-slate-900 tracking-tighter">{applications.length}</span><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Apps</span></div></div></div>
      </div>
    </div>
  );

  const renderTestimonialsModule = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-black text-slate-900 tracking-tight">Social Trust Management</h2><p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Testimonials & Reputation Feedback</p></div>
        <button onClick={() => handleOpenTestimonialModal()} className="flex items-center gap-2 px-6 py-3 bg-[#003380] text-white rounded-2xl text-xs font-black shadow-lg hover:scale-105 transition-all"><Plus className="w-4 h-4" /> Add New Feedback</button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm luxury-shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Order</th>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Feedback Snapshot</th>
              <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {testimonials.sort((a, b) => a.display_order - b.display_order).map((t, idx, arr) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#003380]">{t.display_order}</span>
                    <div className="flex flex-col gap-0.5">
                      <button disabled={idx === 0} onClick={() => reorderTestimonial(t.id, 'up')} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
                      <button disabled={idx === arr.length - 1} onClick={() => reorderTestimonial(t.id, 'down')} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.photo ? (t.photo.startsWith('data:') ? t.photo : `http://localhost:5000${t.photo}`) : t.photo_url || `https://ui-avatars.com/api/?name=${t.name}`}
                      className="w-10 h-10 rounded-full border-2 border-slate-100 shadow-sm object-cover"
                    />
                    <div className="flex flex-col"><span className="text-xs font-black text-slate-900">{t.name}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.designation}</span></div>
                  </div>
                </td>
                <td className="px-8 py-4"><p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic max-w-xs">"{t.comment}"</p></td>
                <td className="px-8 py-4">
                  <button onClick={() => toggleTestimonialStatus(t.id)} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${t.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {t.status ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenTestimonialModal(t)} className="p-2 text-blue-400 hover:text-blue-600 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => deleteTestimonial(t.id)} className="p-2 text-red-400 hover:text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Testimonial Record</h3>
              <button onClick={() => setIsTestimonialModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</label><input value={testimonialFormData.name || ''} onChange={e => setTestimonialFormData({ ...testimonialFormData, name: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</label><input value={testimonialFormData.designation || ''} onChange={e => setTestimonialFormData({ ...testimonialFormData, designation: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Feedback</label><textarea rows={3} value={testimonialFormData.comment || ''} onChange={e => setTestimonialFormData({ ...testimonialFormData, comment: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none" /></div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Source</label><div className="flex bg-white rounded-lg p-0.5 border border-slate-200"><button onClick={() => setImageSource('upload')} className={`p-1.5 rounded-md ${imageSource === 'upload' ? 'bg-[#003380] text-white' : 'text-slate-300'}`}><Upload className="w-3 h-3" /></button><button onClick={() => setImageSource('url')} className={`p-1.5 rounded-md ${imageSource === 'url' ? 'bg-[#003380] text-white' : 'text-slate-300'}`}><LucideLink className="w-3 h-3" /></button></div></div>
                {imageSource === 'upload' ? (
                  <div className="flex items-center gap-4">
                    <label className="shrink-0 cursor-pointer w-12 h-12 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-[#003380] transition-all">
                      <Upload className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleTestimonialImageUpload} />
                    </label>
                    {(testimonialFormData.photo || testimonialFormData.photo_url) && (
                      <img
                        src={testimonialFormData.photo?.startsWith('data:') ? testimonialFormData.photo : (testimonialFormData.photo?.startsWith('/') ? `http://localhost:5000${testimonialFormData.photo}` : testimonialFormData.photo_url)}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <input value={testimonialFormData.photo_url || ''} onChange={e => setTestimonialFormData({ ...testimonialFormData, photo_url: e.target.value, photo: '' })} className="w-full px-4 py-3 bg-white rounded-xl font-bold text-[10px] outline-none border border-slate-100" placeholder="https://external-image-link.com/avatar.jpg" />
                )}
              </div>
              <button onClick={handleSaveTestimonial} className="w-full py-4 bg-[#003380] text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">Synchronize Social Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEnquiriesModule = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center"><div><h2 className="text-3xl font-black text-slate-900 tracking-tighter">Engagement Lead Cell</h2><p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Inbound Professional Citizen Requests</p></div></div>
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm luxury-shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr><th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity</th><th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile</th><th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Message Snapshot</th><th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timeline</th><th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Control</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {enquiries.map(enquiry => (
              <tr key={enquiry.id} className={`hover:bg-slate-50/80 transition-all group ${!enquiry.isRead ? 'bg-blue-50/20' : ''}`}><td className="px-8 py-5"><div className="flex items-center gap-3">{!enquiry.isRead && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}<span className="text-xs font-black text-slate-900">{enquiry.name}</span></div></td><td className="px-8 py-5 font-bold text-xs">+91 {enquiry.mobile}</td><td className="px-8 py-5 text-[11px] font-medium text-slate-500 line-clamp-1 max-w-xs">{enquiry.message}</td><td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase">{new Date(enquiry.timestamp).toLocaleDateString()}</td><td className="px-8 py-5 text-right"><button className="p-3 text-[#003380] hover:bg-white rounded-xl transition-all shadow-sm"><Eye className="w-4 h-4" /></button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettingsModule = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">System Configuration</h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Platform Core & Communication Logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Management Section */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 luxury-shadow space-y-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
              <User className="w-5 h-5 text-brand" /> Profile Management
            </h3>

            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-brand flex items-center justify-center text-white text-3xl font-black overflow-hidden shadow-xl shadow-brand/20">
                  {profile.avatar ? <img src={profile.avatar.startsWith('/') ? `http://localhost:5000${profile.avatar}` : profile.avatar} className="w-full h-full object-cover" alt="Avatar" /> : profile.name.charAt(0)}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center cursor-pointer text-brand hover:scale-110 transition-all">
                  <Upload className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs font-black text-slate-900">{profile.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{profile.role}</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input
                    value={profileFormData.name}
                    onChange={e => setProfileFormData({ ...profileFormData, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:bg-white focus:ring-4 focus:ring-brand/5 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Identity</label>
                  <input
                    type="email"
                    value={profileFormData.email}
                    onChange={e => setProfileFormData({ ...profileFormData, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:bg-white focus:ring-4 focus:ring-brand/5 transition-all"
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-[9px] font-black text-[#003380] uppercase tracking-widest">Security Credentials Update</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Current Password</label>
                    <input
                      type="password"
                      value={profileFormData.currentPassword}
                      onChange={e => setProfileFormData({ ...profileFormData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">New Password</label>
                    <input
                      type="password"
                      value={profileFormData.newPassword}
                      onChange={e => setProfileFormData({ ...profileFormData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex-1 py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Save Account Changes</>}
                </button>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all"
                >
                  Logout
                </button>
              </div>
            </form>
          </div>

          {/* Website Branding Settings */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 luxury-shadow space-y-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-500" /> Branding & Content
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Name</label>
                  <input value={aboutContent.title} onChange={e => onUpdateAbout({ ...aboutContent, title: e.target.value })} className="w-full px-5 py-3 bg-slate-50 rounded-xl font-black text-xs outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Slogan</label>
                  <input value={aboutContent.subtitle} onChange={e => onUpdateAbout({ ...aboutContent, subtitle: e.target.value })} className="w-full px-5 py-3 bg-slate-50 rounded-xl font-black text-xs outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Description</label>
                <textarea rows={3} value={aboutContent.description} onChange={e => onUpdateAbout({ ...aboutContent, description: e.target.value })} className="w-full px-5 py-3 bg-slate-50 rounded-xl font-bold text-xs outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission Statement</label>
                  <textarea rows={2} value={aboutContent.mission} onChange={e => onUpdateAbout({ ...aboutContent, mission: e.target.value })} className="w-full px-5 py-3 bg-slate-50 rounded-xl font-bold text-xs outline-none resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vision Statement</label>
                  <textarea rows={2} value={aboutContent.vision} onChange={e => onUpdateAbout({ ...aboutContent, vision: e.target.value })} className="w-full px-5 py-3 bg-slate-50 rounded-xl font-bold text-xs outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Logs */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 luxury-shadow flex flex-col h-[500px]">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3 mb-6">
            <Smartphone className="w-5 h-5 text-brand" /> Communication Logs
          </h3>
          <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-2">
            {notificationLogs.length > 0 ? notificationLogs.map((log, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.type === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {log.type === 'WhatsApp' ? <MessageSquare className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900">To: {log.to}</p>
                    <p className="text-[9px] font-bold text-slate-400 line-clamp-1">{log.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{log.status}</span>
                  <p className="text-[8px] font-bold text-slate-300 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">No Recent Transmissions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 luxury-shadow">
        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3 mb-8">
          <Send className="w-5 h-5 text-brand" /> Automated Message Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messageTemplates.map((template) => (
            <div key={template.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${template.type === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {template.type}
                  </span>
                  <button
                    onClick={() => {
                      const updated = messageTemplates.map(t => t.id === template.id ? { ...t, active: !t.active } : t);
                      setMessageTemplates(updated);
                      saveMessageTemplates(updated);
                    }}
                    className={`p-1.5 rounded-lg transition-all ${template.active ? 'text-emerald-500' : 'text-slate-300'}`}
                  >
                    {template.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
                <h4 className="text-xs font-black text-slate-900 mb-2">{template.name}</h4>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">"{template.content}"</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Trigger: {template.trigger}</span>
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-2 text-[#003380] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingTemplate && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Template</h3>
              <button onClick={() => setEditingTemplate(null)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Template Name</label>
                <input value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-black text-xs outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content (Use [Name], [Service], [ID], [Status] as placeholders)</label>
                <textarea rows={4} value={editingTemplate.content} onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 rounded-xl font-bold text-xs outline-none resize-none" />
              </div>
              <button
                onClick={() => {
                  const updated = messageTemplates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
                  setMessageTemplates(updated);
                  saveMessageTemplates(updated);
                  setEditingTemplate(null);
                }}
                className="w-full py-5 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Save Template Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const pieData = [
    { name: 'Queue', value: stats.pendingApplications, color: '#F97316' },
    { name: 'Processing', value: applications.filter(a => a.status === ApplicationStatus.REVIEWING || a.status === ApplicationStatus.VERIFYING).length, color: '#3B82F6' },
    { name: 'Ready', value: stats.completedApplications, color: '#10B981' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside
        className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'} bg-white border-r border-slate-100 flex flex-col fixed h-screen z-40 luxury-shadow transition-all duration-300 ease-in-out`}
      >
        <div className={`p-8 pb-10 flex flex-col items-center gap-4 ${sidebarCollapsed ? 'px-4' : ''}`}>
          <img
            src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png"
            className={`${sidebarCollapsed ? 'h-8' : 'h-16'} w-auto transition-all duration-300`}
            alt="Digital India"
          />
          {!sidebarCollapsed && <h1 className="text-xl font-black tracking-tighter text-brand leading-none">Command Hub</h1>}
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scroll">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4 px-6'} py-4 rounded-2xl text-xs font-black transition-all relative ${activeMenu === item.name ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
              title={sidebarCollapsed ? item.name : ''}
            >
              <item.icon className={`w-4 h-4 ${activeMenu === item.name ? 'text-white' : 'text-slate-300'}`} />
              {!sidebarCollapsed && <span className="flex-1 text-left">{item.name}</span>}
              {!sidebarCollapsed && item.badge && (
                <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[8px] font-black animate-pulse shadow-lg shadow-red-500/30">
                  {item.badge}
                </span>
              )}
              {sidebarCollapsed && item.badge && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className={`flex-1 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[280px]'} transition-all duration-300 ease-in-out`}>
        <header className="h-20 bg-white/80 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-brand hover:bg-white border border-slate-100 rounded-xl transition-all shadow-sm group"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-black tracking-tight text-slate-900">{activeMenu}</h2>
            </div>
          </div>

          <div className="relative">
            <div
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-6 group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none mb-1">{profile.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                  {profile.role === 'admin' ? 'Strategic Administrator' : 'Staff Official'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-lg shadow-brand/20 group-hover:scale-105 transition-all">
                {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" /> : profile.name.charAt(0)}
              </div>
            </div>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-4 w-60 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
                  <div className="px-4 py-4 border-b border-slate-50 mb-1">
                    <p className="text-xs font-black text-slate-900 leading-none mb-1">{profile.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 truncate">{profile.email}</p>
                  </div>
                  <button
                    onClick={() => { setActiveMenu('Settings'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-brand transition-all"
                  >
                    <User className="w-4 h-4" /> View Profile
                  </button>
                  <button
                    onClick={() => { setActiveMenu('Settings'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-brand transition-all"
                  >
                    <Settings className="w-4 h-4" /> Account Settings
                  </button>
                  <div className="border-t border-slate-50 mt-1 pt-1">
                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black text-red-500 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Logout Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>
        <div className="p-10">
          {activeMenu === 'Dashboard' ? renderDashboardOverview() :
            activeMenu === 'Services' ? renderServicesModule() :
              activeMenu === 'Applications' ? renderApplicationsModule() :
                activeMenu === 'Testimonials' ? renderTestimonialsModule() :
                  activeMenu === 'Enquiries' ? renderEnquiriesModule() :
                    activeMenu === 'Settings' ? renderSettingsModule() :
                      null}
        </div>
      </main>
    </div>
  );
};