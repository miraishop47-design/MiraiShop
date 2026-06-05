'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../../application/services/orderService';
import { generateWhatsAppMessage } from '../../application/utils/generateWhatsAppMessage';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { user, loading } = useAuth();

  // Guest name state
  const [guestName, setGuestName] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50/50 dark:bg-gray-955/50">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando tu carrito...</p>
        </div>
      </div>
    );
  }

  const isReseller = user?.role === 'reseller' || user?.role === 'admin';
  const showPrice = !!user;

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  const getAccountTypeLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'reseller':
        return 'Distribuidor (Mayorista)';
      case 'customer':
      default:
        return 'Cliente Minorista';
    }
  };

  const handleWhatsAppCheckout = async () => {
    const clientName = user ? user.name : guestName.trim();
    if (!clientName) {
      alert('Por favor, ingresa tu nombre antes de continuar con el pedido.');
      return;
    }

    try {
      setIsCheckingOut(true);

      const orderItems = cart.map(item => {
        const isPack = !!item.isPackageSale;
        return {
          productId: item.productId,
          nombre: item.nombre,
          imagen: item.imagen,
          precio: item.precio,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad,
          isPackageSale: isPack ? true : undefined,
          selectedPackageId: item.selectedPackageId,
          packageQuantity: isPack ? item.cantidad : undefined,
          unitsPerPackage: isPack ? item.unitsPerPackage : undefined,
          totalUnits: isPack ? item.cantidad * (item.unitsPerPackage || 0) : undefined,
          precioPaquete: isPack ? item.precioPaquete : undefined,
        };
      });

      const newOrder = {
        userId: user?.id || 'invitado',
        customerName: clientName,
        customerEmail: user?.email || 'invitado@mirai.shop',
        customerRole: user?.role || 'customer',
        items: orderItems,
        subtotal: cartTotal,
        total: cartTotal
      };

      const savedOrder = await orderService.createOrder(newOrder);
      if (!savedOrder.id) {
        throw new Error('No se pudo generar el ID de registro de Firestore.');
      }

      const accountType = getAccountTypeLabel(user?.role);
      const whatsappUrl = generateWhatsAppMessage(
        savedOrder.id,
        clientName,
        accountType,
        cart,
        cartTotal,
        isReseller
      );

      clearCart();
      window.open(whatsappUrl, '_blank');
    } catch (err: any) {
      console.error('Error creating order:', err);
      alert(`Ocurrió un error al procesar tu pedido: ${err.message || err}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <span className="text-7xl block animate-bounce">🛒</span>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Tu Carrito está vacío</h1>
        <p className="text-gray-500 dark:text-gray-400 font-light max-w-md mx-auto">
          ¿Aún no has decidido qué comprar? Explora nuestro catálogo y agrega figuras, soportes u otros diseños únicos.
        </p>
        <Link
          href="/productos"
          className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-sm"
        >
          Explorar Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-8">
        Resumen de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black">tu Pedido</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Cart Items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-md">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Artículos seleccionados</h2>
              <button
                onClick={clearCart}
                disabled={isCheckingOut}
                className="text-xs font-bold text-red-500 hover:text-red-650 transition-colors uppercase tracking-wider disabled:opacity-50"
              >
                Vaciar todo
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    {/* Item Thumbnail */}
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-955 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight">{item.nombre}</h4>
                      {item.isPackageSale && isReseller ? (
                        <>
                          {showPrice && item.precio > 0 && <p className="text-xs text-indigo-500 font-semibold mt-1">Precio por paquete: {formatCOP(item.precio)}</p>}
                          <p className="text-[11px] text-gray-400 mt-0.5">Contenido: {item.unitsPerPackage} unidades por paquete</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Paquetes disponibles: {item.availablePackages}</p>
                          <p className="text-xs font-bold text-pink-600 dark:text-pink-400 mt-1">Total unidades: {item.cantidad * (item.unitsPerPackage || 0)} unds.</p>
                        </>
                      ) : (
                        <>
                          {showPrice && item.precio > 0 && <p className="text-xs text-indigo-500 font-semibold mt-1">Precio unitario: {formatCOP(item.precio)}</p>}
                          <p className="text-[11px] text-gray-400 mt-0.5">Stock disponible: {item.stock} unidades</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Quantity */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Quantity Controls */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          disabled={isCheckingOut}
                          className="px-3 py-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 text-gray-650 dark:text-gray-300 font-bold transition-all disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="px-4 py-1.5 font-bold text-gray-900 dark:text-white text-sm w-12 text-center border-x border-gray-200 dark:border-gray-800">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          disabled={isCheckingOut}
                          className="px-3 py-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 text-gray-655 dark:text-gray-300 font-bold transition-all disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      {item.isPackageSale && isReseller && (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">paquetes</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {showPrice && item.precio > 0 && (
                        <span className="font-black text-gray-900 dark:text-white text-base min-w-[80px] text-right">
                          {formatCOP(item.precio * item.cantidad)}
                        </span>
                      )}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={isCheckingOut}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl transition-all disabled:opacity-50"
                        title="Eliminar artículo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-md space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
              Resumen de compra
            </h2>

            {/* Profile info block */}
            <div className="p-4 bg-gray-50 dark:bg-gray-955 rounded-2xl border border-gray-150/40 dark:border-gray-800 space-y-3">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Datos de Entrega</span>
              {user ? (
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-255">
                    Cliente: <span className="text-indigo-600 dark:text-indigo-400">{user.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Cuenta: <span className="font-semibold">{getAccountTypeLabel(user.role)}</span>
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Inicia sesión para gestionar tu pedido y opciones de entrega.</p>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 text-sm">
              {showPrice && cartTotal > 0 && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCOP(cartTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Envío</span>
                <span className="text-emerald-500 font-semibold">Por acordar</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 dark:text-white text-lg pt-3 border-t border-gray-100 dark:border-gray-800">
                <span>Total</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {showPrice && cartTotal > 0 ? formatCOP(cartTotal) : 'A convenir'}
                </span>
              </div>
            </div>

            {/* Botón de compra */}
            {!showPrice ? (
              <Link
                href={user ? "/productos" : "/auth/login"}
                className={`w-full text-center font-black py-4 px-10 rounded-2xl shadow-xl transition-all block text-lg ${
                  user
                    ? 'bg-transparent border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {user ? 'Explorar catálogo para cotizar' : 'Iniciar sesión para comprar'}
              </Link>
            ) : (
              <button
                onClick={handleWhatsAppCheckout}
                disabled={isCheckingOut}
                className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7669] hover:-translate-y-0.5 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-black/20 active:scale-97 active:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed group"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando Pedido...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-7 h-7 text-white drop-shadow-sm opacity-95 group-hover:opacity-100 transition-opacity"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.299 1.262.478 1.694.612.712.222 1.36.19 1.874.115.576-.084 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Comprar por WhatsApp
                  </>
                )}
              </button>
            )}

            <Link
              href="/productos"
              className="block text-center text-sm font-bold text-gray-505 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider"
            >
              Seguir Comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
