import { useEffect, useMemo, useState } from 'react';

/**
 * Muestra la lista de a tandas en vez de dibujarla completa.
 *
 * A propósito NO pagina la consulta a Firestore: los totales de Finanzas
 * (Vendido/Gastado/Balance) y la búsqueda global de Admin necesitan TODOS los
 * registros, así que traer solo 20 documentos daría totales falsos y
 * búsquedas incompletas. Lo que pesaba era dibujar cientos de filas en el DOM,
 * y eso es justo lo que esto corta.
 *
 * `clave` es la firma de los filtros activos: cuando cambia, la lista vuelve a
 * arrancar desde la primera tanda.
 */
export function usePaginacion<T>(items: T[], clave: string, porTanda = 20) {
  const [cuantos, setCuantos] = useState(porTanda);

  useEffect(() => {
    setCuantos(porTanda);
  }, [clave, porTanda]);

  const visibles = useMemo(() => items.slice(0, cuantos), [items, cuantos]);

  return {
    visibles,
    total: items.length,
    mostrando: visibles.length,
    hayMas: items.length > visibles.length,
    verMas: () => setCuantos((c) => c + porTanda),
    verTodos: () => setCuantos(items.length),
  };
}
