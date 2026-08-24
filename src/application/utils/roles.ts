import { User } from '../../domain/entities/User';

/**
 * Correos con acceso de administrador garantizado ("bootstrap").
 * Son una red de seguridad: permiten entrar al panel aunque el documento
 * usuarios/{uid} todavía no exista o haya perdido su campo `role`.
 * El resto de administradores se gestionan desde /admin/preferences
 * cambiando el rol del usuario a 'admin'.
 */
export const BOOTSTRAP_ADMIN_EMAILS = [
  'miraishop47@gmail.com',
  'ariaacris73@gmail.com',
];

type AuthLike = Pick<User, 'email' | 'role'> | null | undefined;

/** Administrador: por rol guardado en Firestore o por correo bootstrap. */
export function isAdminUser(user: AuthLike): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return !!user.email && BOOTSTRAP_ADMIN_EMAILS.includes(user.email);
}

/** Mayorista: ve precios por caja/paquete. Los admin también. */
export function isResellerUser(user: AuthLike): boolean {
  if (!user) return false;
  return user.role === 'reseller' || isAdminUser(user);
}
