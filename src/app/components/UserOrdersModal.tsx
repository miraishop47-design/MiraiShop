'use client';

import { useEffect, useState } from 'react';
import { orderService } from '../../application/services/orderService';
import { Order } from '../../domain/entities/Order';
import OrderHistoryList, { formatCOP, formatOrderDate, summarizeOrders } from './OrderHistoryList';

interface UserOrdersModalProps {
  target: { id: string; name: string; email: string } | null;
  onClose: () => void;
}

export default function UserOrdersModal({ target, onClose }: UserOrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    const unsubscribe = orderService.subscribeUserOrders(
      target.id,
      (data) => {
        setOrders(data);
        setError('');
        setLoading(false);
      },
      () => {
        setError('No se pudo cargar el historial de este usuario.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  if (!target) return null;

  const { count, validCount, totalSpent } = summarizeOrders(orders);
  const lastOrder = orders[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-orders-title"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-white/10">
          <div className="min-w-0">
            <h3 id="user-orders-title" className="text-lg font-bold text-gray-900 dark:text-white">
              Historial de compras
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-all">
              {target.name} · {target.email}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 -m-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">Este usuario todavía no ha hecho pedidos.</p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/8 p-3">
                  <dt className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Compras</dt>
                  <dd className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                    {validCount}
                    {count > validCount && (
                      <span className="text-xs font-medium text-gray-400"> (+{count - validCount} canc.)</span>
                    )}
                  </dd>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/8 p-3">
                  <dt className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Total</dt>
                  <dd className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{formatCOP(totalSpent)}</dd>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/8 p-3">
                  <dt className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Último</dt>
                  <dd className="text-sm font-bold text-gray-900 dark:text-white mt-1">{formatOrderDate(lastOrder?.createdAt)}</dd>
                </div>
              </dl>
              <OrderHistoryList orders={orders} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
