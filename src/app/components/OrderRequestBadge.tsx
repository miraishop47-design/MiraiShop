import { OrderRequestStatus } from '../../domain/entities/OrderRequest';

const STYLES: Record<OrderRequestStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/30 dark:border-amber-900/30',
  aceptada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-900/30',
  rechazada: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200/30 dark:border-red-900/30',
};

const LABELS: Record<OrderRequestStatus, string> = {
  pendiente: 'Por confirmar',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
};

export default function OrderRequestBadge({ status }: { status: OrderRequestStatus }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${STYLES[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {LABELS[status]}
    </span>
  );
}
