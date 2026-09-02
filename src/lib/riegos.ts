import { collection, addDoc, updateDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Riego } from '../types/models';

export function escucharRiegosDeCiclo(cicloId: string, callback: (riegos: Riego[]) => void) {
  const q = query(collection(db, 'riegos'), where('cicloId', '==', cicloId));
  return onSnapshot(q, (snap) => {
    const riegos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Riego, 'id'>) }));
    riegos.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(riegos);
  });
}

/** Todos los riegos de todos los lotes, para la búsqueda global del Panel (HU-7.3). */
export function escucharTodosLosRiegos(callback: (riegos: Riego[]) => void) {
  return onSnapshot(collection(db, 'riegos'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Riego, 'id'>) })));
  });
}

export interface DatosRiego {
  loteId: string;
  cicloId: string;
  fecha: string;
  duracion?: string;
  metodo?: string;
  responsable: string;
  creadoPor: string;
}

export async function crearRiego(data: DatosRiego) {
  await addDoc(collection(db, 'riegos'), {
    loteId: data.loteId,
    cicloId: data.cicloId,
    fecha: data.fecha,
    duracion: data.duracion?.trim() || null,
    metodo: data.metodo?.trim() || null,
    responsable: data.responsable.trim(),
    creadoPor: data.creadoPor,
  });
}

export async function actualizarRiego(
  id: string,
  data: Pick<DatosRiego, 'fecha' | 'duracion' | 'metodo' | 'responsable'>,
) {
  await updateDoc(doc(db, 'riegos', id), {
    fecha: data.fecha,
    duracion: data.duracion?.trim() || null,
    metodo: data.metodo?.trim() || null,
    responsable: data.responsable.trim(),
  });
}
