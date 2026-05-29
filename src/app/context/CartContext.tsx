'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../../domain/entities/CartItem';
import { Product, PackageOption } from '../../domain/entities/Product';
import { UIProduct } from '../../application/utils/productTransformer';
import { cartService } from '../../application/services/cartService';
import { useAuth } from './AuthContext';
import { productService } from '../../application/services/productService';

interface CartContextProps {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product | UIProduct, quantity: number, selectedPackageId?: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

const getPackageOptions = (prod: Product | UIProduct): PackageOption[] => {
  if (prod.packageOptions && prod.packageOptions.length > 0) {
    return prod.packageOptions;
  }
  if (prod.isPackageSale && prod.unitsPerPackage) {
    return [{
      id: 'default-pack',
      unitsPerPackage: prod.unitsPerPackage,
      availablePackages: prod.availablePackages || 0,
      wholesalePrice: prod.precioPaquete || ('precioMayorista' in prod ? (prod.precioMayorista || 0) : 0)
    }];
  }
  return [];
};

const getPriceByRole = (prod: Product, role?: string) => {
  if (role === 'reseller' || role === 'admin') {
    if (prod.isPackageSale) {
      const options = getPackageOptions(prod);
      if (options.length > 0) {
        return Math.min(...options.map(o => o.wholesalePrice));
      }
      return prod.precioPaquete || prod.precioMayorista || 0;
    }
    return prod.precioMayorista || 0;
  }
  return prod.precioCliente || 0;
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
          const matchingProd = products.find(p => p.id === item.productId || p.id === item.id);
          if (matchingProd) {
            let currentPrice = getPriceByRole(matchingProd, user?.role);
            const isReseller = user?.role === 'reseller' || user?.role === 'admin';
            if (item.isPackageSale && isReseller) {
              const options = getPackageOptions(matchingProd);
              const opt = options.find(o => o.id === item.selectedPackageId);
              if (opt) {
                currentPrice = opt.wholesalePrice;
              }
            }
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

  const addToCart = (product: Product | UIProduct, quantity: number, selectedPackageId?: string) => {
    if (quantity <= 0) return;

    const isReseller = user?.role === 'reseller' || user?.role === 'admin';
    const isPack = !!product.isPackageSale;

    let cartKey = product.id!;
    let packOpt: any = null;

    if (isPack) {
      const options = getPackageOptions(product);
      if (options.length > 0) {
        packOpt = selectedPackageId 
          ? options.find(o => o.id === selectedPackageId) 
          : options[0];
        
        if (!packOpt) {
          alert('Opción de paquete no válida.');
          return;
        }
        cartKey = `${product.id}-${packOpt.id}`;
      } else {
        alert('Este producto no tiene configuraciones de paquete disponibles.');
        return;
      }
    }

    const existingItem = cart.find(item => item.id === cartKey);
    const currentQty = existingItem ? existingItem.cantidad : 0;
    const newQty = currentQty + quantity;

    const isMadeToOrder = !!product.isMadeToOrder;
    const limit = isPack && packOpt ? packOpt.availablePackages : product.stock;

    if (!isMadeToOrder && newQty > limit) {
      alert(`No hay suficiente stock disponible. Límite: ${limit} ${isPack ? 'paquetes' : 'unidades'}`);
      return;
    }

    const price = isPack && packOpt
      ? packOpt.wholesalePrice
      : ('precioCliente' in product
          ? getPriceByRole(product as Product, user?.role)
          : (product as UIProduct).precio);

    let updatedCart: CartItem[];
    if (existingItem) {
      updatedCart = cart.map(item =>
        item.id === cartKey ? { 
          ...item, 
          cantidad: newQty, 
          precio: price,
          packageQuantity: isPack ? newQty : undefined,
          totalUnits: isPack && packOpt ? newQty * packOpt.unitsPerPackage : undefined,
        } : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          id: cartKey,
          productId: product.id!,
          nombre: product.nombre,
          imagen: product.imagen,
          precio: price,
          cantidad: quantity,
          stock: product.stock,
          isPackageSale: isPack ? true : undefined,
          selectedPackageId: isPack && packOpt ? packOpt.id : undefined,
          packageQuantity: isPack ? quantity : undefined,
          unitsPerPackage: isPack && packOpt ? packOpt.unitsPerPackage : undefined,
          availablePackages: isPack && packOpt ? packOpt.availablePackages : undefined,
          precioPaquete: isPack && packOpt ? packOpt.wholesalePrice : undefined,
          totalUnits: isPack && packOpt ? quantity * packOpt.unitsPerPackage : undefined,
          isMadeToOrder: product.isMadeToOrder,
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

    const isReseller = user?.role === 'reseller' || user?.role === 'admin';
    const isPack = !!existingItem.isPackageSale;
    const isMadeToOrder = !!existingItem.isMadeToOrder;
    const limit = isPack ? (existingItem.availablePackages || 0) : existingItem.stock;

    if (!isMadeToOrder && quantity > limit) {
      alert(`No hay suficiente stock disponible. Límite: ${limit} ${isPack ? 'paquetes' : 'unidades'}`);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === id ? { 
        ...item, 
        cantidad: quantity,
        packageQuantity: isPack ? quantity : undefined,
        totalUnits: isPack && item.unitsPerPackage ? quantity * item.unitsPerPackage : undefined
      } : item
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
