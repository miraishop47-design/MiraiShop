import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '../../../../../infrastructure/firebase/firebaseAdmin';
import { BOOTSTRAP_ADMIN_EMAILS, isSuperAdminEmail } from '../../../../../application/utils/roles';

export const runtime = 'nodejs';

/**
 * POST /api/admin/users/delete
 * Body: { uid: string }
 * Header: Authorization: Bearer <Firebase ID token>
 *
 * Elimina por completo a un usuario: su cuenta de Firebase Authentication
 * (así puede volver a registrarse con ese correo), su perfil en `usuarios`
 * y sus documentos personales (favoritos y preferencias). Los pedidos se
 * conservan como registro de ventas.
 * Solo admins; la cuenta superadmin nunca se puede eliminar.
 */
export async function POST(req: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminFirestore();
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: 'El servidor no tiene configuradas las credenciales de administrador de Firebase.', code: 'admin-not-configured' },
      { status: 503 }
    );
  }

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Falta la sesión.' }, { status: 401 });
  }

  let caller: { uid: string; email?: string };
  try {
    caller = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Sesión inválida o vencida. Vuelve a iniciar sesión.' }, { status: 401 });
  }

  // Mismo criterio que isAdmin() en firestore.rules: correo bootstrap o rol admin guardado.
  const callerIsBootstrap = !!caller.email && BOOTSTRAP_ADMIN_EMAILS.includes(caller.email);
  const callerProfile = callerIsBootstrap ? null : await adminDb.doc(`usuarios/${caller.uid}`).get();
  if (!callerIsBootstrap && callerProfile?.data()?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo un administrador puede eliminar usuarios.' }, { status: 403 });
  }

  let body: { uid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }
  const { uid } = body;
  if (typeof uid !== 'string' || !uid) {
    return NextResponse.json({ error: 'Falta el usuario.' }, { status: 400 });
  }
  if (uid === caller.uid) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta desde el panel.' }, { status: 400 });
  }

  // El correo del objetivo puede venir de Authentication o, si ya no existe ahí, del perfil.
  let authUserExists = true;
  let targetEmail: string | undefined;
  try {
    targetEmail = (await adminAuth.getUser(uid)).email;
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err;
    authUserExists = false;
  }
  const profileRef = adminDb.doc(`usuarios/${uid}`);
  if (!targetEmail) {
    targetEmail = (await profileRef.get()).data()?.email;
  }
  if (isSuperAdminEmail(targetEmail)) {
    return NextResponse.json({ error: 'La cuenta superadmin no puede ser eliminada.' }, { status: 403 });
  }

  try {
    if (authUserExists) await adminAuth.deleteUser(uid);
    const batch = adminDb.batch();
    batch.delete(profileRef);
    batch.delete(adminDb.doc(`favorites/${uid}`));
    batch.delete(adminDb.doc(`userPreferences/${uid}`));
    await batch.commit();
    return NextResponse.json({ ok: true, authDeleted: authUserExists });
  } catch (err) {
    console.error('[POST /api/admin/users/delete]', err);
    return NextResponse.json({ error: 'No se pudo eliminar el usuario.' }, { status: 500 });
  }
}
