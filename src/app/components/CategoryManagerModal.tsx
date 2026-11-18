'use client';

import React, { useEffect, useState } from 'react';
import { Category } from '../../domain/entities/Category';
import { categoryService } from '../../application/services/categoryService';
import { DEFAULT_CATEGORIES } from '../../application/utils/productTransformer';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lista combinada (predeterminadas + personalizadas). */
  categories: string[];
  /** Solo las creadas por el admin. */
  custom: Category[];
  /** Cuántos productos usa cada categoría, por nombre. */
  productCounts: Record<string, number>;
  /** Categorías que tienen productos pero aún no existen en la lista. */
  orphanCategories: string[];
  loadError?: string | null;
}

const plural = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`;

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  custom,
  productCounts,
  orphanCategories,
  loadError,
}: CategoryManagerModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const create = async (rawName: string) => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const created = await categoryService.createCategory(rawName, categories);
      setSuccess(`Categoría "${created.nombre}" creada.`);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: Category) => {
    const count = productCounts[category.nombre] || 0;
    if (count === 0 && !window.confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return;

    setError(null);
    setSuccess(null);
    setDeletingId(category.id);
    try {
      await categoryService.deleteCategory(category, count);
      setSuccess(`Categoría "${category.nombre}" eliminada.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la categoría.');
    } finally {
      setDeletingId(null);
    }
  };

  const sortedCustom = [...custom].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manager-title"
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 id="category-manager-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Categorías
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Las categorías nuevas aparecen al instante en el formulario de productos y en los filtros de la tienda.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {/* Create form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create(name);
            }}
            className="space-y-2"
          >
            <label htmlFor="new-category" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
              Nueva categoría
            </label>
            <div className="flex gap-2">
              <input
                id="new-category"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder="Ej. Navidad"
                className="flex-1 min-w-0 px-4 py-3 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium"
              />
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>

          {(error || loadError) && (
            <div className="p-3 bg-red-100/50 dark:bg-red-900/30 border border-red-500/50 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
              {error || loadError}
            </div>
          )}
          {success && !error && (
            <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-500/50 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              {success}
            </div>
          )}

          {/* Categories used by products but not registered yet */}
          {orphanCategories.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Usadas por productos, sin registrar
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estos productos tienen una categoría que no aparece en los filtros. Regístrala para que los clientes puedan filtrar por ella.
              </p>
              <ul className="space-y-2">
                {orphanCategories.map((cat) => (
                  <li key={cat} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {cat} <span className="font-medium text-gray-400">· {plural(productCounts[cat] || 0)}</span>
                    </span>
                    <button
                      onClick={() => create(cat)}
                      disabled={saving}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                    >
                      Registrar
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Custom categories */}
          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              Creadas por ti ({sortedCustom.length})
            </h3>
            {sortedCustom.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no has creado categorías.</p>
            ) : (
              <ul className="space-y-2">
                {sortedCustom.map((cat) => {
                  const count = productCounts[cat.nombre] || 0;
                  return (
                    <li key={cat.id} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {cat.nombre} <span className="font-medium text-gray-400">· {plural(count)}</span>
                      </span>
                      <button
                        onClick={() => remove(cat)}
                        disabled={deletingId === cat.id}
                        title={count > 0 ? 'Cambia la categoría de sus productos antes de eliminarla' : undefined}
                        className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === cat.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Default categories */}
          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Predeterminadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((cat) => (
                <span key={cat} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {cat} <span className="text-gray-400 font-medium">{productCounts[cat] || 0}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400">Las predeterminadas no se pueden eliminar: el inicio de la tienda enlaza a ellas.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
