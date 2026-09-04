/**
 * Siembra un escenario simulado realista de la finca de guayaba, sustituyendo
 * todos los datos de demo anteriores.
 *
 * Historia que cuenta el escenario: la finca empezó a usar AgroData en enero de
 * 2026, así que los ciclos que ya venían de 2025 solo tienen registros a partir
 * de enero (antes se llevaba en cuaderno). Las podas están escalonadas entre
 * lotes, como se hace de verdad para tener ingreso todo el año.
 *
 * Casos que quedan cubiertos a propósito:
 *   - lotes muy rentables, lotes apenas en equilibrio y lotes en pérdida
 *   - un lote golpeado por plaga (muchas aplicaciones, cosecha pobre)
 *   - ciclos abiertos a mitad de camino (gasto hecho, cosecha todavía no)
 *   - ventas cobradas y ventas pendientes de cobro
 *   - jornales pagados y pendientes, atados a un lote y generales
 *   - inventario con entradas por compra y salidas por aplicación, incluido un
 *     insumo casi agotado
 *   - un lote sin ningún registro (recién comprado, en descanso)
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,

  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const cfg = {
  apiKey: 'AIzaSyDXbXI5KfHRyBGnNP-_mxfyPqBviL48BE0',
  authDomain: 'agrodata-9c539.firebaseapp.com',
  projectId: 'agrodata-9c539',
  storageBucket: 'agrodata-9c539.firebasestorage.app',
  messagingSenderId: '430193125636',
  appId: '1:430193125636:web:39e9fc39bdff2a010f4851',
};
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);
const cred = await signInWithEmailAndPassword(auth, 'admin@test.com', '123456');
const UID = cred.user.uid;

const HOY = '2026-09-02';

// ---------------------------------------------------------------- utilidades
let semilla = 20260902;
function rnd() {
  semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
  return semilla / 0x7fffffff;
}
const entre = (a, b) => a + rnd() * (b - a);
const enteroEntre = (a, b) => Math.floor(entre(a, b + 1));
const elegir = (arr) => arr[Math.floor(rnd() * arr.length)];
const redondear = (n, a) => Math.round(n / a) * a;

function sumarDias(iso, dias) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}
const antesDeHoy = (iso) => iso <= HOY;

// ---------------------------------------------------------------- catálogos
const TRABAJADORES = [
  'Jhon Torres',
  'Pedro Ramírez',
  'Luis Fernando Ocampo',
  'José Mosquera',
  'Wilmer Cardona',
  'Alexánder Grisales',
  'Deisy Ospina',
  'María Elena Quintero',
];
const PAGADORES = ['Freddy', 'Freddy', 'Freddy', 'Emerson'];
const COMPRADORES = [
  'Central de Abastos',
  'Comercializadora El Rosal',
  'Don Aníbal (mayorista)',
  'Surtifruver La 14',
  'Plaza de mercado Manizales',
];
const PROVEEDORES = ['Agroinsumos La Cosecha', 'Almacén El Agricultor', 'Coagronorte', 'Distriagro'];
const FOTOS_FACTURA = [
  'https://res.cloudinary.com/bmq7c3hv/image/upload/v1787015691/r4fzfrzffijrwxau77uq.jpg',
  'https://res.cloudinary.com/bmq7c3hv/image/upload/v1787007631/uaqp5wgj2578ruc9mtgj.jpg',
];

/** Insumos con precio por unidad de compra (pesos, 2026) y tamaño típico de compra. */
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

/**
 * Perfil económico de cada lote. `rendimiento` son kilos por hectárea y por
 * ciclo; `precioKg` el precio promedio de venta; `plaga` sube la cantidad de
 * fumigaciones. Con esto salen solos los lotes rentables y los que dan pérdida.
 */
