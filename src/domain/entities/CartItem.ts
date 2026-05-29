export interface CartItem {
  id: string; // Cart-specific key (e.g. productId or productId-packageId)
  productId: string; // The original product ID
  nombre: string;
  imagen: string;
  precio: number; // dynamically mapped based on user role
  cantidad: number;
  stock: number;
  isPackageSale?: boolean;
  selectedPackageId?: string;
  packageQuantity?: number;
  unitsPerPackage?: number;
  availablePackages?: number;
  precioPaquete?: number;
  totalUnits?: number;
  isMadeToOrder?: boolean;
}
