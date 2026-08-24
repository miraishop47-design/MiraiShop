import { STORE_PHONE } from '../../application/utils/generateWhatsAppMessage';

const DEFAULT_MESSAGE =
  'Hola Mirai Shop Me gustaría recibir más información sobre sus productos.';

interface WhatsAppContactButtonProps {
  /** Texto del tooltip y etiqueta accesible. */
  label?: string;
  /** Mensaje con el que se abre el chat de WhatsApp. */
  message?: string;
}

/**
 * Botón flotante de contacto por WhatsApp.
 *
 * Va montado una sola vez en el layout raíz, fuera de cualquier sección,
 * por eso usa `fixed`: se posiciona respecto a la ventana del navegador y
 * no respecto a la página, así que se queda quieto al hacer scroll.
 *
 * Posición vertical:
 *  - bottom-24 en móvil/tablet, para no chocar con el FloatingCartButton
 *    (que vive en bottom-6 y solo aparece por debajo de lg).
 *  - bottom-6 desde lg, donde el botón del carrito ya no se muestra.
 */
export default function WhatsAppContactButton({
  label = 'Contáctame por WhatsApp',
  message = DEFAULT_MESSAGE,
}: WhatsAppContactButtonProps) {
  const href = `https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="print:hidden group fixed bottom-24 right-5 lg:bottom-6 lg:right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-2xl shadow-black/40 ring-1 ring-white/10 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.45)] active:scale-95"
    >
      {/* Tooltip: solo en escritorio, al pasar el mouse */}
      <span className="pointer-events-none absolute right-full mr-3 hidden translate-x-2 whitespace-nowrap rounded-xl border border-white/10 bg-[#13151F] px-3.5 py-2 text-sm font-bold text-white opacity-0 shadow-xl transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 lg:block">
        {label}
      </span>

      {/* Halo animado */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />

      <svg
        className="relative h-7 w-7 drop-shadow-sm"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.299 1.262.478 1.694.612.712.222 1.36.19 1.874.115.576-.084 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}
