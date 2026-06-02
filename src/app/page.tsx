'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PreferencePicker from '@/app/components/PreferencePicker';
import { Product } from '../domain/entities/Product';
import { productService } from '../application/services/productService';
import { useAuth } from './context/AuthContext';
import { transformProductForUser, UIProduct } from '../application/utils/productTransformer';
import ProductCard from './components/ProductCard';
import ProductFilters from './components/ProductFilters';
import HeroCarousel from './components/HeroCarousel';
import PremiumCategories from './components/PremiumCategories';
import WhyMiraiShop from './components/WhyMiraiShop';

export default function HomePage() {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = productService.subscribeProducts((updatedProducts) => {
      setRawProducts(updatedProducts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter inactive products and transform them before rendering
  const activeProducts = useMemo(() => {
    const filtered = rawProducts.filter((p) => p.activo !== false);
    console.log(`[MiraiShop]\nProducts After Filters: ${filtered.length}`);
    return filtered.map((p) => transformProductForUser(p, user?.role));
  }, [rawProducts, user?.role]);

  // Split products for different sections
  const productsFeatured = activeProducts.slice(0, 4);
  const productsBestSellers = activeProducts.slice(4, 8); // Next 4 for best sellers

  const handleHomeSearchSubmit = ({ search, category }: { search: string; category: string }) => {
    if (search.trim() || category) {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      router.push(`/productos?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white font-sans selection:bg-[#8B5CF6]/30 -mt-16 pt-16 pb-24 overflow-x-hidden">
      
      {/* 1. HERO PREMIUM */}
      <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
        <HeroCarousel />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-8">
        
        {/* Unified Search Bar & Filters */}
        <div className="relative z-20 mb-16 max-w-3xl mx-auto">
          <ProductFilters 
            initialSearch=""
            initialCategory=""
            onFilterChange={({ category }) => {
              if (category) {
                router.push(`/productos?category=${category}`);
              }
            }}
            disableDebounce={true}
            onSearchSubmit={handleHomeSearchSubmit}
          />
        </div>

        {/* 2. CATEGORIES GRID */}
        <div className="mt-8 md:mt-16 mb-24">
          <PremiumCategories />
        </div>

        <div className="my-8 flex justify-center opacity-80 hover:opacity-100 transition-opacity">
          <PreferencePicker />
        </div>

        {/* 3. FEATURED PRODUCTS */}
        <div className="mb-24">
          <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between border-b border-white/5 pb-6 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Colección Destacada</h2>
              <p className="text-gray-400 font-light">Nuestras piezas de diseño más exclusivas del mes.</p>
            </div>
            <Link href="/productos" className="text-sm font-bold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors flex items-center gap-2 bg-[#8B5CF6]/10 px-5 py-2.5 rounded-xl whitespace-nowrap">
              Explorar colección
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#13151F] rounded-[2rem] border border-white/5 overflow-hidden shadow-xl h-[420px] animate-pulse p-6 space-y-4">
                  <div className="w-full h-48 bg-white/5 rounded-2xl"></div>
                  <div className="h-6 bg-white/5 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-white/5 rounded-lg w-1/2"></div>
                  <div className="h-10 bg-white/5 rounded-xl w-full mt-auto"></div>
                </div>
              ))}
            </div>
          )}

          {!loading && productsFeatured.length === 0 && (
            <div className="text-center py-16 bg-[#13151F] border border-white/5 rounded-[2.5rem] p-8 max-w-xl mx-auto shadow-xl">
              <span className="text-6xl block mb-6">✨</span>
              <p className="text-xl font-bold text-white mb-2">Renovando colección</p>
              <p className="text-sm text-gray-500 font-light">Vuelve más tarde para ver nuestras novedades.</p>
            </div>
          )}

          {!loading && productsFeatured.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {productsFeatured.map((product) => (
                <div key={product.id} className="block h-full group">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. BRANDING: WHY MIRAISHOP */}
        <WhyMiraiShop />

        {/* 5. BEST SELLERS / COMMUNITY FAVORITES */}
        {!loading && productsBestSellers.length > 0 && (
          <div className="mt-24 mb-12">
            <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between border-b border-white/5 pb-6 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                  <span className="text-yellow-400">⭐</span> Favoritos de la comunidad
                </h2>
                <p className="text-gray-400 font-light">Los diseños más elegidos por nuestros clientes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {productsBestSellers.map((product) => (
                <div key={product.id} className="block h-full group">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
