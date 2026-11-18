import { OrderRepository } from '../../../domain/repositories/OrderRepository';
import { Order } from '../../../domain/entities/Order';

export class GetOrdersUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orderRepository.getAll();
  }

  subscribe(callback: (orders: Order[]) => void): () => void {
    return this.orderRepository.subscribeToAll(callback);
  }

  subscribeByUser(userId: string, callback: (orders: Order[]) => void, onError?: (error: Error) => void): () => void {
    return this.orderRepository.subscribeByUser(userId, callback, onError);
  }
}
