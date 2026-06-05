import { CartItem } from '../../domain/entities/CartItem';

const STORE_PHONE = '573016996522';

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export function generateWhatsAppMessage(
  orderId: string,
  clientName: string,
  accountType: string,
  items: CartItem[],
  total: number,
  isReseller?: boolean
): string {
  const header = `Hola Mirai Shop 👋\n\nHe registrado el pedido Nro: #${orderId}\n\nDetalle del pedido:\n`;
  
  const itemsList = items
    .map(item => {
      const itemDesc = item.isPackageSale && isReseller
        ? `• ${item.nombre} (Caja x${item.unitsPerPackage}) x${item.cantidad} paquete(s) (${item.cantidad * (item.unitsPerPackage || 0)} unds.)`
        : `• ${item.nombre} x${item.cantidad}`;
      
      return isReseller
        ? `${itemDesc} - ${formatCOP(item.precio * item.cantidad)}`
        : itemDesc;
    })
    .join('\n');
    
  const totalSection = isReseller ? `\n\nTotal: ${formatCOP(total)}` : '';
  
  const clientSection = `\n\nCliente: ${clientName || 'Invitado'}\nTipo de cuenta: ${accountType}`;
  
  const fullMessage = `${header}${itemsList}${totalSection}${clientSection}`;
  
  return `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(fullMessage)}`;
}
