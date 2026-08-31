'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UIProduct } from '../../application/utils/productTransformer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorite } from '../context/FavoriteContext';
import { PackageOption } from '../../domain/entities/Product';

interface ProductCardProps {
  product: UIProduct;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const getPackageOptions = (prod: UIProduct): PackageOption[] => {
  if (prod.packageOptions && prod.packageOptions.length > 0) {
    return prod.packageOptions;
  }
  if (prod.isPackageSale && prod.unitsPerPackage) {
    return [{
      id: 'default-pack',
      unitsPerPackage: prod.unitsPerPackage,
      availablePackages: prod.availablePackages || 0,
      wholesalePrice: prod.precioPaquete || prod.precio || 0
    }];
  }
  return [];
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorite();
  const router = useRouter();

  const isReseller = user?.role === 'reseller' || user?.role === 'admin';
  const isPack = !!product.isPackageSale;
  const options = getPackageOptions(product);
  const hasMultiplePacks = isPack && options.length > 1;
  const totalPacks = isPack ? options.reduce((sum, o) => sum + o.availablePackages, 0) : 0;
  const isMadeToOrder = !!product.isMadeToOrder;
  const isOutOfStock = !isMadeToOrder && (isPack ? totalPacks <= 0 : product.stock <= 0);

  const mainImage = product.imagen || 'https://images.unsplash.com/photo-1612036781124-847f8939b154?auto=format&fit=crop&w=800&q=80';

  const showPrice = !!user;
  const isFav = isFavorite(product.id!);

  return (
    <div 
      onClick={() => router.push(`/products/${product.id}`)}
      className="group bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden shadow-sm transition-transform duration-300 transform sm:hover:-translate-y-1.5 will-change-transform flex flex-col h-full relative cursor-pointer"
    >
      
      {/* Badges Container */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="bg-black/80 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/10 tracking-wide pointer-events-none">
            {product.categoria}
          </span>
          
          {isPack && isReseller && (
            <span className="bg-pink-600/95 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full border border-pink-500/30 uppercase tracking-wider pointer-events-none">
              {options.length === 1 
                ? `Caja x${options[0].unitsPerPackage} und.` 
                : `Cajas x${options.map(o => o.unitsPerPackage).join('/')} und.`}
            </span>
          )}

          {isMadeToOrder && (
            <span className="bg-amber-600/95 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full border border-amber-500/20 tracking-wider uppercase pointer-events-none">
              🛠️ Por pedido
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id!);
          }}
          className={`pointer-events-auto p-2 rounded-full backdrop-blur-md border transition-all duration-300 active:scale-95 shadow-md flex-shrink-0 ${
            isFav 
              ? 'bg-pink-500/90 border-pink-500 text-white shadow-pink-500/20' 
              : 'bg-white/70 dark:bg-black/50 border-gray-200/50 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:bg-white dark:hover:bg-black/80'
          }`}
          title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${isFav ? 'scale-110' : 'hover:scale-110'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFav ? '1.5' : '2'} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        </button>
      </div>

      {/* Image Container */}
      <div className="relative h-40 sm:h-64 w-full bg-gray-100 dark:bg-gray-955 overflow-hidden flex-shrink-0">
        <Image
          src={mainImage}
          alt={`${product.nombre} - MiraiShop`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-black tracking-wider uppercase bg-red-600/90 px-5 py-2 rounded-full border border-red-500/50 text-sm shadow-lg">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-3 sm:p-6 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-2 leading-tight group-hover:text-indigo-500 transition-colors duration-300">
            {product.nombre}
          </h3>
          <p className="hidden sm:block text-gray-500 dark:text-gray-400 text-sm font-light mb-4 line-clamp-3 leading-relaxed">
            {product.descripcion}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            {isReseller ? (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    {isPack && options.length > 1 ? 'Desde' : 'Precio'}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {formatCOP(product.precio)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="hidden sm:block text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Disponibilidad</span>
                  <span className={`text-[10px] sm:text-sm font-black ${isOutOfStock ? 'text-red-500' : 'text-emerald-500'}`}>
                    {isMadeToOrder 
                      ? 'Bajo pedido' 
                      : isOutOfStock 
                        ? 'Agotado' 
                        : isPack 
                          ? `${totalPacks} pqts.` 
                          : `${product.stock} disp.`}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  {showPrice && product.precio > 0 ? (
                    <>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                        Precio
                      </span>
                      <span className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        {formatCOP(product.precio)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">
                      {!showPrice ? 'Inicia sesión para ver precio' : 'Precios por cotización'}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="hidden sm:block text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Disponibilidad</span>
                  <span className={`text-[10px] sm:text-sm font-black ${isOutOfStock ? 'text-red-500' : 'text-emerald-500'}`}>
                    {isMadeToOrder 
                      ? 'Bajo pedido' 
                      : isOutOfStock 
                        ? 'Agotado' 
                        : isPack 
                          ? 'Disponible' 
                          : `${product.stock} disp.`}
                  </span>
                </div>
              </>
            )}
          </div>

          {showPrice ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (hasMultiplePacks) {
                  window.location.href = `/products/${product.id}`;
                } else if (product.id) {
                  addToCart(product, 1);
                }
              }}
              disabled={isOutOfStock}
              className={`w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all text-xs sm:text-sm shadow-md flex items-center justify-center gap-1 sm:gap-2 active:scale-95 mt-3 sm:mt-5 ${isOutOfStock ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed dark:bg-gray-800/40 dark:text-gray-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/10'}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              {isOutOfStock ? 'Agotado' : 'Al carrito'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/products/${product.id}`);
              }}
              className="w-full py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 text-xs sm:text-sm flex items-center justify-center gap-2 mt-3 sm:mt-5 bg-transparent border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white group-hover:border-indigo-200 dark:group-hover:border-indigo-900/50"
            >
              Ver detalles
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
