import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from '../../components/ServiceCard';
import { Service } from '../../types';
import api from '../api/axios';
import { Loader2 } from 'lucide-react';

export const AllServices: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/services');
                if (response.data.success) {
                    setServices(response.data.data);
                } else {
                    setError('Failed to load services.');
                }
            } catch (err) {
                console.error("Failed to fetch services", err);
                setError('Failed to load services. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
                <Loader2 className="w-10 h-10 animate-spin text-brand dark:text-emerald-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
                <div className="text-center">
                    <p className="text-red-500 font-bold mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-brand dark:bg-emerald-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen transition-colors duration-500 pt-24 pb-12 px-6" style={{ backgroundColor: 'var(--app-bg)' }}>
            <div className="max-w-[1500px] mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="w-10 h-1 bg-brand dark:bg-emerald-500 rounded-full"></span>
                        <span className="text-[10px] font-black text-brand dark:text-emerald-400 uppercase tracking-[0.2em]">Full Portfolio</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">All Services</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-lg leading-relaxed max-w-2xl">Browse our complete catalog of government and digital services.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id || (service as any)._id}
                            service={service}
                            onApply={() => navigate(`/apply/${service.id || (service as any)._id}`)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
