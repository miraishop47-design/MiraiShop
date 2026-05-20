import { Product } from '../../domain/entities/Product';

export interface UIProduct {
  id?: string;
  nombre: string;
  precio: number;
  stock: number;
  descripcion: string;
  categoria: string;
  imagen: string;
  imagenes?: string[];
  activo: boolean;
}

export function transformProductForUser(product: Product, role?: 'customer' | 'reseller' | 'admin'): UIProduct {
  // Customer role -> precioCliente
  // Reseller or Admin role -> precioMayorista
  // Default/Visitor -> precioCliente
  const precio = (role === 'reseller' || role === 'admin') 
    ? product.precioMayorista 
    : product.precioCliente;

  return {
    id: product.id,
    nombre: product.nombre,
    precio: precio,
    stock: product.stock,
    descripcion: product.descripcion,
    categoria: product.categoria,
    imagen: product.imagen || (product.imagenes && product.imagenes[0]) || '',
    imagenes: product.imagenes,
    activo: product.activo,
  };
}
