import { collection, setDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { registrarSalida, revertirSalida, verificarStock } from './insumos';
import type { Aplicacion } from '../types/models';
import { escribir } from './escrituraOffline';

export function formatoCantidadAplicacion(a: Aplicacion) {
  if (typeof a.cantidad === 'number') return `${a.cantidad}${a.unidad ? ` ${a.unidad}` : ''}`;
  return a.cantidad;
}

export function escucharAplicacionesDeCiclo(cicloId: string, callback: (aplicaciones: Aplicacion[]) => void) {
  // Ordenamos en el cliente (como en ciclos.ts) para no depender de un índice compuesto.
  const q = query(collection(db, 'aplicaciones'), where('cicloId', '==', cicloId));
  return onSnapshot(q, (snap) => {
    const aplicaciones = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Aplicacion, 'id'>) }));
    aplicaciones.sort((a, b) => b.fecha.localeCompare(a.fecha));
    callback(aplicaciones);
  });
}

/** Todas las aplicaciones de todos los lotes, para calcular rentabilidad en Finanzas (HU-7.2). */
export function escucharTodasLasAplicaciones(callback: (aplicaciones: Aplicacion[]) => void) {
  return onSnapshot(collection(db, 'aplicaciones'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Aplicacion, 'id'>) })));
  });
}

/** Fecha (YYYY-MM-DD) de la aplicación más reciente de cada lote, para el color en "Mis fincas". */
export function escucharUltimaAplicacionPorLote(callback: (porLote: Map<string, string>) => void) {
  return onSnapshot(collection(db, 'aplicaciones'), (snap) => {
    const porLote = new Map<string, string>();
    snap.docs.forEach((d) => {
      const { loteId, fecha } = d.data() as Aplicacion;
      const actual = porLote.get(loteId);
      if (!actual || fecha > actual) porLote.set(loteId, fecha);
    });
    callback(porLote);
  });
}

export interface DatosAplicacion {
  loteId: string;
  cicloId: string;
  insumoId: string;
  producto: string;
  dosis?: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number; // costoUnitario vigente del insumo, ya cargado en el formulario
  fecha: string;
  responsable: string;
  creadoPor: string;
}

export async function crearAplicacion(data: DatosAplicacion) {
  // La comprobación va PRIMERO, antes de escribir la aplicación: si se escribe
  // y después falla el descuento, queda una aplicación huérfana que el libro de
  // inventario nunca va a poder cuadrar.
  await verificarStock(data.insumoId, data.cantidad);

  const costoEstimado = data.cantidad * data.costoUnitario;
  // ID generado en el teléfono: registrarSalida lo necesita y no puede esperar
  // la confirmación del servidor, que sin señal no llega nunca.
  const ref = doc(collection(db, 'aplicaciones'));
  escribir(setDoc(ref, {
    loteId: data.loteId,
    cicloId: data.cicloId,
    insumoId: data.insumoId,
    producto: data.producto.trim(),
    dosis: data.dosis?.trim() || null,
    cantidad: data.cantidad,
    unidad: data.unidad,
    costoEstimado,
    fecha: data.fecha,
    responsable: data.responsable.trim(),
    creadoPor: data.creadoPor,
  }));
  registrarSalida({
    insumoId: data.insumoId,
    cantidad: data.cantidad,
    costoUnitario: data.costoUnitario,
    aplicacionId: ref.id,
    loteId: data.loteId,
    fecha: data.fecha,
    creadoPor: data.creadoPor,
  });
}

export async function actualizarAplicacion(
  aplicacionExistente: Aplicacion,
  data: Pick<DatosAplicacion, 'insumoId' | 'producto' | 'dosis' | 'cantidad' | 'unidad' | 'costoUnitario' | 'fecha' | 'responsable'>,
) {
  // Igual que al crear: comprobar antes de tocar nada. Si es el mismo insumo,
  // lo que esta aplicación ya tenía descontado cuenta como disponible.
  const cantidadPrevia = typeof aplicacionExistente.cantidad === 'number' ? aplicacionExistente.cantidad : 0;
  await verificarStock(
    data.insumoId,
    data.cantidad,
    aplicacionExistente.insumoId === data.insumoId ? cantidadPrevia : 0,
  );

  const costoEstimado = data.cantidad * data.costoUnitario;
  escribir(updateDoc(doc(db, 'aplicaciones', aplicacionExistente.id), {
    insumoId: data.insumoId,
    producto: data.producto.trim(),
    dosis: data.dosis?.trim() || null,
    cantidad: data.cantidad,
    unidad: data.unidad,
    costoEstimado,
    fecha: data.fecha,
    responsable: data.responsable.trim(),
  }));

  // Si cambió el insumo o la cantidad aplicada, hay que ajustar el stock:
  // devolver lo que se había descontado antes y descontar lo nuevo.
  const insumoIdViejo = aplicacionExistente.insumoId;
  const cantidadVieja = typeof aplicacionExistente.cantidad === 'number' ? aplicacionExistente.cantidad : 0;
  const cambioAlgo = insumoIdViejo !== data.insumoId || cantidadVieja !== data.cantidad;
  if (!cambioAlgo) return;

  if (insumoIdViejo) {
    await revertirSalida({
      insumoId: insumoIdViejo,
      cantidad: cantidadVieja,
      costoUnitario: data.costoUnitario,
      aplicacionId: aplicacionExistente.id,
      fecha: data.fecha,
      creadoPor: aplicacionExistente.creadoPor,
    });
  }
  registrarSalida({
    insumoId: data.insumoId,
    cantidad: data.cantidad,
    costoUnitario: data.costoUnitario,
    aplicacionId: aplicacionExistente.id,
    loteId: aplicacionExistente.loteId,
    fecha: data.fecha,
    creadoPor: aplicacionExistente.creadoPor,
  });
}

/** Borra la aplicación y le devuelve al inventario el insumo que había descontado. */
export async function borrarAplicacion(aplicacion: Aplicacion) {
  const cantidad = typeof aplicacion.cantidad === 'number' ? aplicacion.cantidad : 0;
  if (aplicacion.insumoId && cantidad > 0) {
    await revertirSalida({
      insumoId: aplicacion.insumoId,
      cantidad,
      costoUnitario: cantidad > 0 ? (aplicacion.costoEstimado ?? 0) / cantidad : 0,
      aplicacionId: aplicacion.id,
      fecha: aplicacion.fecha,
      creadoPor: aplicacion.creadoPor,
    });
  }
  escribir(deleteDoc(doc(db, 'aplicaciones', aplicacion.id)));
}
