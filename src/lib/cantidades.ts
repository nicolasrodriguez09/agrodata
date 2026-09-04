/**
 * Muestra una cantidad de inventario sin la basura de la coma flotante.
 *
 * El stock se mueve con increment() de Firestore, que hace aritmética de punto
 * flotante: comprar 5 y devolverlos deja 0.7999999999999998 en vez de 0.8. El
 * número guardado está bien (la diferencia es de 1e-16), lo que no se puede es
 * mostrarlo así. Redondea a 2 decimales y quita los ceros de relleno.
 */
export function formatoCantidad(n: number): string {
  const redondeado = Math.round(n * 100) / 100;
  return redondeado.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}
