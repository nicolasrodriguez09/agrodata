import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from './firebase';

/**
 * Crea un usuario nuevo sin cerrar la sesión del admin actual.
 * Firebase inicia sesión automáticamente como el usuario recién creado,
 * así que se hace en una instancia secundaria de la app y se descarta.
 */
export async function crearUsuario(email: string, password: string) {
  const secondaryApp = initializeApp(app.options, `crear-usuario-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
  } finally {
    await deleteApp(secondaryApp);
  }
}
