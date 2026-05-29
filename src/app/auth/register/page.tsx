'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'reseller'>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(name, email, password, role);
      alert(`¡Registro exitoso para ${user.email}!`);
      router.push('/');
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = 'El correo electrónico ya está en uso.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'El correo electrónico no es válido.';
      } else if (err.code === 'auth/weak-password') {
        message = 'La contraseña es muy débil.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30 blur-[100px]">
        <div className="w-[30rem] h-[30rem] bg-indigo-600 rounded-full mix-blend-multiply filter"></div>
        <div className="w-[30rem] h-[30rem] bg-pink-600 rounded-full mix-blend-multiply filter -ml-32"></div>
      </div>

      <div className="w-full max-w-md bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 relative z-10 mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Únete al futuro</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Crea tu cuenta en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black">MiraiShop</span></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100/50 dark:bg-red-900/30 border border-red-500/50 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium text-center backdrop-blur-sm animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Nombre Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white transition-all shadow-inner outline-none font-medium"
              required
              placeholder="Nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white transition-all shadow-inner outline-none font-medium"
              required
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white transition-all shadow-inner outline-none font-medium"
              required
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Tipo de Cuenta</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'customer' | 'reseller')}
              className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 dark:text-white transition-all shadow-inner outline-none font-medium appearance-none"
            >
              <option value="customer" className="text-gray-900 dark:text-white bg-white dark:bg-gray-950">Cliente (Precio Minorista)</option>
              <option value="reseller" className="text-gray-900 dark:text-white bg-white dark:bg-gray-950">Distribuidor (Precio Mayorista)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] hover:bg-right text-white py-4 rounded-2xl font-black shadow-lg shadow-purple-500/30 transition-all duration-500 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-lg mt-6"
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Ya tienes una cuenta? <Link href="/auth/login" className="text-purple-600 dark:text-purple-400 font-bold hover:text-indigo-500 transition-colors">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
}
