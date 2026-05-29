'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveUserPreferences, loadUserPreferences } from '../../application/services/preferenceService';

// ─── Data ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string; // Tailwind gradient classes
  items: string[];
}

const CATEGORIES: Category[] = [
  {
    id: 'hogar',
    label: 'Hogar',
    emoji: '🏠',
    color: 'from-amber-400 to-orange-500',
    items: ['Cocina', 'Baño', 'Mesa', 'Decoración plantas', 'Llaveros', 'Detalles'],
  },
  {
    id: 'organizacion',
    label: 'Organización',
    emoji: '📦',
    color: 'from-emerald-400 to-teal-600',
    items: ['Organizadores escritorio', 'Cajas de almacenamiento', 'Soportes pared', 'Clips cables'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    emoji: '🎮',
    color: 'from-violet-500 to-purple-600',
    items: ['Consolas', 'Desk Setup', 'Iluminación RGB', 'Soportes de control', 'Teclados', 'Accesorios setup', 'Audífonos', 'Decoración temática'],
  },
  {
    id: 'decoracion',
    label: 'Decoración',
    emoji: '🏡',
    color: 'from-pink-400 to-rose-600',
    items: ['Macetas', 'Lámparas LED', 'Arte abstracto', 'Minimalista', 'Moderno', 'Vintage'],
  },
  {
    id: 'oficina',
    label: 'Oficina',
    emoji: '💼',
    color: 'from-cyan-400 to-blue-600',
    items: ['Accesorios escritorio', 'Soportes monitor', 'Tarjeteros', 'Lapiceros', 'Organizadores'],
  },
  {
    id: 'accesorios',
    label: 'Accesorios',
    emoji: '🎒',
    color: 'from-indigo-400 to-purple-500',
    items: ['Llaveros', 'Pines', 'Accesorios de mochila', 'Coleccionables'],
  },
  {
    id: 'tecnologia',
    label: 'Tecnología',
    emoji: '💡',
    color: 'from-sky-400 to-indigo-500',
    items: ['Soportes para celular', 'Soportes laptop', 'Accesorios PC', 'Organizadores de cables', 'Desk pads', 'Gadgets'],
  },
  {
    id: 'automotriz',
    label: 'Automotriz',
    emoji: '🚗',
    color: 'from-gray-400 to-slate-600',
    items: ['Soportes de celular auto', 'Accesorios de tablero', 'Organizadores de carro'],
  },
  {
    id: 'coleccion',
    label: 'Colección',
    emoji: '🔥',
    color: 'from-red-400 to-orange-600',
    items: ['Figuras anime', 'Figuras geek', 'Modelos a escala', 'Réplicas', 'Arte temático'],
  },
  {
    id: 'personalizados',
    label: 'Personalizados',
    emoji: '✨',
    color: 'from-yellow-400 to-amber-500',
    items: ['Nombres', 'Logos', 'Regalos especiales', 'Mascotas', 'Fotos', 'Diseños únicos'],
  },
];

const LS_KEY = 'mirai_preferences';

// ─── Types ────────────────────────────────────────────────────────────────────

type Selections = Record<string, string[]>; // categoryId -> selected items
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PreferencePicker() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selections, setSelections] = useState<Selections>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Load preferences: from DB if logged in, otherwise from localStorage
  useEffect(() => {
    const load = async () => {
      if (user?.id) {
        try {
          const pref = await loadUserPreferences(user.id);
          if (pref) {
            setSelections(pref.selections);
            return;
          }
        } catch (e) {
          console.warn('Could not load preferences from DB, falling back to localStorage', e);
        }
      }
      // Fallback: localStorage
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) setSelections(JSON.parse(raw));
      } catch {
        // ignore
      }
    };
    load();
  }, [user?.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const totalSelected = Object.values(selections).flat().length;

  const toggleItem = useCallback((categoryId: string, item: string) => {
    setSaveStatus('idle');
    setSelections(prev => {
      const current = prev[categoryId] ?? [];
      const next = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [categoryId]: next };
    });
  }, []);

  const toggleCategory = (id: string) =>
    setExpanded(prev => (prev === id ? null : id));

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Always persist to localStorage (works when not logged in too)
      localStorage.setItem(LS_KEY, JSON.stringify(selections));

      // Persist to DB if the user is authenticated
      if (user?.id) {
        await saveUserPreferences(user.id, selections);
      }

      setSaveStatus('saved');
      setTimeout(() => { setSaveStatus('idle'); setOpen(false); }, 1400);
    } catch (err) {
      console.error('Error saving preferences', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleClear = () => {
    setSelections({});
    setSaveStatus('idle');
  };

  const isSaving = saveStatus === 'saving';
  const isSaved = saveStatus === 'saved';
  const isError = saveStatus === 'error';

  return (
    <>
      {/* ── Trigger Button ──────────────────────────────────────── */}
      <button
        id="preference-picker-btn"
        onClick={() => setOpen(true)}
        className="
          group relative inline-flex items-center gap-3
          px-6 py-3 rounded-2xl font-semibold text-sm
          bg-white/10 dark:bg-white/5 border border-white/20
          backdrop-blur-sm text-gray-700 dark:text-gray-200
          hover:border-indigo-400/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/20
          transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10
          hover:-translate-y-0.5
        "
      >
        <span className="text-xl transition-transform duration-300 group-hover:rotate-12">✨</span>
        <span>Ayúdanos a conocer tus gustos</span>
        {totalSelected > 0 && (
          <span className="
            ml-1 inline-flex items-center justify-center
            w-5 h-5 rounded-full text-xs font-bold
            bg-gradient-to-r from-indigo-500 to-purple-500 text-white
          ">
            {totalSelected}
          </span>
        )}
      </button>

      {/* ── Modal Overlay ───────────────────────────────────────── */}
      {open && (
        <div
          id="preference-picker-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* Panel */}
          <div
            id="preference-picker-panel"
            className="
              relative w-full max-w-2xl max-h-[90vh] flex flex-col
              bg-white dark:bg-gray-900 rounded-3xl
              shadow-2xl shadow-indigo-500/20
              border border-gray-200/50 dark:border-white/10
              overflow-hidden
            "
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    ¿Qué tipo de productos
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                      te gustaría ver?
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Selecciona una o más categorías para personalizar tu experiencia
                  </p>
                  {user && (
                    <p className="mt-1 text-xs text-indigo-400 dark:text-indigo-300 font-medium">
                      ✅ Tus preferencias se guardarán en tu cuenta
                    </p>
                  )}
                </div>
                <button
                  id="preference-picker-close"
                  onClick={() => setOpen(false)}
                  className="
                    flex-shrink-0 w-9 h-9 rounded-full
                    flex items-center justify-center
                    text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                    hover:bg-gray-100 dark:hover:bg-white/10
                    transition-all duration-200
                  "
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Section label */}
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Categorías recomendadas
              </p>
            </div>

            {/* Scrollable category list */}
            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-2 scrollbar-thin">
              {CATEGORIES.map(cat => {
                const isExpanded = expanded === cat.id;
                const catSelections = selections[cat.id] ?? [];
                const count = catSelections.length;

                return (
                  <div key={cat.id} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/3">
                    {/* Category header */}
                    <button
                      id={`category-${cat.id}`}
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left group transition-colors hover:bg-gray-100/60 dark:hover:bg-white/5"
                    >
                      {/* Emoji badge */}
                      <span className={`
                        w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                        bg-gradient-to-br ${cat.color} shadow-sm
                      `}>
                        {cat.emoji}
                      </span>

                      <span className="flex-1 font-bold text-gray-800 dark:text-gray-100 text-sm">
                        {cat.label}
                      </span>

                      {count > 0 && (
                        <span className={`
                          text-xs font-bold px-2 py-0.5 rounded-full
                          bg-gradient-to-r ${cat.color} text-white
                        `}>
                          {count}
                        </span>
                      )}

                      {/* Chevron */}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Subcategory chips */}
                    {isExpanded && (
                      <div
                        className="px-4 pb-4 pt-1 flex flex-wrap gap-2"
                        style={{ animation: 'expandDown 0.2s ease' }}
                      >
                        {cat.items.map(item => {
                          const selected = catSelections.includes(item);
                          return (
                            <button
                              key={item}
                              id={`item-${cat.id}-${item.replace(/\s+/g, '-').toLowerCase()}`}
                              onClick={() => toggleItem(cat.id, item)}
                              className={`
                                px-3 py-1.5 rounded-xl text-xs font-semibold
                                border transition-all duration-200
                                ${selected
                                  ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md scale-105`
                                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300'
                                }
                              `}
                            >
                              {selected && <span className="mr-1">✓</span>}
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/8 flex items-center justify-between gap-3">
              <button
                onClick={handleClear}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Limpiar selección
              </button>
              <div className="flex items-center gap-3">
                {totalSelected > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-bold text-gray-800 dark:text-gray-100">{totalSelected}</span> seleccionado{totalSelected !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  id="preference-picker-save"
                  onClick={handleSave}
                  disabled={totalSelected === 0 || isSaving}
                  className={`
                    px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                    ${isSaved
                      ? 'bg-green-500 text-white scale-95'
                      : isError
                        ? 'bg-red-500 text-white'
                        : isSaving
                          ? 'bg-indigo-400 text-white cursor-wait opacity-80'
                          : totalSelected > 0
                            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isSaving
                    ? 'Guardando…'
                    : isSaved
                      ? '¡Guardado! 🎉'
                      : isError
                        ? 'Error al guardar ✕'
                        : 'Guardar preferencias'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Animations ──────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 9999px; }
      `}</style>
    </>
  );
}