const LOTES = [
  { id: 'lv-1', ha: 1.5, arboles: 120, rendimiento: 9800, precioKg: 1850, plaga: 0, grupo: 0 },
  { id: 'lv-2', ha: 1.8, arboles: 150, rendimiento: 8200, precioKg: 1700, plaga: 0, grupo: 1 },
  { id: 'lv-3', ha: 1.2, arboles: 95, rendimiento: 7300, precioKg: 1350, plaga: 1, grupo: 2 },
  { id: 'ed-1', ha: 2.0, arboles: 160, rendimiento: 9200, precioKg: 1800, plaga: 0, grupo: 0 },
  { id: 'ed-2', ha: 1.6, arboles: 110, rendimiento: 3100, precioKg: 1150, plaga: 2, grupo: 1 },
  { id: 'ed-3', ha: 1.4, arboles: 100, rendimiento: 8600, precioKg: 1750, plaga: 0, grupo: 2 },
  { id: 'f3-1', ha: 1.1, arboles: 90, rendimiento: 6900, precioKg: 1600, plaga: 1, grupo: 0 },
  { id: 'f3-2', ha: 1.3, arboles: 105, rendimiento: 8400, precioKg: 1780, plaga: 0, grupo: 1 },
  { id: 'f3-3', ha: 1.0, arboles: 80, rendimiento: 6300, precioKg: 1300, plaga: 1, grupo: 2 },
  { id: 'suelto-1', ha: 0.8, arboles: 60, rendimiento: 9500, precioKg: 1900, plaga: 0, grupo: 0 },
  { id: 'suelto-2', ha: 0.9, arboles: 70, rendimiento: 0, precioKg: 0, plaga: 0, grupo: null }, // en descanso
];

/**
 * Podas escalonadas por grupo para que haya cosecha (e ingresos) repartida a lo
 * largo del año en vez de todo junto. Un ciclo de guayaba va de la poda a la
 * cosecha en unos 5 meses y medio.
 */
const CICLOS_POR_GRUPO = [
  // grupo 0: viene de 2025, ya cerró dos ciclos, va en el tercero
  [
    { nombre: 'Cosecha 2025-2', inicio: '2025-09-18', cierre: '2026-03-10' },
    { nombre: 'Cosecha 2026-1', inicio: '2026-03-14', cierre: '2026-08-20' },
    { nombre: 'Cosecha 2026-2', inicio: '2026-08-24', cierre: null },
  ],
  // grupo 1: podó más tarde, va en el segundo ciclo y ya arrancó la cosecha
  [
    { nombre: 'Cosecha 2025-2', inicio: '2025-11-12', cierre: '2026-05-04' },
    { nombre: 'Cosecha 2026-1', inicio: '2026-05-08', cierre: null },
  ],
  // grupo 2: el más atrasado, el ciclo abierto todavía no da fruta
  [
    { nombre: 'Cosecha 2025-2', inicio: '2025-12-20', cierre: '2026-06-08' },
    { nombre: 'Cosecha 2026-1', inicio: '2026-06-12', cierre: null },
  ],
];

// ---------------------------------------------------------------- simulación
const eventos = []; // se llena desordenado y se procesa por fecha
const ciclos = [];
const cosechas = [];
const ventas = [];
const riegos = [];
const jornales = [];

let contador = 0;
const nuevoId = (p) => `${p}-${(contador++).toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`;

