'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { usePathname } from 'next/navigation';

export default function FloatingCartButton() {
  const { cartItemsCount, setIsCartOpen } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on mobile/tablet (<= 768px typically) and hide on specific pages like cart or checkout
    const handleScroll = () => {
      if (window.innerWidth < 1024 && window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide on the cart page itself
  if (pathname === '/cart') return null;
  if (!isVisible) return null;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="lg:hidden fixed bottom-6 right-6 z-[90] bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.15)] animate-in slide-in-from-bottom-10 fade-in duration-300 hover:scale-105 active:scale-95 transition-all group"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
      {cartItemsCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md animate-bounce group-hover:animate-none">
          {cartItemsCount}
        </span>
      )}
    </button>
  );
}
