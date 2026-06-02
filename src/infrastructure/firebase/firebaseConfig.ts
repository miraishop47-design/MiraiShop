import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate config
const missingKeys = [];
if (!firebaseConfig.apiKey) missingKeys.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingKeys.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingKeys.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');

if (missingKeys.length > 0) {
  console.warn('⚠️ [MiraiShop] Missing Firebase Configuration variables:', missingKeys.join(', '));
}

export const isMockFirebase = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('Dummy');

if (typeof window !== 'undefined') {
  if (isMockFirebase) {
    console.log('⚠️ [MiraiShop] MOCK MODE / LOCAL STORAGE MODE');
    let reason = 'Unknown';
    if (!firebaseConfig.apiKey) reason = 'Missing Firebase Config (API Key)';
    else if (firebaseConfig.apiKey.includes('Dummy')) reason = 'Dummy API Key provided';
    console.log(`⚠️ Mock Mode Enabled\nReason: ${reason}`);
  } else {
    console.log('✅ [MiraiShop] FIRESTORE MODE');
  }
}

// Initialize Firebase for SSR compatibility
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== 'undefined' && !isMockFirebase) {
  console.log(`[MiraiShop] Firebase initialized\nPROJECT ID ACTUAL: ${firebaseConfig.projectId}`);
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, app };