for (const lote of LOTES) {
  if (lote.grupo === null) continue; // suelto-2 queda sin ningún registro
  const plan = CICLOS_POR_GRUPO[lote.grupo];

  for (const def of plan) {
    const cicloId = nuevoId('c');
    const abierto = def.cierre === null;
    ciclos.push({
      id: cicloId,
      loteId: lote.id,
      nombre: def.nombre,
      fechaInicio: def.inicio,
      fechaCierre: def.cierre,
      estado: abierto ? 'abierto' : 'cerrado',
    });

    // La cosecha va del día 150 al 175 después de la poda.
    const inicioCosecha = sumarDias(def.inicio, 150);
    const finCosecha = sumarDias(def.inicio, 178);

    // --- Labores de campo (jornales atados al lote) ---
    // Los días salen de los árboles, no de las hectáreas: la poda y sobre todo
    // el embolsado (bolsa por fruta) son las labores que más mano de obra piden.
    const labores = [
      { labor: 'Poda de producción', dia: 2, dias: Math.max(2, Math.round(lote.arboles / 22)) },
      { labor: 'Plateo y desyerba', dia: 18, dias: Math.max(2, Math.round(lote.ha * 3.5)) },
      { labor: 'Fertilización', dia: 26, dias: Math.max(1, Math.round(lote.ha * 2)) },
      { labor: 'Control de maleza', dia: 74, dias: Math.max(2, Math.round(lote.ha * 3)) },
      { labor: 'Fertilización', dia: 96, dias: Math.max(1, Math.round(lote.ha * 2)) },
      { labor: 'Embolsado de fruta', dia: 122, dias: Math.max(4, Math.round(lote.arboles / 5)) },
      { labor: 'Embolsado de fruta', dia: 132, dias: Math.max(4, Math.round(lote.arboles / 6)) },
    ];
    for (const l of labores) {
      const fecha = sumarDias(def.inicio, l.dia);
      if (fecha < '2026-01-01' || !antesDeHoy(fecha)) continue;
      const tarifa = redondear(entre(62000, 76000), 1000);
      jornales.push({
        id: nuevoId('j'),
        loteId: lote.id,
        trabajador: elegir(TRABAJADORES),
        quienPago: elegir(PAGADORES),
        labor: l.labor,
        fecha,
        unidad: 'dia',
        cantidad: l.dias,
        tarifa,
        valor: l.dias * tarifa,
        pagado: fecha < sumarDias(HOY, -20),
        creadoPor: UID,
      });
    }

    // --- Aplicaciones: fertilización de suelo, foliares y fumigaciones ---
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
    // Un lote con plaga necesita fumigaciones extra: más gasto, no más fruta.
    for (let k = 0; k < lote.plaga * 2; k++) {
      programa.push({ dia: 84 + k * 16, insumo: k % 2 === 0 ? 'abamectina' : 'clorpirifos', dosisHa: 1.1, resp: 'Emerson' });
    }

    for (const p of programa) {
      const fecha = sumarDias(def.inicio, p.dia);
      if (fecha < '2026-01-01' || !antesDeHoy(fecha)) continue;
      const ins = porId[p.insumo];
      const cantidad = Number((p.dosisHa * lote.ha * entre(0.9, 1.1)).toFixed(ins.unidad === 'bultos' ? 0 : 1));
      if (cantidad <= 0) continue;
      eventos.push({
        tipo: 'aplicacion',
        fecha,
        loteId: lote.id,
        cicloId,
        insumoId: p.insumo,
        cantidad,
        responsable: p.resp,
      });
    }

    // --- Riegos: solo en temporada seca (dic-feb y jun-ago) ---
    for (let d = 10; d <= 150; d += enteroEntre(16, 26)) {
      const fecha = sumarDias(def.inicio, d);
      if (fecha < '2026-01-01' || !antesDeHoy(fecha)) continue;
      const mes = Number(fecha.slice(5, 7));
      if (![12, 1, 2, 6, 7, 8].includes(mes)) continue;
      riegos.push({
        id: nuevoId('r'),
        loteId: lote.id,
        cicloId,
        fecha,
        duracion: elegir(['2 horas', '3 horas', 'Toda la mañana', '90 minutos']),
        metodo: elegir(['Goteo', 'Goteo', 'Aspersión', 'Manual con manguera']),
        responsable: elegir(['Freddy', 'Emerson', 'Jhon Torres']),
        creadoPor: UID,
      });
    }

    // --- Cosechas y ventas ---
    if (lote.rendimiento === 0) continue;
    const kilosTotales = Math.round(lote.rendimiento * lote.ha * entre(0.92, 1.08));
    const pases = 5; // la guayaba se recoge en varios pases, no de una
    let kilosVendidos = 0;
    for (let i = 0; i < pases; i++) {
      const fecha = sumarDias(inicioCosecha, Math.round(((finCosecha ? 28 : 28) * i) / pases));
      if (!antesDeHoy(fecha)) continue;
      // Los pases del medio son los más cargados.
      const peso = [0.14, 0.24, 0.28, 0.21, 0.13][i];
      const kilos = Math.round(kilosTotales * peso);
      const canastillas = Math.round(kilos / 22);
      const calidad = i === 0 || i === pases - 1 ? 'Segunda' : 'Primera';
      cosechas.push({
        id: nuevoId('h'),
        loteId: lote.id,
        cicloId,
        fecha,
        cantidad: `${canastillas} canastillas (${kilos.toLocaleString('es-CO')} kg)`,
        calidad,
        creadoPor: UID,
      });

      // Jornales de recolección del pase: un recolector saca ~220 kg al día,
      // porque la guayaba se corta a mano fruta por fruta.
      const diasRecoleccion = Math.max(1, Math.round(kilos / 220));
      const tarifaRec = redondear(entre(62000, 78000), 1000);
      jornales.push({
        id: nuevoId('j'),
        loteId: lote.id,
        trabajador: elegir(TRABAJADORES),
        quienPago: elegir(PAGADORES),
        labor: 'Recolección',
        fecha,
        unidad: 'dia',
        cantidad: diasRecoleccion,
        tarifa: tarifaRec,
        valor: diasRecoleccion * tarifaRec,
        pagado: fecha < sumarDias(HOY, -20),
        creadoPor: UID,
      });

      // La venta sale uno o dos días después del pase
      const fechaVenta = sumarDias(fecha, enteroEntre(1, 2));
      if (!antesDeHoy(fechaVenta)) continue;
      const precioKg = redondear(lote.precioKg * (calidad === 'Segunda' ? entre(0.78, 0.88) : entre(0.96, 1.08)), 50);
      kilosVendidos += kilos;
      ventas.push({
        id: nuevoId('v'),
        loteId: lote.id,
        cicloId,
        fecha: fechaVenta,
        cantidad: `${canastillas} canastillas (${kilos.toLocaleString('es-CO')} kg)`,
        precio: redondear(kilos * precioKg, 100),
        comprador: elegir(COMPRADORES),
        cobrado: fechaVenta < sumarDias(HOY, -25),
        creadoPor: UID,
      });
    }
    void kilosVendidos;
  }
}

