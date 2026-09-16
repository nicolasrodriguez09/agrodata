import { useEffect, useMemo, useState } from 'react';
import { escucharTodasLasVentas } from '../lib/ventas';
import { escucharCompras } from '../lib/compras';
import { escucharJornales } from '../lib/jornales';
import { escucharLotes } from '../lib/lotes';
import { escucharFincas } from '../lib/fincas';
import { escucharTodosLosCiclos } from '../lib/ciclos';
import { escucharTodasLasAplicaciones } from '../lib/aplicaciones';
import { useCountUp } from '../lib/useCountUp';
import { pesos, pesosCorto } from '../lib/formatoDinero';
import type { Aplicacion, Ciclo, CompraInsumo, Finca, Jornal, Lote, Venta } from '../types/models';
import GraficaTiempo from './finanzas/graficas/GraficaTiempo';
import GraficaDivergente from './finanzas/graficas/GraficaDivergente';
import GraficaBarras from './finanzas/graficas/GraficaBarras';
import BarraComposicion from './finanzas/BarraComposicion';
import RankingBarras from './finanzas/RankingBarras';
import DetalleGastosPeriodo from './finanzas/DetalleGastosPeriodo';
import DetalleVentasPeriodo from './finanzas/DetalleVentasPeriodo';
import DetalleFinancieroLote from './finanzas/DetalleFinancieroLote';

const MESES_A_MOSTRAR = 8;
const TOP_N = 8;

const NOMBRES_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function etiquetaMes(clave: string) {
  const [anio, mes] = clave.split('-');
  return `${NOMBRES_MES[Number(mes) - 1]} ${anio.slice(2)}`;
}

function formatoFecha(iso: string) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

type Vista = 'tiempo' | 'lotes' | 'costos' | 'ciclos';
const VISTAS: { id: Vista; label: string }[] = [
  { id: 'tiempo', label: 'Tiempo' },
  { id: 'lotes', label: 'Lotes' },
  { id: 'costos', label: 'Costos' },
  { id: 'ciclos', label: 'Ciclos' },
];

export interface RentabilidadLote {
  totalVendido: number;
  totalInsumos: number;
  totalJornales: number;
  totalInvertido: number;
  balance: number;
  retornoPct: number | null;
}

/** Título de sección: el mismo rótulo discreto en toda la vista. */
function Rotulo({ children, nota }: { children: React.ReactNode; nota?: string }) {
  return (
    <div className="mt-6 mb-2">
      <h3 className="font-display text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
        {children}
      </h3>
      {nota && (
        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-dim)' }}>
          {nota}
        </p>
      )}
    </div>
  );
}

function Indicador({
  label,
  valor,
  sufijo,
  tono,
  grande,
}: {
  label: string;
  valor: number;
  sufijo?: string;
  tono?: 'positivo' | 'negativo';
  grande?: boolean;
}) {
  const animado = useCountUp(valor);
  const color = tono === 'negativo' ? 'var(--serie-2)' : 'var(--text)';
  return (
    <div>
      <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
        {label}
      </p>
      <p
        className={`font-serif font-semibold tabular-nums ${grande ? 'text-xl' : 'text-base'}`}
        style={{ color }}
      >
        {sufijo ? `${animado}${sufijo}` : pesos(animado)}
      </p>
    </div>
  );
}

