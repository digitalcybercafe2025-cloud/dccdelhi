import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Mail, MessageCircle, Check, Trash, Search, ExternalLink, X } from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationsManager: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Admin Communications</h1>
                    <p className="text-slate-400 text-xs font-bold mt-1">Manage platform inquiries and global system alerts</p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                    <Check className="w-4 h-4" /> Mark All Read
                </button>
            </div>

            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/20 rounded-[2rem] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-24 flex flex-col items-center opacity-40">
                        <Mail className="w-12 h-12 mb-4 text-slate-400" />
                        <span className="font-black uppercase tracking-[0.3em] text-sm text-slate-500">Inbox Zero</span>
                        <p className="text-slate-400 text-xs font-bold mt-2">No new communications received.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map((notif) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={notif._id}
                                className={`p-6 transition-all duration-300 relative group flex flex-col lg:flex-row gap-6 items-start lg:items-center ${notif.isRead ? 'bg-white opacity-70' : 'bg-slate-50/80 border-l-4 border-l-blue-500'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${notif.type === 'contact' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {notif.type}
                                        </div>
                                        {!notif.isRead && (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                            </span>
                                        )}
                                        <p className="text-xs font-bold text-slate-400 ml-auto lg:ml-0">
                                            {new Date(notif.createdAt).toLocaleString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{notif.userName}</h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2 pr-4">{notif.message}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
                                    <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto text-sm font-bold text-slate-600 mr-4 border-l border-slate-100 pl-4 py-1">
                                        <p className="text-xs tracking-tight">{notif.mobile}</p>
                                        <p className="text-[11px] text-slate-400">{notif.email || 'No email'}</p>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-2">
                                        <a
                                            href={`https://wa.me/91${notif.mobile}?text=${encodeURIComponent(`Hello ${notif.userName},\n\nThank you for contacting Digital Cyber Cafe. We received your message: "${notif.message}".\n\nHow can we help you today?`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => !notif.isRead && markAsRead(notif._id)}
                                            className="w-10 h-10 bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                            title="Send WhatsApp"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                        </a>
                                        <a
                                            href={`mailto:${notif.email}?subject=Regarding your query – Digital Cyber Cafe&body=${encodeURIComponent(`Hello ${notif.userName},\n\nThank you for contacting Digital Cyber Cafe. We have received your message: "${notif.message}".\n\nHow can we help you today?`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => !notif.isRead && markAsRead(notif._id)}
                                            className={`w-10 h-10 ${notif.email ? 'bg-blue-50 hover:bg-blue-500 hover:text-white text-blue-600' : 'bg-slate-100 text-slate-300 pointer-events-none'} rounded-xl flex items-center justify-center transition-all shadow-sm`}
                                            title="Send Email"
                                        >
                                            <Mail className="w-5 h-5" />
                                        </a>
                                        {!notif.isRead && (
                                            <button
                                                onClick={() => markAsRead(notif._id)}
                                                className="w-10 h-10 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                                title="Mark as Read"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsManager;
