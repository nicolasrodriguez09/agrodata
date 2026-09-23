import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Venta } from '../types/models';
import { escribir } from './escrituraOffline';

export function escucharVentasDeCiclo(cicloId: string, callback: (ventas: Venta[]) => void) {
  const q = query(collection(db, 'ventas'), where('cicloId', '==', cicloId));
  return onSnapshot(q, (snap) => {
    const ventas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Venta, 'id'>) }));
    ventas.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(ventas);
  });
}

/** Todas las ventas de todos los lotes, para el panel de Finanzas (HU-7.1). */
export function escucharTodasLasVentas(callback: (ventas: Venta[]) => void) {
  return onSnapshot(collection(db, 'ventas'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Venta, 'id'>) })));
  });
}

export interface DatosVenta {
  loteId: string;
  cicloId: string;
  fecha: string;
  cantidad: string;
  precio: number;
  /** Desglose opcional; ver el comentario en types/models.ts. */
  cantidadNum?: number;
  unidad?: string;
  precioUnitario?: number;
  comprador?: string;
  cobrado: boolean;
  cosechaId?: string;
  creadoPor: string;
}

/** Devuelve el id generado localmente, para poder enlazar la cosecha con su venta. */
export function crearVenta(data: DatosVenta): string {
  const ref = doc(collection(db, 'ventas'));
  escribir(
    setDoc(ref, {
      loteId: data.loteId,
      cicloId: data.cicloId,
      fecha: data.fecha,
      cantidad: data.cantidad.trim(),
      precio: data.precio,
      cantidadNum: data.cantidadNum ?? null,
      unidad: data.unidad ?? null,
      precioUnitario: data.precioUnitario ?? null,
      comprador: data.comprador?.trim() || null,
      cobrado: data.cobrado,
      cosechaId: data.cosechaId ?? null,
      creadoPor: data.creadoPor,
    }),
  );
  return ref.id;
}

export async function actualizarVenta(
  id: string,
  data: Pick<DatosVenta, 'fecha' | 'cantidad' | 'precio' | 'cantidadNum' | 'unidad' | 'precioUnitario' | 'comprador' | 'cobrado'>,
) {
  escribir(updateDoc(doc(db, 'ventas', id), {
    fecha: data.fecha,
    cantidad: data.cantidad.trim(),
    precio: data.precio,
    cantidadNum: data.cantidadNum ?? null,
    unidad: data.unidad ?? null,
    precioUnitario: data.precioUnitario ?? null,
    comprador: data.comprador?.trim() || null,
    cobrado: data.cobrado,
  }));
}

export async function borrarVenta(id: string) {
  escribir(deleteDoc(doc(db, 'ventas', id)));
}
