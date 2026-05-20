'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../../domain/entities/CartItem';
import { Product } from '../../domain/entities/Product';
import { UIProduct } from '../../application/utils/productTransformer';
import { cartService } from '../../application/services/cartService';
import { useAuth } from './AuthContext';
import { productService } from '../../application/services/productService';

interface CartContextProps {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product | UIProduct, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

const getPriceByRole = (prod: Product, role?: string) => {
  if (role === 'reseller' || role === 'admin') {
    return prod.precioMayorista;
  }
  return prod.precioCliente;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart initially (Client-side only to prevent Next.js hydration issues)
  useEffect(() => {
    const initialCart = cartService.loadCart();
    setCart(initialCart);
    setIsLoaded(true);
  }, []);

  // Update cart prices if user role changes
  useEffect(() => {
    if (!isLoaded || cart.length === 0) return;

    const refreshPrices = async () => {
      try {
        const products = await productService.getProducts();
        let hasChanges = false;
        
        const updatedCart = cart.map(item => {
          const matchingProd = products.find(p => p.id === item.id);
          if (matchingProd) {
            const currentPrice = getPriceByRole(matchingProd, user?.role);
            if (item.precio !== currentPrice) {
              hasChanges = true;
              return { ...item, precio: currentPrice };
            }
          }
          return item;
        });

        if (hasChanges) {
          setCart(updatedCart);
          cartService.saveCart(updatedCart);
        }
      } catch (err) {
        console.error('Error refreshing cart prices on user role change:', err);
      }
    };

    refreshPrices();
  }, [user?.role, isLoaded]);

  const addToCart = (product: Product | UIProduct, quantity: number) => {
    if (quantity <= 0) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    const currentQty = existingItem ? existingItem.cantidad : 0;
    const newQty = currentQty + quantity;

    if (newQty > product.stock) {
      alert(`No hay suficiente stock disponible. Límite: ${product.stock}`);
      return;
    }

    const price = 'precioCliente' in product
      ? getPriceByRole(product as Product, user?.role)
      : (product as UIProduct).precio;

    let updatedCart: CartItem[];
    if (existingItem) {
      updatedCart = cart.map(item =>
        item.id === product.id ? { ...item, cantidad: newQty, precio: price } : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          id: product.id!,
          nombre: product.nombre,
          imagen: product.imagen,
          precio: price,
          cantidad: quantity,
          stock: product.stock,
        },
      ];
    }

    setCart(updatedCart);
    cartService.saveCart(updatedCart);
    setIsCartOpen(true); // Automatically slide sidebar open when item is added
  };

  const removeFromCart = (id: string) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
    cartService.saveCart(updatedCart);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const existingItem = cart.find(item => item.id === id);
    if (!existingItem) return;

    if (quantity > existingItem.stock) {
      alert(`No hay suficiente stock disponible. Límite: ${existingItem.stock}`);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, cantidad: quantity } : item
    );
    setCart(updatedCart);
    cartService.saveCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    cartService.saveCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
