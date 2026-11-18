import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { db, isMockFirebase } from './firebaseConfig';
import { cleanUndefined, decrementStock, resolveOrderPrices } from './orderInventory';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy,
  where,
  DocumentData
} from 'firebase/firestore';

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Más recientes primero. */
function sortByNewest(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

function orderFromDoc(id: string, data: DocumentData): Order {
  return {
    id,
    userId: data.userId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerRole: data.customerRole,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    customerNotes: data.customerNotes,
    items: (data.items || []).map((item: any) => ({
      productId: item.productId,
      nombre: item.nombre,
      imagen: item.imagen,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      subtotal: Number(item.subtotal),
      isPackageSale: item.isPackageSale || false,
      packageQuantity: item.packageQuantity !== undefined ? Number(item.packageQuantity) : undefined,
      unitsPerPackage: item.unitsPerPackage !== undefined ? Number(item.unitsPerPackage) : undefined,
      totalUnits: item.totalUnits !== undefined ? Number(item.totalUnits) : undefined,
      precioPaquete: item.precioPaquete !== undefined ? Number(item.precioPaquete) : undefined,
    })),
    subtotal: Number(data.subtotal),
    total: Number(data.total),
    status: data.status as OrderStatus,
    createdAt: data.createdAt,
    requestedAt: data.requestedAt,
    rouletteTicketGranted: data.rouletteTicketGranted,
  };
}

export class FirebaseOrderRepositoryImpl implements OrderRepository {
  private collectionRef = collection(db, 'orders');

  private getMockOrders(): Order[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('mock_orders');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  private saveMockOrders(orders: Order[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mock_orders', JSON.stringify(orders));
    window.dispatchEvent(new Event('mock_orders_changed'));
  }

  async create(input: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    const order = await resolveOrderPrices(input);
    await decrementStock(order.items);

    if (isMockFirebase) {
      const orders = this.getMockOrders();
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        ...order,
        status: 'pendiente' as OrderStatus,
        createdAt: new Date().toISOString()
      };
      orders.unshift(newOrder);
      this.saveMockOrders(orders);
      return newOrder;
    }

    const docRef = await addDoc(this.collectionRef, {
      ...cleanUndefined(order),
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
    if (isMockFirebase) {
      return this.getMockOrders();
    }

    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push(orderFromDoc(docSnap.id, docSnap.data()));
    });
    return orders;
  }

  subscribeToAll(callback: (orders: Order[]) => void): () => void {
    if (isMockFirebase) {
      callback(this.getMockOrders());
      const handler = () => {
        callback(this.getMockOrders());
      };
      window.addEventListener('mock_orders_changed', handler);
      return () => {
        window.removeEventListener('mock_orders_changed', handler);
      };
    }

    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const orders: Order[] = [];
      querySnapshot.forEach((docSnap) => {
        orders.push(orderFromDoc(docSnap.id, docSnap.data()));
      });
      callback(orders);
    }, (error) => {
      console.error("Error subscribing to orders:", error);
    });
  }

  subscribeByUser(userId: string, callback: (orders: Order[]) => void, onError?: (error: Error) => void): () => void {
    if (isMockFirebase) {
      const emit = () => callback(sortByNewest(this.getMockOrders().filter((o) => o.userId === userId)));
      emit();
      window.addEventListener('mock_orders_changed', emit);
      return () => window.removeEventListener('mock_orders_changed', emit);
    }

    // Sin orderBy para no requerir un índice compuesto (userId + createdAt):
    // se ordena en el cliente, los pedidos de una persona son pocos.
    const q = query(this.collectionRef, where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => callback(sortByNewest(snap.docs.map((d) => orderFromDoc(d.id, d.data())))),
      (error) => {
        console.error('Error subscribing to user orders:', error);
        onError?.(error);
      }
    );
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    if (isMockFirebase) {
      const orders = this.getMockOrders();
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index].status = status;
        this.saveMockOrders(orders);
      }
      return;
    }

    const docRef = doc(db, 'orders', id);
    await updateDoc(docRef, { status });
  }

  async update(id: string, data: Partial<Order>): Promise<void> {
    if (isMockFirebase) {
      const orders = this.getMockOrders();
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...data };
        this.saveMockOrders(orders);
      }
      return;
    }

    const docRef = doc(db, 'orders', id);
    
    
    const updatePayload = cleanUndefined({ ...data });
    delete updatePayload.id; // Prevent updating ID
    await updateDoc(docRef, updatePayload);
  }

  async delete(id: string): Promise<void> {
    if (isMockFirebase) {
      const orders = this.getMockOrders();
      const filtered = orders.filter(o => o.id !== id);
      this.saveMockOrders(filtered);
      return;
    }

    const { deleteDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'orders', id);
    await deleteDoc(docRef);
  }
}
