import { OrderRepository } from '../../../domain/repositories/OrderRepository';
import { Order } from '../../../domain/entities/Order';

export class CreateOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    return this.orderRepository.create(order);
  }
}
