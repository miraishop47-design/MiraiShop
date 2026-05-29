'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorite } from '../context/FavoriteContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { setIsCartOpen, cartItemsCount } = useCart();
  const { favorites } = useFavorite();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu if route changes (optional cleanup)
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 640) setIsMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="fixed w-full z-50 top-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center space-x-8">
            <Link href="/" className="text-3xl font-extrabold tracking-tighter hover:opacity-80 transition-opacity">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Mirai</span>
              <span className="text-gray-900 dark:text-white">Shop</span>
            </Link>
            <div className="hidden sm:flex items-center space-x-8 ml-8">
              <Link href="/productos" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Productos
              </Link>
              {user && (user.email === 'miraishop47@gmail.com' || user.email === 'miraishop47@gmail.com') && (
                <Link href="/admin" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Administrar
                </Link>
              )}
            </div>
          </div>
          <div className="flex space-x-4 items-center">
            {/* Favorites Trigger Button */}
            {user && (
              <Link
                href="/favoritos"
                className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
                title="Mis Favoritos"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-955 shadow-md">
                    {favorites.length}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
              title="Abrir Carrito"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-955 shadow-md">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {loading ? (
              <div className="hidden sm:block w-20 h-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hola, <span className="font-bold text-indigo-600 dark:text-indigo-400">{user.name}</span>
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-full font-medium text-sm transition-all active:scale-95 border border-gray-200/50 dark:border-gray-700/50"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-4">
                <Link href="/auth/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                  Iniciar Sesión
                </Link>
                <Link href="/auth/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-full font-medium transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95">
                  Registrarse
                </Link>
              </div>
            )}
            
            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="sm:hidden p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 transition-colors ml-1"
              title="Menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-4/5 max-w-sm h-full bg-white dark:bg-gray-950 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200/50 dark:border-gray-800/50">
            <div className="p-5 flex justify-between items-center border-b border-gray-100 dark:border-gray-900">
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                MiraiShop
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
              {user && (
                <div className="px-4 py-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl mb-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Conectado como</p>
                  <p className="text-base font-black text-indigo-700 dark:text-indigo-400 truncate">{user.name}</p>
                </div>
              )}
              
              <nav className="space-y-2">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 text-lg font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-colors">
                  Inicio
                </Link>
                <Link href="/productos" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 text-lg font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-colors">
                  Catálogo de Productos
                </Link>
                {user && (
                  <Link href="/favoritos" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 text-lg font-bold text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-xl transition-colors">
                    Mis Favoritos
                  </Link>
                )}
                {user && (user.email === 'miraishop47@gmail.com' || user.email === 'miraishop47@gmail.com') && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors">
                    Panel de Administración
                  </Link>
                )}
              </nav>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-900">
              {user ? (
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="w-full py-4 text-center text-red-600 dark:text-red-400 font-bold bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                >
                  Cerrar Sesión
                </button>
              ) : (
                <div className="space-y-3">
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3.5 text-center text-gray-700 dark:text-gray-300 font-bold bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors">
                    Iniciar Sesión
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3.5 text-center text-white font-bold bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                    Crear Cuenta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
