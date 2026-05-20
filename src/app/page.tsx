'use client';

import { useEffect, useState, useMemo } from 'react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16 relative">
        <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30 blur-3xl">
          <div className="w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter animate-pulse"></div>
          <div className="w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter animate-pulse delay-700 -ml-20"></div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
          Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">MiraiShop</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
          ¡Gracias por tu preferencia! Descubre nuestro catálogo exclusivo de impresiones 3D.
        </p>
        <div className="mt-8 flex justify-center">
          <PreferencePicker />
        </div>
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
        <div className="text-center py-12 text-gray-400 bg-white/50 dark:bg-gray-950/50 border border-gray-200/30 rounded-3xl p-8 max-w-md mx-auto">
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
