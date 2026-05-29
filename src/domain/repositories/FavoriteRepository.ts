import { FavoriteUser } from '../entities/Favorite';

export interface FavoriteRepository {
  /**
   * Retrieves the favorite products for a specific user.
   */
  getUserFavorites(userId: string): Promise<FavoriteUser | null>;

  /**
   * Adds a product to the user's favorites.
   */
  addFavorite(userId: string, productId: string): Promise<void>;

  /**
   * Removes a product from the user's favorites.
   */
  removeFavorite(userId: string, productId: string): Promise<void>;

  /**
   * Retrieves all favorites for analytics purposes.
   */
  getAllFavorites(): Promise<FavoriteUser[]>;
}
