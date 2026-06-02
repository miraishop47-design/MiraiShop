'use client';

import { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '../../domain/entities/Product';
import { productService } from '../../application/services/productService';
import { useAuth } from '../context/AuthContext';
import { transformProductForUser, UIProduct } from '../../application/utils/productTransformer';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';

function ProductosListContent() {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Keep state synced with URL navigation (e.g. back button)
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

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

  const handleFilterChange = useCallback(({ search, category }: { search: string; category: string }) => {
    const params = new URLSearchParams(window.location.search);
    
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    
    const newPath = params.toString() ? `/productos?${params.toString()}` : '/productos';
    window.history.replaceState(null, '', newPath);
    
    setSearchQuery(search);
    setSelectedCategory(category);
  }, []);

  // Filter inactive products and transform + filter by search and category before rendering
  const products = useMemo(() => {
    const active = rawProducts.filter((p) => p.activo !== false);
    console.log(`[MiraiShop]\nProducts After Filters: ${active.length}`);
    return active
      .map((p) => transformProductForUser(p, user?.role))
      .filter((p) => {
        // Category filter
        if (selectedCategory && p.categoria !== selectedCategory) {
          return false;
        }
        
        // Search query filter (search by name, category, and description)
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = p.nombre.toLowerCase().includes(q);
          const matchCategory = p.categoria.toLowerCase().includes(q);
          const matchDesc = p.descripcion.toLowerCase().includes(q);
          return matchName || matchCategory || matchDesc;
        }
        
        return true;
      });
  }, [rawProducts, user?.role, searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30 blur-3xl">
          <div className="w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter"></div>
          <div className="w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter -ml-20"></div>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
          Nuestra Galería de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">productos</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light">
          Explora diseños únicos de la más alta calidad y listos para formar parte de tu Setup o tu Hogar.
        </p>
      </div>

      {/* Filter Component */}
      <ProductFilters
        initialSearch={initialSearch}
        initialCategory={initialCategory}
        onFilterChange={handleFilterChange}
      />

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
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No se encontraron productos</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-light max-w-sm mx-auto">
            Intenta cambiar los términos de búsqueda o de categoría para encontrar lo que buscas.
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => handleFilterChange({ search: '', category: '' })}
              className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-650 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md"
            >
              Ver todos los productos
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="block h-full group">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-500 dark:text-gray-400 font-medium">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Cargando catálogo...
      </div>
    }>
      <ProductosListContent />
    </Suspense>
  );
}
