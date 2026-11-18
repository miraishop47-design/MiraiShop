'use client';

import { useEffect, useMemo, useState } from 'react';
import { Category } from '../../domain/entities/Category';
import { categoryService, mergeCategories } from '../../application/services/categoryService';

/**
 * Lista de categorías en tiempo real: las predeterminadas más las creadas
 * por el admin. Si Firestore falla (p. ej. reglas sin desplegar), se queda
 * con las predeterminadas para que la tienda siga funcionando.
 */
export function useCategories() {
  const [custom, setCustom] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return categoryService.subscribeCustomCategories(
      (cats) => {
        setCustom(cats);
        setError(null);
      },
      (err) => {
        console.warn('[MiraiShop] No se pudieron cargar las categorías personalizadas:', err.message);
        setError('No se pudieron cargar las categorías personalizadas.');
      }
    );
  }, []);

  const categories = useMemo(() => mergeCategories(custom), [custom]);

  return { categories, custom, error };
}