// --- Jornales generales, sin lote: mantenimiento del negocio ---
const LABORES_GENERALES = [
  'Arreglo de cercas',
  'Mantenimiento de la vía',
  'Limpieza de bodega',
  'Mantenimiento de la bomba de riego',
  'Cargue de camión',
  'Arreglo del tanque de agua',
];
for (let mes = 1; mes <= 9; mes++) {
  const cuantos = enteroEntre(1, 2);
  for (let k = 0; k < cuantos; k++) {
    const fecha = `2026-${String(mes).padStart(2, '0')}-${String(enteroEntre(3, 26)).padStart(2, '0')}`;
    if (!antesDeHoy(fecha)) continue;
    const porHora = rnd() < 0.3;
    const cantidad = porHora ? enteroEntre(4, 9) : enteroEntre(1, 3);
    const tarifa = porHora ? redondear(entre(9000, 11000), 500) : redondear(entre(62000, 76000), 1000);
    jornales.push({
      id: nuevoId('j'),
      trabajador: elegir(TRABAJADORES),
      quienPago: elegir(PAGADORES),
      labor: elegir(LABORES_GENERALES),
      fecha,
      unidad: porHora ? 'hora' : 'dia',
      cantidad,
      tarifa,
      valor: cantidad * tarifa,
      pagado: fecha < sumarDias(HOY, -20),
      creadoPor: UID,
    });
  }
}

// ------------------------------------------- inventario: compras y movimientos
// Se recorre en orden de fecha y, cuando falta stock para una aplicación, se
// registra la compra que en la vida real se habría hecho antes.
eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));

const stock = Object.fromEntries(INSUMOS.map((i) => [i.id, 0]));
const costoUnit = Object.fromEntries(INSUMOS.map((i) => [i.id, 0]));
const compras = [];
const movimientos = [];
const aplicaciones = [];
let fotosUsadas = 0;

