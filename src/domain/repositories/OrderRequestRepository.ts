import { NewOrderRequest, OrderRequest } from '../entities/OrderRequest';

export interface OrderRequestRepository {
  create(request: NewOrderRequest): Promise<OrderRequest>;
  /** Todas las solicitudes (solo admin), más recientes primero. */
  subscribeAll(callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void;
  /** Solo las pendientes (solo admin), para el contador de notificaciones. */
  subscribePending(callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void;
  /** Solicitudes de un cliente, más recientes primero. */
  subscribeByUser(userId: string, callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void;
  /** Crea el pedido en `orders` (mismo id), descuenta stock y marca la solicitud como aceptada. */
  accept(id: string, adminEmail: string): Promise<void>;
  reject(id: string, adminEmail: string): Promise<void>;
}
