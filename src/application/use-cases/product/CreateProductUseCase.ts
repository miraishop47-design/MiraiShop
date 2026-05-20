import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { Product } from '../../../domain/entities/Product';

export class CreateProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    if (!product.nombre || product.precioCliente <= 0 || product.precioMayorista <= 0 || product.stock < 0) {
      throw new Error('Datos del producto inválidos. Nombre, precios (cliente y mayorista) y stock son requeridos.');
    }
    return this.productRepository.create(product);
  }
}
