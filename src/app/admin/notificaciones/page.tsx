'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { isAdminUser } from '../../../application/utils/roles';
import { orderRequestService } from '../../../application/services/orderRequestService';
import { OrderRequest } from '../../../domain/entities/OrderRequest';
import OrderRequestBadge from '../../components/OrderRequestBadge';
import { formatCOP, formatOrderDate } from '../../components/OrderHistoryList';

const RECENT_RESOLVED_LIMIT = 20;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  reseller: 'Distribuidor (mayorista)',
  customer: 'Cliente minorista',
};

function RequestCard({
  request,
  busy,
  onAccept,
  onReject,
}: {
  request: OrderRequest;
  busy: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const shortId = request.id ? request.id.slice(-6).toUpperCase() : '—';
  const isPending = request.status === 'pendiente';

  return (
    <li className="rounded-2xl border border-gray-100 dark:border-white/8 bg-white dark:bg-gray-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900 dark:text-white">{request.customerName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
            {request.customerEmail} · {ROLE_LABELS[request.customerRole] ?? request.customerRole}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Solicitud #{shortId} · {formatOrderDate(request.createdAt)}
          </p>
        </div>
        <OrderRequestBadge status={request.status} />
      </div>

      <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/5 border-y border-gray-100 dark:border-white/5">
        {request.items.map((item, idx) => (
          <li key={`${item.productId}-${idx}`} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-gray-700 dark:text-gray-200 min-w-0 truncate">
              {item.nombre}
              <span className="text-gray-400">
                {' '}
                × {item.cantidad}
                {item.isPackageSale && item.unitsPerPackage ? ` paq. (${item.cantidad * item.unitsPerPackage} und.)` : ''}
              </span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{formatCOP(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums ml-1">{formatCOP(request.total)}</span>
        </p>

        {isPending ? (
          <div className="flex gap-2">
            <button
              onClick={onReject}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              onClick={onAccept}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {busy ? 'Procesando…' : 'Aceptar compra'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            {request.status === 'aceptada' ? 'Aceptada' : 'Rechazada'} {formatOrderDate(request.resolvedAt)}
            {request.resolvedBy ? ` por ${request.resolvedBy}` : ''}
          </p>
        )}
      </div>
    </li>
  );
}

export default function AdminNotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = isAdminUser(user);

  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/');
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = orderRequestService.subscribeAll(
      (data) => {
        setRequests(data);
        setError('');
        setFetching(false);
      },
      () => {
        setError('No se pudieron cargar las solicitudes. Revisa que las reglas de Firestore estén publicadas.');
        setFetching(false);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  const pending = useMemo(() => requests.filter((r) => r.status === 'pendiente'), [requests]);
  const resolved = useMemo(
    () => requests.filter((r) => r.status !== 'pendiente').slice(0, RECENT_RESOLVED_LIMIT),
    [requests]
  );

  const handle = async (request: OrderRequest, action: 'accept' | 'reject') => {
    if (!request.id || !user) return;
    const question =
      action === 'accept'
        ? `¿Aceptar la compra de ${request.customerName} por ${formatCOP(request.total)}?\n\nSe registrará como pedido confirmado y se descontará el stock.`
        : `¿Rechazar la solicitud de ${request.customerName}?\n\nNo se registrará ningún pedido.`;
    if (!confirm(question)) return;

    setBusyId(request.id);
    try {
      if (action === 'accept') {
        await orderRequestService.acceptRequest(request.id, user.email);
      } else {
        await orderRequestService.rejectRequest(request.id, user.email);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo procesar la solicitud.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading || (isAdmin && fetching)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Notificaciones</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Solicitudes de compra enviadas por WhatsApp. Al aceptarlas se registran como pedido.
          </p>
        </div>
        <Link href="/admin/orders" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Ver pedidos registrados →
        </Link>
      </div>

      {error && (
        <p className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Por confirmar ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            No hay solicitudes pendientes.
          </p>
        ) : (
          <ul className="space-y-4">
            {pending.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                busy={busyId === r.id}
                onAccept={() => handle(r, 'accept')}
                onReject={() => handle(r, 'reject')}
              />
            ))}
          </ul>
        )}
      </section>

      {resolved.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Atendidas recientemente
          </h2>
          <ul className="space-y-4 opacity-80">
            {resolved.map((r) => (
              <RequestCard key={r.id} request={r} busy={false} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
