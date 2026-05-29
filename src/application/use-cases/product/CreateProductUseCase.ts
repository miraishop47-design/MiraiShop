import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { Product } from '../../../domain/entities/Product';

export class CreateProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const isStockInvalid = !product.isMadeToOrder && (product.stock === undefined || product.stock < 0);
    if (!product.nombre || isStockInvalid) {
      throw new Error('Datos del producto inválidos. Nombre y stock son requeridos.');
    }
    if (product.isPackageSale) {
      if (product.packageOptions && product.packageOptions.length > 0) {
        const seenUnits = new Set<number>();
        for (const opt of product.packageOptions) {
          if (opt.unitsPerPackage === undefined || opt.unitsPerPackage <= 0) {
            throw new Error('Las unidades por paquete en todas las opciones deben ser mayor a cero.');
          }
          if (opt.wholesalePrice === undefined || opt.wholesalePrice <= 0) {
            throw new Error('El precio del paquete en todas las opciones debe ser mayor a cero.');
          }
          if (!product.isMadeToOrder && (opt.availablePackages === undefined || opt.availablePackages < 0)) {
            throw new Error('La cantidad de paquetes disponibles en todas las opciones no es válida.');
          }
          if (seenUnits.has(opt.unitsPerPackage)) {
            throw new Error(`No se permiten paquetes duplicados con la misma cantidad de unidades (${opt.unitsPerPackage}).`);
          }
          seenUnits.add(opt.unitsPerPackage);
        }
      } else {
        if (product.unitsPerPackage === undefined || product.unitsPerPackage <= 0) {
          throw new Error('Unidades por paquete debe ser mayor a cero para venta por paquetes.');
        }
        if (product.precioPaquete === undefined || product.precioPaquete <= 0) {
          throw new Error('El precio por paquete debe ser mayor a cero para venta por paquetes.');
        }
        if (!product.isMadeToOrder && (product.availablePackages === undefined || product.availablePackages < 0)) {
          throw new Error('Cantidad de paquetes disponibles no es válida.');
        }
      }
    }
    return this.productRepository.create(product);
  }
}
