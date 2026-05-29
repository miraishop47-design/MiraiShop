import { OrderRepository } from '../../../domain/repositories/OrderRepository';
import { Order } from '../../../domain/entities/Order';

export class UpdateOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string, data: Partial<Order>): Promise<void> {
    if (!id) throw new Error('Order ID is required');
    return this.orderRepository.update(id, data);
  }
}
