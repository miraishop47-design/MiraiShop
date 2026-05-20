export interface CartItem {
  id: string;
  nombre: string;
  imagen: string;
  precio: number; // dynamically mapped based on user role
  cantidad: number;
  stock: number;
}
