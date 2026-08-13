import { collection, onSnapshot, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Ciclo } from '../types/models';

const coleccion = collection(db, 'ciclos');

export function escucharCiclosDeLote(loteId: string, callback: (ciclos: Ciclo[]) => void) {
  // Ordenamos en el cliente (no con orderBy en la consulta) para no depender
  // de crear un índice compuesto en Firestore por un simple listado chico.
  const q = query(coleccion, where('loteId', '==', loteId));
  return onSnapshot(q, (snap) => {
    const ciclos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ciclo, 'id'>) }));
    ciclos.sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
    callback(ciclos);
  });
}

/** Crea un ciclo abierto y lo deja como el ciclo activo del lote. */
export async function abrirCiclo(loteId: string, data: { nombre: string; fechaInicio: string }) {
  const nuevo = await addDoc(coleccion, {
    loteId,
    nombre: data.nombre.trim(),
    fechaInicio: data.fechaInicio,
    fechaCierre: null,
    estado: 'abierto' as const,
  });
  await updateDoc(doc(db, 'lotes', loteId), { cicloActivoId: nuevo.id });
  return nuevo.id;
}

/** Cierra el ciclo activo del lote (hoy como fecha de cierre) y libera al lote para abrir uno nuevo. */
export async function cerrarCiclo(loteId: string, cicloId: string) {
  await updateDoc(doc(db, 'ciclos', cicloId), {
    estado: 'cerrado' as const,
    fechaCierre: new Date().toISOString().slice(0, 10),
  });
  await updateDoc(doc(db, 'lotes', loteId), { cicloActivoId: null });
}
