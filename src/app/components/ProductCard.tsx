'use client';

import React from 'react';
import Link from 'next/link';
import { UIProduct } from '../../application/utils/productTransformer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: UIProduct;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isOutOfStock = product.stock <= 0;
  const mainImage = product.imagen || 'https://images.unsplash.com/photo-1612036781124-847f8939b154?auto=format&fit=crop&w=800&q=80';

  const showPrice = user && (user.role === 'reseller' || user.role === 'admin');

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col h-full relative">
      
      {/* Category Tag */}
      <span className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/10 tracking-wide">
        {product.categoria}
      </span>

      {/* Image Container */}
      <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-955 overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage}
          alt={product.nombre}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-black tracking-wider uppercase bg-red-600/90 px-5 py-2 rounded-full border border-red-500/50 text-sm shadow-lg">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-indigo-500 transition-colors duration-300">
            {product.nombre}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-light mb-4 line-clamp-3 leading-relaxed">
            {product.descripcion}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Precio</span>
              {showPrice ? (
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  {formatCOP(product.precio)}
                </span>
              ) : (
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 italic">
                  Solo mayoristas
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Disponibilidad</span>
              <span className={`text-sm font-black ${isOutOfStock ? 'text-red-500' : 'text-emerald-500'}`}>
                {isOutOfStock ? '0 unidades' : `${product.stock} disp.`}
              </span>
            </div>
          </div>

          {showPrice ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.id) {
                  addToCart(product, 1);
                }
              }}
              disabled={isOutOfStock}
              className={`w-full py-3.5 rounded-2xl font-bold transition-all text-sm shadow-md flex items-center justify-center gap-2 active:scale-97 mt-5 ${isOutOfStock ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed dark:bg-gray-800/40 dark:text-gray-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/10'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              {isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
            </button>
          ) : (
            <Link
              href={user ? "/productos" : "/auth/login"}
              onClick={(e) => e.stopPropagation()}
              className="w-full py-3.5 rounded-2xl font-bold transition-all text-sm shadow-md flex items-center justify-center gap-2 active:scale-97 mt-5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-800/40 dark:to-gray-800 text-gray-700 dark:text-gray-300 text-center"
            >
              {user ? 'Cuenta Minorista' : 'Iniciar sesión para comprar'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
