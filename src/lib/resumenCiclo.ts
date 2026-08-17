import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ResumenCiclo {
  aplicaciones: number;
  cosechas: number;
  totalVendido: number;
}

async function contar(coleccion: string, cicloId: string) {
  const snap = await getDocs(query(collection(db, coleccion), where('cicloId', '==', cicloId)));
  return snap.docs;
}

/**
 * Trae los totales reales de un ciclo. No incluye compras de insumos ni
 * jornales: ninguno de los dos está atado a un lote/ciclo (ver CompraInsumo
 * y Jornal en types/models.ts), así que viven aparte en Finanzas.
 */
export async function cargarResumenCiclo(cicloId: string): Promise<ResumenCiclo> {
  const [aplicaciones, cosechas, ventas] = await Promise.all([
    contar('aplicaciones', cicloId),
    contar('cosechas', cicloId),
    contar('ventas', cicloId),
  ]);

  const totalVendido = ventas.reduce((s, d) => s + (Number(d.data().precio) || 0), 0);

  return {
    aplicaciones: aplicaciones.length,
    cosechas: cosechas.length,
    totalVendido,
  };
}
