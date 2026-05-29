import { PreferenceRepository } from '../../domain/repositories/PreferenceRepository';
import { UserPreference } from '../../domain/entities/UserPreference';
import { db, isMockFirebase } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
} from 'firebase/firestore';

const MOCK_PREFERENCES_KEY = 'mock_preferences';
const COLLECTION = 'userPreferences';

export class FirebasePreferenceRepositoryImpl implements PreferenceRepository {
  private collectionRef = collection(db, COLLECTION);

  // ─── Mock helpers ────────────────────────────────────────────────────────────

  private getMockAll(): UserPreference[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(MOCK_PREFERENCES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveMockAll(prefs: UserPreference[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MOCK_PREFERENCES_KEY, JSON.stringify(prefs));
  }

  // ─── Repository methods ───────────────────────────────────────────────────────

  async save(preference: UserPreference): Promise<void> {
    if (isMockFirebase) {
      const all = this.getMockAll();
      const idx = all.findIndex((p) => p.userId === preference.userId);
      if (idx >= 0) {
        all[idx] = preference;
      } else {
        all.push(preference);
      }
      this.saveMockAll(all);
      return;
    }

    // Real Firestore: use userId as document ID so each user has one doc
    const docRef = doc(this.collectionRef, preference.userId);
    await setDoc(docRef, {
      userId: preference.userId,
      preferences: preference.preferences,
      selections: preference.selections,
      updatedAt: preference.updatedAt,
    });
  }

  async getByUserId(userId: string): Promise<UserPreference | null> {
    if (isMockFirebase) {
      const all = this.getMockAll();
      return all.find((p) => p.userId === userId) ?? null;
    }

    const docRef = doc(this.collectionRef, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      userId: data.userId,
      preferences: data.preferences ?? [],
      selections: data.selections ?? {},
      updatedAt: data.updatedAt ?? '',
    };
  }

  async getAll(): Promise<UserPreference[]> {
    if (isMockFirebase) {
      return this.getMockAll();
    }

    const snap = await getDocs(this.collectionRef);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        userId: data.userId,
        preferences: data.preferences ?? [],
        selections: data.selections ?? {},
        updatedAt: data.updatedAt ?? '',
      };
    });
  }
}
