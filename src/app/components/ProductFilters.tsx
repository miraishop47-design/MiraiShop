'use client';

import React, { useState, useEffect } from 'react';
import { ALLOWED_CATEGORIES } from '../../application/utils/productTransformer';

interface ProductFiltersProps {
  initialSearch?: string;
  initialCategory?: string;
  onFilterChange: (filters: { search: string; category: string }) => void;
  disableDebounce?: boolean;
  onSearchSubmit?: (filters: { search: string; category: string }) => void;
}

export default function ProductFilters({
  initialSearch = '',
  initialCategory = '',
  onFilterChange,
  disableDebounce = false,
  onSearchSubmit
}: ProductFiltersProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [isOpen, setIsOpen] = useState(false);

  // Sync state if initial values change (e.g. on URL navigation)
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // Debounce search input
  useEffect(() => {
    if (disableDebounce) return;
    const handler = setTimeout(() => {
      onFilterChange({ search, category });
    }, 200);

    return () => clearTimeout(handler);
  }, [search, category, onFilterChange, disableDebounce]);

  const handleCategorySelect = (cat: string) => {
    setCategory(prev => (prev === cat ? '' : cat));
  };

  const handleClear = () => {
    setSearch('');
    setCategory('');
    onFilterChange({ search: '', category: '' });
  };

  const hasActiveFilters = search !== '' || category !== '';

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 px-4 relative z-20">
      {/* Search Input and Filter Toggle Bar */}
      <div className="flex items-center gap-3">
        {/* Search Bar Container */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchSubmit?.({ search, category });
              }
            }}
            placeholder="¿Qué estás buscando?"
            className="w-full pl-12 pr-10 py-3.5 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border shadow-sm font-semibold text-sm transition-all duration-300 active:scale-95 ${
            isOpen || category
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent text-white shadow-indigo-500/20'
              : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-gray-200/60 dark:border-gray-800/60 text-gray-700 dark:text-gray-300 hover:border-indigo-400/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="hidden md:inline">Filtros</span>
          {category && (
            <span className="flex items-center justify-center bg-white text-indigo-600 dark:bg-gray-900 dark:text-indigo-400 text-[10px] font-black w-4.5 h-4.5 rounded-full">
              1
            </span>
          )}
        </button>
      </div>

      {/* DESKTOP FILTER PANEL: Inline Expandable */}
      <div
        className={`hidden md:block transition-all duration-500 overflow-hidden ${
          isOpen ? 'max-h-80 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800/60">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Filtrar por Categoría</span>
            {hasActiveFilters && (
              <button
                onClick={handleClear}
                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {ALLOWED_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-350 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10 scale-105'
                      : 'bg-white/50 dark:bg-gray-950/50 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-400/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER PANEL: Bottom Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
          {/* Overlay Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-[2.5rem] p-6 pb-8 border-t border-gray-150 dark:border-gray-800/60 shadow-2xl z-10 flex flex-col gap-4 animate-slide-up">
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-2" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Filtros</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Categories Grid */}
            <div className="space-y-3 py-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Categorías</span>
              <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {ALLOWED_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-4 py-3.5 rounded-2xl text-xs font-bold text-center transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-800/50'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80">
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    handleClear();
                    setIsOpen(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-sm transition-all"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/10 transition-all text-center"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Up Animation Style */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
