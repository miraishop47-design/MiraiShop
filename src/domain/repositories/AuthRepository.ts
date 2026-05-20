import { User } from '../entities/User';

export interface AuthRepository {
  login(email: string, password: string): Promise<User>;
  register(name: string, email: string, password: string, role: 'customer' | 'reseller'): Promise<User>;
  logout(): Promise<void>;
}
