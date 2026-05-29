import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { db, isMockFirebase } from './firebaseConfig';
import { FavoriteRepository } from '../../domain/repositories/FavoriteRepository';
import { FavoriteUser } from '../../domain/entities/Favorite';

const COLLECTION_NAME = 'favorites';

export class FirebaseFavoriteRepositoryImpl implements FavoriteRepository {
  async getUserFavorites(userId: string): Promise<FavoriteUser | null> {
    if (isMockFirebase) {
      const data = localStorage.getItem(`${COLLECTION_NAME}_${userId}`);
      if (data) return JSON.parse(data) as FavoriteUser;
      return null;
    }

    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        userId,
        productIds: docSnap.data().productIds || [],
      };
    }
    return null;
  }

  async addFavorite(userId: string, productId: string): Promise<void> {
    if (isMockFirebase) {
      const existing = await this.getUserFavorites(userId);
      const productIds = existing ? [...new Set([...existing.productIds, productId])] : [productId];
      localStorage.setItem(`${COLLECTION_NAME}_${userId}`, JSON.stringify({ userId, productIds }));
      return;
    }

    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        productIds: arrayUnion(productId)
      });
    } else {
      await setDoc(docRef, {
        productIds: [productId]
      });
    }
  }

  async removeFavorite(userId: string, productId: string): Promise<void> {
    if (isMockFirebase) {
      const existing = await this.getUserFavorites(userId);
      if (existing) {
        const productIds = existing.productIds.filter(id => id !== productId);
        localStorage.setItem(`${COLLECTION_NAME}_${userId}`, JSON.stringify({ userId, productIds }));
      }
      return;
    }

    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        productIds: arrayRemove(productId)
      });
    }
  }

  async getAllFavorites(): Promise<FavoriteUser[]> {
    if (isMockFirebase) {
      const results: FavoriteUser[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${COLLECTION_NAME}_`)) {
          const data = localStorage.getItem(key);
          if (data) results.push(JSON.parse(data));
        }
      }
      return results;
    }

    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      productIds: doc.data().productIds || [],
    }));
  }
}
