import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/entities/User';
import { auth, db } from '../firebase/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export class FirebaseAuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    let role: 'customer' | 'reseller' | 'admin' = 'customer';
    if (firebaseUser.email === 'ariaacris73@gmail.com' || firebaseUser.email === 'miraishop47@gmail.com') {
      role = 'admin';
    } else {
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDoc.exists()) {
        role = userDoc.data().role || 'customer';
      }
    }

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario de Firebase',
      email: firebaseUser.email || '',
      role,
    };
  }

  async register(name: string, email: string, password: string, role: 'customer' | 'reseller'): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update the profile display name in Firebase Auth
    await updateProfile(firebaseUser, {
      displayName: name,
    });

    const finalRole = (email === 'ariaacris73@gmail.com' || email === 'miraishop47@gmail.com') ? 'admin' : role;

    // Save user role profile to Firestore
    await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
      id: firebaseUser.uid,
      name,
      email,
      role: finalRole,
    });

    return {
      id: firebaseUser.uid,
      name: name,
      email: firebaseUser.email || '',
      role: finalRole,
    };
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}
