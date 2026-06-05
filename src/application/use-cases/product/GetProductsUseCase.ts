import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { Product } from '../../../domain/entities/Product';

export class GetProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.getAll();
  }

  subscribe(callback: (products: Product[]) => void, onError?: (error: any) => void): () => void {
    return this.productRepository.subscribeToAll(callback, onError);
  }
}
