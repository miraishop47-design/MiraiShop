'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SLIDES = [
  {
    id: 1,
    title: "Transforma tu setup",
    subtitle: "Organización, estilo y diseño funcional llevado al siguiente nivel.",
    image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1920&q=80",
    cta1: "Ver productos",
    cta2: "Explorar colección",
    link: "/productos"
  },
  {
    id: 2,
    title: "El poder del minimalismo",
    subtitle: "Accesorios premium que eliminan el ruido y potencian tu productividad.",
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1920&q=80",
    cta1: "Descubrir más",
    cta2: "Ver decoración",
    link: "/productos?category=Decoración"
  },
  {
    id: 3,
    title: "Gaming de Alta Gama",
    subtitle: "Soportes, luces y organización inteligente para tu battlestation.",
    image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1920&q=80",
    cta1: "Ver accesorios gaming",
    cta2: "Ir al catálogo",
    link: "/productos?category=Gaming"
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 6000); // 6 seconds autoplay
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[60vh] min-h-[450px] overflow-hidden rounded-[2.5rem] bg-[#0B0D14] shadow-2xl group">
      
      {/* Slides Container */}
      <div 
        className="flex w-full h-full transition-transform duration-1000 cubic-bezier(0.87, 0, 0.13, 1)"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {SLIDES.map((slide, idx) => (
          <div key={slide.id} className="min-w-full w-full h-full relative flex-shrink-0">
            {/* Background Image with Zoom Effect */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="100vw"
                priority={idx === 0}
                className={`object-cover transition-transform duration-[10000ms] ease-out ${currentSlide === idx ? 'scale-110' : 'scale-100'}`}
              />
            </div>

            {/* Gradient Overlay for Text Readability & Premium Dark Feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D14] via-[#0B0D14]/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D14]/90 via-[#0B0D14]/50 to-transparent z-10" />

            {/* Content Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-12 pb-20 md:pb-24 max-w-7xl mx-auto">
              <div className="max-w-2xl transform transition-all duration-1000 delay-300 translate-y-0 opacity-100">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-[1.1] drop-shadow-2xl">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-2xl text-gray-300 mb-10 font-light leading-relaxed max-w-xl text-balance">
                  {slide.subtitle}
                </p>
                
                <div className="flex flex-wrap items-center gap-4">
                  <Link 
                    href={slide.link}
                    className="bg-white text-black font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] text-sm md:text-base"
                  >
                    {slide.cta1}
                  </Link>
                  <Link 
                    href="/productos"
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-full hover:bg-white/20 transition-colors duration-300 text-sm md:text-base"
                  >
                    {slide.cta2}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Indicators (Dots) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all duration-500 rounded-full ${
              currentSlide === idx 
                ? 'w-8 h-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Ir a slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Arrows (Visible on Hover) */}
      <button 
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <button 
        onClick={() => setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1))}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
      </button>

    </div>
  );
}
