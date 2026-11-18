import { OrderRequestRepository } from '../../domain/repositories/OrderRequestRepository';
import { NewOrderRequest, OrderRequest, OrderRequestStatus } from '../../domain/entities/OrderRequest';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { db, isMockFirebase } from './firebaseConfig';
import { cleanUndefined, decrementStock, resolveOrderPrices } from './orderInventory';
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

/* eslint-disable @typescript-eslint/no-explicit-any */

const COLLECTION = 'solicitudes';
const MOCK_KEY = 'mock_order_requests';
const MOCK_EVENT = 'mock_order_requests_changed';
/** Estado con el que nace el pedido cuando el admin acepta la solicitud. */
const ACCEPTED_ORDER_STATUS: OrderStatus = 'confirmado';

function toMillis(value: any): number {
  if (!value) return Date.now(); // serverTimestamp aún sin resolver: es de "ahora"
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

const byNewest = (a: OrderRequest, b: OrderRequest) => toMillis(b.createdAt) - toMillis(a.createdAt);

function fromDoc(id: string, data: DocumentData): OrderRequest {
  return {
    id,
    userId: data.userId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerRole: data.customerRole,
    items: (data.items || []).map((item: any) => ({
      ...item,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      subtotal: Number(item.subtotal),
    })),
    subtotal: Number(data.subtotal),
    total: Number(data.total),
    status: data.status as OrderRequestStatus,
    createdAt: data.createdAt,
    resolvedAt: data.resolvedAt,
    resolvedBy: data.resolvedBy,
  };
}

export class FirebaseOrderRequestRepositoryImpl implements OrderRequestRepository {
  private collectionRef = collection(db, COLLECTION);

  // ─── Mock helpers ────────────────────────────────────────────────────────────

  private getMock(): OrderRequest[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private saveMock(requests: OrderRequest[]): void {
    localStorage.setItem(MOCK_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event(MOCK_EVENT));
  }

  private subscribeMock(filter: (r: OrderRequest) => boolean, callback: (r: OrderRequest[]) => void): () => void {
    const emit = () => callback(this.getMock().filter(filter).sort(byNewest));
    emit();
    window.addEventListener(MOCK_EVENT, emit);
    return () => window.removeEventListener(MOCK_EVENT, emit);
  }

  private resolveMock(id: string, status: OrderRequestStatus, adminEmail: string): OrderRequest {
    const all = this.getMock();
    const req = all.find((r) => r.id === id);
    if (!req) throw new Error('La solicitud ya no existe.');
    if (req.status !== 'pendiente') throw new Error('Esta solicitud ya fue atendida.');
    req.status = status;
    req.resolvedAt = new Date().toISOString();
    req.resolvedBy = adminEmail;
    this.saveMock(all);
    return req;
  }

  // ─── Repository methods ──────────────────────────────────────────────────────

  async create(input: NewOrderRequest): Promise<OrderRequest> {
    const request = await resolveOrderPrices(input);

    if (isMockFirebase) {
      const created: OrderRequest = {
        ...request,
        id: `order-${Date.now()}`,
        status: 'pendiente',
        createdAt: new Date().toISOString(),
      };
      this.saveMock([created, ...this.getMock()]);
      return created;
    }

    const docRef = await addDoc(this.collectionRef, {
      ...cleanUndefined(request),
      status: 'pendiente' as OrderRequestStatus,
      createdAt: serverTimestamp(),
    });
    return { ...request, id: docRef.id, status: 'pendiente' };
  }

  subscribeAll(callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void {
    if (isMockFirebase) return this.subscribeMock(() => true, callback);

    return onSnapshot(
      this.collectionRef,
      (snap) => callback(snap.docs.map((d) => fromDoc(d.id, d.data())).sort(byNewest)),
      (error) => {
        console.error('Error subscribing to order requests:', error);
        onError?.(error);
      }
    );
  }

  subscribePending(callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void {
    if (isMockFirebase) return this.subscribeMock((r) => r.status === 'pendiente', callback);

    return onSnapshot(
      query(this.collectionRef, where('status', '==', 'pendiente')),
      (snap) => callback(snap.docs.map((d) => fromDoc(d.id, d.data())).sort(byNewest)),
      (error) => {
        console.error('Error subscribing to pending order requests:', error);
        onError?.(error);
      }
    );
  }

  subscribeByUser(userId: string, callback: (requests: OrderRequest[]) => void, onError?: (error: Error) => void): () => void {
    if (isMockFirebase) return this.subscribeMock((r) => r.userId === userId, callback);

    return onSnapshot(
      query(this.collectionRef, where('userId', '==', userId)),
      (snap) => callback(snap.docs.map((d) => fromDoc(d.id, d.data())).sort(byNewest)),
      (error) => {
        console.error('Error subscribing to user order requests:', error);
        onError?.(error);
      }
    );
  }

  async accept(id: string, adminEmail: string): Promise<void> {
    if (isMockFirebase) {
      const req = this.resolveMock(id, 'aceptada', adminEmail);
      const order: Order = {
        id,
        userId: req.userId,
        customerName: req.customerName,
        customerEmail: req.customerEmail,
        customerRole: req.customerRole,
        items: req.items,
        subtotal: req.subtotal,
        total: req.total,
        status: ACCEPTED_ORDER_STATUS,
        createdAt: new Date().toISOString(),
        requestedAt: req.createdAt,
      };
      const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
      localStorage.setItem('mock_orders', JSON.stringify([order, ...orders]));
      window.dispatchEvent(new Event('mock_orders_changed'));
      await decrementStock(req.items);
      return;
    }

    const requestRef = doc(db, COLLECTION, id);
    const orderRef = doc(db, 'orders', id);

    // La transacción evita que dos admins acepten la misma solicitud a la vez
    // (se crearía el pedido dos veces y se descontaría el stock doble).
    const accepted = await runTransaction(db, async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists()) throw new Error('La solicitud ya no existe.');
      const req = fromDoc(snap.id, snap.data());
      if (req.status !== 'pendiente') throw new Error('Esta solicitud ya fue atendida.');

      tx.set(
        orderRef,
        cleanUndefined({
          userId: req.userId,
          customerName: req.customerName,
          customerEmail: req.customerEmail,
          customerRole: req.customerRole,
          items: req.items,
          subtotal: req.subtotal,
          total: req.total,
          status: ACCEPTED_ORDER_STATUS,
          createdAt: serverTimestamp(),
          requestedAt: snap.data().createdAt ?? null,
        })
      );
      tx.update(requestRef, { status: 'aceptada', resolvedAt: serverTimestamp(), resolvedBy: adminEmail });
      return req;
    });

    await decrementStock(accepted.items);
  }

  async reject(id: string, adminEmail: string): Promise<void> {
    if (isMockFirebase) {
      this.resolveMock(id, 'rechazada', adminEmail);
      return;
    }

    const requestRef = doc(db, COLLECTION, id);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists()) throw new Error('La solicitud ya no existe.');
      if (snap.data().status !== 'pendiente') throw new Error('Esta solicitud ya fue atendida.');
      tx.update(requestRef, { status: 'rechazada', resolvedAt: serverTimestamp(), resolvedBy: adminEmail });
    });
  }
}
