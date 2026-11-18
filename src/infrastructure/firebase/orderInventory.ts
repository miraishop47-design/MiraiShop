import { OrderItem } from '../../domain/entities/Order';
import { db, isMockFirebase } from './firebaseConfig';
import { collection, doc, getDoc, getDocs, increment, updateDoc } from 'firebase/firestore';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Firestore no acepta `undefined`: se eliminan esas claves (también en arrays/objetos anidados). */
export function cleanUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanUndefined(v)])
    ) as T;
  }
  return obj;
}

async function loadRawProducts(): Promise<any[]> {
  if (isMockFirebase) {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('mock_products') || '[]');
  }
  const rawProducts: any[] = [];
  try {
    const productDocs = await getDocs(collection(db, 'productos'));
    productDocs.forEach((d) => rawProducts.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Error loading products to resolve order prices:', e);
  }
  return rawProducts;
}

/**
 * Completa precios en 0 (p. ej. invitados que no ven precios) con el precio
 * mayorista del producto y recalcula subtotales y total. También marca los
 * productos hechos bajo pedido, que no descuentan stock.
 */
export async function resolveOrderPrices<T extends { items: OrderItem[]; subtotal: number; total: number }>(order: T): Promise<T> {
  const rawProducts = await loadRawProducts();
  let resolvedSubtotal = 0;

  const items = order.items.map((item) => {
    const prod = rawProducts.find((p) => p.id === item.productId);
    let price = item.precio;

    if (price <= 0 && prod) {
      if (item.isPackageSale && item.selectedPackageId) {
        const opt = prod.packageOptions?.find((o: any) => o.id === item.selectedPackageId);
        price = opt
          ? Number(opt.wholesalePrice || opt.precioPaquete || 0)
          : Number(prod.precioPaquete || prod.precioMayorista || 0);
      } else {
        price = Number(prod.precioMayorista || 0);
      }
    }

    const subtotal = price * item.cantidad;
    resolvedSubtotal += subtotal;

    return {
      ...item,
      precio: price,
      subtotal,
      precioPaquete: item.isPackageSale ? price : undefined,
      isMadeToOrder: prod?.isMadeToOrder || false,
    };
  });

  return { ...order, items, subtotal: resolvedSubtotal, total: resolvedSubtotal };
}

/**
 * Descuenta el inventario de los productos de un pedido (salvo los hechos
 * bajo pedido). En Firestore solo funciona con una sesión de admin, porque
 * las reglas solo permiten al admin modificar `productos`.
 */
export async function decrementStock(items: OrderItem[]): Promise<void> {
  if (isMockFirebase) {
    if (typeof window === 'undefined') return;
    const productsStore = JSON.parse(localStorage.getItem('mock_products') || '[]');
    items.forEach((item) => {
      if (item.isMadeToOrder) return;
      const prod = productsStore.find((p: any) => p.id === item.productId);
      if (!prod) return;

      if (item.isPackageSale) {
        if (prod.packageOptions && prod.packageOptions.length > 0 && item.selectedPackageId) {
          const opt = prod.packageOptions.find((o: any) => o.id === item.selectedPackageId);
          if (opt) opt.availablePackages = Math.max(0, (opt.availablePackages || 0) - item.cantidad);
        } else {
          prod.availablePackages = Math.max(0, (prod.availablePackages || 0) - item.cantidad);
        }
      } else {
        prod.stock = Math.max(0, (prod.stock || 0) - item.cantidad);
      }
    });
    localStorage.setItem('mock_products', JSON.stringify(productsStore));
    window.dispatchEvent(new Event('mock_products_changed'));
    return;
  }

  for (const item of items) {
    if (item.isMadeToOrder) continue;

    try {
      const productRef = doc(db, 'productos', item.productId);

      if (item.isPackageSale) {
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) continue;
        const prodData = productSnap.data();
        if (prodData.packageOptions && item.selectedPackageId) {
          const updatedOptions = (prodData.packageOptions as any[]).map((opt: any) =>
            opt.id === item.selectedPackageId
              ? { ...opt, availablePackages: Math.max(0, (opt.availablePackages || 0) - item.cantidad) }
              : opt
          );
          await updateDoc(productRef, { packageOptions: updatedOptions });
        } else {
          await updateDoc(productRef, { availablePackages: increment(-item.cantidad) });
        }
      } else {
        await updateDoc(productRef, { stock: increment(-item.cantidad) });
      }
    } catch (e) {
      console.error('Error decrementing stock:', e);
    }
  }
}