function comprar(insumoId, cantidad, fecha) {
  const ins = porId[insumoId];
  // El precio sube con el calendario (~10% al año), no con cada compra, más un
  // poco de ruido porque nunca se compra dos veces al mismo precio.
  const meses = (Number(fecha.slice(0, 4)) - 2026) * 12 + Number(fecha.slice(5, 7)) - 1;
  const unitario = redondear(ins.precio * (1 + meses * 0.008) * entre(0.97, 1.03), 100);
  const costo = redondear(cantidad * unitario, 100);
  const compraId = nuevoId('cp');
  const conFoto = fotosUsadas < FOTOS_FACTURA.length && costo > 900000;
  compras.push({
    id: compraId,
    insumoId,
    producto: ins.nombre,
    cantidad,
    costo,
    fecha,
    proveedor: elegir(PROVEEDORES),
    personaQueCompro: elegir(PAGADORES),
    ...(conFoto ? { fotoFacturaUrl: FOTOS_FACTURA[fotosUsadas++] } : {}),
    creadoPor: UID,
  });
  movimientos.push({
    id: nuevoId('m'),
    insumoId,
    tipo: 'entrada',
    cantidad,
    costoUnitario: unitario,
    fecha,
    origen: 'compra',
    origenId: compraId,
    creadoPor: UID,
  });
  stock[insumoId] += cantidad;
  costoUnit[insumoId] = unitario;
}

for (const ev of eventos) {
  const ins = porId[ev.insumoId];
  // Si no alcanza, se hace la compra que en la vida real se habría hecho unos
  // días antes — y se compra de una para varias aplicaciones, no lo justo.
  if (stock[ev.insumoId] < ev.cantidad) {
    const faltante = ev.cantidad - stock[ev.insumoId];
    const bultos = Math.ceil(faltante / ins.lote) + enteroEntre(0, 1);
    comprar(ev.insumoId, bultos * ins.lote, sumarDias(ev.fecha, -enteroEntre(2, 6)));
  }

  const aplicacionId = nuevoId('a');
  const unitario = costoUnit[ev.insumoId];
  aplicaciones.push({
    id: aplicacionId,
    loteId: ev.loteId,
    cicloId: ev.cicloId,
    insumoId: ev.insumoId,
    producto: ins.nombre,
    cantidad: ev.cantidad,
    unidad: ins.unidad,
    costoEstimado: Math.round(ev.cantidad * unitario),
    dosis: `${(ev.cantidad / 1).toFixed(1)} ${ins.unidad}`,
    fecha: ev.fecha,
    responsable: ev.responsable,
    creadoPor: UID,
  });
  movimientos.push({
    id: nuevoId('m'),
    insumoId: ev.insumoId,
    tipo: 'salida',
    cantidad: ev.cantidad,
    costoUnitario: unitario,
    fecha: ev.fecha,
    origen: 'aplicacion',
    origenId: aplicacionId,
    loteId: ev.loteId,
    creadoPor: UID,
  });
  stock[ev.insumoId] -= ev.cantidad;
}

// Redondea el stock final para que no queden decimales de coma flotante feos.
for (const k of Object.keys(stock)) stock[k] = Number(stock[k].toFixed(2));

// El costoUnitario que guarda la app es siempre el de la compra MÁS RECIENTE
// por fecha (ver recalcularCostoUnitario en src/lib/insumos.ts). Las compras se
// generan retrofechadas unos días, así que el orden en que se crearon no es el
// orden cronológico: hay que recalcularlo igual que lo haría la app.
const insumosDocs = INSUMOS.map((i) => {
  const suyas = compras.filter((c) => c.insumoId === i.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultima = suyas[0];
  return {
    id: i.id,
    nombre: i.nombre,
    unidad: i.unidad,
    stockActual: stock[i.id],
    costoUnitario: ultima ? Math.round(ultima.costo / ultima.cantidad) : i.precio,
    creadoPor: UID,
  };
});

// ---------------------------------------------------------------- escritura
async function borrarColeccion(nombre) {
  const snap = await getDocs(collection(db, nombre));
  let n = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const b = writeBatch(db);
    for (const d of snap.docs.slice(i, i + 400)) {
      b.delete(d.ref);
      n++;
    }
    await b.commit();
  }
  return n;
}

