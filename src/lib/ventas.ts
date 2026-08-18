import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Venta } from '../types/models';

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
  comprador?: string;
  cobrado: boolean;
  creadoPor: string;
}

export async function crearVenta(data: DatosVenta) {
  await addDoc(collection(db, 'ventas'), {
    loteId: data.loteId,
    cicloId: data.cicloId,
    fecha: data.fecha,
    cantidad: data.cantidad.trim(),
    precio: data.precio,
    comprador: data.comprador?.trim() || null,
    cobrado: data.cobrado,
    creadoPor: data.creadoPor,
  });
}
