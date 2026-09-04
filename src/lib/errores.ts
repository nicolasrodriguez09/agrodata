/**
 * Error cuyo mensaje ya está escrito para mostrárselo al usuario tal cual.
 *
 * Sirve para distinguir "esto no se puede hacer y acá está el motivo" de una
 * falla técnica (sin red, permisos, etc.), que no tiene sentido mostrar cruda.
 */
export class ErrorDeNegocio extends Error {}

/** Devuelve el mensaje del error si es explicable, o el genérico si no. */
export function mensajeParaUsuario(err: unknown, porDefecto: string): string {
  return err instanceof ErrorDeNegocio ? err.message : porDefecto;
}
