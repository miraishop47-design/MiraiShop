import { Order, OrderStatus } from '../entities/Order';

export interface OrderRepository {
  create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order>;
  getAll(): Promise<Order[]>;
  subscribeToAll(callback: (orders: Order[]) => void): () => void;
  /** Pedidos de un usuario, más recientes primero. */
  subscribeByUser(userId: string, callback: (orders: Order[]) => void, onError?: (error: Error) => void): () => void;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
  update(id: string, data: Partial<Order>): Promise<void>;
  delete(id: string): Promise<void>;
}
