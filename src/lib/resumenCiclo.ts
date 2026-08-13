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
 * Trae los totales reales de un ciclo. Hoy, con los módulos de Aplicaciones,
 * Cosecha/Venta, Compras y Jornales todavía sin construir, estas colecciones
 * están vacías y todo da 0 — apenas existan esos registros, esto se llena solo.
 */
export async function cargarResumenCiclo(cicloId: string): Promise<ResumenCiclo> {
  const [aplicaciones, cosechas, compras, jornales, ventas] = await Promise.all([
    contar('aplicaciones', cicloId),
    contar('cosechas', cicloId),
    contar('compras', cicloId),
    contar('jornales', cicloId),
    contar('ventas', cicloId),
  ]);

  const totalCompras = compras.reduce((s, d) => s + (Number(d.data().costo) || 0), 0);
  const totalJornales = jornales.reduce((s, d) => s + (Number(d.data().valor) || 0), 0);
  const totalVendido = ventas.reduce((s, d) => s + (Number(d.data().precio) || 0), 0);
  const totalGastado = totalCompras + totalJornales;

  return {
    aplicaciones: aplicaciones.length,
    cosechas: cosechas.length,
    totalGastado,
    totalVendido,
    balance: totalVendido - totalGastado,
  };
}
