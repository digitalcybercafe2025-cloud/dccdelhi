import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../../components/Hero';
import { ServiceCard } from '../../components/ServiceCard';
import { TestimonialSection } from '../../components/TestimonialSection';
import { ChevronRight } from 'lucide-react';
import { Service, Message, Testimonial } from '../../types';
import { SERVICES, MESSAGES, TESTIMONIALS } from '../../constants';

import { Link } from 'react-router-dom';
import api from '../api/axios';

// In-memory persistent cache across route transitions
const cachedHomeData: {
    services: Service[] | null;
    messages: any[] | null;
    slides: any[] | null;
    testimonials: Testimonial[] | null;
} = {
    services: null,
    messages: null,
    slides: null,
    testimonials: null,
};

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>(() => cachedHomeData.services || SERVICES.slice(0, 8));
    const [messages, setMessages] = useState<any[]>(() => cachedHomeData.messages || MESSAGES);
    const [slides, setSlides] = useState<any[]>(() => cachedHomeData.slides || []);
    const [testimonials, setTestimonials] = useState<Testimonial[]>(() => cachedHomeData.testimonials || TESTIMONIALS);

    useEffect(() => {
        let isMounted = true;
        const fetchHomeData = async () => {
            try {
                const [svcRes, testRes, slideRes, noticeRes] = await Promise.allSettled([
                    api.get('/services'),
                    api.get('/testimonials'),
                    api.get('/hero/slides/active'),
                    api.get('/hero/notices/active')
                ]);

                if (svcRes.status === 'fulfilled' && svcRes.value?.data?.success && Array.isArray(svcRes.value.data.data) && svcRes.value.data.data.length > 0) {
                    const svcList = svcRes.value.data.data.slice(0, 8);
                    cachedHomeData.services = svcList;
                    if (isMounted) setServices(svcList);
                }

                if (testRes.status === 'fulfilled' && testRes.value?.data?.success && Array.isArray(testRes.value.data.data) && testRes.value.data.data.length > 0) {
                    const mapped = testRes.value.data.data.map((t: any) => ({
                        id: t._id,
                        name: t.name || 'Customer',
                        comment: t.message || '',
                        rating: t.rating || 5,
                        designation: t.role || 'Citizen',
                        photo_url: t.image || '',
                        status: t.active !== false,
                        display_order: t.order || 0
                    }));
                    if (mapped.length > 0) {
                        cachedHomeData.testimonials = mapped;
                        if (isMounted) setTestimonials(mapped);
                    }
                }

                if (slideRes.status === 'fulfilled' && slideRes.value?.data?.success && Array.isArray(slideRes.value.data.data) && slideRes.value.data.data.length > 0) {
                    cachedHomeData.slides = slideRes.value.data.data;
                    if (isMounted) setSlides(slideRes.value.data.data);
                }
                if (noticeRes.status === 'fulfilled' && noticeRes.value?.data?.success && Array.isArray(noticeRes.value.data.data) && noticeRes.value.data.data.length > 0) {
                    cachedHomeData.messages = noticeRes.value.data.data;
                    if (isMounted) setMessages(noticeRes.value.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch home data", error);
            }
        };

        fetchHomeData();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="animate-in fade-in duration-1000">
            <Hero messages={messages} slides={slides} />
            <section className="max-w-[1500px] mx-auto py-12 px-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id || (service as any)._id}
                            service={service}
                            onApply={() => navigate(`/apply/${service.id || (service as any)._id}`)}
                        />
                    ))}
                </div>
                <div className="mt-8 md:mt-12 flex justify-center">
                    <Link to="/services" className="px-6 md:px-10 py-3 md:py-4 border border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs text-slate-400 hover:text-brand hover:border-brand transition-all shadow-lg flex items-center gap-2 md:gap-3 group" style={{ backgroundColor: 'var(--card-bg)' }}>
                        Show More Services <ChevronRight className="w-3.5 md:w-4 h-3.5 md:h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            <TestimonialSection testimonials={testimonials} />
        </div>
    );
};
