import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import type { Lote } from '../types/models';

const coleccion = collection(db, 'lotes');

export interface DatosLote {
  nombre: string;
  fincaId: string | null;
  cultivo: string;
  areaHectareas?: number;
  cantidadArboles?: number;
}

export function escucharLotes(callback: (lotes: Lote[]) => void) {
  const q = query(coleccion, orderBy('nombre'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lote, 'id'>) })));
  });
}

export function escucharLote(id: string, callback: (lote: Lote | null) => void) {
  return onSnapshot(doc(db, 'lotes', id), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Lote, 'id'>) }) : null);
  });
}

export async function obtenerLote(id: string): Promise<Lote | null> {
  const snap = await getDoc(doc(db, 'lotes', id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Lote, 'id'>) }) : null;
}

function limpiar(data: DatosLote) {
  return {
    nombre: data.nombre.trim(),
    fincaId: data.fincaId,
    cultivo: data.cultivo.trim(),
    areaHectareas: data.areaHectareas ?? null,
    cantidadArboles: data.cantidadArboles ?? null,
  };
}

export async function crearLote(data: DatosLote) {
  await addDoc(coleccion, { ...limpiar(data), cicloActivoId: null });
}

export async function actualizarLote(id: string, data: DatosLote) {
  await updateDoc(doc(db, 'lotes', id), limpiar(data));
}

export async function borrarLote(id: string) {
  await deleteDoc(doc(db, 'lotes', id));
}
