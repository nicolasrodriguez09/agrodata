import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ResumenCiclo {
  aplicaciones: number;
  cosechas: number;
  totalGastado: number;
  totalVendido: number;
  balance: number;
}

async function contar(coleccion: string, cicloId: string) {
  const snap = await getDocs(query(collection(db, coleccion), where('cicloId', '==', cicloId)));
  return snap.docs;
}

/**
 * Trae los totales reales de un ciclo. "Total gastado" es solo compras de
 * insumos — los jornales no están atados a un lote/ciclo (ver Jornal en
 * types/models.ts), así que viven aparte en Finanzas, no acá.
 */
export async function cargarResumenCiclo(cicloId: string): Promise<ResumenCiclo> {
  const [aplicaciones, cosechas, compras, ventas] = await Promise.all([
    contar('aplicaciones', cicloId),
    contar('cosechas', cicloId),
    contar('compras', cicloId),
    contar('ventas', cicloId),
  ]);

  const totalGastado = compras.reduce((s, d) => s + (Number(d.data().costo) || 0), 0);
  const totalVendido = ventas.reduce((s, d) => s + (Number(d.data().precio) || 0), 0);

  return {
    aplicaciones: aplicaciones.length,
    cosechas: cosechas.length,
    totalGastado,
    totalVendido,
    balance: totalVendido - totalGastado,
  };
}