console.log('Borrando datos anteriores...');
for (const c of ['aplicaciones', 'cosechas', 'riegos', 'ventas', 'compras', 'jornales', 'insumos', 'movimientos', 'ciclos']) {
  console.log(`  ${c}: ${await borrarColeccion(c)} borrados`);
}

async function escribir(nombre, items) {
  for (let i = 0; i < items.length; i += 400) {
    const b = writeBatch(db);
    for (const { id, ...data } of items.slice(i, i + 400)) b.set(doc(db, nombre, id), data);
    await b.commit();
  }
  console.log(`  ${nombre}: ${items.length} creados`);
}

console.log('Escribiendo escenario nuevo...');
await escribir('insumos', insumosDocs);
await escribir('ciclos', ciclos);
await escribir('aplicaciones', aplicaciones);
await escribir('cosechas', cosechas);
await escribir('riegos', riegos);
await escribir('ventas', ventas);
await escribir('compras', compras);
await escribir('jornales', jornales);
await escribir('movimientos', movimientos);

// Cada lote apunta a su ciclo abierto (o a ninguno si está en descanso).
console.log('Actualizando el ciclo activo de cada lote...');
for (const lote of LOTES) {
  const abierto = ciclos.find((c) => c.loteId === lote.id && c.estado === 'abierto');
  await updateDoc(doc(db, 'lotes', lote.id), { cicloActivoId: abierto ? abierto.id : null });
}

// Asegura los datos estructurales del lote por si el demo viejo los dejó raros.
for (const lote of LOTES) {
  await setDoc(doc(db, 'lotes', lote.id), { areaHectareas: lote.ha, cantidadArboles: lote.arboles }, { merge: true });
}

// ---------------------------------------------------------------- resumen
const total = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
console.log('\n===== ESCENARIO SEMBRADO =====');
console.log('Ciclos:', ciclos.length, `(${ciclos.filter((c) => c.estado === 'abierto').length} abiertos)`);
console.log('Aplicaciones:', aplicaciones.length, '| Cosechas:', cosechas.length, '| Riegos:', riegos.length);
console.log('Ventas:', ventas.length, '→ $', total(ventas, (v) => v.precio).toLocaleString('es-CO'),
  `(${ventas.filter((v) => !v.cobrado).length} sin cobrar)`);
console.log('Compras:', compras.length, '→ $', total(compras, (c) => c.costo).toLocaleString('es-CO'),
  `(${compras.filter((c) => c.fotoFacturaUrl).length} con foto de factura)`);
console.log('Jornales:', jornales.length, '→ $', total(jornales, (j) => j.valor).toLocaleString('es-CO'),
  `(${jornales.filter((j) => !j.pagado).length} sin pagar, ${jornales.filter((j) => !j.loteId).length} generales)`);
console.log('\nStock final por insumo:');
for (const i of insumosDocs) console.log(`  ${i.nombre.padEnd(24)} ${String(i.stockActual).padStart(7)} ${i.unidad}  @ $${i.costoUnitario.toLocaleString('es-CO')}`);

console.log('\nRentabilidad por lote (todos los ciclos juntos):');
for (const lote of LOTES) {
  const vendido = total(ventas.filter((v) => v.loteId === lote.id), (v) => v.precio);
  const insumo = total(aplicaciones.filter((a) => a.loteId === lote.id), (a) => a.costoEstimado);
  const mano = total(jornales.filter((j) => j.loteId === lote.id), (j) => j.valor);
  const bal = vendido - insumo - mano;
  console.log(
    `  ${lote.id.padEnd(9)} vendido $${vendido.toLocaleString('es-CO').padStart(12)}  insumos $${insumo.toLocaleString('es-CO').padStart(10)}  jornales $${mano.toLocaleString('es-CO').padStart(10)}  balance $${bal.toLocaleString('es-CO').padStart(12)}`,
  );
}
process.exit(0);
