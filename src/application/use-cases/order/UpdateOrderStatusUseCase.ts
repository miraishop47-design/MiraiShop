import { OrderRepository } from '../../../domain/repositories/OrderRepository';
import { OrderStatus } from '../../../domain/entities/Order';

export class UpdateOrderStatusUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string, status: OrderStatus): Promise<void> {
    return this.orderRepository.updateStatus(id, status);
  }
}
