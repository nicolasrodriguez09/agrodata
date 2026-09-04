import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { registrarEntrada, ajustarStock, recalcularCostoUnitario } from './insumos';
import type { CompraInsumo } from '../types/models';

export function escucharCompras(callback: (compras: CompraInsumo[]) => void) {
  const q = query(collection(db, 'compras'));
  return onSnapshot(q, (snap) => {
    const compras = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CompraInsumo, 'id'>) }));
    compras.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(compras);
  });
}

export interface DatosCompra {
  insumoId: string;
  producto: string;
  cantidad: number;
  costo: number;
  fecha: string;
  proveedor?: string;
  personaQueCompro: string;
  creadoPor: string;
}

export async function crearCompra(data: DatosCompra): Promise<string> {
  const ref = await addDoc(collection(db, 'compras'), {
    insumoId: data.insumoId,
    producto: data.producto.trim(),
    cantidad: data.cantidad,
    costo: data.costo,
    fecha: data.fecha,
    proveedor: data.proveedor?.trim() || null,
    personaQueCompro: data.personaQueCompro.trim(),
    fotoFacturaUrl: null,
    creadoPor: data.creadoPor,
  });
  await registrarEntrada({
    insumoId: data.insumoId,
    cantidad: data.cantidad,
    costoUnitario: data.costo / data.cantidad,
    compraId: ref.id,
    fecha: data.fecha,
    creadoPor: data.creadoPor,
  });
  return ref.id;
}

/**
 * Edita una compra y deja el inventario coherente: ajusta el stock por la diferencia de cantidad
 * (dejando su movimiento de ajuste) y vuelve a fijar el costo unitario del insumo según la compra
 * más reciente que quede.
 */
export async function actualizarCompra(
  compraExistente: CompraInsumo,
  data: Pick<DatosCompra, 'producto' | 'cantidad' | 'costo' | 'fecha' | 'proveedor' | 'personaQueCompro'>,
) {
  await updateDoc(doc(db, 'compras', compraExistente.id), {
    producto: data.producto.trim(),
    cantidad: data.cantidad,
    costo: data.costo,
    fecha: data.fecha,
    proveedor: data.proveedor?.trim() || null,
    personaQueCompro: data.personaQueCompro.trim(),
  });

  if (!compraExistente.insumoId) return; // compras viejas, de antes del inventario

  const delta = data.cantidad - (compraExistente.cantidad ?? 0);
  await ajustarStock({
    insumoId: compraExistente.insumoId,
    delta,
    costoUnitario: data.costo / data.cantidad,
    origenId: compraExistente.id,
    fecha: data.fecha,
    creadoPor: compraExistente.creadoPor,
  });
  await recalcularCostoUnitario(compraExistente.insumoId);
}

/** Borra la compra y le devuelve al inventario el stock que había cargado. */
export async function borrarCompra(compra: CompraInsumo) {
  if (compra.insumoId && (compra.cantidad ?? 0) > 0) {
    await ajustarStock({
      insumoId: compra.insumoId,
      delta: -(compra.cantidad ?? 0),
      costoUnitario: compra.costo / (compra.cantidad ?? 1),
      origenId: compra.id,
      fecha: compra.fecha,
      creadoPor: compra.creadoPor,
    });
  }
  await deleteDoc(doc(db, 'compras', compra.id));
  if (compra.insumoId) await recalcularCostoUnitario(compra.insumoId);
}
