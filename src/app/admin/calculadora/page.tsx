'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

interface Filament {
  id: string;
  weight: number;
  pricePerKg: number;
}

interface QuoteItem {
  id: string;
  nombre: string;
  materialType: string;
  materialColor: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  filaments: Filament[];
  time: number;
  power: number;
  powerPrice: number;
  margin: number;
  pesoTotalAcumulado: number;
  costoMaterialTotal: number;
  costoLuz: number;
  costoProduccion: number;
  costoReposicion: number;
  ganancia: number;
}

export default function CalculadoraPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.email !== 'miraishop47@gmail.com') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Invoice & Client Data
  const [invoiceStatus, setInvoiceStatus] = useState<string>('Cotización');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [isFreeShipping, setIsFreeShipping] = useState<boolean>(true);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Current Form State
  const [nombre, setNombre] = useState<string>('');
  const [materialType, setMaterialType] = useState<string>('PLA');
  const [materialColor, setMaterialColor] = useState<string>('');
  const [filaments, setFilaments] = useState<Filament[]>([{ id: '1', weight: 4, pricePerKg: 56000 }]);
  const [time, setTime] = useState<number>(1.5);
  const [power, setPower] = useState<number>(100);
  const [powerPrice, setPowerPrice] = useState<number>(440);
  const [margin, setMargin] = useState<number>(150);
  const [quantity, setQuantity] = useState<number>(1);

  // Quote Cart State
  const [quoteCart, setQuoteCart] = useState<QuoteItem[]>([]);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  
  // Static Invoice Data
  const invoiceNumber = useState(() => Math.floor(Math.random() * 90000) + 10000)[0];
  const invoiceDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading || !user || user.email !== 'miraishop47@gmail.com') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950/50">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  const formatCOP = (valor: number) => {
    return '$ ' + Math.round(valor).toLocaleString('es-CO');
  };

  const qty = quantity || 1;
  let costoMaterialUnitario = 0;
  let pesoUnitarioAcumulado = 0;

  filaments.forEach(fil => {
    const w = fil.weight || 0;
    const p = fil.pricePerKg || 0;
    const pricePerGram = p / 1000;
    costoMaterialUnitario += w * pricePerGram;
    pesoUnitarioAcumulado += w;
  });

  const costoMaterialTotal = costoMaterialUnitario * qty;
  const pesoTotalAcumulado = pesoUnitarioAcumulado * qty;

  const tUnitario = time || 0;
  const tiempoTotal = tUnitario * qty;
  
  const pwr = power || 0;
  const pPrice = powerPrice || 0;
  const mrg = margin || 0;

  const costoLuz = (pwr / 1000) * tiempoTotal * pPrice;
  const costoProduccion = costoMaterialTotal + costoLuz;
  const costoReposicion = costoMaterialTotal * 2;
  const ganancia = costoProduccion * (mrg / 100);
  const precioVentaTotal = costoProduccion + costoReposicion + ganancia;
  const precioVentaUnitario = precioVentaTotal / qty;

  const addFilament = () => {
    setFilaments([...filaments, { id: Math.random().toString(), weight: 0, pricePerKg: 56000 }]);
  };

  const removeFilament = (id: string) => {
    if (filaments.length > 1) {
      setFilaments(filaments.filter(f => f.id !== id));
    } else {
      alert('Debes mantener al menos un filamento para realizar el cálculo.');
    }
  };

  const updateFilament = (id: string, field: keyof Filament, value: number) => {
    setFilaments(filaments.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSaveToCart = () => {
    if (!nombre.trim()) {
      alert('Por favor, asigna un "Nombre de la Pieza" antes de añadir a la factura.');
      return;
    }

    const newQuote: QuoteItem = {
      id: editingQuoteId || Math.random().toString(36).substring(2, 9),
      nombre,
      materialType,
      materialColor,
      cantidad: qty,
      precioUnitario: precioVentaUnitario,
      precioTotal: precioVentaTotal,
      filaments: [...filaments],
      time,
      power,
      powerPrice,
      margin,
      pesoTotalAcumulado,
      costoMaterialTotal,
      costoLuz,
      costoProduccion,
      costoReposicion,
      ganancia
    };

    if (editingQuoteId) {
      setQuoteCart(quoteCart.map(item => item.id === editingQuoteId ? newQuote : item));
      setEditingQuoteId(null);
    } else {
      setQuoteCart([...quoteCart, newQuote]);
    }

    setNombre('');
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditQuote = (item: QuoteItem) => {
    setNombre(item.nombre);
    setMaterialType(item.materialType || 'PLA');
    setMaterialColor(item.materialColor || '');
    setQuantity(item.cantidad);
    setFilaments([...item.filaments]);
    setTime(item.time);
    setPower(item.power);
    setPowerPrice(item.powerPrice);
    setMargin(item.margin);
    setEditingQuoteId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuote = (id: string) => {
    setQuoteCart(quoteCart.filter(item => item.id !== id));
    if (editingQuoteId === id) {
      setEditingQuoteId(null);
      setNombre('');
      setQuantity(1);
    }
  };

  const handlePrint = () => {
    if (quoteCart.length === 0) {
      alert('Debes añadir al menos una cotización a la lista antes de generar la factura.');
      return;
    }
    const originalTitle = document.title;
    const safeClientName = clientName.trim() || 'Cliente';
    document.title = `Factura - ${safeClientName}`;
    
    window.print();
    
    // Restaurar el título original después de imprimir
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const cartSubtotal = quoteCart.reduce((sum, item) => {
    if (item.id === editingQuoteId) {
      return sum + precioVentaTotal;
    }
    return sum + item.precioTotal;
  }, 0);
  const finalShipping = isFreeShipping ? 0 : (shippingCost || 0);
  const cartTotal = cartSubtotal + finalShipping;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pagada': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cotización': default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen print:min-h-0 bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-gray-100 py-8 px-4 flex justify-center items-start print:p-0 print:bg-white print:block">
      {/* 
        ====================================================
        VISTA DE INTERFAZ WEB (OCULTA AL IMPRIMIR)
        ====================================================
      */}
      <div className="w-full max-w-7xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 overflow-hidden print:hidden">
        
        <header className="bg-gradient-to-br from-blue-900 to-blue-600 dark:from-indigo-950 dark:to-indigo-800 text-white p-8 text-center">
          <div className="flex justify-between items-center mb-4 max-w-full mx-auto">
            <Link href="/admin" className="text-blue-200 hover:text-white transition-colors text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              Volver a Admin
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">MiraiShop - Creador de Facturas</h1>
          <p className="text-blue-200 text-sm">Generador de facturas comerciales.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-8">
          
          {/* Columna Izquierda: Formulario */}
          <section className="xl:col-span-7">
            
            {/* Datos de la Factura y Cliente */}
            <div className="bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-200 dark:border-gray-700 mb-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                📄 Datos del Documento y Cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Estado de la Factura</label>
                  <select 
                    value={invoiceStatus} 
                    onChange={e => setInvoiceStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cotización">Cotización</option>
                    <option value="Pendiente">Pendiente de Pago</option>
                    <option value="Pagada">Pagada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Nombre del Cliente</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Opcional" className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Correo Electrónico</label>
                  <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Opcional" className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Teléfono</label>
                  <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Opcional" className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Dirección de Entrega</label>
                  <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Opcional" className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-gray-700 mt-2">
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="freeShipping" checked={isFreeShipping} onChange={e => setIsFreeShipping(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  <label htmlFor="freeShipping" className="text-sm font-semibold text-slate-700 dark:text-gray-300 cursor-pointer">Envío Gratis / Entregado en persona</label>
                </div>
                {!isFreeShipping && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Costo de Envío (COP)</label>
                    <input type="number" value={Number.isNaN(shippingCost) ? '' : shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value))} min="0" className="w-full p-2.5 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              {editingQuoteId ? '✏️ Editando Pieza' : '📝 Agregar Nueva Pieza'}
            </h2>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800/50 mb-8">
              <label className="block text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">🏷️ Nombre de la Pieza / Producto *</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                placeholder="Ej: Soporte de audífonos personalizado"
                className="w-full p-3 border border-blue-300 dark:border-blue-700 rounded-xl font-semibold bg-white dark:bg-gray-900 text-base outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">🧵 Filamentos Utilizados (Costo base)</h3>
            <div className="mb-6 space-y-3">
              {filaments.map((fil) => (
                <div key={fil.id} className="grid grid-cols-[1fr_1.2fr_auto] gap-3 items-end bg-slate-100 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">Gramos</label>
                    <input 
                      type="number" value={Number.isNaN(fil.weight) ? '' : fil.weight} onChange={e => updateFilament(fil.id, 'weight', parseFloat(e.target.value))}
                      min="0" step="any"
                      className="w-full p-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">Precio Rollo KG</label>
                    <input 
                      type="number" value={Number.isNaN(fil.pricePerKg) ? '' : fil.pricePerKg} onChange={e => updateFilament(fil.id, 'pricePerKg', parseFloat(e.target.value))}
                      min="0"
                      className="w-full p-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button onClick={() => removeFilament(fil.id)} className="p-2 text-red-500 hover:text-red-700 hover:scale-110 transition-transform" title="Eliminar filamento">
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addFilament} className="w-full py-3 mb-8 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex justify-center items-center gap-2">
              ➕ Añadir mezcla de filamento a esta pieza
            </button>

            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">⚙️ Parámetros Generales de Impresión</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">Tiempo estimado (Hrs)</label>
                <input type="number" value={Number.isNaN(time) ? '' : time} onChange={e => setTime(parseFloat(e.target.value))} min="0" step="any" className="w-full p-3 border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">Consumo Impresora (W)</label>
                <input type="number" value={Number.isNaN(power) ? '' : power} onChange={e => setPower(parseFloat(e.target.value))} min="0" className="w-full p-3 border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">Precio Luz kWh (COP)</label>
                <input type="number" value={Number.isNaN(powerPrice) ? '' : powerPrice} onChange={e => setPowerPrice(parseFloat(e.target.value))} min="0" className="w-full p-3 border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">Margen Ganancia (%)</label>
                <input type="number" value={Number.isNaN(margin) ? '' : margin} onChange={e => setMargin(parseFloat(e.target.value))} min="0" className="w-full p-3 border border-slate-200 dark:border-gray-700 rounded-xl bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2">Cantidad Piezas</label>
                <input type="number" value={Number.isNaN(quantity) ? '' : quantity} onChange={e => setQuantity(parseInt(e.target.value))} min="1" className="w-full p-3 border-2 border-emerald-400 rounded-xl font-bold text-center bg-white dark:bg-gray-900 outline-none focus:ring-4 focus:ring-emerald-500/20" />
              </div>
              <div className="w-full sm:w-2/3 text-center sm:text-right">
                <span className="block text-sm font-medium text-slate-500 dark:text-gray-400 mb-1">Subtotal de esta pieza:</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatCOP(precioVentaTotal)}</span>
              </div>
            </div>

            <button 
              onClick={handleSaveToCart} 
              className={`w-full mt-6 py-4 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] text-white flex justify-center items-center gap-2 ${editingQuoteId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
            >
              {editingQuoteId ? '✅ Actualizar Pieza en Factura' : '🛒 Añadir Pieza a la Factura'}
            </button>
          </section>

          {/* Columna Derecha: Vista previa e Historial */}
          <section className="xl:col-span-5 flex flex-col gap-6">
            
            {/* Desglose del Precio (Previsualización) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                📊 Desglose del Precio
              </h2>

              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-6 border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  <span className="text-base">ℹ️</span>
                  <span>Peso total acumulado de material:</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{pesoTotalAcumulado.toFixed(1)} gramos</span>
              </div>

              <div className="space-y-3">
                {/* Costo Material Usado */}
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-4 border-l-4 border-l-blue-500 shadow-sm">
                  <div>
                    <h4 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Costo Material Usado</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Valor exacto de los gramos fundidos</p>
                  </div>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{formatCOP(costoMaterialTotal)}</span>
                </div>

                {/* Costo de Energía */}
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-4 border-l-4 border-l-blue-500 shadow-sm">
                  <div>
                    <h4 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Costo de Energía</h4>
                  </div>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{formatCOP(costoLuz)}</span>
                </div>

                {/* Costo Base de Producción */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl p-4 border-l-4 border-l-slate-300 dark:border-l-gray-600 shadow-sm">
                  <div>
                    <h4 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Costo Base de Producción</h4>
                  </div>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{formatCOP(costoProduccion)}</span>
                </div>

                {/* Fondo de Reposición */}
                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 border-l-4 border-l-amber-500 shadow-sm">
                  <div>
                    <h4 className="text-amber-700 dark:text-amber-500 font-semibold text-sm">Fondo de Reposición</h4>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">Costo del material usado multiplicado por 2</p>
                  </div>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-500">{formatCOP(costoReposicion)}</span>
                </div>

                {/* Ganancia Neta */}
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-4 border-l-4 border-l-slate-300 dark:border-l-gray-600 shadow-sm">
                  <div>
                    <h4 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Ganancia Neta</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Aplicada sobre el costo base de producción</p>
                  </div>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{formatCOP(ganancia)}</span>
                </div>

                {/* Total de Venta */}
                <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 border-l-4 border-l-indigo-500 shadow-sm mt-4">
                  <div>
                    <h4 className="text-indigo-800 dark:text-indigo-400 font-bold text-sm">Precio Final de la Pieza</h4>
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">Suma de producción, reposición y ganancia</p>
                  </div>
                  <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{formatCOP(precioVentaTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                📋 Factura en Progreso ({quoteCart.length})
              </h2>

              {quoteCart.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl">
                  <span className="text-4xl block mb-3 opacity-50">🛒</span>
                  <p className="text-slate-500 dark:text-gray-400 font-medium">No hay piezas en la factura.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-gray-700 text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          <th className="py-2 pr-2 font-semibold">Desc.</th>
                          <th className="py-2 px-2 font-semibold text-center">Cant.</th>
                          <th className="py-2 pl-2 font-semibold text-right">Total</th>
                          <th className="py-2 pl-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                        {quoteCart.map(item => {
                          const isEditing = item.id === editingQuoteId;
                          const currentTotal = isEditing ? precioVentaTotal : item.precioTotal;
                          const currentQty = isEditing ? qty : item.cantidad;
                          const currentName = isEditing ? (nombre || 'Pieza sin nombre') : item.nombre;
                          
                          return (
                            <tr key={item.id} className="text-slate-700 dark:text-gray-300">
                              <td className="py-3 pr-2">
                                <span className="font-bold block text-slate-900 dark:text-white text-sm">{currentName}</span>
                              </td>
                              <td className="py-3 px-2 text-center text-sm">{currentQty}</td>
                              <td className="py-3 pl-2 text-right font-bold text-slate-900 dark:text-white text-sm">{formatCOP(currentTotal)}</td>
                              <td className="py-3 pl-2 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleEditQuote(item)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Editar">✏️</button>
                                  <button onClick={() => handleDeleteQuote(item.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Eliminar">❌</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="bg-slate-50 dark:bg-gray-800/80 p-4 rounded-xl flex flex-col gap-2 border border-slate-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm text-slate-600 dark:text-gray-400">
                        <span>Subtotal Piezas:</span>
                        <span className="font-semibold">{formatCOP(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600 dark:text-gray-400 pb-2 border-b border-slate-200 dark:border-gray-700">
                        <span>Costo de Envío:</span>
                        <span className="font-semibold">{isFreeShipping ? 'Gratis' : formatCOP(shippingCost || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-base font-bold text-slate-800 dark:text-gray-200">TOTAL FACTURA:</span>
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCOP(cartTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handlePrint} 
              disabled={quoteCart.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Ver e Imprimir Factura
            </button>
          </section>
        </div>
      </div>

      {/* 
        ====================================================
        VISTA DE IMPRESIÓN (FACTURA COMERCIAL CORPORATIVA)
        Visible únicamente al hacer window.print()
        ====================================================
      */}
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0mm; }
        `}
      </style>
      <div className="hidden print:block w-full max-w-[21cm] mx-auto bg-white text-slate-900 text-[13px] leading-relaxed print:py-12 print:px-8">
        {/* Header Corporate */}
        <header className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
          <div className="flex flex-col">
            {/* Logo placeholder, points to /logo.png in the public folder */}
            <img src="/logo.png" alt="MiraiShop Logo" className="h-36 max-w-[300px] object-contain mb-1 -mt-4" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <h1 className="hidden text-4xl font-black tracking-tight text-slate-900 mb-1">MiraiShop</h1>
          </div>
          <div className="text-right flex flex-col items-end mt-2">
            <h2 className="text-3xl font-light text-slate-300 mb-4 uppercase tracking-widest">Factura</h2>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">Número</p>
                <p className="font-semibold">#{invoiceNumber}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">Fecha</p>
                <p className="font-semibold">{invoiceDate}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Company and Client Info */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          {/* MiraiShop Info */}
          <div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-3">Emitido por</p>
            <p className="font-bold text-base text-slate-900 mb-1">MiraiShop</p>
            <p className="text-slate-600">miraishop47@gmail.com</p>
            <p className="text-slate-600">Cel: 301 699 6522</p>
            <p className="text-slate-600">Colombia</p>
          </div>
          
          {/* Client Info */}
          <div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-3">Facturado a</p>
            <p className="font-bold text-base text-slate-900 mb-1">{clientName || 'Cliente No Registrado'}</p>
            {clientEmail && <p className="text-slate-600">{clientEmail}</p>}
            {clientPhone && <p className="text-slate-600">Tel: {clientPhone}</p>}
            {clientAddress && <p className="text-slate-600 mt-1 max-w-[250px]">{clientAddress}</p>}
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-3 px-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider">Descripción del Servicio / Producto</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider text-center">Cant.</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider text-right">Vr. Unitario</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-[11px] uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quoteCart.map((item, index) => {
                const isEditing = item.id === editingQuoteId;
                const currentTotal = isEditing ? precioVentaTotal : item.precioTotal;
                const currentQty = isEditing ? qty : item.cantidad;
                const currentUnit = isEditing ? precioVentaUnitario : item.precioUnitario;
                const currentName = isEditing ? (nombre || 'Pieza sin nombre') : item.nombre;

                return (
                  <tr key={index} className="align-top">
                    <td className="py-5 px-4">
                      <p className="font-bold text-slate-900 text-sm mb-1">{currentName}</p>
                    </td>
                    <td className="py-5 px-4 text-center font-medium text-slate-800">{currentQty}</td>
                    <td className="py-5 px-4 text-right text-slate-800">{formatCOP(currentUnit)}</td>
                    <td className="py-5 px-4 text-right font-bold text-slate-900">{formatCOP(currentTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end mb-16">
          <div className="w-1/2">
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-800">{formatCOP(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <span>Envío</span>
              <span className="font-medium text-slate-800">{isFreeShipping ? 'Gratis' : formatCOP(shippingCost || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-4 mt-2 border-2 border-slate-900 text-slate-900 px-6 rounded-lg shadow-sm">
              <span className="font-bold text-base tracking-wide">TOTAL FINAL</span>
              <span className="text-3xl font-black">{formatCOP(cartTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-200 flex justify-between items-end text-slate-400">
          <div>
            <p className="font-bold text-slate-800 text-sm mb-1">¡Gracias por confiar en MiraiShop!</p>
          </div>
          <div className="text-right text-xs">
            <p>Generado el {invoiceDate}</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
