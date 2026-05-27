'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../../domain/entities/User';
import { FirebaseAuthRepositoryImpl } from '../../infrastructure/repositories/FirebaseAuthRepositoryImpl';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RegisterUseCase } from '../../application/use-cases/RegisterUseCase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../infrastructure/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: 'customer' | 'reseller') => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Clean Architecture instantiations
  const authRepository = new FirebaseAuthRepositoryImpl();
  const loginUseCase = new LoginUseCase(authRepository);
  const registerUseCase = new RegisterUseCase(authRepository);

  useEffect(() => {
    // Listen for authentication state changes in Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role: 'customer' | 'reseller' | 'admin' = 'customer';
        if (firebaseUser.email === 'miraishop47@gmail.com') {
          role = 'admin';
          // Ensure admin role is always persisted in Firestore
          try {
            await setDoc(doc(db, 'usuarios', firebaseUser.uid), { role: 'admin' }, { merge: true });
          } catch (e) {
            console.error('Error persisting admin role', e);
          }
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
            if (userDoc.exists()) {
              role = userDoc.data().role || 'customer';
            }
          } catch (e) {
            console.error("Error fetching user role on state change", e);
          }
        }
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuario de Firebase',
          email: firebaseUser.email || '',
          role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    // Execute use case
    const loggedUser = await loginUseCase.execute(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (name: string, email: string, password: string, role: 'customer' | 'reseller'): Promise<User> => {
    // Execute use case
    const registeredUser = await registerUseCase.execute(name, email, password, role);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    await authRepository.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
