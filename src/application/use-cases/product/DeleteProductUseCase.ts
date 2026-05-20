import { ProductRepository } from '../../../domain/repositories/ProductRepository';

export class DeleteProductUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('El ID del producto es obligatorio para eliminarlo.');
    }
    return this.productRepository.delete(id);
  }
}
