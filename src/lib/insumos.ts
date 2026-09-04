import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { ErrorDeNegocio } from './errores';
import { formatoCantidad } from './cantidades';
import type { InsumoInventario, MovimientoInventario } from '../types/models';

/** Margen para que la coma flotante no dispare el bloqueo (0.1 - 0.1 puede dar -1e-17). */
const TOLERANCIA = 0.001;

/**
 * Se intentó descontar más stock del que hay. Lleva los números para poder
 * explicarle al usuario exactamente por qué no se puede.
 */
export class StockInsuficiente extends ErrorDeNegocio {
  constructor(nombreInsumo: string, stockActual: number, aDescontar: number, unidad: string) {
    super(
      `No se puede: "${nombreInsumo}" tiene ${formatoCantidad(stockActual)} ${unidad} en inventario y esta ` +
        `acción le descontaría ${formatoCantidad(aDescontar)}, dejándolo en ` +
        `${formatoCantidad(stockActual - aDescontar)}. Un stock negativo significaría que se aplicó insumo ` +
        `que nunca entró. Primero borra las aplicaciones que sobran, o registra la compra que falta.`,
    );
    this.name = 'StockInsuficiente';
  }
}

export function escucharInsumos(callback: (insumos: InsumoInventario[]) => void) {
  const q = query(collection(db, 'insumos'));
  return onSnapshot(q, (snap) => {
    const insumos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InsumoInventario, 'id'>) }));
    insumos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    callback(insumos);
  });
}

export function escucharMovimientosDeInsumo(insumoId: string, callback: (movimientos: MovimientoInventario[]) => void) {
  const q = query(collection(db, 'movimientos'), where('insumoId', '==', insumoId));
  return onSnapshot(q, (snap) => {
    const movimientos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MovimientoInventario, 'id'>) }));
    movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(movimientos);
  });
}

export async function crearInsumo(nombre: string, unidad: string, creadoPor: string): Promise<string> {
  const ref = await addDoc(collection(db, 'insumos'), {
    nombre: nombre.trim(),
    unidad: unidad.trim(),
    stockActual: 0,
    costoUnitario: 0,
    creadoPor,
  });
  return ref.id;
}

interface DatosEntrada {
  insumoId: string;
  cantidad: number;
  costoUnitario: number;
  compraId: string;
  fecha: string;
  creadoPor: string;
}

/** Entrada de stock por una compra. Sobreescribe costoUnitario (último precio, ver types/models.ts). */
export async function registrarEntrada(data: DatosEntrada) {
  await updateDoc(doc(db, 'insumos', data.insumoId), {
    stockActual: increment(data.cantidad),
    costoUnitario: data.costoUnitario,
  });
  await addDoc(collection(db, 'movimientos'), {
    insumoId: data.insumoId,
    tipo: 'entrada' as const,
    cantidad: data.cantidad,
    costoUnitario: data.costoUnitario,
    fecha: data.fecha,
    origen: 'compra' as const,
    origenId: data.compraId,
    creadoPor: data.creadoPor,
  });
}

interface DatosSalida {
  insumoId: string;
  cantidad: number;
  costoUnitario: number;
  aplicacionId: string;
  loteId: string;
  fecha: string;
  creadoPor: string;
}

/** Salida de stock por una aplicación. No bloquea si deja el stock en negativo. */
export async function registrarSalida(data: DatosSalida) {
  await updateDoc(doc(db, 'insumos', data.insumoId), {
    stockActual: increment(-data.cantidad),
  });
  await addDoc(collection(db, 'movimientos'), {
    insumoId: data.insumoId,
    tipo: 'salida' as const,
    cantidad: data.cantidad,
    costoUnitario: data.costoUnitario,
    fecha: data.fecha,
    origen: 'aplicacion' as const,
    origenId: data.aplicacionId,
    loteId: data.loteId,
    creadoPor: data.creadoPor,
  });
}

interface DatosAjuste {
  insumoId: string;
  cantidad: number;
  costoUnitario: number;
  aplicacionId: string;
  fecha: string;
  creadoPor: string;
}

