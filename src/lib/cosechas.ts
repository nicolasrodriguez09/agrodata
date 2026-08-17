import { collection, addDoc, updateDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Cosecha } from '../types/models';

export function escucharCosechasDeCiclo(cicloId: string, callback: (cosechas: Cosecha[]) => void) {
  const q = query(collection(db, 'cosechas'), where('cicloId', '==', cicloId));
  return onSnapshot(q, (snap) => {
    const cosechas = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Cosecha, 'id'>) }));
    cosechas.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(cosechas);
  });
}

export interface DatosCosecha {
  loteId: string;
  cicloId: string;
  fecha: string;
  cantidad: string;
  calidad?: string;
  creadoPor: string;
}

export async function crearCosecha(data: DatosCosecha) {
  await addDoc(collection(db, 'cosechas'), {
    loteId: data.loteId,
    cicloId: data.cicloId,
    fecha: data.fecha,
    cantidad: data.cantidad.trim(),
    calidad: data.calidad || null,
    creadoPor: data.creadoPor,
  });
}

export async function actualizarCosecha(
  id: string,
  data: Pick<DatosCosecha, 'fecha' | 'cantidad' | 'calidad'>,
) {
  await updateDoc(doc(db, 'cosechas', id), {
    fecha: data.fecha,
    cantidad: data.cantidad.trim(),
    calidad: data.calidad || null,
  });
}
