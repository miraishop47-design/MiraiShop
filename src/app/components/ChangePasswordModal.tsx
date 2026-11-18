'use client';
import { useEffect, useState } from 'react';
import { changeUserPassword } from '../../application/services/userService';

interface ChangePasswordModalProps {
  target: { id: string; name: string; email: string } | null;
  onClose: () => void;
}

const MIN_LENGTH = 6;

export default function ChangePasswordModal({ target, onClose }: ChangePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, saving, onClose]);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSaving(true);
    try {
      await changeUserPassword(target.id, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="change-password-title" className="text-lg font-bold text-gray-900 dark:text-white">
          Cambiar contraseña
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all">
          {target.name} · {target.email}
        </p>

        {done ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm">
              Contraseña actualizada. Se cerraron las sesiones abiertas de esta cuenta; tendrá que entrar con la nueva.
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                autoFocus
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Repetir contraseña
              </label>
              <input
                id="confirm-password"
                type={show ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              Mostrar lo que escribo
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando…' : 'Cambiar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
