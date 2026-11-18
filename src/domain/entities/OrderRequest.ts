import { OrderItem } from './Order';

export type OrderRequestStatus = 'pendiente' | 'aceptada' | 'rechazada';

/**
 * Solicitud de compra: se crea cuando el cliente pulsa "Comprar por WhatsApp".
 * No es un pedido todavía: el admin debe aceptarla desde Notificaciones.
 * Al aceptarla se crea el pedido en `orders` con el mismo id y se descuenta el stock.
 */
export interface OrderRequest {
  id?: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerRole: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderRequestStatus;
  // Firestore Timestamp, o ISO string en modo mock (igual que Order.createdAt).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvedAt?: any;
  resolvedBy?: string;
}

export type NewOrderRequest = Omit<OrderRequest, 'id' | 'status' | 'createdAt' | 'resolvedAt' | 'resolvedBy'>;
