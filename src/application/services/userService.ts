import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, isMockFirebase } from '../../infrastructure/firebase/firebaseConfig';
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

  const userRef = doc(db, 'usuarios', userId);
  await deleteDoc(userRef);
}
