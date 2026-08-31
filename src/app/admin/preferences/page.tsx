'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { isAdminUser, isSuperAdminEmail } from '../../../application/utils/roles';
import { getPreferenceStats, PreferenceStats } from '../../../application/services/preferenceService';
import { getAllUsers, updateUserRole, deleteUserRecord } from '../../../application/services/userService';
import { User } from '../../../domain/entities/User';

// ─── Colour palettes for categories ──────────────────────────────────────────
const PALETTE = [
  'from-violet-500 to-purple-600',
  'from-indigo-500 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-600',
  'from-sky-400 to-indigo-500',
  'from-red-400 to-orange-600',
  'from-yellow-400 to-amber-500',
  'from-cyan-400 to-blue-600',
  'from-gray-400 to-slate-600',
];

function paletteFor(index: number) {
  return PALETTE[index % PALETTE.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, gradient }: {
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6
      bg-gradient-to-br ${gradient}
      text-white shadow-lg
    `}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">{title}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
      {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
    </div>
  );
}

function BarRow({ label, count, max, gradient }: {
  label: string;
  count: number;
  max: number;
  gradient: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-800 dark:text-gray-100">{label}</span>
        <span className="font-bold text-gray-500 dark:text-gray-400">{count} usuario{count !== 1 ? 's' : ''}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPreferencesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PreferenceStats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || !isAdminUser(user))) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // Load stats directly from the service (client-side, same security model as admin/page.tsx)
  useEffect(() => {
    if (!user || !isAdminUser(user)) return;
    const load = async () => {
      try {
        const data = await getPreferenceStats();
        setStats(data);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar las estadísticas.');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [user]);

  // Load users for management
  useEffect(() => {
    if (!user || !isAdminUser(user)) return;
    const loadUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setFetchingUsers(false);
      }
    };
    loadUsers();
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'customer' | 'reseller', userEmail?: string) => {
    if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) return;
    try {
      await updateUserRole(userId, newRole, userEmail);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(`Rol actualizado exitosamente a ${newRole}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error actualizando rol');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail?: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este usuario de la base de datos? Perderá sus roles y permisos permanentemente.')) return;
    try {
      await deleteUserRecord(userId, userEmail);
      setUsers(users.filter(u => u.id !== userId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error eliminando usuario');
    }
  };

  // ─── Loading / guard states ──────────────────────────────────────────────────

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando estadísticas…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error al cargar</h2>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxCategoryCount = stats.topCategories[0]?.count ?? 1;
  const maxItemCount = stats.topItems[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6 py-12 md:py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Panel de administración
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Preferencias de Usuarios
          </h1>
          <p className="mt-2 text-white/70 text-base">
            Analíticas en tiempo real · {stats.totalUsers} usuario{stats.totalUsers !== 1 ? 's' : ''} registrado{stats.totalUsers !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ── KPI cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total usuarios"
            value={stats.totalUsers}
            subtitle="Con preferencias guardadas"
            gradient="from-indigo-500 to-purple-600"
          />
          <StatCard
            title="Categorías registradas"
            value={stats.topCategories.length}
            subtitle="Categorías con al menos 1 selección"
            gradient="from-emerald-400 to-teal-600"
          />
          <StatCard
            title="Categoría top"
            value={stats.topCategories[0]?.label ?? '—'}
            subtitle={stats.topCategories[0] ? `${stats.topCategories[0].count} usuarios` : 'Sin datos aún'}
            gradient="from-amber-400 to-orange-500"
          />
          <StatCard
            title="Interés top"
            value={stats.topItems[0]?.label ?? '—'}
            subtitle={stats.topItems[0] ? `${stats.topItems[0].count} selecciones` : 'Sin datos aún'}
            gradient="from-pink-400 to-rose-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Top categories chart ─────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">📊 Categorías más populares</h2>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">por usuario</span>
            </div>

            {stats.topCategories.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Sin datos aún</p>
            ) : (
              <div className="space-y-4">
                {stats.topCategories.map((cat, i) => (
                  <BarRow
                    key={cat.label}
                    label={cat.label}
                    count={cat.count}
                    max={maxCategoryCount}
                    gradient={paletteFor(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Top items chart ──────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔥 Intereses más seleccionados</h2>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">top 20</span>
            </div>

            {stats.topItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Sin datos aún</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {stats.topItems.map((item, i) => (
                  <div key={`${item.category}-${item.label}`} className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center
                      text-[10px] font-black text-white
                      bg-gradient-to-br ${paletteFor(i)}
                    `}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold truncate">{item.label}</span>
                        <span className="flex-shrink-0 text-xs text-gray-400 font-medium">{item.count}×</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{item.category}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${paletteFor(i)}`}
                          style={{ width: `${Math.round((item.count / maxItemCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent activity ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🕐 Actividad reciente</h2>

          {stats.recentActivity.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/8">
              {stats.recentActivity.map((act, i) => (
                <div key={act.userId} className="py-3 flex items-start gap-4">
                  {/* Avatar placeholder */}
                  <div className={`
                    w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                    bg-gradient-to-br ${paletteFor(i)} text-white text-xs font-bold
                  `}>
                    {act.userId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {act.userId}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {act.categories.map(cat => (
                        <span key={cat} className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <time className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(act.updatedAt).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* ── User Management ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-6 overflow-hidden">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">👥 Gestión de Usuarios Registrados</h2>
          
          {fetchingUsers ? (
            <div className="flex justify-center py-8">
              <div className="inline-block w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No hay usuarios registrados en Firestore</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Usuario</th>
                    <th className="py-3 px-4 font-semibold">Correo</th>
                    <th className="py-3 px-4 font-semibold text-center">Rol Actual</th>
                    <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map(u => {
                    const isSuperAdmin = isSuperAdminEmail(u.email);
                    return (
                      <tr key={u.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">
                          {u.name}
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {u.email}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                              🛡️ Superadmin
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as any, u.email)}
                              className={`
                                px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none appearance-none cursor-pointer text-center
                                ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                                  u.role === 'reseller' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                              `}
                            >
                              <option value="customer">Customer</option>
                              <option value="reseller">Reseller</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 9999px; }
      `}</style>
    </div>
  );
}
