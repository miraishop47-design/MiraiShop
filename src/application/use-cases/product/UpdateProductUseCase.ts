import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { Product } from '../../../domain/entities/Product';

export class UpdateProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    if (!id) {
      throw new Error('El ID del producto es obligatorio para realizar una actualización.');
    }
    return this.productRepository.update(id, product);
  }
}
