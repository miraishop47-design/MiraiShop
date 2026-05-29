import { Product, PackageOption } from '../../domain/entities/Product';

export const ALLOWED_CATEGORIES = [
  "Hogar",
  "Organización",
  "Gaming",
  "Decoración",
  "Oficina",
  "Accesorios",
  "Tecnología",
  "Automotriz",
  "Colección",
  "Personalizados"
];

export function normalizeCategory(cat: string): string {
  if (!cat) return 'Accesorios';
  const cleanCat = cat.trim().toLowerCase();
  
  if (cleanCat === 'hogar') return 'Hogar';
  if (cleanCat === 'organización' || cleanCat === 'organizacion') return 'Organización';
  if (cleanCat === 'gaming' || cleanCat === 'gamer' || cleanCat === 'juegos' || cleanCat === 'geek') return 'Gaming';
  if (cleanCat === 'decoración' || cleanCat === 'decoracion') return 'Decoración';
  if (cleanCat === 'oficina') return 'Oficina';
  if (cleanCat === 'accesorios' || cleanCat === 'accesorio') return 'Accesorios';
  if (
    cleanCat === 'tecnología' || 
    cleanCat === 'tecnologia' || 
    cleanCat === 'periféricos' || 
    cleanCat === 'perifericos' || 
    cleanCat === 'monitores' || 
    cleanCat === 'audio'
  ) {
    return 'Tecnología';
  }
  if (cleanCat === 'automotriz' || cleanCat === 'auto' || cleanCat === 'carros' || cleanCat === 'carro') return 'Automotriz';
  if (cleanCat === 'colección' || cleanCat === 'coleccion' || cleanCat === 'muy populares' || cleanCat === 'popular') return 'Colección';
  if (
    cleanCat === 'personalizados' || 
    cleanCat === 'personalizado' || 
    cleanCat === 'pla' || 
    cleanCat === 'impresión 3d' || 
    cleanCat === 'impresion 3d' || 
    cleanCat === 'filamentos' || 
    cleanCat === 'stl' || 
    cleanCat === 'printer' || 
    cleanCat === 'maker' || 
    cleanCat === 'impresión' || 
    cleanCat === 'impresion'
  ) {
    return 'Personalizados';
  }
  
  const matched = ALLOWED_CATEGORIES.find(c => c.toLowerCase() === cleanCat);
  return matched || 'Accesorios';
}

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
  isPackageSale?: boolean;
  unitsPerPackage?: number;
  availablePackages?: number;
  precioPaquete?: number;
  packageOptions?: PackageOption[];
  isMadeToOrder?: boolean;
}

export function transformProductForUser(product: Product, role?: 'customer' | 'reseller' | 'admin'): UIProduct {
  const isReseller = role === 'reseller' || role === 'admin';
  const resolvedCategory = normalizeCategory(product.categoria);

  if (!isReseller) {
    return {
      id: product.id,
      nombre: product.nombre,
      precio: 0,
      stock: product.stock,
      descripcion: product.descripcion,
      categoria: resolvedCategory,
      imagen: product.imagen || (product.imagenes && product.imagenes[0]) || '',
      imagenes: product.imagenes,
      activo: product.activo,
      isPackageSale: product.isPackageSale,
      unitsPerPackage: product.unitsPerPackage,
      availablePackages: product.availablePackages,
      packageOptions: product.packageOptions,
      isMadeToOrder: product.isMadeToOrder,
    };
  }

  let resolvedPrecio = product.precioMayorista || 0;
  if (product.isPackageSale) {
    const options = product.packageOptions || [];
    if (options.length > 0) {
      resolvedPrecio = Math.min(...options.map(o => o.wholesalePrice));
    } else if (product.precioPaquete) {
      resolvedPrecio = product.precioPaquete;
    }
  }

  return {
    id: product.id,
    nombre: product.nombre,
    precio: resolvedPrecio,
    stock: product.stock,
    descripcion: product.descripcion,
    categoria: resolvedCategory,
    imagen: product.imagen || (product.imagenes && product.imagenes[0]) || '',
    imagenes: product.imagenes,
    activo: product.activo,
    isPackageSale: product.isPackageSale,
    unitsPerPackage: product.unitsPerPackage,
    availablePackages: product.availablePackages,
    precioPaquete: product.precioPaquete,
    packageOptions: product.packageOptions,
    isMadeToOrder: product.isMadeToOrder,
  };
}
