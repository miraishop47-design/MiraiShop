import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../../infrastructure/firebase/firebaseAdmin';
import { isSuperAdminEmail } from '../../../../../application/utils/roles';

export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 6;

/**
 * POST /api/admin/users/password
 * Body: { uid: string, password: string }
 * Header: Authorization: Bearer <Firebase ID token>
 *
 * Cambia la contraseña de cualquier usuario. Solo la cuenta superadmin puede
 * usarlo: el token se verifica con el SDK de administrador, así que no basta
 * con conocer el correo. Tras el cambio se cierran las sesiones abiertas de
 * ese usuario.
 */
export async function POST(req: NextRequest) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { error: 'El servidor no tiene configuradas las credenciales de administrador de Firebase.' },
      { status: 503 }
    );
  }

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Falta la sesión.' }, { status: 401 });
  }

  let callerEmail: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    callerEmail = decoded.email;
  } catch {
    return NextResponse.json({ error: 'Sesión inválida o vencida. Vuelve a iniciar sesión.' }, { status: 401 });
  }

  if (!isSuperAdminEmail(callerEmail)) {
    return NextResponse.json({ error: 'Solo la cuenta superadmin puede cambiar contraseñas.' }, { status: 403 });
  }

  let body: { uid?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const { uid, password } = body;
  if (typeof uid !== 'string' || !uid) {
    return NextResponse.json({ error: 'Falta el usuario.' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  try {
    await adminAuth.updateUser(uid, { password });
    await adminAuth.revokeRefreshTokens(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'Esa cuenta ya no existe en Firebase Authentication.' },
        { status: 404 }
      );
    }
    if (code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'Firebase rechazó la contraseña por ser inválida.' }, { status: 400 });
    }
    console.error('[POST /api/admin/users/password]', err);
    return NextResponse.json({ error: 'No se pudo cambiar la contraseña.' }, { status: 500 });
  }
}
