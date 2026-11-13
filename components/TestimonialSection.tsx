import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Testimonial } from '../types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { getMediaUrl } from '../src/api/axios';

interface TestimonialSectionProps {
  testimonials: Testimonial[];
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({ testimonials }) => {
  const filtered = (testimonials || [])
    .filter(t => (t as any).status !== undefined ? (t as any).status : (t as any).active)
    .sort((a, b) => ((a as any).display_order || (a as any).order || 0) - ((b as any).display_order || (b as any).order || 0));

  const activeTestimonials = filtered.length > 0 ? filtered : (testimonials || []);

  if (activeTestimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-12 px-8 transition-colors duration-500 overflow-hidden" style={{ backgroundColor: 'var(--section-bg)' }}>
      <style>{`
        .testimonial-card {
          background: var(--app-bg);
          border-radius: 1rem;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: auto;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .dark .testimonial-card {
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
        }

        .avatar-ring {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          flex-shrink: 0;
        }

        .avatar-ring img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid white;
        }
        
        .dark .avatar-ring img {
          border-color: #0f172a;
        }

        .testimonial-comment {
          font-style: italic;
          color: var(--text-secondary);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 2.5rem;
          max-width: 90%;
        }

        /* Strict 5px Gap Implementation */
        .swiper-container-custom {
          padding-bottom: 5px !important;
          margin-bottom: 0 !important;
        }

        .test-pagination {
          margin-top: 5px !important; 
          display: flex;
          justify-content: center;
          gap: 6px;
          height: 8px;
          line-height: 0;
        }

        .test-pagination .swiper-pagination-bullet {
          background: #cbd5e1 !important;
          opacity: 0.6;
          width: 8px;
          height: 8px;
          margin: 0 !important;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .test-pagination .swiper-pagination-bullet-active {
          background: #3b82f6 !important;
          opacity: 1;
        }

        .dark .test-pagination .swiper-pagination-bullet-active {
          background: #10b981 !important;
        }

        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.3s ease;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .dark .nav-arrow {
          color: #10b981;
        }

        .nav-arrow:hover {
          scale: 1.2;
        }

        .nav-arrow-prev { left: -10px; }
        .nav-arrow-next { right: -10px; }

        @media (max-width: 1024px) {
          .nav-arrow-prev { left: 0; }
          .nav-arrow-next { right: 0; }
        }

        @media (max-width: 768px) {
          .nav-arrow { display: none; }
          .swiper-container-custom { padding: 0 !important; }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight" style={{ color: 'var(--text-color)', opacity: 0.9 }}>
            What Our Customers Say
          </h2>
          <p className="font-medium max-w-2xl mx-auto leading-relaxed text-sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
            We take pride in providing the best services to our clients. Here's what they have to say about us.
          </p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={30}
            loop={activeTestimonials.length > 3}
            speed={800}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            navigation={{
              prevEl: '.nav-arrow-prev',
              nextEl: '.nav-arrow-next',
            }}
            pagination={{
              clickable: true,
              el: '.test-pagination',
            }}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="swiper-container-custom"
          >
            {activeTestimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <div className="testimonial-card">
                  <div className="avatar-ring">
                    <img
                      src={
                        (testimonial as any).photo_url || (testimonial as any).image || (testimonial as any).photo
                          ? getMediaUrl((testimonial as any).photo_url || (testimonial as any).image || (testimonial as any).photo)
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}`
                      }
                      alt={testimonial.name}
                      loading="lazy"
                    />
                  </div>

                  <p className="testimonial-comment">
                    "{testimonial.comment}"
                  </p>

                  <div className="mt-auto">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm font-bold text-[#0ea5e9] dark:text-emerald-400">
                      {testimonial.designation}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button className="nav-arrow nav-arrow-prev" aria-label="Previous">
            <ChevronLeft className="w-10 h-10 stroke-[1.5px]" />
          </button>
          <button className="nav-arrow nav-arrow-next" aria-label="Next">
            <ChevronRight className="w-10 h-10 stroke-[1.5px]" />
          </button>

          <div className="test-pagination"></div>
        </div>
      </div>
    </section>
  );
};