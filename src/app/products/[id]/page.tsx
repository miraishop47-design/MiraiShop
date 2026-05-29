'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { productService } from '../../../application/services/productService';
import { Product, PackageOption } from '../../../domain/entities/Product';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { transformProductForUser, UIProduct } from '../../../application/utils/productTransformer';

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

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export default function ProductDetailPage() {
  const { id } = useParams();
  const [rawProduct, setRawProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const fetchedProduct = await productService.getProductById(id);
        if (fetchedProduct) {
          setRawProduct(fetchedProduct);
        } else {
          setError('Producto no encontrado');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar el producto.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Transform product pricing client-side
  const product = useMemo(() => {
    if (!rawProduct) return null;
    return transformProductForUser(rawProduct, user?.role);
  }, [rawProduct, user?.role]);

  const isReseller = user?.role === 'reseller' || user?.role === 'admin';
  const isPack = !!product?.isPackageSale;

  const options = useMemo(() => {
    if (!product) return [];
    return getPackageOptions(product);
  }, [product]);

  const [selectedPackId, setSelectedPackId] = useState<string>('');

  useEffect(() => {
    if (options.length > 0) {
      setSelectedPackId(options[0].id);
    }
  }, [options]);

  const selectedPack = useMemo(() => {
    if (!isPack) return null;
    return options.find(o => o.id === selectedPackId) || options[0] || null;
  }, [options, isPack, selectedPackId]);

  useEffect(() => {
    if (isPack && selectedPack) {
      const limit = selectedPack.availablePackages;
      setQuantity(prev => {
        if (prev > limit) return Math.max(1, limit);
        return prev;
      });
    }
  }, [selectedPackId, isPack, selectedPack]);

  // Enforce active status redirect if user is not admin
  const isDenied = rawProduct && rawProduct.activo === false && user?.role !== 'admin';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="mb-8 w-32 h-6 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-150 dark:border-gray-800 h-[500px] flex">
          <div className="w-1/2 bg-gray-100 dark:bg-gray-955 p-8 flex items-center justify-center rounded-l-[2.5rem]">
            <div className="w-full h-full bg-gray-200 dark:bg-gray-850 rounded-3xl"></div>
          </div>
          <div className="w-1/2 p-14 space-y-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-850 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-850 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-850 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-850 rounded w-full"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-850 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || isDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="text-center space-y-4">
          <span className="text-6xl block">🔍</span>
          <h2 className="text-2xl font-black text-gray-800 dark:text-gray-200">
            {isDenied ? 'Producto no disponible en este momento' : (error || 'Producto no encontrado')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-light text-sm max-w-sm">
            No pudimos encontrar el artículo que estás buscando. Es posible que haya sido desactivado o eliminado de la tienda.
          </p>
          <Link href="/productos" className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const isMadeToOrder = !!product.isMadeToOrder;
  const isOutOfStock = !isMadeToOrder && (isPack 
    ? (selectedPack ? selectedPack.availablePackages <= 0 : true) 
    : product.stock <= 0);

  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const handleIncrease = () => {
    if (isMadeToOrder) {
      setQuantity((prev) => prev + 1);
      return;
    }
    const limit = isPack 
      ? (selectedPack ? selectedPack.availablePackages : 0) 
      : product.stock;
    setQuantity((prev) => (prev < limit ? prev + 1 : limit));
  };

  // Determine list of image URLs
  const productImages = product.imagenes && product.imagenes.length > 0 
    ? product.imagenes 
    : [product.imagen || 'https://images.unsplash.com/photo-1612036781124-847f8939b154?auto=format&fit=crop&w=800&q=80'];

  const activeImage = productImages[activeImageIdx] || productImages[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/productos" className="text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 w-fit font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver a productos
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 relative z-10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -z-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="bg-gray-50/50 dark:bg-gray-955/50 p-8 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
            {/* Imagen Principal */}
            <div className="relative h-96 w-full flex items-center justify-center overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={product.nombre}
                className="max-h-full max-w-full object-contain rounded-2xl transition-transform hover:scale-[1.03] duration-500"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                  <span className="text-white font-black tracking-wider uppercase bg-red-600/90 px-6 py-2.5 rounded-full border border-red-500/50 text-sm shadow-xl">
                    Agotado
                  </span>
                </div>
              )}
            </div>

            {/* Selector de Miniaturas */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto w-full justify-center py-4 mt-4 scrollbar-thin scrollbar-thumb-gray-200">
                {productImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 bg-white dark:bg-gray-900 transition-all p-1 flex-shrink-0 relative ${activeImageIdx === idx ? 'border-indigo-500 scale-105 shadow-md' : 'border-gray-200/50 hover:border-indigo-300 dark:border-gray-800'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`${product.nombre} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Detalles del Producto */}
          <div className="p-8 md:p-14 flex flex-col justify-center">
            <div className="uppercase tracking-widest text-xs text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black mb-4 flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
              {product.categoria || 'Diseño Exclusivo'}
              {isPack && (
                <span className="bg-pink-100 text-pink-700 dark:bg-pink-955/30 dark:text-pink-400 font-black px-2.5 py-1 rounded-full text-[10px] tracking-wide ml-2 uppercase">
                  Paquete (Caja x{selectedPack ? selectedPack.unitsPerPackage : product.unitsPerPackage})
                </span>
              )}
              {isMadeToOrder && (
                <span className="bg-amber-100 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400 font-black px-2.5 py-1 rounded-full text-[10px] tracking-wide ml-2 uppercase">
                  🛠️ Hecho bajo pedido
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
              {product.nombre}
            </h1>

            {isReseller ? (
              <div className="flex flex-col mb-8">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 inline-block">
                  {formatCOP(isPack && selectedPack ? selectedPack.wholesalePrice : product.precio)}
                </p>
                {isPack && (
                  <span className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">Precio por paquete (Caja x{selectedPack ? selectedPack.unitsPerPackage : product.unitsPerPackage} uds.)</span>
                )}
              </div>
            ) : (
              <div className="mb-8 p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-950/10 dark:to-purple-950/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/50">
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  Precio disponible al finalizar pedido
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light">
                  Añade los productos que desees a tu carrito y realiza el pedido para coordinar los precios de cotización.
                </p>
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-300 mb-10 leading-relaxed text-lg whitespace-pre-line">
              {product.descripcion}
            </p>

            {isPack && options.length > 0 && (
              <div className="mb-8 p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-950/10 dark:to-purple-950/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/50">
                <span className="block text-xs font-black text-indigo-500 uppercase tracking-widest mb-3">
                  Selecciona presentación:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt) => {
                    const isSelected = opt.id === selectedPackId;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedPackId(opt.id)}
                        className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-955/20 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-850'}`}
                      >
                        <div className="flex justify-between items-center w-full mb-1">
                          <span className={`text-sm font-extrabold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                            Caja x{opt.unitsPerPackage} unds.
                          </span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600' : 'border-gray-300'}`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-end w-full mt-2">
                          <span className="text-base font-black text-gray-900 dark:text-white">
                            {isReseller ? formatCOP(opt.wholesalePrice) : 'Precio a convenir'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMadeToOrder || opt.availablePackages > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-955/20 dark:text-red-400'}`}>
                            {isMadeToOrder 
                              ? 'Disponible bajo pedido' 
                              : opt.availablePackages > 0 
                                ? `${opt.availablePackages} pqts.` 
                                : 'Sin stock'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-10 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {isMadeToOrder ? 'Por pedido' : (isPack ? 'Paquetes a comprar' : 'Cantidad a comprar')}
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full ${isMadeToOrder ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' : isOutOfStock ? 'bg-red-100 text-red-700 dark:bg-red-955/30 dark:text-red-400' : (isPack ? (selectedPack ? selectedPack.availablePackages : 0) : product.stock) > 10 ? 'bg-green-100 text-green-700 dark:bg-green-955/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'}`}>
                    {isMadeToOrder 
                      ? 'Disponible bajo pedido' 
                      : isOutOfStock 
                        ? 'No disponible' 
                        : isPack 
                          ? `${selectedPack ? selectedPack.availablePackages : 0} paquetes disponibles` 
                          : `${product.stock} disponibles`}
                  </span>
                  {isMadeToOrder && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      ⏱️ Tiempo de preparación variable
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center border-2 border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 w-fit">
                  <button
                    onClick={handleDecrease}
                    disabled={isOutOfStock}
                    className="px-5 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-bold text-xl active:bg-gray-200 dark:active:bg-gray-700 disabled:opacity-50 outline-none"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 font-bold text-gray-900 dark:text-white w-16 text-center border-x-2 border-gray-200 dark:border-gray-800 text-xl">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    onClick={handleIncrease}
                    disabled={isOutOfStock}
                    className="px-5 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-bold text-xl active:bg-gray-200 dark:active:bg-gray-700 disabled:opacity-50 outline-none"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total a pagar</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {isReseller 
                      ? formatCOP(isOutOfStock ? 0 : (isPack && selectedPack ? selectedPack.wholesalePrice : product.precio) * quantity)
                      : 'Cotización: A convenir'}
                  </span>
                  {isPack && !isOutOfStock && (
                    <span className="text-[11px] text-gray-400 font-semibold mt-0.5">
                      ({quantity * (selectedPack ? selectedPack.unitsPerPackage : 0)} unidades totales)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => product && addToCart(product, quantity, selectedPack?.id)}
                disabled={isOutOfStock}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none text-white font-black py-4.5 rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-500 transform hover:-translate-y-1 active:translate-y-0 text-lg flex justify-center items-center gap-3 active:scale-[0.99] disabled:transform-none disabled:active:scale-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {isOutOfStock ? 'Sin Stock Disponible' : isPack ? 'Agregar Paquetes al Carrito' : 'Agregar al Carrito'}
              </button>

              {!isReseller && (
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 font-light mt-4">
                  ¿Eres distribuidor?{' '}
                  {user ? (
                    <a
                      href={`https://wa.me/573000000000?text=Hola,%20quiero%20solicitar%20el%20acceso%2520como%2520distribuidor%2520en%2520MiraiShop.%2520Mi%2520correo%2520es%2520${encodeURIComponent(user.email)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Solicita acceso aquí
                    </a>
                  ) : (
                    <>
                      <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                        Inicia sesión
                      </Link>{' '}
                      o{' '}
                      <Link href="/auth/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                        regístrate
                      </Link>
                    </>
                  )}{' '}
                  para acceder a precios mayoristas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
