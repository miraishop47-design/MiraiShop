'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isCartOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Drawer Panel */}
        <div className={`w-screen max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l border-gray-200/50 dark:border-gray-800/50 transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              Tu Carrito ({cart.reduce((sum, item) => sum + item.cantidad, 0)})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
                <span className="text-5xl">🛍️</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">El carrito está vacío</h3>
                  <p className="text-xs text-gray-500 max-w-[250px] mx-auto">Explora nuestro catálogo e introduce tus piezas preferidas.</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.nombre}</h4>
                    <p className="text-xs text-indigo-500 font-semibold mt-0.5">{formatCOP(item.precio)}</p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="w-7 h-7 bg-gray-50 dark:bg-gray-800 hover:bg-gray-150 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center justify-center font-bold text-sm transition-all"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-gray-900 dark:text-white w-6 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="w-7 h-7 bg-gray-50 dark:bg-gray-800 hover:bg-gray-150 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center justify-center font-bold text-sm transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl transition-all"
                    title="Eliminar del carrito"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="px-6 py-6 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white text-base">
                <span>Total Estimado:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatCOP(cartTotal)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={clearCart}
                  className="py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all text-xs text-center border border-gray-200/50 dark:border-gray-700/50"
                >
                  Vaciar Carrito
                </button>
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all text-xs text-center shadow-md shadow-indigo-500/10 flex items-center justify-center"
                >
                  Ver Carrito / Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
