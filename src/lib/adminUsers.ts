import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';
import { escribir } from './escrituraOffline';

/**
 * Crea un usuario nuevo sin cerrar la sesión del admin actual.
 * Firebase inicia sesión automáticamente como el usuario recién creado,
 * así que se hace en una instancia secundaria de la app y se descarta.
 *
 * Crear la cuenta NO alcanza para dar acceso: cualquiera puede crearse una
 * contra la API pública de Firebase sin pasar por acá. Lo que da acceso es
 * quedar anotado en /usuarios, que es lo que miran las reglas de Firestore.
 * Por eso las dos cosas van juntas en esta función.
 */
export async function crearUsuario(email: string, password: string, nombre?: string) {
  const secondaryApp = initializeApp(app.options, `crear-usuario-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    // Se escribe desde la sesión del admin (db), no desde la secundaria: las
    // reglas solo dejan sumar a alguien si quien lo suma ya está adentro.
    escribir(setDoc(doc(db, 'usuarios', uid), {
      uid,
      email: email.trim(),
      nombre: nombre?.trim() || email.trim().split('@')[0],
    }));
  } finally {
    await deleteApp(secondaryApp);
  }
}
