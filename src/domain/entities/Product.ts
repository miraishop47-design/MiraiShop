export interface PackageOption {
  id: string;
  unitsPerPackage: number;
  availablePackages: number;
  wholesalePrice: number;
}

export interface Product {
  id?: string;
  nombre: string;
  precioCliente?: number;
  precioMayorista?: number;
  stock: number;
  descripcion: string;
  categoria: string;
  imagen: string;       // Primary image URL
  imagenes?: string[];   // Optional multi-image gallery support
  activo: boolean;       // Status flag
  createdAt?: any;       // Timestamp from Firestore
  isPackageSale?: boolean;
  unitsPerPackage?: number;
  availablePackages?: number;
  precioPaquete?: number;
  packageOptions?: PackageOption[];
  isMadeToOrder?: boolean;
}
