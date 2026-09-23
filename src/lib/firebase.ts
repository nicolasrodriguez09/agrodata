import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// Persistencia local offline: los registros cargados sin señal quedan en el
// dispositivo y se sincronizan solos cuando vuelve la conexión.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * Modo de pruebas contra el emulador local de Firebase.
 *
 * Se activa poniendo VITE_USAR_EMULADOR=true en .env.local y levantando el
 * emulador con `npm run emulador`. Con eso la app escribe en una base que vive
 * en tu máquina y se puede llenar de datos inventados sin tocar la de la finca.
 *
 * Nunca se activa en producción: el build de Firebase Hosting no lleva
 * .env.local, así que la variable no existe y este bloque no corre.
 */
if (import.meta.env.VITE_USAR_EMULADOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  console.info('[agrodata] Usando el EMULADOR local. Nada de esto toca la base real.');
}
