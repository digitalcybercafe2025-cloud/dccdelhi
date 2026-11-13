import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from '../../components/ServiceCard';
import { Service } from '../../types';
import { SERVICES } from '../../constants';
import api from '../api/axios';
import { Loader2 } from 'lucide-react';

let cachedAllServices: Service[] | null = null;

export const AllServices: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>(() => cachedAllServices || SERVICES);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchServices = async () => {
            try {
                const response = await api.get('/services');
                if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    cachedAllServices = response.data.data;
                    if (isMounted) setServices(response.data.data);
                }
            } catch (err) {
                console.warn("Failed to fetch dynamic services, using fallback", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchServices();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: 'var(--app-bg)' }}>
                <Loader2 className="w-10 h-10 animate-spin text-brand dark:text-emerald-500" />
            </div>
        );
    }

    if (error && services.length === 0) {
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
        <div className="min-h-screen transition-colors duration-500 pt-5 md:pt-7 pb-12 px-4 md:px-6" style={{ backgroundColor: 'var(--app-bg)' }}>
            <div className="max-w-[1500px] mx-auto">
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-8 h-1 bg-brand dark:bg-emerald-500 rounded-full"></span>
                        <span className="text-[10px] font-black text-brand dark:text-emerald-400 uppercase tracking-[0.2em]">Full Portfolio</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tighter">All Services</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm md:text-base leading-relaxed max-w-2xl">Browse our complete catalog of government and digital services.</p>
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
