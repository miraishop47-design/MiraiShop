import 'server-only';
import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

/**
 * SDK de administrador de Firebase. Solo corre en el servidor (API routes),
 * nunca en el navegador: usa la clave privada de una cuenta de servicio y se
 * salta las reglas de Firestore.
 *
 * Variables de entorno necesarias (en .env.local y en Vercel):
 *   FIREBASE_ADMIN_CLIENT_EMAIL  -> "client_email" del JSON de la cuenta de servicio
 *   FIREBASE_ADMIN_PRIVATE_KEY   -> "private_key" del mismo JSON
 * El projectId se toma de NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 */
const ADMIN_APP_NAME = 'mirai-admin';

function getAdminApp(): App | null {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // En Vercel/.env la clave suele guardarse con "\n" literales.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) return null;

  return getApps().some((a) => a.name === ADMIN_APP_NAME)
    ? getApp(ADMIN_APP_NAME)
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, ADMIN_APP_NAME);
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminFirestore(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}
