import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ResumenCiclo {
  aplicaciones: number;
  cosechas: number;
  riegos: number;
  totalGastado: number;
  totalVendido: number;
  balance: number;
}

async function contar(coleccion: string, cicloId: string) {
  const snap = await getDocs(query(collection(db, coleccion), where('cicloId', '==', cicloId)));
  return snap.docs;
}

/**
 * Trae los totales reales de un ciclo. "Gastado" sale de costoEstimado en
 * cada aplicación (cantidad × costo del insumo en ese momento, ver
 * lib/insumos.ts) — los jornales siguen sin estar atados a un lote/ciclo,
 * así que no entran acá, viven aparte en Finanzas.
 */
export async function cargarResumenCiclo(cicloId: string): Promise<ResumenCiclo> {
  const [aplicaciones, cosechas, riegos, ventas] = await Promise.all([
    contar('aplicaciones', cicloId),
    contar('cosechas', cicloId),
    contar('riegos', cicloId),
    contar('ventas', cicloId),
  ]);

  const totalGastado = aplicaciones.reduce((s, d) => s + (Number(d.data().costoEstimado) || 0), 0);
  const totalVendido = ventas.reduce((s, d) => s + (Number(d.data().precio) || 0), 0);

  return {
    aplicaciones: aplicaciones.length,
    cosechas: cosechas.length,
    riegos: riegos.length,
    totalGastado,
    totalVendido,
    balance: totalVendido - totalGastado,
  };
}
