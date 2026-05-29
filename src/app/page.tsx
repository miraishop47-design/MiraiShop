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

export default function HomePage() {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const [homeSearch, setHomeSearch] = useState('');

  useEffect(() => {
    const unsubscribe = productService.subscribeProducts((updatedProducts) => {
      setRawProducts(updatedProducts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter inactive products and transform them before rendering (take first 4 as featured)
  const products = useMemo(() => {
    return rawProducts
      .filter((p) => p.activo !== false)
      .map((p) => transformProductForUser(p, user?.role))
      .slice(0, 4);
  }, [rawProducts, user?.role]);

  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeSearch.trim()) {
      router.push(`/productos?search=${encodeURIComponent(homeSearch.trim())}`);
    }
  };

  const quickCategories = [
    { name: 'Hogar', emoji: '🏠' },
    { name: 'Gaming', emoji: '🎮' },
    { name: 'Tecnología', emoji: '💡' },
    { name: 'Decoración', emoji: '🏡' },
    { name: 'Organización', emoji: '📦' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero section */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30 blur-3xl">
          <div className="w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter animate-pulse"></div>
          <div className="w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter animate-pulse delay-700 -ml-20"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
          Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">MiraiShop</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light mb-10 leading-relaxed">
          Descubre nuestra colección exclusiva de productos y accesorios de diseño premium para tu setup y tu hogar.
        </p>

        {/* Home Search Bar */}
        <form onSubmit={handleHomeSearchSubmit} className="max-w-2xl mx-auto mb-6 px-4 relative z-10">
          <div className="relative">
            <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={homeSearch}
              onChange={(e) => setHomeSearch(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="w-full pl-14 pr-24 py-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-3xl border border-gray-250/50 dark:border-gray-800/50 shadow-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-gray-850 dark:text-gray-150 placeholder-gray-400 dark:placeholder-gray-500 text-base font-semibold"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-6 py-2.5 rounded-2.5xl shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all text-sm cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Quick Categories trigger */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10 max-w-3xl mx-auto px-4">
          {quickCategories.map((cat) => (
            <Link
              key={cat.name}
              href={`/productos?category=${cat.name}`}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-indigo-400/50 hover:bg-indigo-50/15 dark:hover:bg-indigo-950/15 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <PreferencePicker />
        </div>
      </div>

      {/* Featured section separator */}
      <div className="mb-10 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/60 pb-4">
        <h2 className="text-2xl font-black text-gray-950 dark:text-white">Productos destacados</h2>
        <Link href="/productos" className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
          Ver catálogo completo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden shadow-sm h-[420px] animate-pulse p-6 space-y-4">
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-full mt-4"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white/50 dark:bg-gray-955/50 border border-gray-200/30 rounded-3xl p-8 max-w-md mx-auto">
          <span className="text-4xl block mb-2">📦</span>
          <p className="text-sm">No hay productos destacados disponibles en este momento.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link href={`/products/${product.id}`} key={product.id} className="block h-full group">
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
