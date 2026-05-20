import { Product } from '../entities/Product';

export interface ProductRepository {
  create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  subscribeToAll(callback: (products: Product[]) => void): () => void;
  update(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
}
