import React, { useState } from 'react';
import { Order, OrderItem } from '../../domain/entities/Order';

interface OrderEditModalProps {
  order: Order;
  onClose: () => void;
  onSave: (id: string, data: Partial<Order>) => Promise<void>;
}

export default function OrderEditModal({ order, onClose, onSave }: OrderEditModalProps) {
  const [formData, setFormData] = useState({
    customerName: order.customerName,
    customerPhone: order.customerPhone || '',
    customerAddress: order.customerAddress || '',
    customerNotes: order.customerNotes || '',
  });

  const [items, setItems] = useState<OrderItem[]>([...order.items]);
  const [isSaving, setIsSaving] = useState(false);

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newItems = [...items];
    const item = { ...newItems[index] };
    item.cantidad = newQuantity;
    item.subtotal = item.precio * newQuantity;
    if (item.isPackageSale && item.unitsPerPackage) {
      item.totalUnits = newQuantity * item.unitsPerPackage;
      item.packageQuantity = newQuantity;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const newSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const newTotal = newSubtotal; // Simplified for now, add shipping if needed
      await onSave(order.id!, {
        ...formData,
        items,
        subtotal: newSubtotal,
        total: newTotal,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Editar Pedido #{order.id}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Datos del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Nombre</label>
                  <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Teléfono</label>
                  <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Dirección</label>
                  <input type="text" name="customerAddress" value={formData.customerAddress} onChange={handleInputChange} placeholder="Ej. Calle 123 #45-67" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Notas del Cliente</label>
                  <textarea name="customerNotes" value={formData.customerNotes} onChange={handleInputChange} rows={2} placeholder="Instrucciones especiales de entrega..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Productos</h3>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-sm text-red-500 font-bold">El pedido no tiene productos. (Será guardado con total 0)</p>
                )}
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-950/50">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item.nombre}</h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.isPackageSale ? `Caja x${item.unitsPerPackage} unds.` : 'Unidad individual'} • {formatCOP(item.precio)} c/u
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                        <button type="button" onClick={() => handleItemQuantityChange(idx, item.cantidad - 1)} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">-</button>
                        <span className="px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-700 min-w-[3rem] text-center">{item.cantidad}</span>
                        <button type="button" onClick={() => handleItemQuantityChange(idx, item.cantidad + 1)} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">+</button>
                      </div>
                      <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 min-w-[5rem] text-right">
                        {formatCOP(item.subtotal)}
                      </span>
                      <button onClick={() => handleRemoveItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-bold">Nuevo Total: </span>
            <span className="font-black text-xl text-gray-900 dark:text-white ml-2">
              {formatCOP(items.reduce((sum, item) => sum + item.subtotal, 0))}
            </span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={onClose} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent shadow-sm hover:shadow-indigo-500/25 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
              {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              Guardar Cambios
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
