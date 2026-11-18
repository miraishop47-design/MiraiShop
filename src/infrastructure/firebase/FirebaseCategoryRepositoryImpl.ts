import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { Category } from '../../domain/entities/Category';
import { db, isMockFirebase } from './firebaseConfig';
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, DocumentData } from 'firebase/firestore';

const COLLECTION = 'categorias';
const MOCK_KEY = 'mock_categories';
const MOCK_EVENT = 'mirai:categories-updated';

function fromDoc(id: string, data: DocumentData): Category {
  return {
    id,
    nombre: typeof data.nombre === 'string' ? data.nombre : id,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
  };
}

export class FirebaseCategoryRepositoryImpl implements CategoryRepository {
  private collectionRef = collection(db, COLLECTION);

  // ─── Mock helpers ────────────────────────────────────────────────────────────

  private getMockAll(): Category[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(MOCK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveMockAll(categories: Category[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MOCK_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent(MOCK_EVENT));
  }

  // ─── Repository methods ──────────────────────────────────────────────────────

  async getAll(): Promise<Category[]> {
    if (isMockFirebase) return this.getMockAll();
    const snap = await getDocs(this.collectionRef);
    return snap.docs.map((d) => fromDoc(d.id, d.data()));
  }

  subscribeToAll(callback: (categories: Category[]) => void, onError?: (error: Error) => void): () => void {
    if (isMockFirebase) {
      callback(this.getMockAll());
      const handler = () => callback(this.getMockAll());
      window.addEventListener(MOCK_EVENT, handler);
      return () => window.removeEventListener(MOCK_EVENT, handler);
    }

    return onSnapshot(
      this.collectionRef,
      (snap) => callback(snap.docs.map((d) => fromDoc(d.id, d.data()))),
      (error) => onError?.(error)
    );
  }

  async create(category: Category): Promise<void> {
    if (isMockFirebase) {
      const all = this.getMockAll().filter((c) => c.id !== category.id);
      all.push(category);
      this.saveMockAll(all);
      return;
    }

    await setDoc(doc(this.collectionRef, category.id), {
      nombre: category.nombre,
      createdAt: category.createdAt ?? new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    if (isMockFirebase) {
      this.saveMockAll(this.getMockAll().filter((c) => c.id !== id));
      return;
    }

    await deleteDoc(doc(this.collectionRef, id));
  }
}
