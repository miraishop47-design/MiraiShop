'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { favoriteService } from '../../application/services/favoriteService';

interface FavoriteContextProps {
  favorites: string[];
  isLoading: boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

const FavoriteContext = createContext<FavoriteContextProps | undefined>(undefined);

export const FavoriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites when user changes
  useEffect(() => {
    let isMounted = true;
    
    const loadFavorites = async () => {
      if (!user?.id) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const userFavorites = await favoriteService.getUserFavorites(user.id);
        if (isMounted) {
          setFavorites(userFavorites);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (!user?.id) {
      alert("Inicia sesión para guardar productos favoritos.");
      return;
    }

    const isFav = favorites.includes(productId);
    
    // Optimistic UI update
    setFavorites(prev => 
      isFav ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    try {
      if (isFav) {
        await favoriteService.removeFavorite(user.id, productId);
      } else {
        await favoriteService.addFavorite(user.id, productId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on failure
      setFavorites(prev => 
        isFav ? [...prev, productId] : prev.filter(id => id !== productId)
      );
      alert("Ocurrió un error al actualizar tus favoritos.");
    }
  }, [favorites, user?.id]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  const value = useMemo(() => ({
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite
  }), [favorites, isLoading, toggleFavorite, isFavorite]);

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorite = () => {
  const context = useContext(FavoriteContext);
  if (context === undefined) {
    throw new Error('useFavorite must be used within a FavoriteProvider');
  }
  return context;
};
