'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { setIsCartOpen, cartItemsCount } = useCart();

  return (
    <nav className="fixed w-full z-50 top-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center space-x-8">
            <Link href="/" className="text-3xl font-extrabold tracking-tighter hover:opacity-80 transition-opacity">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Mirai</span>
              <span className="text-gray-900 dark:text-white">Shop</span>
            </Link>
            <Link href="/productos" className="hidden sm:inline-block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Productos
            </Link>
            {user && (user.email === 'miraishop47@gmail.com' || user.email === 'ariaacris73@gmail.com') && (
              <Link href="/admin" className="hidden sm:inline-block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Administrar
              </Link>
            )}
          </div>
          <div className="flex space-x-4 items-center">
            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 transition-colors"
              title="Abrir Carrito"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 shadow-md">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {loading ? (
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
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
              <>
                <Link href="/auth/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                  Iniciar Sesión
                </Link>
                <Link href="/auth/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-full font-medium transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
