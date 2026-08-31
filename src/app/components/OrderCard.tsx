'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '../../domain/entities/Order';
import OrderStatusBadge from './OrderStatusBadge';
import OrderEditModal from './OrderEditModal';
import { grantRouletteSpin } from '../../application/services/rouletteService';

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, newStatus: OrderStatus) => Promise<void>;
  onUpdate: (id: string, data: Partial<Order>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function OrderCard({ order, onStatusChange, onUpdate, onDelete }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGrantingTicket, setIsGrantingTicket] = useState(false);

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Pendiente de registrar';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getAccountTypeLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'reseller':
        return 'Distribuidor / Mayorista';
      case 'customer':
      default:
        return 'Cliente Minorista';
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    if (order.id) {
      try {
        setIsUpdating(true);
        await onStatusChange(order.id, newStatus);
      } catch (err) {
        console.error(err);
        alert('No se pudo actualizar el estado del pedido.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDelete = async () => {
    if (order.id) {
      try {
        setIsUpdating(true);
        await onDelete(order.id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUpdating(false);
        setIsDeleteModalOpen(false);
      }
    }
  };

  const handleConfirmTicket = async () => {
    if (!order.id || !order.userId || order.userId === 'invitado') return;
    try {
      setIsGrantingTicket(true);
      await grantRouletteSpin(order.userId);
      await onUpdate(order.id, { rouletteTicketGranted: true });
    } catch (err) {
      console.error(err);
      alert('No se pudo confirmar el ticket de la Ruleta de la Suerte.');
    } finally {
      setIsGrantingTicket(false);
    }
  };

  const totalPacks = order.items.reduce((sum, item) => sum + (item.isPackageSale ? item.cantidad : 0), 0);
  const totalUnits = order.items.reduce((sum, item) => sum + (item.isPackageSale ? 0 : item.cantidad), 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      {isUpdating && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Pedido ID</span>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs mt-0.5">
            #{order.id}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Body: Client Details */}
      <div className="py-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <span className="block font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Cliente</span>
          <p className="font-extrabold text-gray-900 dark:text-white text-sm">{order.customerName}</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{order.customerEmail}</p>
        </div>
        <div className="space-y-1 sm:text-right md:text-left">
          <span className="block font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tipo de Cuenta</span>
          <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {getAccountTypeLabel(order.customerRole)}
          </p>
        </div>
      </div>

      {/* Summary Line */}
      <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50">
        <div className="text-xs">
          <span className="font-bold text-gray-500 dark:text-gray-400">Total</span>
          <p className="font-black text-lg text-gray-900 dark:text-white mt-0.5">{formatCOP(order.total)}</p>
        </div>
        <div className="text-right text-xs">
          <span className="font-bold text-gray-500 dark:text-gray-400">Artículos</span>
          <p className="font-black text-sm text-gray-900 dark:text-white mt-0.5">
            {totalUnits > 0 ? `${totalUnits} unds.` : ''}
            {totalUnits > 0 && totalPacks > 0 ? ' + ' : ''}
            {totalPacks > 0 ? `${totalPacks} pqts.` : ''}
            {totalUnits === 0 && totalPacks === 0 ? '0 unidades' : ''}
          </p>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-5 flex flex-wrap gap-4 items-center justify-between">
        {/* Toggle Expand Items */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
        >
          {isExpanded ? 'Ocultar productos' : 'Ver productos'}
          <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {/* Change Status Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor={`status-${order.id}`} className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Estado:
          </label>
          <select
            id={`status-${order.id}`}
            value={order.status}
            onChange={handleStatusChange}
            className="text-xs font-bold px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-100 outline-none transition-all cursor-pointer"
          >
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Action Buttons (Ticket / Edit / Delete) */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto justify-end">
          {order.userId && order.userId !== 'invitado' && (
            order.rouletteTicketGranted ? (
              <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                🎟️ Ticket otorgado
              </span>
            ) : (
              <button
                onClick={handleConfirmTicket}
                disabled={isGrantingTicket}
                className="px-4 py-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-950/20 dark:hover:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isGrantingTicket ? 'Otorgando...' : '🎟️ Confirmar ticket'}
              </button>
            )
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Collapsible Items List */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-800 space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">{item.nombre}</h4>
                  {item.isPackageSale ? (
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Cant: <span className="font-bold text-pink-500">{item.cantidad} pqts.</span> (Caja x{item.unitsPerPackage}, {item.totalUnits} unds. totales) x {formatCOP(item.precio)}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Cant: <span className="font-bold dark:text-gray-300">{item.cantidad} unds.</span> x {formatCOP(item.precio)}
                    </p>
                  )}
                </div>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-right">
                {formatCOP(item.subtotal)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <OrderEditModal
          order={order}
          onClose={() => setIsEditModalOpen(false)}
          onSave={onUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Eliminar Pedido</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              ¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer y los datos se perderán para siempre.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm hover:shadow-red-500/25 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}