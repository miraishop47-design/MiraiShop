import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, isMockFirebase } from '../../infrastructure/firebase/firebaseConfig';
import { User } from '../../domain/entities/User';
import { isSuperAdminEmail } from '../utils/roles';

export async function getAllUsers(): Promise<User[]> {
  if (isMockFirebase) {
    return JSON.parse(localStorage.getItem('mock_users') || '[]');
  }

  const querySnapshot = await getDocs(collection(db, 'usuarios'));
  const users: User[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    users.push({
      id: docSnap.id,
      name: data.name || 'Sin nombre',
      email: data.email || 'Sin correo',
      role: data.role || 'customer'
    });
  });
  return users;
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'customer' | 'reseller', userEmail?: string): Promise<void> {
  if (isSuperAdminEmail(userEmail)) {
    throw new Error('La cuenta superadmin no puede perder el rol de administrador.');
  }

  if (isMockFirebase) {
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const updatedUsers = mockUsers.map((u: any) => u.id === userId ? { ...u, role: newRole } : u);
    localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
    return;
  }

  const userRef = doc(db, 'usuarios', userId);
  await updateDoc(userRef, {
    role: newRole
  });
}

/** El servidor no tiene la clave de servicio de Firebase: no puede tocar Authentication. */
export class AdminNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminNotConfiguredError';
  }
}

async function callAdminApi(path: string, body: unknown): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  }
  const token = await currentUser.getIdToken();

  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'admin-not-configured') {
      throw new AdminNotConfiguredError(data.error);
    }
    throw new Error(data.error || 'No se pudo completar la operación.');
  }
}

/**
 * Elimina al usuario por completo: cuenta de Firebase Authentication (para
 * que pueda registrarse de nuevo con ese correo), perfil, favoritos y
 * preferencias. Se hace en el servidor; los pedidos se conservan.
 * Lanza AdminNotConfiguredError si el servidor no tiene la clave de servicio.
 */
export async function deleteUserRecord(userId: string, userEmail?: string): Promise<void> {
  if (isSuperAdminEmail(userEmail)) {
    throw new Error('La cuenta superadmin no puede ser eliminada.');
  }

  if (isMockFirebase) {
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const updatedUsers = mockUsers.filter((u: any) => u.id !== userId);
    localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
    return;
  }

  await callAdminApi('/api/admin/users/delete', { uid: userId });
}

/**
 * Plan B cuando el servidor no tiene la clave de servicio: borra solo el
 * perfil en Firestore. La cuenta de Authentication sigue existiendo.
 */
export async function deleteUserProfileOnly(userId: string, userEmail?: string): Promise<void> {
  if (isSuperAdminEmail(userEmail)) {
    throw new Error('La cuenta superadmin no puede ser eliminada.');
  }
  await deleteDoc(doc(db, 'usuarios', userId));
}

/**
 * Cambia la contraseña de otro usuario (solo superadmin). Se hace en el
 * servidor con el SDK de administrador: desde el navegador no es posible.
 */
export async function changeUserPassword(userId: string, newPassword: string): Promise<void> {
  if (isMockFirebase) {
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const updatedUsers = mockUsers.map((u: any) => u.id === userId ? { ...u, password: newPassword } : u);
    localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
    return;
  }

  await callAdminApi('/api/admin/users/password', { uid: userId, password: newPassword });
}
