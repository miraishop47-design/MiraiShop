'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '../../domain/entities/Product';
import { productService } from '../../application/services/productService';
import { useAuth } from '../context/AuthContext';
import { transformProductForUser, UIProduct } from '../../application/utils/productTransformer';
import ProductCard from '../components/ProductCard';

export default function ProductosPage() {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    try {
      // Subscribe to products in Firestore in real-time
      const unsubscribe = productService.subscribeProducts((updatedProducts) => {
        setRawProducts(updatedProducts);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      setError(err.message || 'Error desconocido al suscribirse a los productos.');
      setLoading(false);
    }
  }, []);

  // Filter inactive products and transform them before rendering
  const products = useMemo(() => {
    return rawProducts
      .filter((p) => p.activo !== false)
      .map((p) => transformProductForUser(p, user?.role));
  }, [rawProducts, user?.role]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30 blur-3xl">
          <div className="w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter animate-pulse"></div>
          <div className="w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter animate-pulse delay-700 -ml-20"></div>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
          Nuestra Galería de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">productos</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light">
          Explora diseños únicos de la más alta calidad y listos para formar parte de tu Setup o tu Hogar.
        </p>
      </div>

      {/* Loading Skeletons */}
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

      {/* Error state */}
      {!loading && error && (
        <div className="text-center p-12 bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-3xl max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400 font-bold mb-2">Ocurrió un error al cargar los productos</p>
          <p className="text-xs text-red-500 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-bold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-20 bg-white/50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] max-w-xl mx-auto p-10">
          <span className="text-5xl block mb-4">📦</span>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No hay productos disponibles</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-light max-w-sm mx-auto">
            Aún no se han agregado productos a la tienda. ¡Regresa pronto o inicia sesión para agregar nuevos productos desde el panel de administración!
          </p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
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
