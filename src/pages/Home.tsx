import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../../components/Hero';
import { ServiceCard } from '../../components/ServiceCard';
import { TestimonialSection } from '../../components/TestimonialSection';
import { ChevronRight } from 'lucide-react';
import { Service, Message, Testimonial } from '../../types';
import { MESSAGES, TESTIMONIALS } from '../../constants';



import { Link } from 'react-router-dom';
import api from '../api/axios';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [slides, setSlides] = useState<any[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [svcRes, testRes, slideRes, noticeRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/testimonials'),
                    api.get('/hero/slides/active'),
                    api.get('/hero/notices/active')
                ]);

                if (svcRes.data.success) setServices(svcRes.data.data.slice(0, 8));

                if (testRes.data.success) {
                    const mapped = testRes.data.data.map((t: any) => ({
                        id: t._id,
                        name: t.name,
                        comment: t.message,
                        rating: t.rating,
                        designation: t.role,
                        photo_url: t.image,
                        status: t.active,
                        display_order: t.order
                    }));
                    setTestimonials(mapped);
                }

                if (slideRes.data.success) setSlides(slideRes.data.data);
                if (noticeRes.data.success) setMessages(noticeRes.data.data);
            } catch (error) {
                console.error("Failed to fetch home data", error);
            }
        };

        fetchHomeData();
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
