import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Finca } from '../types/models';
import { escribir } from './escrituraOffline';

const coleccion = collection(db, 'fincas');

export function escucharFincas(callback: (fincas: Finca[]) => void) {
  const q = query(coleccion, orderBy('nombre'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Finca, 'id'>) })));
  });
}

export async function crearFinca(data: { nombre: string; ubicacion?: string }) {
  escribir(addDoc(coleccion, {
    nombre: data.nombre.trim(),
    ubicacion: data.ubicacion?.trim() || '',
  }));
}

export async function actualizarFinca(id: string, data: { nombre: string; ubicacion?: string }) {
  escribir(updateDoc(doc(db, 'fincas', id), {
    nombre: data.nombre.trim(),
    ubicacion: data.ubicacion?.trim() || '',
  }));
}

/** Lanza un error si la finca todavía tiene lotes asociados. */
export async function borrarFinca(id: string) {
  const lotesDeLaFinca = await getDocs(query(collection(db, 'lotes'), where('fincaId', '==', id)));
  if (!lotesDeLaFinca.empty) {
    throw new Error('NO_SE_PUEDE_BORRAR_TIENE_LOTES');
  }
  escribir(deleteDoc(doc(db, 'fincas', id)));
}
