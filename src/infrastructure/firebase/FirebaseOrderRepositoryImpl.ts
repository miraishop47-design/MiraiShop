import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { db, isMockFirebase } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy,
  increment
} from 'firebase/firestore';

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

  async create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    // Resolve prices if items have 0 price or if customer role is client
    let resolvedSubtotal = 0;
    let rawProducts: any[] = [];
    if (isMockFirebase) {
      if (typeof window !== 'undefined') {
        rawProducts = JSON.parse(localStorage.getItem('mock_products') || '[]');
      }
    } else {
      try {
        const productDocs = await getDocs(collection(db, 'productos'));
        productDocs.forEach((d) => {
          rawProducts.push({ id: d.id, ...d.data() });
        });
      } catch (e) {
        console.error("Error loading products to resolve order prices:", e);
      }
    }

    const updatedItems = order.items.map((item) => {
      const prod = rawProducts.find((p) => p.id === item.productId);
      let price = item.precio;
      
      if (price <= 0 && prod) {
        if (item.isPackageSale && item.selectedPackageId) {
          const opt = prod.packageOptions?.find((o: any) => o.id === item.selectedPackageId);
          if (opt) {
            price = Number(opt.wholesalePrice || opt.precioPaquete || 0);
          } else {
            price = Number(prod.precioPaquete || prod.precioMayorista || 0);
          }
        } else {
          price = Number(prod.precioMayorista || 0);
        }
      }
      
      const subtotal = price * item.cantidad;
      resolvedSubtotal += subtotal;
      
      return {
        ...item,
        precio: price,
        subtotal: subtotal,
        precioPaquete: item.isPackageSale ? price : undefined,
        isMadeToOrder: prod?.isMadeToOrder || false
      };
    });

    order.items = updatedItems;
    order.subtotal = resolvedSubtotal;
    order.total = resolvedSubtotal;

    if (isMockFirebase) {
      // Decrement availablePackages in localStorage for products that use package sale
      if (typeof window !== 'undefined') {
        const productsStore = JSON.parse(localStorage.getItem('mock_products') || '[]');
        order.items.forEach((item) => {
          if (item.isPackageSale && !item.isMadeToOrder) {
            const prod = productsStore.find((p: any) => p.id === item.productId);
            if (prod) {
              if (prod.packageOptions && prod.packageOptions.length > 0 && item.selectedPackageId) {
                const opt = prod.packageOptions.find((o: any) => o.id === item.selectedPackageId);
                if (opt) {
                  opt.availablePackages = Math.max(0, (opt.availablePackages || 0) - item.cantidad);
                }
              } else {
                prod.availablePackages = Math.max(0, (prod.availablePackages || 0) - item.cantidad);
              }
            }
          }
        });
        localStorage.setItem('mock_products', JSON.stringify(productsStore));
        window.dispatchEvent(new Event('mock_products_changed'));
      }

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

    // In real mode: decrement in Firestore
    for (const item of order.items) {
      if (item.isPackageSale && !item.isMadeToOrder) {
        try {
          const productRef = doc(db, 'productos', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const prodData = productSnap.data();
            if (prodData.packageOptions && item.selectedPackageId) {
              const updatedOptions = (prodData.packageOptions as any[]).map((opt: any) => {
                if (opt.id === item.selectedPackageId) {
                  return {
                    ...opt,
                    availablePackages: Math.max(0, (opt.availablePackages || 0) - item.cantidad)
                  };
                }
                return opt;
              });
              await updateDoc(productRef, { packageOptions: updatedOptions });
            } else {
              await updateDoc(productRef, {
                availablePackages: increment(-item.cantidad)
              });
            }
          }
        } catch (e) {
          console.error("Error decrementing package stock:", e);
        }
      }
    }

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
    if (isMockFirebase) {
      return this.getMockOrders();
    }

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
      });
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
        const data = docSnap.data();
        orders.push({
          id: docSnap.id,
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
        });
      });
      callback(orders);
    }, (error) => {
      console.error("Error subscribing to orders:", error);
    });
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
    const updatePayload = { ...data };
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
