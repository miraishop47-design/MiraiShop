import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { Product } from '../../../domain/entities/Product';

export class GetProductByIdUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(id: string): Promise<Product | null> {
    if (!id) {
      throw new Error('El ID del producto es obligatorio.');
    }
    return this.productRepository.getById(id);
  }
}
