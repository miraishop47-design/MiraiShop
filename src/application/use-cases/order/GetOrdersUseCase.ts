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
}
