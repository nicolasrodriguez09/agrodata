import type { InsumoInventario } from '../types/models';

export type EstadoInsumo = 'negativo' | 'agotado' | 'bajo' | 'pendiente' | 'bien';

export interface InsumoConEstado {
  insumo: InsumoInventario;
  estado: EstadoInsumo;
}

export const ROTULOS: Record<EstadoInsumo, { texto: string; color: string; fondo: string }> = {
  negativo: { texto: 'En negativo', color: 'var(--peligro)', fondo: 'var(--peligro-suave)' },
  agotado: { texto: 'Sin existencias', color: 'var(--peligro)', fondo: 'var(--peligro-suave)' },
  bajo: { texto: 'Queda muy poco', color: 'var(--peligro)', fondo: 'var(--peligro-suave)' },
  pendiente: { texto: 'Hay que ir pensando', color: 'var(--aviso)', fondo: 'var(--aviso-suave)' },
  bien: { texto: 'Con stock', color: 'var(--recent)', fondo: 'var(--recent)' },
};

/**
 * Umbrales en la unidad en que se registró cada insumo, como los pidió la finca:
 * menos de 4 es alerta, de 4 a 7 hay que ir pensando en comprar, más de 7 está bien.
 *
 * Son números absolutos a propósito, no un cálculo a partir del consumo. El
 * estimado anterior ("alcanza para ~N aplicaciones") era más fino, pero nadie
 * sabía de dónde salía, y un umbral que no se entiende no se usa. Cuatro bultos
 * es cuatro bultos.
 */
const MUY_POCO = 4;
const PENDIENTE = 7;

export function clasificarInsumos(insumos: InsumoInventario[]): InsumoConEstado[] {
  return insumos.map((insumo) => {
    let estado: EstadoInsumo;
    if (insumo.stockActual < 0) estado = 'negativo';
    else if (insumo.stockActual === 0) estado = 'agotado';
    else if (insumo.stockActual < MUY_POCO) estado = 'bajo';
    else if (insumo.stockActual <= PENDIENTE) estado = 'pendiente';
    else estado = 'bien';
    return { insumo, estado };
  });
}

/** Orden de atención: primero lo que hay que resolver. */
export const ORDEN_ESTADOS: EstadoInsumo[] = ['negativo', 'agotado', 'bajo', 'pendiente', 'bien'];

/** Qué hacer con este insumo, en una línea. */
export function consejo(estado: EstadoInsumo, unidad: string): string {
  switch (estado) {
    case 'negativo':
      return 'Falta registrar una compra';
    case 'agotado':
      return 'Hay que comprar';
    case 'bajo':
      return `Quedan menos de ${MUY_POCO} ${unidad}`;
    case 'pendiente':
      return 'Conviene ir comprando';
    default:
      return 'Existencias suficientes';
  }
}
