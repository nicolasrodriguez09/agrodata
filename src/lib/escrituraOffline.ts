/**
 * Lanza una escritura de Firestore sin esperar la confirmación del servidor.
 *
 * Firestore resuelve la promesa de addDoc/setDoc/updateDoc/deleteDoc SOLO
 * cuando el servidor confirma. Sin señal esa promesa no se resuelve nunca, así
 * que un `await` deja la pantalla congelada para siempre — aunque el dato YA
 * quedó guardado en el teléfono y va a subir solo apenas vuelva el internet.
 *
 * Eso fue justo lo que pasó probando en un iPhone en modo avión: la compra se
 * guardaba bien, pero el botón se quedaba en "Guardando..." y el formulario no
 * cerraba nunca.
 *
 * Por eso acá no se espera. El error se atrapa para que un fallo de verdad
 * (por ejemplo, permisos) no quede como promesa sin manejar y tumbe la app.
 */
export function escribir(promesa: Promise<unknown>): void {
  promesa.catch((err) => {
    console.error('[agrodata] una escritura no se pudo confirmar:', err);
  });
}
