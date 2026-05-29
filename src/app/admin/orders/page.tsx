'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../../application/services/orderService';
import { Order, OrderStatus } from '../../../domain/entities/Order';
import OrderCard from '../../components/OrderCard';

const STATUS_FILTERS: (OrderStatus | 'todos')[] = [
  'todos',
  'pendiente',
  'confirmado',
  'enviado',
  'entregado',
  'cancelado',
];

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'todos'>('todos');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth Redirect Guard
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.email !== 'miraishop47@gmail.com' && user.email !== 'miraishop47@gmail.com') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Subscribe to Firestore Orders in Real-Time
  useEffect(() => {
    if (!user || (user.email !== 'miraishop47@gmail.com' && user.email !== 'miraishop47@gmail.com')) return;

    try {
      const unsubscribe = orderService.subscribeOrders((updatedOrders) => {
        setOrders(updatedOrders);
        setOrdersLoading(false);
      });
      return () => unsubscribe();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con Firestore.');
      setOrdersLoading(false);
    }
  }, [user]);

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    try {
      await orderService.updateOrderStatus(id, newStatus);
    } catch (err: any) {
      alert(`No se pudo actualizar el estado: ${err.message || err}`);
    }
  };

  const handleUpdateOrder = async (id: string, data: Partial<Order>) => {
    try {
      await orderService.updateOrder(id, data);
    } catch (err: any) {
      alert(`No se pudo actualizar el pedido: ${err.message || err}`);
      throw err;
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await orderService.deleteOrder(id);
    } catch (err: any) {
      alert(`No se pudo eliminar el pedido: ${err.message || err}`);
      throw err;
    }
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  // Filter Orders
  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'todos') return true;
    return order.status === activeFilter;
  });

  // Calculate statistics
  const pendingCount = orders.filter(o => o.status === 'pendiente').length;
  const confirmedCount = orders.filter(o => o.status === 'confirmado').length;
  const totalRevenue = orders
    .filter(o => ['confirmado', 'enviado', 'entregado'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  if (loading || !user || (user.email !== 'miraishop47@gmail.com' && user.email !== 'miraishop47@gmail.com')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-955/50">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header and navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Panel de Control</span>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            Administración de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black">Pedidos</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-xs font-bold text-gray-550 hover:text-indigo-500 dark:text-gray-450 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-800 px-5 py-2.5 rounded-full transition-all"
          >
            Administrar Productos
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-550 dark:text-red-400 text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ingresos Estimados</span>
          <span className="text-2xl font-black text-indigo-650 dark:text-indigo-400">{formatCOP(totalRevenue)}</span>
          <p className="text-[10px] text-gray-400 mt-1 font-light">Suma de pedidos confirmados, enviados y entregados.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pedidos Pendientes</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount} órdenes</span>
          <p className="text-[10px] text-gray-400 mt-1 font-light">Pedidos recibidos que requieren confirmación.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pedidos Confirmados</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{confirmedCount} órdenes</span>
          <p className="text-[10px] text-gray-400 mt-1 font-light">Pedidos validados listos para embalaje y envío.</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex overflow-x-auto pb-4 mb-8 scrollbar-thin scrollbar-thumb-gray-200 gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase border transition-all cursor-pointer ${
              activeFilter === filter
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
                : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            {filter === 'todos' ? 'Todos' : filter}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {ordersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 space-y-6 animate-pulse">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-850">
                <div className="space-y-2 w-1/3">
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-[2rem] p-16 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <span className="text-5xl block">📋</span>
          <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">No hay pedidos</h3>
          <p className="text-gray-500 dark:text-gray-400 font-light text-xs leading-relaxed">
            No se encontraron pedidos con el estado "{activeFilter}". Los nuevos pedidos de los clientes aparecerán aquí automáticamente en tiempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onUpdate={handleUpdateOrder}
              onDelete={handleDeleteOrder}
            />
          ))}
        </div>
      )}

    </div>
  );
}
