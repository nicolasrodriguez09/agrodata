import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Aplicacion } from '../types/models';

export function escucharAplicacionesDeCiclo(cicloId: string, callback: (aplicaciones: Aplicacion[]) => void) {
  // Ordenamos en el cliente (como en ciclos.ts) para no depender de un índice compuesto.
  const q = query(collection(db, 'aplicaciones'), where('cicloId', '==', cicloId));
  return onSnapshot(q, (snap) => {
    const aplicaciones = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Aplicacion, 'id'>) }));
    aplicaciones.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(aplicaciones);
  });
}

export interface DatosAplicacion {
  loteId: string;
  cicloId: string;
  producto: string;
  dosis?: string;
  cantidad: string;
  fecha: string;
  responsable: string;
  creadoPor: string;
}

export async function crearAplicacion(data: DatosAplicacion) {
  await addDoc(collection(db, 'aplicaciones'), {
    loteId: data.loteId,
    cicloId: data.cicloId,
    producto: data.producto.trim(),
    dosis: data.dosis?.trim() || null,
    cantidad: data.cantidad.trim(),
    fecha: data.fecha,
    responsable: data.responsable.trim(),
    creadoPor: data.creadoPor,
  });
}
