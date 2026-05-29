'use client';

import { useEffect, useState, useMemo } from 'react';
import { favoriteService } from '../../../application/services/favoriteService';
import { productService } from '../../../application/services/productService';
import { Product } from '../../../domain/entities/Product';
import { FavoriteUser } from '../../../domain/entities/Favorite';
import Link from 'next/link';

interface RankedProduct {
  product: Product;
  count: number;
}

export default function AdminFavoritesAnalytics() {
  const [allFavorites, setAllFavorites] = useState<FavoriteUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [favs, prods] = await Promise.all([
          favoriteService.getAllFavorites(),
          productService.getProducts()
        ]);
        setAllFavorites(favs);
        setProducts(prods);
      } catch (err: any) {
        setError(err.message || 'Error al cargar analíticas de favoritos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const ranking = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count occurrences of each productId
    allFavorites.forEach(userFav => {
      userFav.productIds.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    // Map to RankedProduct
    const ranked: RankedProduct[] = Object.entries(counts)
      .map(([id, count]) => {
        const product = products.find(p => p.id === id);
        return { product: product as Product, count };
      })
      .filter(item => item.product !== undefined)
      .sort((a, b) => b.count - a.count);

    return ranked;
  }, [allFavorites, products]);

  const totalSaves = useMemo(() => ranking.reduce((acc, curr) => acc + curr.count, 0), [ranking]);
  const activeUsers = useMemo(() => allFavorites.filter(f => f.productIds.length > 0).length, [allFavorites]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        Cargando analíticas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl">
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-3xl">🔥</span> Analytics de Favoritos
        </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Total de Guardados</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{totalSaves}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Productos Distintos</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{ranking.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Usuarios Activos</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{activeUsers}</p>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Ranking de Productos (Top 50)</h3>
        </div>
        
        {ranking.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            Aún no hay datos de favoritos registrados en la tienda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Guardados</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {ranking.slice(0, 50).map((item, index) => (
                  <tr key={item.product.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="h-10 w-10 object-cover" src={item.product.imagen || 'https://via.placeholder.com/150'} alt="" />
                        </div>
                        <div className="ml-4">
                          <Link href={`/products/${item.product.id}`} target="_blank" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {item.product.nombre}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.product.activo ? '✅ Activo' : '❌ Inactivo'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {item.product.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-pink-600 dark:text-pink-400">
                      {item.count} <span className="text-lg align-middle">❤️</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
