import { FirebaseOrderRequestRepositoryImpl } from '../../infrastructure/firebase/FirebaseOrderRequestRepositoryImpl';
import { NewOrderRequest, OrderRequest } from '../../domain/entities/OrderRequest';

const repository = new FirebaseOrderRequestRepositoryImpl();

export const orderRequestService = {
  /** El cliente pulsa "Comprar por WhatsApp": queda pendiente de aprobación. */
  createRequest(request: NewOrderRequest): Promise<OrderRequest> {
    if (!request.items.length) {
      return Promise.reject(new Error('El carrito está vacío.'));
    }
    return repository.create(request);
  },

  subscribeAll(callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void {
    return repository.subscribeAll(callback, onError);
  },

  subscribePending(callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void {
    return repository.subscribePending(callback, onError);
  },

  subscribeUserRequests(userId: string, callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void {
    return repository.subscribeByUser(userId, callback, onError);
  },

  acceptRequest(id: string, adminEmail: string): Promise<void> {
    return repository.accept(id, adminEmail);
  },

  rejectRequest(id: string, adminEmail: string): Promise<void> {
    return repository.reject(id, adminEmail);
  },
};
