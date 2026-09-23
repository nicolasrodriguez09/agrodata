import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Cosecha } from '../types/models';
import { escribir } from './escrituraOffline';

export function escucharCosechasDeCiclo(cicloId: string, callback: (cosechas: Cosecha[]) => void) {
  const q = query(collection(db, 'cosechas'), where('cicloId', '==', cicloId));
  return onSnapshot(q, (snap) => {
    const cosechas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Cosecha, 'id'>) }));
    cosechas.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(cosechas);
  });
}

/** Todas las cosechas de todos los lotes, para la búsqueda global del Panel (HU-7.3). */
export function escucharTodasLasCosechas(callback: (cosechas: Cosecha[]) => void) {
  return onSnapshot(collection(db, 'cosechas'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Cosecha, 'id'>) })));
  });
}

export interface DatosCosecha {
  loteId: string;
  cicloId: string;
  fecha: string;
  cantidad: string;
  cantidadNum?: number;
  unidad?: string;
  calidad?: string;
  creadoPor: string;
}

/** Devuelve el id generado localmente, para poder enlazarla con su venta. */
export function crearCosecha(data: DatosCosecha): string {
  const ref = doc(collection(db, 'cosechas'));
  escribir(
    setDoc(ref, {
      loteId: data.loteId,
      cicloId: data.cicloId,
      fecha: data.fecha,
      cantidad: data.cantidad.trim(),
      cantidadNum: data.cantidadNum ?? null,
      unidad: data.unidad ?? null,
      calidad: data.calidad || null,
      creadoPor: data.creadoPor,
    }),
  );
  return ref.id;
}

export async function actualizarCosecha(
  id: string,
  data: Pick<DatosCosecha, 'fecha' | 'cantidad' | 'cantidadNum' | 'unidad' | 'calidad'>,
) {
  escribir(updateDoc(doc(db, 'cosechas', id), {
    fecha: data.fecha,
    cantidad: data.cantidad.trim(),
    cantidadNum: data.cantidadNum ?? null,
    unidad: data.unidad ?? null,
    calidad: data.calidad || null,
  }));
}

export async function borrarCosecha(id: string) {
  escribir(deleteDoc(doc(db, 'cosechas', id)));
}
