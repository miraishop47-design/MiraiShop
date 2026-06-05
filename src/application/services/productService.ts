import { FirebaseProductRepositoryImpl } from '../../infrastructure/firebase/FirebaseProductRepositoryImpl';
import { CreateProductUseCase } from '../use-cases/product/CreateProductUseCase';
import { GetProductsUseCase } from '../use-cases/product/GetProductsUseCase';
import { GetProductByIdUseCase } from '../use-cases/product/GetProductByIdUseCase';
import { UpdateProductUseCase } from '../use-cases/product/UpdateProductUseCase';
import { DeleteProductUseCase } from '../use-cases/product/DeleteProductUseCase';
import { Product } from '../../domain/entities/Product';

// Instantiate the single concrete repository implementation
const productRepository = new FirebaseProductRepositoryImpl();

// Instantiate Use Cases
const createProductUseCase = new CreateProductUseCase(productRepository);
const getProductsUseCase = new GetProductsUseCase(productRepository);
const getProductByIdUseCase = new GetProductByIdUseCase(productRepository);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const deleteProductUseCase = new DeleteProductUseCase(productRepository);

export const productService = {
  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    return createProductUseCase.execute(product);
  },

  async getProducts(): Promise<Product[]> {
    return getProductsUseCase.execute();
  },

  async getProductById(id: string): Promise<Product | null> {
    return getProductByIdUseCase.execute(id);
  },

  subscribeProducts(callback: (products: Product[]) => void, onError?: (error: any) => void): () => void {
    return getProductsUseCase.subscribe(callback, onError);
  },

  async updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    return updateProductUseCase.execute(id, product);
  },

  async deleteProduct(id: string): Promise<void> {
    return deleteProductUseCase.execute(id);
  }
};
