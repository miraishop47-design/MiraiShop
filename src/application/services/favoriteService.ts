import { FirebaseFavoriteRepositoryImpl } from '../../infrastructure/firebase/FirebaseFavoriteRepositoryImpl';
import { FavoriteUser } from '../../domain/entities/Favorite';

const repository = new FirebaseFavoriteRepositoryImpl();

export const favoriteService = {
  async getUserFavorites(userId: string): Promise<string[]> {
    const favoriteUser = await repository.getUserFavorites(userId);
    return favoriteUser ? favoriteUser.productIds : [];
  },

  async addFavorite(userId: string, productId: string): Promise<void> {
    return repository.addFavorite(userId, productId);
  },

  async removeFavorite(userId: string, productId: string): Promise<void> {
    return repository.removeFavorite(userId, productId);
  },

  async getAllFavorites(): Promise<FavoriteUser[]> {
    return repository.getAllFavorites();
  }
};
