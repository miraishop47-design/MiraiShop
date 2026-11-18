import { Category } from '../entities/Category';

export interface CategoryRepository {
  /** Categorías creadas por el admin (no incluye las predeterminadas). */
  getAll(): Promise<Category[]>;
  subscribeToAll(callback: (categories: Category[]) => void, onError?: (error: Error) => void): () => void;
  create(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
}
