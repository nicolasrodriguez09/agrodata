import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, addDoc, updateDoc, collection } from 'firebase/firestore';

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
const uid = cred.user.uid;

function fechaHace(dias) {
  return new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
}

async function crearCicloCerrado(loteId, nombre, fechaInicio, fechaCierre) {
  const ref = await addDoc(collection(db, 'ciclos'), {
    loteId, nombre, fechaInicio, fechaCierre, estado: 'cerrado',
  });
  return ref.id;
}

async function aplicacion(loteId, cicloId, producto, dosis, cantidad, dias, responsable) {
  await addDoc(collection(db, 'aplicaciones'), {
    loteId, cicloId, producto, dosis: dosis ?? null, cantidad,
    fecha: fechaHace(dias), responsable, creadoPor: uid,
  });
}

async function cosecha(loteId, cicloId, cantidad, calidad, dias) {
  await addDoc(collection(db, 'cosechas'), {
    loteId, cicloId, cantidad, calidad, fecha: fechaHace(dias), creadoPor: uid,
  });
}

async function venta(loteId, cicloId, cantidad, precio, comprador, cobrado, dias) {
  await addDoc(collection(db, 'ventas'), {
    loteId, cicloId, cantidad, precio, comprador: comprador ?? null, cobrado,
    fecha: fechaHace(dias), creadoPor: uid,
  });
}

const PRODUCTOS = [
  { nombre: 'Fungicida Cupravit', dosis: '2 ml por litro' },
  { nombre: 'Insecticida Lorsban', dosis: '1.5 ml por litro' },
  { nombre: 'Fertilizante triple 15', dosis: null },
  { nombre: 'Abono orgánico', dosis: null },
  { nombre: 'Fungicida Manzate', dosis: '3 g por litro' },
  { nombre: 'Fertilizante foliar', dosis: '5 ml por litro' },
];
const RESPONSABLES = ['Freddy', 'Emerson', 'Emerson', 'Don José'];
const COMPRADORES = ['Comercializadora El Paisa', 'Don Alberto', 'Frutas del Valle', 'Don Carlos', null];

// Un ciclo histórico rico por lote: ~140 a 100 días atrás, con 4 aplicaciones,
// 2 cosechas (selecta/no selecta) y 2 ventas.
const LOTES = ['lv-1', 'lv-2', 'lv-3', 'ed-1', 'ed-2', 'ed-3', 'f3-1', 'f3-2', 'f3-3', 'suelto-1', 'suelto-2'];

async function sembrarLote(loteId, indice) {
  const inicio = 145 - indice; // varía un poco por lote
  const cierre = 100 - indice;
  const cicloId = await crearCicloCerrado(loteId, 'Ciclo 2025-2', fechaHace(inicio), fechaHace(cierre));

  const p1 = PRODUCTOS[indice % PRODUCTOS.length];
  const p2 = PRODUCTOS[(indice + 1) % PRODUCTOS.length];
  const p3 = PRODUCTOS[(indice + 2) % PRODUCTOS.length];
  const p4 = PRODUCTOS[(indice + 3) % PRODUCTOS.length];
  const r1 = RESPONSABLES[indice % RESPONSABLES.length];
  const r2 = RESPONSABLES[(indice + 1) % RESPONSABLES.length];
  const comprador = COMPRADORES[indice % COMPRADORES.length];

  await Promise.all([
    aplicacion(loteId, cicloId, p1.nombre, p1.dosis, `${10 + indice} litros`, inicio - 5, r1),
    aplicacion(loteId, cicloId, p2.nombre, p2.dosis, `${15 + indice} kg`, inicio - 25, r2),
    aplicacion(loteId, cicloId, p3.nombre, p3.dosis, `${8 + indice} litros`, inicio - 45, r1),
    aplicacion(loteId, cicloId, p4.nombre, p4.dosis, `${20 + indice} kg`, inicio - 65, r2),
    cosecha(loteId, cicloId, `${25 + indice * 2} cajas`, 'Selecta', cierre + 8),
    cosecha(loteId, cicloId, `${6 + indice} cajas`, 'No selecta', cierre + 8),
    venta(loteId, cicloId, `${25 + indice * 2} cajas`, (25 + indice * 2) * 12000, comprador, true, cierre + 5),
    venta(loteId, cicloId, `${6 + indice} cajas`, (6 + indice) * 8000, null, indice % 2 === 0, cierre + 3),
  ]);
  console.log('Ciclo histórico sembrado en', loteId);
}

await Promise.all(LOTES.map((loteId, i) => sembrarLote(loteId, i)));

console.log('Listo: historial extra cargado en los 11 lotes.');
process.exit(0);
