import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db, isMockFirebase } from '../../infrastructure/firebase/firebaseConfig';

const MOCK_SPINS_PREFIX = 'mirai_spins_';
const SPINS_UPDATED_EVENT = 'mirai:spins-updated';

/** Compra mínima (COP) para que un pedido otorgue un giro de la Ruleta de la Suerte. */
export const MIN_PURCHASE_FOR_SPIN = 40000;

function mockKey(userId: string) {
  return `${MOCK_SPINS_PREFIX}${userId}`;
}

function getMockSpins(userId: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(mockKey(userId));
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function setMockSpins(userId: string, value: number) {
  localStorage.setItem(mockKey(userId), String(Math.max(0, value)));
  window.dispatchEvent(new CustomEvent(SPINS_UPDATED_EVENT, { detail: { userId } }));
}

/** Otorga una oportunidad de giro al usuario. Se debe llamar al confirmar una compra. */
export async function grantRouletteSpin(userId?: string): Promise<void> {
  if (!userId || userId === 'invitado') return;

  if (isMockFirebase) {
    setMockSpins(userId, getMockSpins(userId) + 1);
    return;
  }

  const userRef = doc(db, 'usuarios', userId);
  try {
    await updateDoc(userRef, { rouletteSpins: increment(1) });
  } catch {
    await setDoc(userRef, { rouletteSpins: 1 }, { merge: true });
  }
}

/** Consume una oportunidad de giro (llamar justo antes de animar la ruleta). */
export async function consumeRouletteSpin(userId?: string): Promise<void> {
  if (!userId || userId === 'invitado') return;

  if (isMockFirebase) {
    setMockSpins(userId, getMockSpins(userId) - 1);
    return;
  }

  const userRef = doc(db, 'usuarios', userId);
  await updateDoc(userRef, { rouletteSpins: increment(-1) });
}

export async function getRouletteSpins(userId?: string): Promise<number> {
  if (!userId || userId === 'invitado') return 0;

  if (isMockFirebase) {
    return getMockSpins(userId);
  }

  const snap = await getDoc(doc(db, 'usuarios', userId));
  return snap.exists() ? (snap.data().rouletteSpins || 0) : 0;
}

/** Se suscribe a los cambios de giros disponibles del usuario en tiempo real. */
export function subscribeRouletteSpins(userId: string | undefined, callback: (spins: number) => void): () => void {
  if (!userId || userId === 'invitado') {
    callback(0);
    return () => {};
  }

  if (isMockFirebase) {
    callback(getMockSpins(userId));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.userId === userId) {
        callback(getMockSpins(userId));
      }
    };
    window.addEventListener(SPINS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(SPINS_UPDATED_EVENT, handler);
  }

  return onSnapshot(doc(db, 'usuarios', userId), (snap) => {
    callback(snap.exists() ? (snap.data().rouletteSpins || 0) : 0);
  });
}
