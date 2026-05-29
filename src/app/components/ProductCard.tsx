'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UIProduct } from '../../application/utils/productTransformer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
  const router = useRouter();

  const isReseller = user?.role === 'reseller' || user?.role === 'admin';
  const isPack = !!product.isPackageSale;
  const options = getPackageOptions(product);
  const hasMultiplePacks = isPack && options.length > 1;
  const totalPacks = isPack ? options.reduce((sum, o) => sum + o.availablePackages, 0) : 0;
  const isMadeToOrder = !!product.isMadeToOrder;
  const isOutOfStock = !isMadeToOrder && (isPack ? totalPacks <= 0 : product.stock <= 0);

  const mainImage = product.imagen || 'https://images.unsplash.com/photo-1612036781124-847f8939b154?auto=format&fit=crop&w=800&q=80';

  const showPrice = user && (user.role === 'reseller' || user.role === 'admin');

  return (
    <div 
      onClick={() => router.push(`/products/${product.id}`)}
      className="group bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden shadow-sm transition-transform duration-300 transform sm:hover:-translate-y-1.5 will-change-transform flex flex-col h-full relative cursor-pointer"
    >
      
      {/* Badges Container */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-2 items-center pointer-events-none">
        <span className="bg-black/80 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/10 tracking-wide pointer-events-none">
          {product.categoria}
        </span>
        
        {isPack && (
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

      {/* Image Container */}
      <div className="relative h-40 sm:h-64 w-full bg-gray-100 dark:bg-gray-955 overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage}
          alt={`${product.nombre} - MiraiShop`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
          loading="lazy"
          decoding="async"
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
                  <span className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                    Precio
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                    Disponible al checkout
                  </span>
                </div>
                <div className="text-right">
                  <span className="hidden sm:block text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Stock</span>
                  <span className={`text-[10px] sm:text-sm font-black ${isOutOfStock ? 'text-red-500' : 'text-emerald-500'}`}>
                    {isMadeToOrder 
                      ? 'Pedido' 
                      : isOutOfStock ? 'Agotado' : `${product.stock} disp.`}
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
              {hasMultiplePacks 
                ? 'Opciones' 
                : (isOutOfStock ? 'Agotado' : isPack ? 'Paquete' : 'Al carrito')}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(user ? '/productos' : '/auth/login');
              }}
              className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 mt-3 sm:mt-5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-800/40 dark:to-gray-800 text-gray-700 dark:text-gray-300 text-center"
            >
              {user ? 'Cuenta Minorista' : 'Iniciar sesión'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
