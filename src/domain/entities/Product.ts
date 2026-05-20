export interface Product {
  id?: string;
  nombre: string;
  precioCliente: number;
  precioMayorista: number;
  stock: number;
  descripcion: string;
  categoria: string;
  imagen: string;       // Primary image URL
  imagenes?: string[];   // Optional multi-image gallery support
  activo: boolean;       // Status flag
  createdAt?: any;       // Timestamp from Firestore
}
