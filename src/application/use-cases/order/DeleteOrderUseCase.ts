import { OrderRepository } from '../../../domain/repositories/OrderRepository';

export class DeleteOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new Error('Order ID is required');
    return this.orderRepository.delete(id);
  }
}
