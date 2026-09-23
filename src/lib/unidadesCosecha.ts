/**
 * Unidades en que se puede medir una cosecha o una venta.
 *
 * El kilo va primero porque es la única que permite comparar de verdad: una
 * canastilla no pesa lo mismo en toda finca ni en toda temporada, así que
 * "rendimiento por hectárea" o "costo por kilo" solo salen bien en kilos.
 * Las demás quedan porque en la práctica se despacha y se cobra por ellas.
 *
 * `aKilos` es cuánto pesa una unidad, para poder estimar kilos aunque se
 * registre en otra medida. null = no se puede saber (una "carga" no es un peso
 * fijo), y en ese caso los cálculos por kilo simplemente omiten ese registro
 * en vez de inventar una equivalencia.
 */
export interface UnidadCosecha {
  id: string;
  nombre: string;
  corto: string;
  aKilos: number | null;
}

export const UNIDADES_COSECHA: UnidadCosecha[] = [
  { id: 'kg', nombre: 'Kilogramos', corto: 'kg', aKilos: 1 },
  { id: 'canastilla', nombre: 'Canastillas', corto: 'canastillas', aKilos: 22 },
  { id: 'tonelada', nombre: 'Toneladas', corto: 't', aKilos: 1000 },
];

export const UNIDAD_POR_DEFECTO = 'kg';

export function unidadDe(id: string | undefined): UnidadCosecha {
  return UNIDADES_COSECHA.find((u) => u.id === id) ?? UNIDADES_COSECHA[0];
}

/** Texto para mostrar: "37 canastillas", "850 kg". */
export function textoCantidad(cantidad: number, unidadId: string | undefined): string {
  const u = unidadDe(unidadId);
  const n = cantidad.toLocaleString('es-CO');
  if (u.id === 'canastilla') return `${n} ${cantidad === 1 ? 'canastilla' : 'canastillas'}`;
  return `${n} ${u.corto}`;
}

/** Kilos equivalentes, o null si la unidad no tiene peso fijo. */
export function enKilos(cantidad: number, unidadId: string | undefined): number | null {
  const u = unidadDe(unidadId);
  return u.aKilos != null ? cantidad * u.aKilos : null;
}
