import { FirebaseOrderRepositoryImpl } from '../../infrastructure/firebase/FirebaseOrderRepositoryImpl';
import { CreateOrderUseCase } from '../use-cases/order/CreateOrderUseCase';
import { GetOrdersUseCase } from '../use-cases/order/GetOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../use-cases/order/UpdateOrderStatusUseCase';
import { Order, OrderStatus } from '../../domain/entities/Order';

const orderRepository = new FirebaseOrderRepositoryImpl();

const createOrderUseCase = new CreateOrderUseCase(orderRepository);
const getOrdersUseCase = new GetOrdersUseCase(orderRepository);
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository);

export const orderService = {
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    return createOrderUseCase.execute(order);
  },

  async getOrders(): Promise<Order[]> {
    return getOrdersUseCase.execute();
  },

  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    return getOrdersUseCase.subscribe(callback);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    return updateOrderStatusUseCase.execute(id, status);
  }
};
