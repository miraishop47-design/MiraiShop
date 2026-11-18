'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../../application/services/orderService';
import { orderRequestService } from '../../application/services/orderRequestService';
import { Order } from '../../domain/entities/Order';
import { OrderRequest } from '../../domain/entities/OrderRequest';
import OrderHistoryList, { formatCOP, summarizeOrders } from '../components/OrderHistoryList';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderRequestBadge from '../components/OrderRequestBadge';

export default function MisPedidosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const onError = () => {
      setError('No se pudo cargar tu historial de compras. Intenta de nuevo más tarde.');
      setLoadingOrders(false);
      setLoadingRequests(false);
    };
    const unsubOrders = orderService.subscribeUserOrders(
      user.id,
      (data) => {
        setOrders(data);
        setLoadingOrders(false);
      },
      onError
    );
    const unsubRequests = orderRequestService.subscribeUserRequests(
      user.id,
      (data) => {
        setRequests(data);
        setLoadingRequests(false);
      },
      onError
    );
    return () => {
      unsubOrders();
      unsubRequests();
    };
  }, [user]);

  if (authLoading || (user && (loadingOrders || loadingRequests))) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500 dark:text-gray-400 font-medium">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        Cargando tus compras…
      </div>
    );
  }

  if (!user) return null;

  // Las aceptadas ya aparecen como pedido; aquí solo las que esperan respuesta o fueron rechazadas.
  const openRequests = requests.filter((r) => r.status !== 'aceptada');
  const { validCount, totalSpent } = summarizeOrders(orders);
  const isEmpty = orders.length === 0 && openRequests.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Mis pedidos</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Todo lo que has comprado en MiraiShop.</p>

      {error ? (
        <p className="mt-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      ) : isEmpty ? (
        <div className="mt-10 text-center space-y-4 py-12 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-300 font-medium">Todavía no tienes compras.</p>
          <Link
            href="/productos"
            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-2xl text-sm"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <>
          {openRequests.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Solicitudes</h2>
              <p className="text-xs text-gray-400 mt-1 mb-3">
                Se convierten en pedido cuando MiraiShop confirma la compra.
              </p>
              <OrderHistoryList
                orders={openRequests}
                label="Solicitud"
                renderBadge={(r) => <OrderRequestBadge status={r.status} />}
              />
            </section>
          )}

          {orders.length > 0 && (
            <section className="mt-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/8 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Compras</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 tabular-nums">{validCount}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/8 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Total comprado</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 tabular-nums">{formatCOP(totalSpent)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Los pedidos cancelados no suman al total.</p>

              <div className="mt-6">
                <OrderHistoryList orders={orders} renderBadge={(o) => <OrderStatusBadge status={o.status} />} />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
