'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { productService } from '../../application/services/productService';
import { Product } from '../../domain/entities/Product';

const CATEGORIES = [
  'Gamer',
  'Decoración',
  'Tecnología',
  'Hogar',
  'Personalizados',
  'Muy populares'
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Firestore Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    precioCliente: '',
    precioMayorista: '',
    stock: '',
    categoria: CATEGORIES[0],
    descripcion: '',
    imagen: '',
    imagenes: [''],
    activo: true,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Auth Redirect Guard
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.email !== 'ariaacris73@gmail.com' && user.email !== 'miraishop47@gmail.com') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Subscribe to Products
  useEffect(() => {
    if (!user || (user.email !== 'ariaacris73@gmail.com' && user.email !== 'miraishop47@gmail.com')) return;

    try {
      const unsubscribe = productService.subscribeProducts((updatedProducts) => {
        setProducts(updatedProducts);
        setProductsLoading(false);
      });
      return () => unsubscribe();
    } catch (err: any) {
      setFormError(err.message || 'Error al conectar con Firestore.');
      setProductsLoading(false);
    }
  }, [user]);

  if (loading || !user || (user.email !== 'ariaacris73@gmail.com' && user.email !== 'miraishop47@gmail.com')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-955/50">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImgs = [...form.imagenes];
    newImgs[index] = value;
    setForm((prev) => ({ ...prev, imagenes: newImgs }));
  };

  const handleAddImageField = () => {
    setForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, ''] }));
  };

  const handleRemoveImageField = (index: number) => {
    if (form.imagenes.length === 1) {
      setForm((prev) => ({ ...prev, imagenes: [''] }));
      return;
    }
    const newImgs = form.imagenes.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, imagenes: newImgs }));
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id || null);
    setForm({
      nombre: product.nombre,
      precioCliente: String(product.precioCliente || 0),
      precioMayorista: String(product.precioMayorista || 0),
      stock: String(product.stock),
      categoria: product.categoria,
      descripcion: product.descripcion,
      imagen: product.imagen || '',
      imagenes: product.imagenes && product.imagenes.length > 0 ? [...product.imagenes] : [''],
      activo: product.activo !== undefined ? product.activo : true,
    });
    // Scroll form into view on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      nombre: '',
      precioCliente: '',
      precioMayorista: '',
      stock: '',
      categoria: CATEGORIES[0],
      descripcion: '',
      imagen: '',
      imagenes: [''],
      activo: true,
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const priceClientNum = Number(form.precioCliente);
    const priceResellerNum = Number(form.precioMayorista);
    const stockNum = Number(form.stock);

    if (!form.nombre || priceClientNum <= 0 || priceResellerNum <= 0 || stockNum < 0) {
      setFormError('Nombre, precios mayores a cero y stock válido son obligatorios.');
      setFormSubmitting(false);
      return;
    }

    const cleanImagenes = form.imagenes.map(u => u.trim()).filter(Boolean);
    const mainImgUrl = form.imagen.trim();

    // Sync main cover image intoimagenes array if not present
    if (mainImgUrl && !cleanImagenes.includes(mainImgUrl)) {
      cleanImagenes.unshift(mainImgUrl);
    }

    // Default placeholder fallback
    if (cleanImagenes.length === 0) {
      const fallback = 'https://images.unsplash.com/photo-1612036781124-847f8939b154?auto=format&fit=crop&w=800&q=80';
      cleanImagenes.push(fallback);
    }

    const finalCoverImg = mainImgUrl || cleanImagenes[0];

    try {
      const productData = {
        nombre: form.nombre,
        precioCliente: priceClientNum,
        precioMayorista: priceResellerNum,
        stock: stockNum,
        categoria: form.categoria,
        descripcion: form.descripcion,
        imagen: finalCoverImg,
        imagenes: cleanImagenes,
        activo: form.activo,
      };

      if (editingId) {
        await productService.updateProduct(editingId, productData);
        setFormSuccess('¡Producto actualizado exitosamente! ✨');
        setEditingId(null);
      } else {
        await productService.createProduct(productData);
        setFormSuccess('¡Producto creado exitosamente! 🚀');
      }

      // Reset form
      setForm({
        nombre: '',
        precioCliente: '',
        precioMayorista: '',
        stock: '',
        categoria: CATEGORIES[0],
        descripcion: '',
        imagen: '',
        imagenes: [''],
        activo: true,
      });
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el producto.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) {
      return;
    }

    try {
      await productService.deleteProduct(id);
    } catch (err: any) {
      alert(`Error al eliminar el producto: ${err.message}`);
    }
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black">Administración</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona el inventario de productos de MiraiShop en tiempo real.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          Ver Pedidos
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-md sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h2>

            {formSuccess && (
              <div className="mb-6 p-4 bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-500/50 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-medium text-center">
                {formSuccess}
              </div>
            )}

            {formError && (
              <div className="mb-6 p-4 bg-red-100/50 dark:bg-red-900/30 border border-red-500/50 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Soporte Auriculares Gamer"
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Precio Cliente</label>
                  <input
                    type="number"
                    name="precioCliente"
                    value={form.precioCliente}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Cliente"
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-955/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Precio Mayorista</label>
                  <input
                    type="number"
                    name="precioMayorista"
                    value={form.precioMayorista}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Mayorista"
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-955/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="15"
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Categoría</label>
                  <select
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Detalles del producto (material, uso, dimensiones...)"
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Imagen Principal (URL)</label>
                <input
                  type="url"
                  name="imagen"
                  value={form.imagen}
                  onChange={handleChange}
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Imágenes de Galería Adicionales (URLs)</label>
                <div className="space-y-2">
                  {form.imagenes.map((imgUrl, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={imgUrl}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder={`https://images.unsplash.com/... (Galería ${index + 1})`}
                        className="flex-grow px-4 py-3 bg-gray-50/50 dark:bg-gray-955/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all font-medium text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField(index)}
                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-xl transition-all"
                        title="Eliminar esta imagen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddImageField}
                  className="mt-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 ml-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Agregar otra imagen a galería
                </button>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={form.activo}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="activo" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Producto Activo (Visible en tienda)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-75 shadow-md active:scale-98"
                >
                  {formSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Listing */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Inventario de Productos ({products.length})
            </h2>

            {productsLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-xl flex-shrink-0"></div>
                    <div className="flex-grow space-y-2">
                       <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3"></div>
                       <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!productsLoading && products.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">📦</span>
                <p className="text-sm">No hay productos en inventario. Usa el formulario para agregar uno.</p>
              </div>
            )}

            {!productsLoading && products.length > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-955 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imagen || (product.imagenes && product.imagenes[0]) || 'https://images.unsplash.com/photo-1612036781124-847f8939b154?auto=format&fit=crop&w=120&q=80'}
                          alt={product.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Product Name & Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{product.nombre}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${product.activo !== false ? 'bg-green-100 text-green-700 dark:bg-green-955/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-450'}`}>
                            {product.activo !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
                          <span className="font-semibold text-indigo-500">{product.categoria}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-600 dark:text-gray-300">P. Cliente: {formatCOP(product.precioCliente || 0)}</span>
                          <span>•</span>
                          <span className="font-medium text-purple-600 dark:text-purple-400">P. Mayorista: {formatCOP(product.precioMayorista || 0)}</span>
                          <span>•</span>
                          <span className={product.stock <= 0 ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                            {product.stock <= 0 ? 'Agotado' : `${product.stock} unidades`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all font-medium text-sm px-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => product.id && handleDeleteClick(product.id, product.nombre)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all font-medium text-sm px-4"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
