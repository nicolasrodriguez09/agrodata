import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Novedad } from '../types/models';
import { escribir } from './escrituraOffline';

/** Categorías fijas para poder contar y filtrar después; "Otra" deja escapar lo que no encaje. */
export const CATEGORIAS_NOVEDAD = ['Clima', 'Riego', 'Plaga o enfermedad', 'Mano de obra', 'Equipos', 'Otra'] as const;

export function escucharNovedadesDeCiclo(cicloId: string, callback: (novedades: Novedad[]) => void) {
  const q = query(collection(db, 'novedades'), where('cicloId', '==', cicloId));
  return onSnapshot(q, (snap) => {
    const novedades = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Novedad, 'id'>) }));
    novedades.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(novedades);
  });
}

/** Todas las novedades, para la búsqueda global del Panel y el reporte por período. */
export function escucharTodasLasNovedades(callback: (novedades: Novedad[]) => void) {
  return onSnapshot(collection(db, 'novedades'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Novedad, 'id'>) })));
  });
}

export interface DatosNovedad {
  loteId: string;
  cicloId: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  resuelta: boolean;
  creadoPor: string;
}

export function crearNovedad(data: DatosNovedad) {
  const ref = doc(collection(db, 'novedades'));
  escribir(
    setDoc(ref, {
      loteId: data.loteId,
      cicloId: data.cicloId,
      fecha: data.fecha,
      categoria: data.categoria,
      descripcion: data.descripcion.trim(),
      resuelta: data.resuelta,
      // Queda constancia de cuándo se anotó, aparte de cuándo pasó.
      creadoEn: Date.now(),
      creadoPor: data.creadoPor,
    }),
  );
  return ref.id;
}

export function actualizarNovedad(id: string, data: Omit<DatosNovedad, 'loteId' | 'cicloId' | 'creadoPor'>) {
  escribir(
    updateDoc(doc(db, 'novedades', id), {
      fecha: data.fecha,
      categoria: data.categoria,
      descripcion: data.descripcion.trim(),
      resuelta: data.resuelta,
    }),
  );
}

export function borrarNovedad(id: string) {
  escribir(deleteDoc(doc(db, 'novedades', id)));
}
