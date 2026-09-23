/**
 * Llena el EMULADOR local con un escenario completo, para poder probar la app
 * con mucha información sin acercarse a la base de la finca.
 *
 * Se niega a correr si no detecta el emulador: la protección es a propósito,
 * porque la diferencia entre esto y borrar la contabilidad real es una variable
 * de entorno.
 *
 *   Terminal 1:  npm run emulador
 *   Terminal 2:  node scripts/seed-emulador.mjs
 *   Terminal 3:  npm run dev:emulador
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, writeBatch, getDocs } from 'firebase/firestore';

const HOST_FS = '127.0.0.1:8080';
const HOST_AUTH = 'http://127.0.0.1:9099';

// --- Guarda de seguridad: sin emulador vivo, no se hace nada ---
const vivo = await fetch(`http://${HOST_FS}/`).then((r) => r.ok).catch(() => false);
if (!vivo) {
  console.error('\n  El emulador de Firestore no responde en ' + HOST_FS + '.');
  console.error('  Levantalo primero con:  npm run emulador\n');
  console.error('  Este script NO escribe en la base real a proposito.\n');
  process.exit(1);
}

const app = initializeApp({ projectId: 'agrodata-9c539', apiKey: 'emulador' }, 'sembrador');
const db = getFirestore(app);
const auth = getAuth(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectAuthEmulator(auth, HOST_AUTH, { disableWarnings: true });

const CORREO = 'admin@test.com';
const CLAVE = '123456';
let uid;
try {
  uid = (await createUserWithEmailAndPassword(auth, CORREO, CLAVE)).user.uid;
  console.log('Cuenta de prueba creada:', CORREO, '/', CLAVE);
} catch {
  uid = (await signInWithEmailAndPassword(auth, CORREO, CLAVE)).user.uid;
  console.log('Cuenta de prueba ya existía:', CORREO);
}

/**
 * El emulador carga las reglas de verdad, que exigen estar en /usuarios para
 * poder leer o escribir. Con la base vacía eso es un círculo: nadie puede
 * entrar porque nadie está en la lista, y nadie puede agregarse porque para
 * eso hay que estar adentro.
 *
 * Se rompe con la API de administrador del emulador (Bearer owner), que sí
 * puede saltarse las reglas. Solo existe en el emulador — contra la base real
 * esto no funcionaría, que es justamente el punto.
 */
