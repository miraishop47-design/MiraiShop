'use client';

import { useState } from 'react';
import { Order } from '../../domain/entities/Order';
import OrderStatusBadge from './OrderStatusBadge';

export const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);

type OrderTimestamp = { toDate?: () => Date; seconds?: number } | string | number | null | undefined;

export const formatOrderDate = (timestamp: OrderTimestamp) => {
  if (!timestamp) return 'Registrando…';
  const date =
    typeof timestamp === 'object'
      ? timestamp.toDate
        ? timestamp.toDate()
        : new Date((timestamp.seconds ?? 0) * 1000)
      : new Date(timestamp);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

/** Resumen: los pedidos cancelados no cuentan como gasto. */
export function summarizeOrders(orders: Order[]) {
  const valid = orders.filter((o) => o.status !== 'cancelado');
  return {
    count: orders.length,
    validCount: valid.length,
    totalSpent: valid.reduce((sum, o) => sum + (o.total || 0), 0),
  };
}

function itemsLabel(order: Order) {
  const units = order.items.reduce((n, i) => n + (i.cantidad || 0), 0);
  return `${units} ${units === 1 ? 'artículo' : 'artículos'}`;
}

function OrderRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const shortId = order.id ? order.id.slice(-6).toUpperCase() : '—';

  return (
    <li className="rounded-2xl border border-gray-100 dark:border-white/8 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex-1 min-w-[10rem]">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Pedido #{shortId}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatOrderDate(order.createdAt)} · {itemsLabel(order)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
        <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{formatCOP(order.total)}</p>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="border-t border-gray-100 dark:border-white/8 divide-y divide-gray-100 dark:divide-white/5">
          {order.items.map((item, idx) => (
            <li key={`${item.productId}-${item.selectedPackageId ?? ''}-${idx}`} className="flex items-center gap-3 p-4">
              {item.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imagen} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.isPackageSale
                    ? `${item.cantidad} paquete(s)${item.unitsPerPackage ? ` × ${item.unitsPerPackage} und.` : ''}`
                    : `${item.cantidad} × ${formatCOP(item.precio)}`}
                </p>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatCOP(item.subtotal)}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrderHistoryList({ orders }: { orders: Order[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </ul>
  );
}
