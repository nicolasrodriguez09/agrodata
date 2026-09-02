import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { registrarEntrada } from './insumos';
import type { CompraInsumo } from '../types/models';

export function escucharCompras(callback: (compras: CompraInsumo[]) => void) {
  const q = query(collection(db, 'compras'));
  return onSnapshot(q, (snap) => {
    const compras = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CompraInsumo, 'id'>) }));
    compras.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(compras);
  });
}

export interface DatosCompra {
  insumoId: string;
  producto: string;
  cantidad: number;
  costo: number;
  fecha: string;
  proveedor?: string;
  personaQueCompro: string;
  creadoPor: string;
}

export async function crearCompra(data: DatosCompra): Promise<string> {
  const ref = await addDoc(collection(db, 'compras'), {
    insumoId: data.insumoId,
    producto: data.producto.trim(),
    cantidad: data.cantidad,
    costo: data.costo,
    fecha: data.fecha,
    proveedor: data.proveedor?.trim() || null,
    personaQueCompro: data.personaQueCompro.trim(),
    fotoFacturaUrl: null,
    creadoPor: data.creadoPor,
  });
  await registrarEntrada({
    insumoId: data.insumoId,
    cantidad: data.cantidad,
    costoUnitario: data.costo / data.cantidad,
    compraId: ref.id,
    fecha: data.fecha,
    creadoPor: data.creadoPor,
  });
  return ref.id;
}