async function autorizarPorLaPuertaDeAtras(uid) {
  const url = `http://${HOST_FS}/v1/projects/agrodata-9c539/databases/(default)/documents/usuarios/${uid}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: { uid: { stringValue: uid }, email: { stringValue: CORREO }, nombre: { stringValue: 'Admin' } },
    }),
  });
  if (!res.ok) throw new Error('No se pudo autorizar al usuario en el emulador: ' + (await res.text()));
  console.log('Usuario autorizado en /usuarios del emulador');
}
await autorizarPorLaPuertaDeAtras(uid);

// ---------------------------------------------------------------- utilidades
let semilla = 424242;
const rnd = () => ((semilla = (semilla * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const entre = (a, b) => a + rnd() * (b - a);
const ent = (a, b) => Math.floor(entre(a, b + 1));
const elegir = (a) => a[Math.floor(rnd() * a.length)];
const red = (n, a) => Math.round(n / a) * a;
const HOY = new Date().toISOString().slice(0, 10);
function masDias(iso, d) {
  const x = new Date(iso + 'T12:00:00');
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}
const antesDeHoy = (f) => f <= HOY;
let n = 0;
const nid = (p) => `${p}-${(n++).toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`;

// ---------------------------------------------------------------- catálogos
const TRABAJADORES = ['Jhon Torres', 'Pedro Ramírez', 'Luis Fernando Ocampo', 'José Mosquera', 'Wilmer Cardona', 'Alexánder Grisales', 'Deisy Ospina', 'María Elena Quintero'];
const PAGADORES = ['Freddy', 'Freddy', 'Freddy', 'Emerson'];
const COMPRADORES = ['Central de Abastos', 'Comercializadora El Rosal', 'Don Aníbal (mayorista)', 'Surtifruver La 14', 'Plaza de mercado Manizales'];
const PROVEEDORES = ['Agroinsumos La Cosecha', 'Almacén El Agricultor', 'Coagronorte', 'Distriagro'];
const LABORES_GEN = ['Arreglo de cercas', 'Mantenimiento de la vía', 'Limpieza de bodega', 'Mantenimiento de la bomba de riego', 'Cargue de camión'];

const INSUMOS = [
  { id: 'urea', nombre: 'Urea 46%', unidad: 'bultos', precio: 128000, lote: 8 },
  { id: 'triple15', nombre: 'Abono Triple 15', unidad: 'bultos', precio: 152000, lote: 8 },
  { id: 'gallinaza', nombre: 'Gallinaza', unidad: 'bultos', precio: 24000, lote: 40 },
  { id: 'cal', nombre: 'Cal dolomita', unidad: 'bultos', precio: 29000, lote: 20 },
  { id: 'mancozeb', nombre: 'Mancozeb (fungicida)', unidad: 'kg', precio: 39000, lote: 10 },
  { id: 'clorpirifos', nombre: 'Clorpirifos (insecticida)', unidad: 'litros', precio: 54000, lote: 10 },
  { id: 'abamectina', nombre: 'Abamectina', unidad: 'litros', precio: 189000, lote: 4 },
  { id: 'coadyuvante', nombre: 'Coadyuvante agrícola', unidad: 'litros', precio: 29000, lote: 8 },
  { id: 'foliar', nombre: 'Fertilizante foliar', unidad: 'litros', precio: 47000, lote: 8 },
];
const porId = Object.fromEntries(INSUMOS.map((i) => [i.id, i]));

const FINCAS = [
  { id: 'la-vega', nombre: 'La Vega', ubicacion: 'Vía al río, km 4' },
  { id: 'el-doctor', nombre: 'El Doctor', ubicacion: 'Vereda La Palma' },
  { id: 'finca-3', nombre: 'Finca 3', ubicacion: 'Alto de la cruz' },
];

const LOTES = [
  { id: 'lv-1', fincaId: 'la-vega', nombre: 'Lote 1', ha: 1.5, arboles: 120, rend: 9800, precioKg: 1850, plaga: 0, grupo: 0 },
  { id: 'lv-2', fincaId: 'la-vega', nombre: 'Lote 2', ha: 1.8, arboles: 150, rend: 8200, precioKg: 1700, plaga: 0, grupo: 1 },
  { id: 'lv-3', fincaId: 'la-vega', nombre: 'Lote 3', ha: 1.2, arboles: 95, rend: 7300, precioKg: 1350, plaga: 1, grupo: 2 },
  { id: 'ed-1', fincaId: 'el-doctor', nombre: 'Lote 1', ha: 2.0, arboles: 160, rend: 9200, precioKg: 1800, plaga: 0, grupo: 0 },
  { id: 'ed-2', fincaId: 'el-doctor', nombre: 'Lote 2', ha: 1.6, arboles: 110, rend: 3100, precioKg: 1150, plaga: 2, grupo: 1 },
  { id: 'ed-3', fincaId: 'el-doctor', nombre: 'Lote 3', ha: 1.4, arboles: 100, rend: 8600, precioKg: 1750, plaga: 0, grupo: 2 },
  { id: 'f3-1', fincaId: 'finca-3', nombre: 'Lote 1', ha: 1.1, arboles: 90, rend: 6900, precioKg: 1600, plaga: 1, grupo: 0 },
  { id: 'f3-2', fincaId: 'finca-3', nombre: 'Lote 2', ha: 1.3, arboles: 105, rend: 8400, precioKg: 1780, plaga: 0, grupo: 1 },
  { id: 'f3-3', fincaId: 'finca-3', nombre: 'Lote 3', ha: 1.0, arboles: 80, rend: 6300, precioKg: 1300, plaga: 1, grupo: 2 },
  { id: 'suelto-1', fincaId: null, nombre: 'Lote suelto 1', ha: 0.8, arboles: 60, rend: 9500, precioKg: 1900, plaga: 0, grupo: 0 },
  { id: 'suelto-2', fincaId: null, nombre: 'Lote suelto 2', ha: 0.9, arboles: 70, rend: 0, precioKg: 0, plaga: 0, grupo: null },
];

const CICLOS_GRUPO = [
  [
    { nombre: 'Cosecha 2025-2', inicio: masDias(HOY, -350), cierre: masDias(HOY, -190) },
    { nombre: 'Cosecha 2026-1', inicio: masDias(HOY, -186), cierre: masDias(HOY, -20) },
    { nombre: 'Cosecha 2026-2', inicio: masDias(HOY, -16), cierre: null },
  ],
  [
    { nombre: 'Cosecha 2025-2', inicio: masDias(HOY, -300), cierre: masDias(HOY, -130) },
    { nombre: 'Cosecha 2026-1', inicio: masDias(HOY, -126), cierre: null },
  ],
  [
    { nombre: 'Cosecha 2025-2', inicio: masDias(HOY, -260), cierre: masDias(HOY, -95) },
    { nombre: 'Cosecha 2026-1', inicio: masDias(HOY, -91), cierre: null },
  ],
];

const NOVEDADES_POSIBLES = [
  { categoria: 'Clima', descripcion: 'Cayó granizada fuerte y tumbó buena parte de la fruta que estaba para recoger.' },
  { categoria: 'Riego', descripcion: 'No se pudo regar en toda la semana porque se fue el agua del acueducto veredal.' },
  { categoria: 'Plaga o enfermedad', descripcion: 'Se detectó mosca de la fruta en la parte baja del lote, tocó reforzar el control.' },
  { categoria: 'Equipos', descripcion: 'Se dañó la motobomba y hubo que alquilar una mientras la arreglaban.' },
  { categoria: 'Mano de obra', descripcion: 'Faltaron recolectores en plena cosecha, se atrasó un pase completo.' },
  { categoria: 'Clima', descripcion: 'Verano muy fuerte, el lote se estresó y la fruta salió más pequeña.' },
  { categoria: 'Riego', descripcion: 'Se rompió la manguera principal, se perdió medio día de riego.' },
  { categoria: 'Otra', descripcion: 'Se cayó un palo grande por el ventarrón y tapó el camino de entrada.' },
];

// ---------------------------------------------------------------- simulación
const ciclos = [], cosechas = [], ventas = [], riegos = [], jornales = [], novedades = [], eventos = [];

for (const lote of LOTES) {
  if (lote.grupo === null) continue;
  for (const def of CICLOS_GRUPO[lote.grupo]) {
    const cicloId = nid('c');
    ciclos.push({ id: cicloId, loteId: lote.id, nombre: def.nombre, fechaInicio: def.inicio, fechaCierre: def.cierre, estado: def.cierre ? 'cerrado' : 'abierto' });

    const inicioCosecha = masDias(def.inicio, 150);

    // Labores
    for (const l of [
      { labor: 'Poda de producción', dia: 2, dias: Math.max(2, Math.round(lote.arboles / 22)) },
      { labor: 'Plateo y desyerba', dia: 18, dias: Math.max(2, Math.round(lote.ha * 3.5)) },
      { labor: 'Fertilización', dia: 26, dias: Math.max(1, Math.round(lote.ha * 2)) },
      { labor: 'Control de maleza', dia: 74, dias: Math.max(2, Math.round(lote.ha * 3)) },
      { labor: 'Fertilización', dia: 96, dias: Math.max(1, Math.round(lote.ha * 2)) },
      { labor: 'Embolsado de fruta', dia: 122, dias: Math.max(4, Math.round(lote.arboles / 5)) },
      { labor: 'Embolsado de fruta', dia: 132, dias: Math.max(4, Math.round(lote.arboles / 6)) },
    ]) {
      const fecha = masDias(def.inicio, l.dia);
      if (!antesDeHoy(fecha)) continue;
      const tarifa = red(entre(62000, 76000), 1000);
      jornales.push({ id: nid('j'), loteId: lote.id, trabajador: elegir(TRABAJADORES), quienPago: elegir(PAGADORES), labor: l.labor, fecha, unidad: 'dia', cantidad: l.dias, tarifa, valor: l.dias * tarifa, pagado: fecha < masDias(HOY, -20), creadoPor: uid });
    }

    // Aplicaciones
    const programa = [
      { dia: 6, insumo: 'cal', dosisHa: 12, resp: 'Emerson' },
      { dia: 26, insumo: 'gallinaza', dosisHa: 30, resp: 'Freddy' },
      { dia: 28, insumo: 'triple15', dosisHa: 6, resp: 'Freddy' },
      { dia: 52, insumo: 'mancozeb', dosisHa: 2.5, resp: 'Emerson' },
      { dia: 62, insumo: 'coadyuvante', dosisHa: 1.5, resp: 'Emerson' },
      { dia: 68, insumo: 'foliar', dosisHa: 2.5, resp: 'Freddy' },
      { dia: 96, insumo: 'urea', dosisHa: 5, resp: 'Freddy' },
      { dia: 110, insumo: 'clorpirifos', dosisHa: 2.2, resp: 'Emerson' },
      { dia: 124, insumo: 'triple15', dosisHa: 4, resp: 'Freddy' },
      { dia: 134, insumo: 'foliar', dosisHa: 2.2, resp: 'Emerson' },
    ];
    for (let k = 0; k < lote.plaga * 2; k++) programa.push({ dia: 84 + k * 16, insumo: k % 2 === 0 ? 'abamectina' : 'clorpirifos', dosisHa: 1.1, resp: 'Emerson' });

    for (const pr of programa) {
      const fecha = masDias(def.inicio, pr.dia);
      if (!antesDeHoy(fecha)) continue;
      const ins = porId[pr.insumo];
      const cantidad = Number((pr.dosisHa * lote.ha * entre(0.9, 1.1)).toFixed(ins.unidad === 'bultos' ? 0 : 1));
      if (cantidad <= 0) continue;
      eventos.push({ fecha, loteId: lote.id, cicloId, insumoId: pr.insumo, cantidad, dosisHa: pr.dosisHa, responsable: pr.resp });
    }

    // Riegos
    for (let d = 10; d <= 150; d += ent(16, 26)) {
      const fecha = masDias(def.inicio, d);
      if (!antesDeHoy(fecha)) continue;
      riegos.push({ id: nid('r'), loteId: lote.id, cicloId, fecha, duracion: elegir(['2 horas', '3 horas', 'Toda la mañana', '90 minutos']), metodo: elegir(['Goteo', 'Goteo', 'Aspersión', 'Manual con manguera']), responsable: elegir(['Freddy', 'Emerson', 'Jhon Torres']), creadoPor: uid });
    }

    // Novedades: una o dos por ciclo, con fecha de registro propia
    for (let k = 0; k < ent(1, 2); k++) {
      const fecha = masDias(def.inicio, ent(20, 150));
      if (!antesDeHoy(fecha)) continue;
      const nv = elegir(NOVEDADES_POSIBLES);
      // Se anota entre el mismo día y 4 días después: así pasa de verdad.
      const anotada = new Date(masDias(fecha, ent(0, 4)) + 'T09:00:00').getTime();
      novedades.push({ id: nid('nv'), loteId: lote.id, cicloId, fecha, categoria: nv.categoria, descripcion: nv.descripcion, resuelta: rnd() > 0.35, creadoEn: anotada, creadoPor: uid });
    }

    // Cosechas y ventas, ahora en kilos
    if (lote.rend === 0) continue;
    const kilosTotales = Math.round(lote.rend * lote.ha * entre(0.92, 1.08));
    for (let i = 0; i < 5; i++) {
      const fecha = masDias(inicioCosecha, Math.round((28 * i) / 5));
      if (!antesDeHoy(fecha)) continue;
      const kilos = Math.round(kilosTotales * [0.14, 0.24, 0.28, 0.21, 0.13][i]);
      const calidad = i === 0 || i === 4 ? 'No selecta' : 'Selecta';
      const cosechaId = nid('h');
      cosechas.push({ id: cosechaId, loteId: lote.id, cicloId, fecha, cantidad: `${kilos.toLocaleString('es-CO')} kg`, cantidadNum: kilos, unidad: 'kg', calidad, creadoPor: uid });

      const diasRec = Math.max(1, Math.round(kilos / 220));
      const tarifaRec = red(entre(62000, 78000), 1000);
      jornales.push({ id: nid('j'), loteId: lote.id, trabajador: elegir(TRABAJADORES), quienPago: elegir(PAGADORES), labor: 'Recolección', fecha, unidad: 'dia', cantidad: diasRec, tarifa: tarifaRec, valor: diasRec * tarifaRec, pagado: fecha < masDias(HOY, -20), creadoPor: uid });

      // El 85% de las cosechas se vende; el resto queda "sin vender todavía",
      // para poder probar ese caso en la pantalla.
      if (rnd() > 0.15) {
        const precioKg = red(lote.precioKg * (calidad === 'No selecta' ? entre(0.78, 0.88) : entre(0.96, 1.08)), 50);
        ventas.push({ id: nid('v'), loteId: lote.id, cicloId, fecha, cantidad: `${kilos.toLocaleString('es-CO')} kg`, precio: red(kilos * precioKg, 100), cantidadNum: kilos, unidad: 'kg', precioUnitario: precioKg, comprador: elegir(COMPRADORES), cobrado: fecha < masDias(HOY, -25), cosechaId, creadoPor: uid });
      }
    }
  }
}

// Jornales generales
for (let m = 0; m < 10; m++) {
  for (let k = 0; k < ent(1, 2); k++) {
    const fecha = masDias(HOY, -ent(m * 30, m * 30 + 29));
    const porHora = rnd() < 0.3;
    const cantidad = porHora ? ent(4, 9) : ent(1, 3);
    const tarifa = porHora ? red(entre(9000, 11000), 500) : red(entre(62000, 76000), 1000);
    jornales.push({ id: nid('j'), trabajador: elegir(TRABAJADORES), quienPago: elegir(PAGADORES), labor: elegir(LABORES_GEN), fecha, unidad: porHora ? 'hora' : 'dia', cantidad, tarifa, valor: cantidad * tarifa, pagado: fecha < masDias(HOY, -20), creadoPor: uid });
  }
}

// ---------------------------------------------- inventario: compras y movimientos
eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
const stock = Object.fromEntries(INSUMOS.map((i) => [i.id, 0]));
const costoUnit = Object.fromEntries(INSUMOS.map((i) => [i.id, 0]));
const compras = [], movimientos = [], aplicaciones = [];

function comprar(insumoId, cantidad, fecha) {
  const ins = porId[insumoId];
  const meses = Math.max(0, Math.round((new Date(HOY) - new Date(fecha)) / 2592000000));
  const unitario = red(ins.precio * (1 - meses * 0.006) * entre(0.97, 1.03), 100);
  const compraId = nid('cp');
  compras.push({ id: compraId, insumoId, producto: ins.nombre, cantidad, costo: red(cantidad * unitario, 100), fecha, proveedor: elegir(PROVEEDORES), personaQueCompro: elegir(PAGADORES), fotoFacturaUrl: null, creadoPor: uid });
  movimientos.push({ id: nid('m'), insumoId, tipo: 'entrada', cantidad, costoUnitario: unitario, fecha, origen: 'compra', origenId: compraId, creadoPor: uid });
  stock[insumoId] += cantidad;
  costoUnit[insumoId] = unitario;
}

for (const ev of eventos) {
  const ins = porId[ev.insumoId];
  if (stock[ev.insumoId] < ev.cantidad) {
    const faltante = ev.cantidad - stock[ev.insumoId];
    comprar(ev.insumoId, (Math.ceil(faltante / ins.lote) + ent(0, 1)) * ins.lote, masDias(ev.fecha, -ent(2, 6)));
  }
  const aplicacionId = nid('a');
  const unitario = costoUnit[ev.insumoId];
  aplicaciones.push({ id: aplicacionId, loteId: ev.loteId, cicloId: ev.cicloId, insumoId: ev.insumoId, producto: ins.nombre, cantidad: ev.cantidad, unidad: ins.unidad, costoEstimado: Math.round(ev.cantidad * unitario), dosis: `${ev.dosisHa} ${ins.unidad}/ha`, fecha: ev.fecha, responsable: ev.responsable, creadoPor: uid });
  movimientos.push({ id: nid('m'), insumoId: ev.insumoId, tipo: 'salida', cantidad: ev.cantidad, costoUnitario: unitario, fecha: ev.fecha, origen: 'aplicacion', origenId: aplicacionId, loteId: ev.loteId, creadoPor: uid });
  stock[ev.insumoId] -= ev.cantidad;
}
for (const k of Object.keys(stock)) stock[k] = Number(stock[k].toFixed(2));

const insumosDocs = INSUMOS.map((i) => {
  const suyas = compras.filter((c) => c.insumoId === i.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return { id: i.id, nombre: i.nombre, unidad: i.unidad, stockActual: stock[i.id], costoUnitario: suyas[0] ? Math.round(suyas[0].costo / suyas[0].cantidad) : i.precio, creadoPor: uid };
});

// ---------------------------------------------------------------- escritura
async function borrar(nombre) {
  const snap = await getDocs(collection(db, nombre));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const b = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
}
async function escribir(nombre, items) {
  for (let i = 0; i < items.length; i += 400) {
    const b = writeBatch(db);
    items.slice(i, i + 400).forEach(({ id, ...data }) => b.set(doc(db, nombre, id), data));
    await b.commit();
  }
  console.log(`  ${nombre.padEnd(14)} ${items.length}`);
}

console.log('\nLimpiando el emulador...');
for (const c of ['fincas', 'lotes', 'ciclos', 'aplicaciones', 'cosechas', 'riegos', 'novedades', 'ventas', 'compras', 'jornales', 'insumos', 'movimientos']) await borrar(c);

console.log('Escribiendo:');
await escribir('fincas', FINCAS);
await escribir('lotes', LOTES.map((l) => ({ id: l.id, fincaId: l.fincaId, nombre: l.nombre, cultivo: 'Guayaba', areaHectareas: l.ha, cantidadArboles: l.arboles, cicloActivoId: ciclos.find((c) => c.loteId === l.id && c.estado === 'abierto')?.id ?? null })));
await escribir('ciclos', ciclos);
await escribir('insumos', insumosDocs);
await escribir('aplicaciones', aplicaciones);
await escribir('cosechas', cosechas);
await escribir('ventas', ventas);
await escribir('riegos', riegos);
await escribir('novedades', novedades);
await escribir('compras', compras);
await escribir('jornales', jornales);
await escribir('movimientos', movimientos);

const suma = (a, f) => a.reduce((s, x) => s + f(x), 0);
const total = ciclos.length + aplicaciones.length + cosechas.length + ventas.length + riegos.length + novedades.length + compras.length + jornales.length + movimientos.length;
console.log('\n===== EMULADOR LISTO =====');
console.log('Registros:', total);
console.log('Vendido: $', suma(ventas, (v) => v.precio).toLocaleString('es-CO'));
console.log('Compras: $', suma(compras, (c) => c.costo).toLocaleString('es-CO'));
console.log('Jornales: $', suma(jornales, (j) => j.valor).toLocaleString('es-CO'));
console.log('Cosechas sin vender:', cosechas.filter((c) => !ventas.some((v) => v.cosechaId === c.id)).length, 'de', cosechas.length);
console.log('Novedades:', novedades.length, `(${novedades.filter((x) => !x.resuelta).length} sin resolver)`);
console.log('\nEntra en http://localhost:5174 con', CORREO, '/', CLAVE);
process.exit(0);
