'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import { productService } from '../../application/services/productService';
import { Product } from '../../domain/entities/Product';
import { transformProductForUser } from '../../application/utils/productTransformer';
import ProductCard from '../components/ProductCard';
import { useRouter } from 'next/navigation';

export default function FavoritosPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading: favLoading } = useFavorite();
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      const unsubscribe = productService.subscribeProducts((updatedProducts) => {
        setRawProducts(updatedProducts);
        setLoadingProducts(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoadingProducts(false);
    }
  }, []);

  const favoriteProducts = useMemo(() => {
    if (!user) return [];
    return rawProducts
      .filter((p) => p.activo !== false && favorites.includes(p.id!))
      .map((p) => transformProductForUser(p, user.role));
  }, [rawProducts, favorites, user]);

  const isLoading = authLoading || favLoading || loadingProducts;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-500 dark:text-gray-400 font-medium">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Cargando tus favoritos...
      </div>
    );
  }

  if (!user) return null; // Prevent flash before redirect

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30 blur-3xl">
          <div className="w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter"></div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
          Mis <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Favoritos</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light">
          Aquí guardamos las piezas que más te han inspirado.
        </p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-20 bg-white/50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] max-w-xl mx-auto p-10">
          <span className="text-5xl block mb-4">❤️</span>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No tienes productos favoritos todavía</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-light max-w-sm mx-auto mb-6">
            Explora nuestro catálogo y guarda los productos que más te gusten haciendo clic en el corazón.
          </p>
          <Link
            href="/productos"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            Explorar Productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {favoriteProducts.map((product) => (
            <div key={product.id} className="block h-full group">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
