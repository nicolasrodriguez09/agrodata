import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const cred = await signInWithEmailAndPassword(auth, 'admin@test.com', '123456');
console.log('Autenticado como', cred.user.email, cred.user.uid);

await setDoc(doc(db, 'usuarios', cred.user.uid), {
  uid: cred.user.uid,
  nombre: 'Admin',
  email: 'admin@test.com',
});

const fincas = [
  { id: 'la-vega', nombre: 'La Vega' },
  { id: 'el-doctor', nombre: 'El Doctor' },
  { id: 'finca-3', nombre: 'Finca 3' },
];

for (const finca of fincas) {
  await setDoc(doc(db, 'fincas', finca.id), { nombre: finca.nombre });
}

const lotes = [
  { id: 'lv-1', fincaId: 'la-vega', nombre: 'Lote 1' },
  { id: 'lv-2', fincaId: 'la-vega', nombre: 'Lote 2' },
  { id: 'lv-3', fincaId: 'la-vega', nombre: 'Lote 3' },
  { id: 'ed-1', fincaId: 'el-doctor', nombre: 'Lote 1' },
  { id: 'ed-2', fincaId: 'el-doctor', nombre: 'Lote 2' },
  { id: 'ed-3', fincaId: 'el-doctor', nombre: 'Lote 3' },
  { id: 'f3-1', fincaId: 'finca-3', nombre: 'Lote 1' },
  { id: 'f3-2', fincaId: 'finca-3', nombre: 'Lote 2' },
  { id: 'f3-3', fincaId: 'finca-3', nombre: 'Lote 3' },
  { id: 'suelto-1', fincaId: null, nombre: 'Lote suelto 1' },
  { id: 'suelto-2', fincaId: null, nombre: 'Lote suelto 2' },
];

for (const lote of lotes) {
  await setDoc(doc(db, 'lotes', lote.id), {
    fincaId: lote.fincaId,
    nombre: lote.nombre,
    cultivo: 'Guayaba',
    cicloActivoId: null,
  });
}

console.log(`Listo: ${fincas.length} fincas y ${lotes.length} lotes creados.`);
process.exit(0);
