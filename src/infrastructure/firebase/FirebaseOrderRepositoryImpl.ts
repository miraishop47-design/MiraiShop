import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

export class FirebaseOrderRepositoryImpl implements OrderRepository {
  private collectionRef = collection(db, 'orders');

  async create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    const docRef = await addDoc(this.collectionRef, {
      ...order,
      status: 'pendiente' as OrderStatus,
      createdAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      ...order,
      status: 'pendiente' as OrderStatus,
    };
  }

  async getAll(): Promise<Order[]> {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      orders.push({
        id: docSnap.id,
        userId: data.userId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerRole: data.customerRole,
        customerPhone: data.customerPhone,
        items: data.items || [],
        subtotal: Number(data.subtotal),
        total: Number(data.total),
        status: data.status as OrderStatus,
        createdAt: data.createdAt,
      });
    });
    return orders;
  }

  subscribeToAll(callback: (orders: Order[]) => void): () => void {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const orders: Order[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        orders.push({
          id: docSnap.id,
          userId: data.userId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerRole: data.customerRole,
          customerPhone: data.customerPhone,
          items: data.items || [],
          subtotal: Number(data.subtotal),
          total: Number(data.total),
          status: data.status as OrderStatus,
          createdAt: data.createdAt,
        });
      });
      callback(orders);
    }, (error) => {
      console.error("Error subscribing to orders:", error);
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, { status });
  }
}
