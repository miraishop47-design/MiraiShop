import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/entities/User';
import { auth, db, isMockFirebase } from '../firebase/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export class FirebaseAuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    if (isMockFirebase) {
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = mockUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user || user.password !== password) {
        throw new Error('auth/invalid-credential');
      }

      const loggedUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      localStorage.setItem('mock_current_user', JSON.stringify(loggedUser));
      return loggedUser;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    let role: 'customer' | 'reseller' | 'admin' = 'customer';
    try {
      if (firebaseUser.email === 'miraishop47@gmail.com') {
        role = 'admin';
        // Persist admin role to Firestore so it's always saved
        await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
          role: 'admin',
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'Admin',
        }, { merge: true });
      } else {
        const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
        if (userDoc.exists()) {
          role = userDoc.data().role || 'customer';
        }
      }
    } catch (error) {
      console.error("Firestore permission error when getting role:", error);
      // Fallback to role already set ('admin' if it was the hardcoded email, 'customer' otherwise)
    }

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario de Firebase',
      email: firebaseUser.email || '',
      role,
    };
  }

  async register(name: string, email: string, password: string, role: 'customer' | 'reseller'): Promise<User> {
    if (isMockFirebase) {
      const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const existingUser = mockUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw { code: 'auth/email-already-in-use', message: 'El correo electrónico ya está en uso.' };
      }

      const finalRole = (email === 'ariaacris73@gmail.com' || email === 'miraishop47@gmail.com') ? 'admin' : role;
      const newUser = {
        id: `mock-uid-${Date.now()}`,
        name,
        email,
        password,
        role: finalRole,
      };

      mockUsers.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(mockUsers));

      const loggedUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as 'customer' | 'reseller' | 'admin',
      };
      localStorage.setItem('mock_current_user', JSON.stringify(loggedUser));
      return loggedUser;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update the profile display name in Firebase Auth
    await updateProfile(firebaseUser, {
      displayName: name,
    });

    const finalRole: 'customer' | 'reseller' | 'admin' = (email === 'miraishop47@gmail.com') ? 'admin' : role;

    // Save user role profile to Firestore
    try {
      await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
        id: firebaseUser.uid,
        name,
        email,
        role: finalRole,
      });
    } catch (error) {
      console.error("Firestore permission error when saving user profile:", error);
    }

    return {
      id: firebaseUser.uid,
      name: name,
      email: firebaseUser.email || '',
      role: finalRole,
    };
  }

  async logout(): Promise<void> {
    if (isMockFirebase) {
      localStorage.removeItem('mock_current_user');
      return;
    }
    await signOut(auth);
  }
}
