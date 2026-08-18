import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
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