export default function ResumenFinanzas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<CompraInsumo[]>([]);
  const [jornales, setJornales] = useState<Jornal[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [vista, setVista] = useState<Vista>('tiempo');
  const [desdeTiempo, setDesdeTiempo] = useState('');
  const [hastaTiempo, setHastaTiempo] = useState('');
  const [porHectarea, setPorHectarea] = useState(false);
  const [mostrarDetalleGastos, setMostrarDetalleGastos] = useState(false);
  const [mostrarDetalleVentas, setMostrarDetalleVentas] = useState(false);
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<string | null>(null);

  useEffect(() => escucharTodasLasVentas(setVentas), []);
  useEffect(() => escucharCompras(setCompras), []);
  useEffect(() => escucharJornales(setJornales), []);
  useEffect(() => escucharTodasLasAplicaciones(setAplicaciones), []);
  useEffect(() => escucharLotes(setLotes), []);
  useEffect(() => escucharFincas(setFincas), []);
  useEffect(() => escucharTodosLosCiclos(setCiclos), []);

  function nombreFinca(fincaId: string | null) {
    if (fincaId === null) return 'Suelto';
    return fincas.find((f) => f.id === fincaId)?.nombre ?? 'Finca borrada';
  }

  const totalVendido = ventas.reduce((s, v) => s + v.precio, 0);
  const totalCompras = compras.reduce((s, c) => s + c.costo, 0);
  const totalJornales = jornales.reduce((s, j) => s + j.valor, 0);
  const totalGastado = totalCompras + totalJornales;
  const balance = totalVendido - totalGastado;
  const margenPct = totalVendido > 0 ? Math.round((balance / totalVendido) * 100) : 0;
  const porCobrar = ventas.filter((v) => !v.cobrado).reduce((s, v) => s + v.precio, 0);
  const porPagar = jornales.filter((j) => !j.pagado).reduce((s, j) => s + j.valor, 0);
  const hayDatos = ventas.length > 0 || compras.length > 0 || jornales.length > 0;
  const hayPeriodoPersonalizado = !!desdeTiempo || !!hastaTiempo;

  // --- Ingresos y costos por mes (global: los gastos no están atados a lote/ciclo) ---
  const ventasTiempo = hayPeriodoPersonalizado
    ? ventas.filter((v) => (!desdeTiempo || v.fecha >= desdeTiempo) && (!hastaTiempo || v.fecha <= hastaTiempo))
    : ventas;
  const comprasTiempo = hayPeriodoPersonalizado
    ? compras.filter((c) => (!desdeTiempo || c.fecha >= desdeTiempo) && (!hastaTiempo || c.fecha <= hastaTiempo))
    : compras;
  const jornalesTiempo = hayPeriodoPersonalizado
    ? jornales.filter((j) => (!desdeTiempo || j.fecha >= desdeTiempo) && (!hastaTiempo || j.fecha <= hastaTiempo))
    : jornales;

  const { etiquetasMes, serieVentas, serieGastos, serieFlujo } = useMemo(() => {
    const ventasPorMes = new Map<string, number>();
    ventasTiempo.forEach((v) => ventasPorMes.set(v.fecha.slice(0, 7), (ventasPorMes.get(v.fecha.slice(0, 7)) ?? 0) + v.precio));
    const gastosPorMes = new Map<string, number>();
    comprasTiempo.forEach((c) => gastosPorMes.set(c.fecha.slice(0, 7), (gastosPorMes.get(c.fecha.slice(0, 7)) ?? 0) + c.costo));
    jornalesTiempo.forEach((j) => gastosPorMes.set(j.fecha.slice(0, 7), (gastosPorMes.get(j.fecha.slice(0, 7)) ?? 0) + j.valor));

    const todos = Array.from(new Set([...ventasPorMes.keys(), ...gastosPorMes.keys()])).sort();
    const meses = hayPeriodoPersonalizado ? todos : todos.slice(-MESES_A_MOSTRAR);

    const v = meses.map((m) => ventasPorMes.get(m) ?? 0);
    const g = meses.map((m) => gastosPorMes.get(m) ?? 0);
    // Flujo acumulado: la plata que queda en el bolsillo mes a mes. En un cultivo
    // el gasto va meses antes que la cosecha, así que esta curva muestra qué tan
    // hondo hay que meterse antes de recuperar — que es justo lo que pregunta un banco.
    let corrido = 0;
    const flujo = meses.map((_, i) => (corrido += v[i] - g[i]));

    return { etiquetasMes: meses.map(etiquetaMes), serieVentas: v, serieGastos: g, serieFlujo: flujo };
  }, [ventasTiempo, comprasTiempo, jornalesTiempo, hayPeriodoPersonalizado]);

  const etiquetaPeriodo = !hayPeriodoPersonalizado
    ? 'Todo el historial'
    : desdeTiempo && hastaTiempo
      ? `${formatoFecha(desdeTiempo)} – ${formatoFecha(hastaTiempo)}`
      : desdeTiempo
        ? `Desde el ${formatoFecha(desdeTiempo)}`
        : `Hasta el ${formatoFecha(hastaTiempo)}`;

  const totalVendidoTiempo = ventasTiempo.reduce((s, v) => s + v.precio, 0);
  const totalComprasTiempo = comprasTiempo.reduce((s, c) => s + c.costo, 0);
  const totalJornalesTiempo = jornalesTiempo.reduce((s, j) => s + j.valor, 0);
  const totalGastadoTiempo = totalComprasTiempo + totalJornalesTiempo;
  const totalCobradoTiempo = ventasTiempo.filter((v) => v.cobrado).reduce((s, v) => s + v.precio, 0);
  const totalPendienteTiempo = totalVendidoTiempo - totalCobradoTiempo;

  // --- Rentabilidad por lote: todo el historial del lote, no un ciclo puntual.
  // Insumos son exactos (costoEstimado de cada aplicación). Jornales solo cuentan si se
  // marcaron con ese lote al registrarlos — los genéricos/compartidos quedan afuera.
  const rentabilidadPorLote = useMemo(() => {
    const mapa = new Map<string, RentabilidadLote>();
    for (const lote of lotes) {
      const totalVendidoLote = ventas.filter((v) => v.loteId === lote.id).reduce((s, v) => s + v.precio, 0);
      const totalInsumos = aplicaciones
        .filter((a) => a.loteId === lote.id)
        .reduce((s, a) => s + (a.costoEstimado ?? 0), 0);
      const totalJornalesLote = jornales.filter((j) => j.loteId === lote.id).reduce((s, j) => s + j.valor, 0);
      const totalInvertido = totalInsumos + totalJornalesLote;
      const bal = totalVendidoLote - totalInvertido;
      mapa.set(lote.id, {
        totalVendido: totalVendidoLote,
        totalInsumos,
        totalJornales: totalJornalesLote,
        totalInvertido,
        balance: bal,
        retornoPct: totalInvertido > 0 ? (bal / totalInvertido) * 100 : null,
      });
    }
    return mapa;
  }, [lotes, ventas, aplicaciones, jornales]);

  // Por hectárea es la comparación honesta: un lote de 2 ha que deja $30 M no es
  // mejor que uno de 0,8 ha que deja $13 M — rinde menos por hectárea sembrada.
  const filasLotes = useMemo(
    () =>
      lotes
        .filter((l) => {
          const r = rentabilidadPorLote.get(l.id);
          if (!r || (r.totalVendido === 0 && r.totalInvertido === 0)) return false;
          return porHectarea ? !!l.areaHectareas : true;
        })
        .map((l) => {
          const r = rentabilidadPorLote.get(l.id)!;
          const ha = l.areaHectareas ?? 1;
          return {
            id: l.id,
            etiqueta: l.nombre,
            sublabel: porHectarea ? `${nombreFinca(l.fincaId)} · ${l.areaHectareas} ha` : nombreFinca(l.fincaId),
            valor: porHectarea ? r.balance / ha : r.balance,
          };
        })
        .sort((a, b) => b.valor - a.valor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lotes, rentabilidadPorLote, porHectarea, fincas],
  );

  // --- En qué se va la plata ---
  const gastoPorProducto = useMemo(() => {
    const mapa = new Map<string, number>();
    comprasTiempo.forEach((c) => mapa.set(c.producto, (mapa.get(c.producto) ?? 0) + c.costo));
    return Array.from(mapa.entries())
      .map(([producto, total]) => ({ id: producto, etiqueta: producto, valor: total }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, TOP_N);
  }, [comprasTiempo]);

  const gastoPorLabor = useMemo(() => {
    const mapa = new Map<string, number>();
    jornalesTiempo.forEach((j) => {
      const clave = j.labor?.trim() || 'Sin labor anotada';
      mapa.set(clave, (mapa.get(clave) ?? 0) + j.valor);
    });
    return Array.from(mapa.entries())
      .map(([labor, total]) => ({ id: labor, etiqueta: labor, valor: total }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, TOP_N);
  }, [jornalesTiempo]);

  // --- Ventas por ciclo ---
  const rankingCiclos = useMemo(() => {
    const porCiclo = new Map<string, number>();
    ventas.forEach((v) => porCiclo.set(v.cicloId, (porCiclo.get(v.cicloId) ?? 0) + v.precio));
    return Array.from(porCiclo.entries())
      .map(([cicloId, total]) => {
        const ciclo = ciclos.find((c) => c.id === cicloId);
        const lote = ciclo ? lotes.find((l) => l.id === ciclo.loteId) : undefined;
        const sublabel = lote ? `${lote.nombre} · ${nombreFinca(lote.fincaId)}` : undefined;
        return { id: cicloId, label: ciclo?.nombre ?? 'Ciclo borrado', sublabel, valor: total };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, TOP_N);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventas, ciclos, lotes, fincas]);

  if (!hayDatos) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Todavía no hay ventas, compras ni jornales registrados para calcular un resumen.
      </p>
    );
  }

  const campoFecha = 'w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none';
  const estiloCampo = { borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' };

  return (
    <div>
      {/* Encabezado de indicadores: se lee como la cabecera de un estado de
          resultados, no como tres tarjetas sueltas. */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="grid grid-cols-2 gap-y-3">
          <Indicador label="Vendido" valor={totalVendido} grande />
          <Indicador label="Invertido" valor={totalGastado} grande />
        </div>
        <div
          className="mt-3 flex items-end justify-between gap-2 border-t pt-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <Indicador label="Margen" valor={balance} tono={balance >= 0 ? 'positivo' : 'negativo'} grande />
          <p
            className="font-serif text-xl font-semibold tabular-nums"
            style={{ color: balance >= 0 ? 'var(--serie-3)' : 'var(--serie-2)' }}
          >
            {balance >= 0 ? '+' : ''}
            {margenPct}%
          </p>
        </div>
        {(porCobrar > 0 || porPagar > 0) && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <Indicador label="Por cobrar" valor={porCobrar} />
            <Indicador label="Por pagar" valor={porPagar} />
          </div>
        )}
      </div>

      <div
        className="font-display mt-5 mb-1 flex rounded-full p-0.5 text-[11px] font-black tracking-wide"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {VISTAS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVista(v.id)}
            className="flex h-9 flex-1 items-center justify-center rounded-full uppercase transition"
            style={
              vista === v.id
                ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
                : { color: 'var(--text-dim)' }
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------------- TIEMPO */}
      {vista === 'tiempo' && (
        <div>
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                Desde
              </label>
              <input type="date" value={desdeTiempo} onChange={(e) => setDesdeTiempo(e.target.value)} className={campoFecha} style={estiloCampo} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                Hasta
              </label>
              <input type="date" value={hastaTiempo} onChange={(e) => setHastaTiempo(e.target.value)} className={campoFecha} style={estiloCampo} />
            </div>
            {hayPeriodoPersonalizado && (
              <button
                onClick={() => {
                  setDesdeTiempo('');
                  setHastaTiempo('');
                }}
                className="h-11 flex-none rounded-xl border px-3 text-xs font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
              >
                Limpiar
              </button>
            )}
          </div>

          <Rotulo nota="Toca un mes para ver las cifras exactas.">Ingresos y costos por mes</Rotulo>
          <div className="mb-2 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--serie-1)' }} />
              Ingresos
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--serie-2)' }} />
              Costos
            </span>
          </div>
          {etiquetasMes.length > 0 ? (
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <GraficaTiempo
                etiquetas={etiquetasMes}
                series={[
                  { nombre: 'Ingresos', color: 'var(--serie-1)', valores: serieVentas, conArea: true },
                  { nombre: 'Costos', color: 'var(--serie-2)', valores: serieGastos },
                ]}
              />
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay ventas, compras ni jornales en ese período.
            </p>
          )}

          {etiquetasMes.length > 1 && (
            <>
              <Rotulo nota="Cuánta plata neta llevas acumulada. Baja mientras se invierte y sube cuando entra la cosecha.">
                Flujo de caja acumulado
              </Rotulo>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <GraficaTiempo
                  etiquetas={etiquetasMes}
                  series={[{ nombre: 'Acumulado', color: 'var(--serie-3)', valores: serieFlujo, conArea: true }]}
                  alto={160}
                />
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                Punto más bajo: <b style={{ color: 'var(--text)' }}>{pesosCorto(Math.min(...serieFlujo))}</b> · cierre del
                período: <b style={{ color: 'var(--text)' }}>{pesosCorto(serieFlujo[serieFlujo.length - 1] ?? 0)}</b>
              </p>
            </>
          )}

          {hayPeriodoPersonalizado && (
            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <div className="grid grid-cols-3 gap-2">
                <Indicador label="Vendido" valor={totalVendidoTiempo} />
                <Indicador label="Invertido" valor={totalGastadoTiempo} />
                <Indicador
                  label="Margen"
                  valor={totalVendidoTiempo - totalGastadoTiempo}
                  tono={totalVendidoTiempo - totalGastadoTiempo >= 0 ? 'positivo' : 'negativo'}
                />
              </div>
            </div>
          )}

          {totalGastadoTiempo > 0 && (
            <div className="mt-4">
              <BarraComposicion
                titulo="Composición del gasto"
                segmentos={[
                  { label: 'Compras de insumos', valor: totalComprasTiempo, color: 'var(--serie-2)' },
                  { label: 'Jornales', valor: totalJornalesTiempo, color: 'var(--serie-1)' },
                ]}
                onVerDetalles={() => setMostrarDetalleGastos(true)}
              />
            </div>
          )}

          {totalVendidoTiempo > 0 && (
            <div className="mt-4">
              <BarraComposicion
                titulo="Cartera de ventas"
                segmentos={[
                  { label: 'Cobrado', valor: totalCobradoTiempo, color: 'var(--serie-3)' },
                  { label: 'Pendiente de cobro', valor: totalPendienteTiempo, color: 'var(--dormant)' },
                ]}
                onVerDetalles={() => setMostrarDetalleVentas(true)}
              />
            </div>
          )}

          <p className="mt-4 text-xs italic" style={{ color: 'var(--text-dim)' }}>
            Las compras y los jornales no están atados a un lote ni a un ciclo, así que estas cifras
            son de toda la finca.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------- LOTES */}
      {vista === 'lotes' && (
        <div>
          <div
            className="mt-4 flex rounded-xl p-0.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            {[
              { id: false, label: 'Margen total' },
              { id: true, label: 'Margen por hectárea' },
            ].map((o) => (
              <button
                key={String(o.id)}
                onClick={() => setPorHectarea(o.id)}
                className="flex h-9 flex-1 items-center justify-center rounded-lg transition"
                style={
                  porHectarea === o.id
                    ? { backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
                    : { color: 'var(--text-dim)' }
                }
              >
                {o.label}
              </button>
            ))}
          </div>

          <Rotulo
            nota={
              porHectarea
                ? 'Divide el margen entre las hectáreas del lote, para poder comparar lotes de distinto tamaño.'
                : 'Ganancia o pérdida de cada lote en todo su historial.'
            }
          >
            {porHectarea ? 'Margen por hectárea' : 'Margen por lote'}
          </Rotulo>

          {filasLotes.length > 0 ? (
            <>
              <GraficaDivergente
                filas={filasLotes}
                onClickFila={setLoteSeleccionadoId}
                formato={porHectarea ? (v) => `${pesosCorto(v)}/ha` : pesos}
              />
              <p className="mt-3 text-xs italic" style={{ color: 'var(--text-dim)' }}>
                Incluye los insumos de cada aplicación y los jornales marcados con ese lote. Los
                jornales sin lote asignado no se cuentan acá.
                {porHectarea && ' Solo aparecen los lotes que tienen el área registrada.'}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {porHectarea
                ? 'Ningún lote con movimientos tiene el área registrada.'
                : 'Todavía no hay ventas ni gastos registrados por lote.'}
            </p>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------- COSTOS */}
      {vista === 'costos' && (
        <div>
          <Rotulo nota={`Compras de insumos · ${etiquetaPeriodo.toLowerCase()}`}>En qué insumos se va la plata</Rotulo>
          {gastoPorProducto.length > 0 ? (
            <GraficaBarras filas={gastoPorProducto} color="var(--serie-2)" />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay compras registradas en este período.
            </p>
          )}

          <Rotulo nota="Dónde se va la mano de obra, que suele ser el gasto más grande.">
            En qué labores se va el jornal
          </Rotulo>
          {gastoPorLabor.length > 0 ? (
            <GraficaBarras filas={gastoPorLabor} color="var(--serie-1)" />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay jornales registrados en este período.
            </p>
          )}

          <p className="mt-4 text-xs italic" style={{ color: 'var(--text-dim)' }}>
            Usa el filtro de fechas de la pestaña Tiempo para acotar el período.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------- CICLOS */}
      {vista === 'ciclos' && (
        <div>
          <Rotulo nota="Lo vendido en cada ciclo de cosecha.">Ventas por ciclo</Rotulo>
          {rankingCiclos.length > 0 ? (
            <RankingBarras filas={rankingCiclos} />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Todavía no hay ventas registradas por ciclo.
            </p>
          )}
        </div>
      )}

      {mostrarDetalleGastos && (
        <DetalleGastosPeriodo
          compras={comprasTiempo}
          jornales={jornalesTiempo}
          etiquetaPeriodo={etiquetaPeriodo}
          onCerrar={() => setMostrarDetalleGastos(false)}
        />
      )}
      {mostrarDetalleVentas && (
        <DetalleVentasPeriodo
          ventas={ventasTiempo}
          lotes={lotes}
          fincas={fincas}
          etiquetaPeriodo={etiquetaPeriodo}
          onCerrar={() => setMostrarDetalleVentas(false)}
        />
      )}
      {loteSeleccionadoId &&
        (() => {
          const lote = lotes.find((l) => l.id === loteSeleccionadoId);
          if (!lote) return null;
          const rentabilidad = rentabilidadPorLote.get(lote.id) ?? {
            totalVendido: 0,
            totalInsumos: 0,
            totalJornales: 0,
            totalInvertido: 0,
            balance: 0,
            retornoPct: null,
          };
          return (
            <DetalleFinancieroLote
              lote={lote}
              nombreFinca={nombreFinca(lote.fincaId)}
              rentabilidad={rentabilidad}
              onCerrar={() => setLoteSeleccionadoId(null)}
            />
          );
        })()}
    </div>
  );
}
