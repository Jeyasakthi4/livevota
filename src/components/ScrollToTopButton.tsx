import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { smoothScrollTo } from '../utils/scrollUtils';
import { sounds } from '../utils/soundEffects';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;

          setIsVisible(scrollY > 280);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = () => {
    sounds.playSelect();
    smoothScrollTo(0, { offset: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-40"
        >
          <button
            type="button"
            id="back-to-top-button"
            onClick={handleClick}
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.14] bg-[#0E1118]/90 text-zinc-300 shadow-2xl backdrop-blur-xl transition hover:border-cyan-400/50 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-95 cursor-pointer"
            title="Smooth scroll back to top"
            aria-label="Scroll back to top"
          >
            {/* Circular Progress Ring */}
            <svg className="absolute inset-0 h-full w-full -rotate-90 p-0.5" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-white/[0.08]"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-cyan-400 transition-all duration-150"
                strokeWidth="2"
                strokeDasharray="113.1"
                strokeDashoffset={113.1 - (113.1 * scrollProgress) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Icon */}
            <ArrowUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
