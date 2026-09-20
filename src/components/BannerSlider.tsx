import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Slide } from '../types';

interface Props {
  slides: Slide[];
}

export const BannerSlider: React.FC<Props> = ({ slides }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const validSlides = (slides || []).filter(s => s && s.img && s.img.trim() !== "");

  useEffect(() => {
    if (validSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % validSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [validSlides.length]);

  if (validSlides.length === 0) return null;

  const currentSlide = validSlides[currentIdx];

  const nextSlide = () => {
    setCurrentIdx(prev => (prev + 1) % validSlides.length);
  };

  const prevSlide = () => {
    setCurrentIdx(prev => (prev - 1 + validSlides.length) % validSlides.length);
  };

  return (
    <div className="relative group w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-md border border-gray-200/80 dark:border-gray-800 bg-neutral-900">
      {/* 
        PRECISE 16:9 ASPECT RATIO WITH MAX-WIDTH:
        Keeps the aspect ratio strictly at 16:9 so the entire image is perfectly visible,
        but limits the maximum width of the slider on desktop to keep it compact and elegant!
      */}
      <div className="w-full aspect-[16/9] relative overflow-hidden flex items-center justify-center">
        {currentSlide.link ? (
          <a 
            href={currentSlide.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full h-full block"
          >
            <img
              src={currentSlide.img}
              alt="Banner Promotion"
              className="w-full h-full object-cover object-center transition-all duration-700 transform group-hover:scale-[1.01]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://i.postimg.cc/14xVxvGg/6A6MX.jpg";
              }}
            />
          </a>
        ) : (
          <img
            src={currentSlide.img}
            alt="Banner Promotion"
            className="w-full h-full object-cover object-center transition-all duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://i.postimg.cc/14xVxvGg/6A6MX.jpg";
            }}
          />
        )}
      </div>

      {/* Navigation arrows (desktop) */}
      {validSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full">
            {validSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all rounded-full ${
                  i === currentIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
