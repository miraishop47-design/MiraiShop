'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { productService } from '../../../application/services/productService';
import { Product, PackageOption } from '../../../domain/entities/Product';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { transformProductForUser, UIProduct } from '../../../application/utils/productTransformer';
import { useFavorite } from '../../context/FavoriteContext';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorite();

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
  const isFav = product ? isFavorite(product.id!) : false;

  const options = useMemo(() => {
    if (!product) return [];
    return getPackageOptions(product);
  }, [product]);

  const [selectedPackId, setSelectedPackId] = useState<string>('');

  const activePackId = selectedPackId || (options.length > 0 ? options[0].id : '');

  const selectedPack = useMemo(() => {
    if (!isPack) return null;
    return options.find(o => o.id === activePackId) || options[0] || null;
  }, [options, isPack, activePackId]);

  const activeQuantity = useMemo(() => {
    if (isPack && selectedPack) {
      const limit = selectedPack.availablePackages;
      return quantity > limit ? Math.max(1, limit) : quantity;
    }
    return quantity;
  }, [quantity, isPack, selectedPack]);

  // Enforce active status redirect if user is not admin
  const isDenied = rawProduct && rawProduct.activo === false && user?.role !== 'admin';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="mb-8 w-32 h-6 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-gray-800 h-[650px] flex">
          <div className="w-full lg:w-7/12 bg-[#111] p-8 flex items-center justify-center rounded-l-[2.5rem]">
            <div className="w-full h-full bg-gray-800 rounded-3xl"></div>
          </div>
          <div className="w-full lg:w-5/12 p-14 space-y-6">
            <div className="h-4 bg-gray-800 rounded w-1/4"></div>
            <div className="h-12 bg-gray-800 rounded w-3/4"></div>
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="h-32 bg-gray-800 rounded w-full"></div>
            <div className="h-16 bg-gray-800 rounded-full w-full mt-10"></div>
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
    <div className="min-h-screen bg-[#0B0D14] text-white font-sans selection:bg-[#8B5CF6]/30 -mt-16 pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32 md:pb-12">

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          
          {/* Left Column: Gallery Card */}
          <div className="bg-[#13151F] rounded-3xl p-4 sm:p-6 border border-white/5 flex flex-col items-center shadow-xl">
            {/* Main Image */}
            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square flex items-center justify-center overflow-hidden rounded-2xl bg-[#0B0D14]/50 group">
              {/* Expand Button */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
              </button>

              <img
                src={activeImage}
                alt={`${product.nombre} - MiraiShop`}
                className="max-h-full max-w-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-105"
              />

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
                  <span className="text-white font-black tracking-widest uppercase bg-red-500/90 px-8 py-3 rounded-full border border-red-500/50 text-sm shadow-2xl">
                    Agotado
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 mt-6 w-full justify-center">
                <button 
                  onClick={() => setActiveImageIdx(prev => prev > 0 ? prev - 1 : productImages.length - 1)}
                  className="text-gray-500 hover:text-white p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x px-2 max-w-[300px]">
                  {productImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`snap-center w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative transition-all duration-300 ${
                        activeImageIdx === idx 
                          ? 'border-2 border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                          : 'border-2 border-transparent hover:border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Vista ${idx + 1}`}
                        className="w-full h-full object-cover bg-[#0B0D14]"
                      />
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setActiveImageIdx(prev => prev < productImages.length - 1 ? prev + 1 : 0)}
                  className="text-gray-500 hover:text-white p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Details Card */}
          <div className="bg-[#13151F] rounded-3xl p-6 sm:p-10 border border-white/5 flex flex-col justify-start shadow-xl">
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-[#8B5CF6] font-black text-sm tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-[#8B5CF6] rounded-full"></span>
                {product.categoria || 'GAMING'}
              </span>
              
              {isMadeToOrder && (
                <span className="bg-[#FFF8D6] text-[#B48013] font-bold px-3 py-1 rounded-full text-[10px] tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                  <span className="text-xs">🛠️</span> HECHO BAJO PEDIDO
                </span>
              )}
              {isPack && (
                <span className="bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold px-3 py-1 rounded-full text-[10px] tracking-wide uppercase">
                  PAQUETE X{selectedPack ? selectedPack.unitsPerPackage : product.unitsPerPackage}
                </span>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white mb-6 leading-[1.1] tracking-tight">
              {product.nombre}
            </h1>

            {/* Price */}
            <div className="mb-8">
              <p className="text-5xl font-black text-[#8B5CF6] tracking-tight drop-shadow-sm">
                {isReseller 
                  ? formatCOP(isOutOfStock ? 0 : (isPack && selectedPack ? selectedPack.wholesalePrice : product.precio))
                  : '$ 0'} 
              </p>
              {!isReseller && (
                <p className="text-sm text-[#8B5CF6] mt-2 font-medium bg-[#8B5CF6]/10 w-fit px-3 py-1 rounded-lg">
                  El precio se calcula por cotización privada
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-400 mb-10 leading-relaxed text-lg font-light">
              {product.descripcion}
            </p>

            {/* Options (If pack) */}
            {isPack && options.length > 0 && (
              <div className="mb-8 space-y-3">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Presentación
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedPackId(opt.id)}
                      className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                        opt.id === activePackId 
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10' 
                          : 'border-white/10 bg-transparent hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-white">Caja x{opt.unitsPerPackage}</span>
                      <span className="text-sm text-gray-400">{isReseller ? formatCOP(opt.wholesalePrice) : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity / Total Box */}
            <div className="bg-[#0A0C10] rounded-2xl border border-white/5 p-6 mb-8 shadow-inner">
              <div className="flex justify-between items-start mb-6">
                <span className="font-bold text-white">
                  {isMadeToOrder ? 'Por pedido' : 'Cantidad'}
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-400' : 'text-[#8B5CF6]'}`}>
                    {isOutOfStock ? 'Agotado' : isMadeToOrder ? 'Disponible bajo pedido' : 'En stock'}
                  </span>
                  {isMadeToOrder && (
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <span>⏱️</span> Tiempo de preparación variable
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Stepper */}
                <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-[#13151F] w-fit">
                  <button
                    onClick={handleDecrease}
                    disabled={isOutOfStock}
                    className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/5 transition-colors font-bold text-xl disabled:opacity-30"
                  >
                    -
                  </button>
                  <div className="w-12 text-center font-bold text-xl text-white border-x border-white/5 h-12 flex items-center justify-center bg-transparent">
                    {isOutOfStock ? 0 : activeQuantity}
                  </div>
                  <button
                    onClick={handleIncrease}
                    disabled={isOutOfStock}
                    className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/5 transition-colors font-bold text-xl disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                {/* Total */}
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    TOTAL A PAGAR
                  </span>
                  <span className="text-3xl font-black text-white">
                    {isReseller 
                      ? formatCOP(isOutOfStock ? 0 : (isPack && selectedPack ? selectedPack.wholesalePrice : product.precio) * activeQuantity)
                      : '$ 0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {/* Favorite Button */}
              <button
                onClick={() => product && toggleFavorite(product.id!)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 border ${
                  isFav 
                    ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.2)]' 
                    : 'bg-transparent border-white/10 text-white hover:bg-white/5 hover:border-white/20'
                }`}
                title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <svg className={`w-7 h-7 transition-transform duration-300 ${isFav ? 'scale-110' : 'hover:scale-110'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFav ? '1.5' : '2'} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </button>

              {/* Add to cart button */}
              <button 
                onClick={() => product && addToCart(product, activeQuantity, selectedPack?.id)}
                disabled={isOutOfStock}
                className="flex-grow bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.3)] text-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}
              </button>
            </div>
            
            {!isReseller && (
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  ¿Eres distribuidor?{' '}
                  <Link href="/auth/login" className="text-white hover:text-[#8B5CF6] underline underline-offset-4 transition-colors font-bold">
                    Inicia sesión
                  </Link>{' '}
                  para ver precios reales.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Features Bottom Bar */}
        <div className="bg-[#13151F] border border-white/5 rounded-2xl flex flex-col md:flex-row overflow-hidden max-w-5xl mx-auto mb-20 md:mb-10 shadow-lg">
          {/* Feature 1 */}
          <div className="flex-1 p-6 flex items-center justify-center md:justify-start gap-4 border-b md:border-b-0 md:border-r border-white/5">
            <div className="flex-shrink-0 text-[#8B5CF6]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Material resistente</h4>
              <p className="text-gray-500 text-xs mt-0.5">Mayor comodidad</p>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="flex-1 p-6 flex items-center justify-center md:justify-start gap-4 border-b md:border-b-0 md:border-r border-white/5">
            <div className="flex-shrink-0 text-[#8B5CF6]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Diseño funcional</h4>
              <p className="text-gray-500 text-xs mt-0.5">Optimiza tu espacio</p>
            </div>
          </div>
          
          {/* Feature 3 */}
          <div className="flex-1 p-6 flex items-center justify-center md:justify-start gap-4">
            <div className="flex-shrink-0 text-[#8B5CF6]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Hecho bajo pedido</h4>
              <p className="text-gray-500 text-xs mt-0.5">Fabricado especialmente para ti</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Sticky Add to Cart */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0B0D14]/90 backdrop-blur-xl border-t border-white/5 p-4 pb-8 z-40 flex items-center justify-between gap-4 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => product && toggleFavorite(product.id!)}
            className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl transition-all ${
              isFav ? 'bg-pink-500/10 text-pink-500 border border-pink-500/50' : 'bg-white/5 text-gray-300 border border-white/10'
            }`}
          >
            <svg className="w-6 h-6" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFav ? '1.5' : '2'} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          </button>
          
          <div className="hidden min-[380px]:flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {isOutOfStock ? 'Agotado' : 'Total'}
            </span>
            <span className="text-xl font-black text-white tracking-tighter">
              {isReseller ? formatCOP(isOutOfStock ? 0 : (isPack && selectedPack ? selectedPack.wholesalePrice : product.precio) * activeQuantity) : '$ 0'}
            </span>
          </div>

          <button 
            onClick={() => product && addToCart(product, activeQuantity, selectedPack?.id)}
            disabled={isOutOfStock}
            className="flex-grow bg-[#8B5CF6] disabled:bg-gray-700 text-white font-black py-4 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 max-w-[200px]"
          >
            <svg className="w-5 h-5 hidden min-[400px]:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Agregar
          </button>
        </div>

      </div>

      {/* Fullscreen Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0D14]/95 backdrop-blur-md p-4">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 sm:top-10 sm:right-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img 
            src={activeImage} 
            alt="Vista expandida" 
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.15)]" 
          />
        </div>
      )}
    </div>
  );
}
