'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      alert(`¡Bienvenido ${user.name}!`);
      router.push('/');
    } catch (err: any) {
      // Friendly message clean up if Firebase throws standard codes
      let message = err.message;
      if (err.code === 'auth/invalid-credential') {
        message = 'El correo o la contraseña son incorrectos.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'El usuario no existe.';
      } else if (err.code === 'auth/wrong-password') {
        message = 'La contraseña es incorrecta.';
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
        <div className="w-[30rem] h-[30rem] bg-purple-600 rounded-full mix-blend-multiply filter animate-pulse"></div>
        <div className="w-[30rem] h-[30rem] bg-indigo-600 rounded-full mix-blend-multiply filter animate-pulse delay-700 -ml-32"></div>
      </div>

      <div className="w-full max-w-md bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 relative z-10 mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Bienvenido de nuevo</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa a tu cuenta de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black">MiraiShop</span></p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100/50 dark:bg-red-900/30 border border-red-500/50 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium text-center backdrop-blur-sm animate-pulse">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white transition-all shadow-inner outline-none font-medium"
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
              className="w-full px-5 py-4 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white transition-all shadow-inner outline-none font-medium"
              required
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/30 transition-all duration-500 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-lg mt-6"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿No tienes una cuenta? <Link href="/auth/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-purple-500 transition-colors">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
}
