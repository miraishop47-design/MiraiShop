export type OrderStatus = 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';

export interface OrderItem {
  productId: string;
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  isPackageSale?: boolean;
  selectedPackageId?: string;
  packageQuantity?: number;
  unitsPerPackage?: number;
  totalUnits?: number;
  precioPaquete?: number;
  isMadeToOrder?: boolean;
}

export interface Order {
  id?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerRole: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNotes?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt?: any; // Firestore serverTimestamp or Date object
}
