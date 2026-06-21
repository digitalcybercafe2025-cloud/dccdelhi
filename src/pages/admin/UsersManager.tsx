import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Shield, Search, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../api/axios';

interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'staff';
    avatar?: string;
    createdAt: string;
}

const UsersManager: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff' as 'admin' | 'staff'
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user?: AdminUser) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'staff'
            });
        }
        setIsModalOpen(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingUser) {
                await api.put(`/admin/users/${editingUser._id}`, formData);
            } else {
                await api.post('/admin/register', formData);
            }
            fetchUsers();
            setIsModalOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await api.delete(`/admin/users/${id}`);
                fetchUsers();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">User Management</h2>
                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Admin & Staff Control Center</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg hover:scale-105 transition-all"
                >
                    <UserPlus className="w-4 h-4" /> Add Authorized User
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm luxury-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                                <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Joined On</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Personnel...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold text-sm">No users found.</td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user._id} className="hover:bg-slate-50 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg overflow-hidden">
                                                {user.avatar ? <img src={user.avatar.startsWith('/') ? `http://localhost:5000${user.avatar}` : user.avatar} className="w-full h-full object-cover" alt="avatar" /> : user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{user.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                            <Shield className="w-3 h-3" /> {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(user)} className="p-2 text-blue-500 hover:bg-white rounded-xl transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(user._id, user.name)} className="p-2 text-red-500 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] w-full max-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingUser ? 'Edit User Authorization' : 'New User Integration'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                <RefreshCw className="w-5 h-5 hover:rotate-180 transition-all duration-700" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Identity Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Access Address</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    placeholder="john@digitalcybercafe.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingUser ? 'New Password (Leave blank to keep current)' : 'Initial Password'}</label>
                                <input
                                    required={!editingUser}
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Authorization Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-xs outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                                >
                                    <option value="staff">Staff Official</option>
                                    <option value="admin">Strategic Administrator</option>
                                </select>
                            </div>
                            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
                            <button
                                disabled={saving}
                                type="submit"
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingUser ? 'Update Session Profile' : 'Synchronize User Access'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManager;
