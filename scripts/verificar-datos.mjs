import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const cfg = { apiKey: 'AIzaSyDXbXI5KfHRyBGnNP-_mxfyPqBviL48BE0', authDomain: 'agrodata-9c539.firebaseapp.com', projectId: 'agrodata-9c539', storageBucket: 'agrodata-9c539.firebasestorage.app', messagingSenderId: '430193125636', appId: '1:430193125636:web:39e9fc39bdff2a010f4851' };
const app = initializeApp(cfg); const db = getFirestore(app);
await signInWithEmailAndPassword(getAuth(app), 'admin@test.com', '123456');
const leer = async (c) => (await getDocs(collection(db, c))).docs.map(d => ({ id: d.id, ...d.data() }));
const [insumos, movs, ciclos, lotes, aplic, ventas, compras, jornales, cosechas] =
  await Promise.all(['insumos','movimientos','ciclos','lotes','aplicaciones','ventas','compras','jornales','cosechas'].map(leer));

let fallas = 0;
const mal = (m) => { console.log('  X', m); fallas++; };

console.log('1) Libro de inventario cuadra con el stock:');
for (const i of insumos) {
  const ms = movs.filter(m => m.insumoId === i.id);
  const neto = Number(ms.reduce((s,m) => s + (m.tipo === 'entrada' ? m.cantidad : -m.cantidad), 0).toFixed(2));
  if (Math.abs(neto - i.stockActual) > 0.01) mal(`${i.nombre}: libro ${neto} vs stock ${i.stockActual}`);
  if (i.stockActual < 0) mal(`${i.nombre}: stock NEGATIVO ${i.stockActual}`);
}
console.log('   revisados', insumos.length, 'insumos y', movs.length, 'movimientos');

console.log('2) Costo unitario = precio de la ultima compra:');
for (const i of insumos) {
  const cs = compras.filter(c => c.insumoId === i.id).sort((a,b) => b.fecha.localeCompare(a.fecha));
  if (!cs.length) continue;
  const esperado = Math.round(cs[0].costo / cs[0].cantidad);
  if (Math.abs(esperado - i.costoUnitario) > 1) mal(`${i.nombre}: costoUnitario ${i.costoUnitario} vs ultima compra ${esperado}`);
}

console.log('3) Un solo ciclo abierto por lote, y cicloActivoId apunta a el:');
for (const l of lotes) {
  const abiertos = ciclos.filter(c => c.loteId === l.id && c.estado === 'abierto');
  if (abiertos.length > 1) mal(`${l.id}: ${abiertos.length} ciclos abiertos`);
  const esperado = abiertos[0]?.id ?? null;
  if ((l.cicloActivoId ?? null) !== esperado) mal(`${l.id}: cicloActivoId ${l.cicloActivoId} != ${esperado}`);
}

console.log('4) Todo registro apunta a un ciclo y lote que existen:');
const idsCiclo = new Set(ciclos.map(c => c.id)), idsLote = new Set(lotes.map(l => l.id));
for (const [nom, arr] of [['aplicaciones',aplic],['ventas',ventas],['cosechas',cosechas]])
  for (const r of arr) { if (!idsCiclo.has(r.cicloId)) mal(`${nom}/${r.id}: ciclo huerfano`); if (!idsLote.has(r.loteId)) mal(`${nom}/${r.id}: lote huerfano`); }
for (const j of jornales) if (j.loteId && !idsLote.has(j.loteId)) mal(`jornal/${j.id}: lote huerfano`);

console.log('5) Ninguna fecha en el futuro (hoy 2026-09-02):');
for (const [nom, arr] of [['aplicaciones',aplic],['ventas',ventas],['cosechas',cosechas],['compras',compras],['jornales',jornales]])
  for (const r of arr) if (r.fecha > '2026-09-02') mal(`${nom}/${r.id}: fecha futura ${r.fecha}`);

console.log('6) Jornal: valor = cantidad x tarifa:');
for (const j of jornales) if (j.valor !== j.cantidad * j.tarifa) mal(`jornal/${j.id}: ${j.valor} != ${j.cantidad}x${j.tarifa}`);

console.log('7) Aplicacion: costoEstimado coherente con el movimiento de salida:');
for (const a of aplic) {
  const m = movs.find(x => x.origen === 'aplicacion' && x.origenId === a.id);
  if (!m) { mal(`aplicacion/${a.id}: sin movimiento de salida`); continue; }
  if (Math.abs(a.costoEstimado - Math.round(m.cantidad * m.costoUnitario)) > 1) mal(`aplicacion/${a.id}: costo ${a.costoEstimado} vs mov ${m.cantidad}x${m.costoUnitario}`);
}

console.log(fallas === 0 ? '\nTODO CONSISTENTE' : `\n${fallas} PROBLEMAS`);
process.exit(fallas === 0 ? 0 : 1);
