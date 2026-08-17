import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, addDoc, updateDoc, collection } from 'firebase/firestore';

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

// 1) Área y árboles reales por lote
const datosLote = {
  'lv-1': { areaHectareas: 1.5, cantidadArboles: 120 },
  'lv-2': { areaHectareas: 1.8, cantidadArboles: 150 },
  'lv-3': { areaHectareas: 1.2, cantidadArboles: 95 },
  'ed-1': { areaHectareas: 2.0, cantidadArboles: 160 },
  'ed-2': { areaHectareas: 1.6, cantidadArboles: 110 },
  'ed-3': { areaHectareas: 1.4, cantidadArboles: 100 },
  'f3-1': { areaHectareas: 1.1, cantidadArboles: 90 },
  'f3-2': { areaHectareas: 1.3, cantidadArboles: 105 },
  'f3-3': { areaHectareas: 1.0, cantidadArboles: 80 },
  'suelto-1': { areaHectareas: 0.8, cantidadArboles: 60 },
  'suelto-2': { areaHectareas: 0.9, cantidadArboles: 70 },
};

for (const [loteId, datos] of Object.entries(datosLote)) {
  await updateDoc(doc(db, 'lotes', loteId), datos);
}
console.log('Área y árboles cargados en los 11 lotes.');

async function crearCiclo(loteId, nombre, fechaInicio, fechaCierre) {
  const cicloRef = await addDoc(collection(db, 'ciclos'), {
    loteId,
    nombre,
    fechaInicio,
    fechaCierre: fechaCierre ?? null,
    estado: fechaCierre ? 'cerrado' : 'abierto',
  });
  await updateDoc(doc(db, 'lotes', loteId), { cicloActivoId: fechaCierre ? null : cicloRef.id });
  return cicloRef.id;
}

async function aplicacion(loteId, cicloId, producto, dosis, cantidad, dias, responsable) {
  await addDoc(collection(db, 'aplicaciones'), {
    loteId, cicloId, producto, dosis, cantidad,
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

// ---- La Vega ----
// lv-1: ciclo activo, bastante movimiento reciente
{
  const c = await crearCiclo('lv-1', 'Ciclo 2026-1', fechaHace(25));
  await aplicacion('lv-1', c, 'Fungicida Cupravit', '2 ml por litro', '15 litros', 3, 'Freddy');
  await aplicacion('lv-1', c, 'Fertilizante triple 15', null, '30 kg', 12, 'Emerson');
  await aplicacion('lv-1', c, 'Insecticida Lorsban', '1.5 ml por litro', '8 litros', 22, 'Emerson');
  await cosecha('lv-1', c, '35 cajas', 'Selecta', 5);
  await cosecha('lv-1', c, '10 cajas', 'No selecta', 5);
  await venta('lv-1', c, '35 cajas', 420000, 'Comercializadora El Paisa', true, 4);
  await venta('lv-1', c, '10 cajas', 90000, null, false, 2);
}
// lv-2: ciclo cerrado (histórico)
{
  const c = await crearCiclo('lv-2', 'Ciclo 2025-2', fechaHace(90), fechaHace(18));
  await aplicacion('lv-2', c, 'Fungicida Cupravit', '2 ml por litro', '20 litros', 85, 'Freddy');
  await aplicacion('lv-2', c, 'Abono orgánico', null, '50 kg', 60, 'Emerson');
  await cosecha('lv-2', c, '40 cajas', 'Selecta', 25);
  await venta('lv-2', c, '40 cajas', 480000, 'Don Alberto', true, 22);
}
// lv-3: sin ciclo todavía

// ---- El Doctor ----
// ed-1: ciclo activo recién abierto
{
  const c = await crearCiclo('ed-1', 'Ciclo 2026-1', fechaHace(8));
  await aplicacion('ed-1', c, 'Fungicida Cupravit', '2 ml por litro', '10 litros', 1, 'Freddy');
}
// ed-2: ciclo activo con más historia
{
  const c = await crearCiclo('ed-2', 'Ciclo 2026-1', fechaHace(40));
  await aplicacion('ed-2', c, 'Fertilizante triple 15', null, '25 kg', 28, 'Emerson');
  await aplicacion('ed-2', c, 'Insecticida Lorsban', '1.5 ml por litro', '6 litros', 6, 'Freddy');
  await cosecha('ed-2', c, '28 cajas', 'Selecta', 3);
  await cosecha('ed-2', c, '6 cajas', 'No selecta', 3);
  await venta('ed-2', c, '28 cajas', 336000, 'Frutas del Valle', false, 1);
}
// ed-3: sin ciclo todavía

// ---- Finca 3 ----
// f3-1: ciclo cerrado, simple
{
  const c = await crearCiclo('f3-1', 'Ciclo 2025-2', fechaHace(70), fechaHace(45));
  await aplicacion('f3-1', c, 'Fungicida Cupravit', '2 ml por litro', '12 litros', 70, 'Emerson');
  await cosecha('f3-1', c, '18 cajas', 'Selecta', 50);
  await venta('f3-1', c, '18 cajas', 216000, 'Don Carlos', true, 48);
}
// f3-2, f3-3: sin ciclo (para que se vea variado, no todo lleno)

// ---- Lotes sueltos ----
// suelto-1: ciclo activo reciente
{
  const c = await crearCiclo('suelto-1', 'Ciclo 2026-1', fechaHace(15));
  await aplicacion('suelto-1', c, 'Abono orgánico', null, '15 kg', 15, 'Freddy');
}
// suelto-2: sin ciclo

console.log('Datos de ejemplo cargados con éxito.');
process.exit(0);
