import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import type { Jornal } from '../types/models';

export function escucharJornales(callback: (jornales: Jornal[]) => void) {
  const q = query(collection(db, 'jornales'));
  return onSnapshot(q, (snap) => {
    const jornales = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Jornal, 'id'>) }));
    jornales.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(jornales);
  });
}

export interface DatosJornal {
  loteId?: string;
  trabajador: string;
  quienPago: string;
  labor?: string;
  fecha: string;
  unidad: 'dia' | 'hora';
  cantidad: number;
  tarifa: number;
  pagado: boolean;
  creadoPor: string;
}

export async function crearJornal(data: DatosJornal) {
  await addDoc(collection(db, 'jornales'), {
    loteId: data.loteId || null,
    trabajador: data.trabajador.trim(),
    quienPago: data.quienPago.trim(),
    labor: data.labor?.trim() || null,
    fecha: data.fecha,
    unidad: data.unidad,
    cantidad: data.cantidad,
    tarifa: data.tarifa,
    valor: data.cantidad * data.tarifa,
    pagado: data.pagado,
    creadoPor: data.creadoPor,
  });
}

export async function actualizarJornal(
  id: string,
  data: Omit<DatosJornal, 'creadoPor'>,
) {
  await updateDoc(doc(db, 'jornales', id), {
    loteId: data.loteId || null,
    trabajador: data.trabajador.trim(),
    quienPago: data.quienPago.trim(),
    labor: data.labor?.trim() || null,
    fecha: data.fecha,
    unidad: data.unidad,
    cantidad: data.cantidad,
    tarifa: data.tarifa,
    valor: data.cantidad * data.tarifa,
    pagado: data.pagado,
  });
}

export async function borrarJornal(id: string) {
  await deleteDoc(doc(db, 'jornales', id));
}
