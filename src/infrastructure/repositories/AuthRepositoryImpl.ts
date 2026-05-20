import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/entities/User';
import { prisma } from '../db/prisma';
import bcrypt from 'bcryptjs';

export class AuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (email === 'ariaacris73@gmail.com' || email === 'miraishop47@gmail.com') ? 'admin' : 'customer',
    };
  }

  async register(name: string, email: string, password: string, role: 'customer' | 'reseller'): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (email === 'ariaacris73@gmail.com' || email === 'miraishop47@gmail.com') ? 'admin' : role,
    };
  }

  async logout(): Promise<void> {
    // Lógica para invalidar sesión/token si se usa BD para sesiones
  }
}
