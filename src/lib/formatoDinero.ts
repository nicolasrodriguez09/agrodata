/** $ 1.234.500 — para cifras que se leen exactas (tarjetas, tablas, tooltips). */
export function pesos(n: number): string {
  return `$ ${Math.round(n).toLocaleString('es-CO')}`;
}

/**
 * $ 1,2 M — para ejes de gráficas, donde el número completo no cabe y además
 * compite con los datos. La precisión exacta vive en el tooltip y en la tabla.
 */
export function pesosCorto(n: number): string {
  const abs = Math.abs(n);
  const signo = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const millones = abs / 1_000_000;
    const texto = millones >= 10 ? Math.round(millones).toString() : millones.toFixed(1).replace('.', ',');
    return `${signo}$ ${texto} M`;
  }
  if (abs >= 1000) return `${signo}$ ${Math.round(abs / 1000)} mil`;
  return `${signo}$ ${Math.round(abs)}`;
}

/**
 * Escoge marcas de eje en números redondos (0 / 5 M / 10 M) en vez de repartir
 * el máximo en partes iguales, que da cifras como "$ 8.371.933" imposibles de leer.
 */
export function marcasDeEje(maximo: number, cuantas = 4): number[] {
  if (maximo <= 0) return [0];
  const bruto = maximo / cuantas;
  const magnitud = Math.pow(10, Math.floor(Math.log10(bruto)));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * magnitud).find((p) => p >= bruto) ?? magnitud * 10;
  const marcas: number[] = [];
  for (let v = 0; v <= maximo + paso * 0.001; v += paso) marcas.push(v);
  return marcas;
}
