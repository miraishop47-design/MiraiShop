'use client';

import { useEffect, useState } from 'react';
import { orderRequestService } from '../../application/services/orderRequestService';

/** Cantidad de solicitudes de compra pendientes, en tiempo real. Solo se suscribe si `enabled` (admin). */
export function usePendingRequestsCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = orderRequestService.subscribePending(
      (requests) => setCount(requests.length),
      () => setCount(0)
    );
    return () => {
      unsubscribe();
      setCount(0);
    };
  }, [enabled]);

  return enabled ? count : 0;
}