/**
 * Revierte una salida vieja (por ejemplo, al editar una aplicación) devolviendo la cantidad al
 * stock, y deja un movimiento de 'ajuste' para que el historial del insumo siga sumando correcto
 * (si no, la salida vieja se queda "colgada" en el historial sin su reversión).
 */
export async function revertirSalida(data: DatosAjuste) {
  await updateDoc(doc(db, 'insumos', data.insumoId), {
    stockActual: increment(data.cantidad),
  });
  await addDoc(collection(db, 'movimientos'), {
    insumoId: data.insumoId,
    tipo: 'entrada' as const,
    cantidad: data.cantidad,
    costoUnitario: data.costoUnitario,
    fecha: data.fecha,
    origen: 'ajuste' as const,
    origenId: data.aplicacionId,
    creadoPor: data.creadoPor,
  });
}

/**
 * Ajusta el stock de un insumo en `delta` (positivo suma, negativo resta) y deja el movimiento
 * de 'ajuste' correspondiente, para que el historial del insumo siga cuadrando con su stock.
 * Se usa al editar o borrar una compra.
 */
export async function ajustarStock(data: {
  insumoId: string;
  delta: number;
  costoUnitario: number;
  origenId: string;
  fecha: string;
  creadoPor: string;
}) {
  if (data.delta === 0) return;

  // Bajar el stock por debajo de cero deja un estado imposible: insumo aplicado
  // a los lotes que nunca entró al inventario. Se corta acá con el motivo, en
  // vez de guardar el negativo. El getDoc sale de la caché local, así que la
  // validación también funciona sin señal.
  if (data.delta < 0) {
    const snap = await getDoc(doc(db, 'insumos', data.insumoId));
    const insumo = snap.data() as Omit<InsumoInventario, 'id'> | undefined;
    const stock = insumo?.stockActual ?? 0;
    if (stock + data.delta < -TOLERANCIA) {
      throw new StockInsuficiente(insumo?.nombre ?? 'Este insumo', stock, -data.delta, insumo?.unidad ?? '');
    }
  }

  await updateDoc(doc(db, 'insumos', data.insumoId), {
    stockActual: increment(data.delta),
  });
  await addDoc(collection(db, 'movimientos'), {
    insumoId: data.insumoId,
    tipo: data.delta > 0 ? ('entrada' as const) : ('salida' as const),
    cantidad: Math.abs(data.delta),
    costoUnitario: data.costoUnitario,
    fecha: data.fecha,
    origen: 'ajuste' as const,
    origenId: data.origenId,
    creadoPor: data.creadoPor,
  });
}

/**
 * Deja el costoUnitario del insumo en el de su compra más reciente (política de "último precio",
 * ver types/models.ts). Se llama después de editar o borrar una compra, porque esa compra pudo
 * haber sido justamente la que fijó el precio vigente.
 */
export async function recalcularCostoUnitario(insumoId: string) {
  const snap = await getDocs(query(collection(db, 'compras'), where('insumoId', '==', insumoId)));
  const compras = snap.docs
    .map((d) => d.data() as { fecha: string; costo: number; cantidad?: number })
    .filter((c) => (c.cantidad ?? 0) > 0)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const masReciente = compras[0];
  await updateDoc(doc(db, 'insumos', insumoId), {
    costoUnitario: masReciente ? masReciente.costo / (masReciente.cantidad ?? 1) : 0,
  });
}

/** Solo deja borrar un insumo si no tiene movimientos, para no dejar historial huérfano. */
export async function borrarInsumo(id: string) {
  const movimientos = await getDocs(query(collection(db, 'movimientos'), where('insumoId', '==', id)));
  if (!movimientos.empty) {
    throw new Error('NO_SE_PUEDE_BORRAR_TIENE_MOVIMIENTOS');
  }
  await deleteDoc(doc(db, 'insumos', id));
}

export async function actualizarInsumo(id: string, nombre: string, unidad: string) {
  await updateDoc(doc(db, 'insumos', id), {
    nombre: nombre.trim(),
    unidad: unidad.trim(),
  });
}
