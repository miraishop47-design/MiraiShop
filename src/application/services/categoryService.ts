import { FirebaseCategoryRepositoryImpl } from '../../infrastructure/firebase/FirebaseCategoryRepositoryImpl';
import { Category } from '../../domain/entities/Category';
import { DEFAULT_CATEGORIES } from '../utils/productTransformer';

const repository = new FirebaseCategoryRepositoryImpl();

const MAX_NAME_LENGTH = 30;

/** "Decoración" -> "decoracion"; "Día de la Madre" -> "dia-de-la-madre" */
export function categorySlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Limpia espacios y pone la primera letra en mayúscula. */
export function cleanCategoryName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function isDefaultCategory(name: string): boolean {
  const slug = categorySlug(name);
  return DEFAULT_CATEGORIES.some((c) => categorySlug(c) === slug);
}

/** Predeterminadas primero (en su orden) y luego las creadas por el admin, alfabéticamente. */
export function mergeCategories(custom: Category[]): string[] {
  const extra = custom
    .filter((c) => !isDefaultCategory(c.nombre))
    .map((c) => c.nombre)
    .sort((a, b) => a.localeCompare(b, 'es'));
  return [...DEFAULT_CATEGORIES, ...extra];
}

export const categoryService = {
  subscribeCustomCategories(callback: (categories: Category[]) => void, onError?: (error: Error) => void): () => void {
    return repository.subscribeToAll(callback, onError);
  },

  async createCategory(rawName: string, existing: string[]): Promise<Category> {
    const nombre = cleanCategoryName(rawName);
    if (!nombre) {
      throw new Error('Escribe un nombre para la categoría.');
    }
    if (nombre.length > MAX_NAME_LENGTH) {
      throw new Error(`El nombre no puede tener más de ${MAX_NAME_LENGTH} caracteres.`);
    }

    const id = categorySlug(nombre);
    if (!id) {
      throw new Error('El nombre debe tener al menos una letra o número.');
    }
    if (existing.some((c) => categorySlug(c) === id)) {
      throw new Error(`La categoría "${nombre}" ya existe.`);
    }

    const category: Category = { id, nombre, createdAt: new Date().toISOString() };
    await repository.create(category);
    return category;
  },

  async deleteCategory(category: Category, productsUsingIt: number): Promise<void> {
    if (isDefaultCategory(category.nombre)) {
      throw new Error('Las categorías predeterminadas no se pueden eliminar.');
    }
    if (productsUsingIt > 0) {
      throw new Error(
        `No se puede eliminar "${category.nombre}": ${productsUsingIt} producto(s) la usan. Cámbiales la categoría primero.`
      );
    }
    await repository.delete(category.id);
  },
};
