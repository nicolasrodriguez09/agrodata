/**
 * Fecha de hoy en 'YYYY-MM-DD' según el reloj del teléfono.
 *
 * OJO: no usar new Date().toISOString(), que da la fecha en UTC. En Colombia
 * (UTC-5) todo lo que se registre después de las 7 de la noche saldría fechado
 * al día siguiente, y un registro mal fechado se le carga al ciclo o al período
 * equivocado — justo lo que rompe los cálculos de rentabilidad.
 */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Las fechas se guardan como 'YYYY-MM-DD'. Se parsean a mano porque
 * new Date('2026-03-12') se interpreta como medianoche UTC y en Colombia
 * (UTC-5) eso muestra el día anterior.
 */
function partes(iso: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** '2026-03-12' → '12 mar 2026'. Para listas y filas, donde el espacio es corto. */
export function formatoFecha(iso: string): string {
  const p = partes(iso);
  if (!p) return iso ?? '';
  const [anio, mes, dia] = p;
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

/** '2026-03-12' → '12 de marzo de 2026'. Para encabezados y reportes. */
export function formatoFechaLarga(iso: string): string {
  const p = partes(iso);
  if (!p) return iso ?? '';
  const [anio, mes, dia] = p;
  return `${dia} de ${MESES_LARGOS[mes - 1]} de ${anio}`;
}

/** '2026-03-12' → '12 mar' cuando el año es el actual, si no '12 mar 2026'. */
export function formatoFechaCorta(iso: string): string {
  const p = partes(iso);
  if (!p) return iso ?? '';
  const [anio, mes, dia] = p;
  const esteAnio = new Date().getFullYear();
  return anio === esteAnio ? `${dia} ${MESES[mes - 1]}` : `${dia} ${MESES[mes - 1]} ${anio}`;
}
