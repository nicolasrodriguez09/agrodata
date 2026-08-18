import { useEffect, useState } from 'react';
import { escucharTodasLasVentas } from '../lib/ventas';
import { escucharCompras } from '../lib/compras';
import { escucharJornales } from '../lib/jornales';
import { escucharLotes } from '../lib/lotes';
import { escucharFincas } from '../lib/fincas';
import { escucharTodosLosCiclos } from '../lib/ciclos';
import { useCountUp } from '../lib/useCountUp';
import type { Ciclo, CompraInsumo, Finca, Jornal, Lote, Venta } from '../types/models';
import GraficaLineas from './finanzas/GraficaLineas';
import BarraComposicion from './finanzas/BarraComposicion';
import RankingBarras from './finanzas/RankingBarras';
import DetalleGastosPeriodo from './finanzas/DetalleGastosPeriodo';
import DetalleVentasPeriodo from './finanzas/DetalleVentasPeriodo';

const COLOR_GASTO = '#b4552f';
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

type Vista = 'tiempo' | 'lotes' | 'ciclos';
const VISTAS: { id: Vista; label: string }[] = [
  { id: 'tiempo', label: 'Tiempo' },
  { id: 'lotes', label: 'Lotes' },
  { id: 'ciclos', label: 'Ciclos' },
];

function TarjetaTotal({ label, valor, tono }: { label: string; valor: number; tono?: 'positivo' | 'negativo' }) {
  const animado = useCountUp(valor);
  const color =
    tono === 'positivo' ? 'var(--recent)' : tono === 'negativo' ? COLOR_GASTO : 'var(--text)';
  return (
    <div className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
        {label}
      </p>
      <p className="font-serif text-sm font-semibold" style={{ color }}>
        $ {animado.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

export default function ResumenFinanzas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<CompraInsumo[]>([]);
  const [jornales, setJornales] = useState<Jornal[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [vista, setVista] = useState<Vista>('tiempo');
  const [desdeTiempo, setDesdeTiempo] = useState('');
  const [hastaTiempo, setHastaTiempo] = useState('');
  const [mostrarDetalleGastos, setMostrarDetalleGastos] = useState(false);
  const [mostrarDetalleVentas, setMostrarDetalleVentas] = useState(false);

  useEffect(() => escucharTodasLasVentas(setVentas), []);
  useEffect(() => escucharCompras(setCompras), []);
  useEffect(() => escucharJornales(setJornales), []);
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
  const hayDatos = ventas.length > 0 || compras.length > 0 || jornales.length > 0;
  const hayPeriodoPersonalizado = !!desdeTiempo || !!hastaTiempo;

  // --- Gastos vs. ventas por mes (global: los gastos no están atados a lote/ciclo) ---
  // Sin filtro de período: se mantiene "global" tal como estaba, mostrando los últimos
  // MESES_A_MOSTRAR meses. Con Desde/Hasta elegido a mano, se respeta ese rango completo,
  // sin recortarlo.
  const ventasTiempo = hayPeriodoPersonalizado
    ? ventas.filter((v) => (!desdeTiempo || v.fecha >= desdeTiempo) && (!hastaTiempo || v.fecha <= hastaTiempo))
    : ventas;
  const comprasTiempo = hayPeriodoPersonalizado
    ? compras.filter((c) => (!desdeTiempo || c.fecha >= desdeTiempo) && (!hastaTiempo || c.fecha <= hastaTiempo))
    : compras;
  const jornalesTiempo = hayPeriodoPersonalizado
    ? jornales.filter((j) => (!desdeTiempo || j.fecha >= desdeTiempo) && (!hastaTiempo || j.fecha <= hastaTiempo))
    : jornales;

  const ventasPorMes = new Map<string, number>();
  ventasTiempo.forEach((v) => ventasPorMes.set(v.fecha.slice(0, 7), (ventasPorMes.get(v.fecha.slice(0, 7)) ?? 0) + v.precio));
  const gastosPorMes = new Map<string, number>();
  comprasTiempo.forEach((c) => gastosPorMes.set(c.fecha.slice(0, 7), (gastosPorMes.get(c.fecha.slice(0, 7)) ?? 0) + c.costo));
  jornalesTiempo.forEach((j) => gastosPorMes.set(j.fecha.slice(0, 7), (gastosPorMes.get(j.fecha.slice(0, 7)) ?? 0) + j.valor));
  const mesesOrdenados = Array.from(new Set([...ventasPorMes.keys(), ...gastosPorMes.keys()])).sort();
  const mesesAMostrar = hayPeriodoPersonalizado ? mesesOrdenados : mesesOrdenados.slice(-MESES_A_MOSTRAR);
  const datosPorTiempo = mesesAMostrar.map((m) => ({
    label: etiquetaMes(m),
    ventas: ventasPorMes.get(m) ?? 0,
    gastos: gastosPorMes.get(m) ?? 0,
  }));

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

  // --- Ventas por lote ---
  const ventasPorLote = new Map<string, number>();
  ventas.forEach((v) => ventasPorLote.set(v.loteId, (ventasPorLote.get(v.loteId) ?? 0) + v.precio));
  const rankingLotes = Array.from(ventasPorLote.entries())
    .map(([loteId, total]) => {
      const lote = lotes.find((l) => l.id === loteId);
      return { id: loteId, label: lote?.nombre ?? 'Lote borrado', sublabel: lote ? nombreFinca(lote.fincaId) : undefined, valor: total };
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, TOP_N);

  // --- Ventas por ciclo ---
  const ventasPorCiclo = new Map<string, number>();
  ventas.forEach((v) => ventasPorCiclo.set(v.cicloId, (ventasPorCiclo.get(v.cicloId) ?? 0) + v.precio));
  const rankingCiclos = Array.from(ventasPorCiclo.entries())
    .map(([cicloId, total]) => {
      const ciclo = ciclos.find((c) => c.id === cicloId);
      const lote = ciclo ? lotes.find((l) => l.id === ciclo.loteId) : undefined;
      const sublabel = lote ? `${lote.nombre} · ${nombreFinca(lote.fincaId)}` : undefined;
      return { id: cicloId, label: ciclo?.nombre ?? 'Ciclo borrado', sublabel, valor: total };
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, TOP_N);

  if (!hayDatos) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Todavía no hay ventas, compras ni jornales registrados para calcular un resumen.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <TarjetaTotal label="Vendido" valor={totalVendido} />
        <TarjetaTotal label="Gastado" valor={totalGastado} />
        <TarjetaTotal label="Balance" valor={balance} tono={balance >= 0 ? 'positivo' : 'negativo'} />
      </div>

      <div
        className="font-display mt-5 mb-4 flex rounded-full p-0.5 text-[11px] font-black tracking-wide"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {VISTAS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVista(v.id)}
            className="flex-1 rounded-full py-2 uppercase transition"
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

      {vista === 'tiempo' && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                Desde
              </label>
              <input
                type="date"
                value={desdeTiempo}
                onChange={(e) => setDesdeTiempo(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                Hasta
              </label>
              <input
                type="date"
                value={hastaTiempo}
                onChange={(e) => setHastaTiempo(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            {hayPeriodoPersonalizado && (
              <button
                onClick={() => {
                  setDesdeTiempo('');
                  setHastaTiempo('');
                }}
                className="flex-none self-end rounded-xl border px-3 py-2 text-xs font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="mb-2 flex items-center gap-4">
            <h3 className="font-display text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
              {hayPeriodoPersonalizado ? 'Período elegido' : 'Gastos vs. ventas'}
            </h3>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--recent)' }} />
              Ventas
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLOR_GASTO }} />
              Gastos
            </span>
          </div>
          {datosPorTiempo.length > 0 ? (
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <GraficaLineas datos={datosPorTiempo} />
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay ventas, compras ni jornales en ese período.
            </p>
          )}

          {hayPeriodoPersonalizado && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <TarjetaTotal label="Vendido" valor={totalVendidoTiempo} />
              <TarjetaTotal label="Gastado" valor={totalGastadoTiempo} />
              <TarjetaTotal
                label="Balance"
                valor={totalVendidoTiempo - totalGastadoTiempo}
                tono={totalVendidoTiempo - totalGastadoTiempo >= 0 ? 'positivo' : 'negativo'}
              />
            </div>
          )}

          {totalGastadoTiempo > 0 && (
            <div className="mt-4">
              <BarraComposicion
                titulo="¿De dónde vienen tus gastos?"
                segmentos={[
                  { label: 'Compras de insumos', valor: totalComprasTiempo, color: 'var(--gold)' },
                  { label: 'Jornales', valor: totalJornalesTiempo, color: COLOR_GASTO },
                ]}
                onVerDetalles={() => setMostrarDetalleGastos(true)}
              />
            </div>
          )}

          {totalVendidoTiempo > 0 && (
            <div className="mt-4">
              <BarraComposicion
                titulo="¿Cuánto de lo vendido ya cobraste?"
                segmentos={[
                  { label: 'Cobrado', valor: totalCobradoTiempo, color: 'var(--recent)' },
                  { label: 'Pendiente', valor: totalPendienteTiempo, color: 'var(--dormant)' },
                ]}
                onVerDetalles={() => setMostrarDetalleVentas(true)}
              />
            </div>
          )}
        </div>
      )}

      {vista === 'lotes' &&
        (rankingLotes.length > 0 ? (
          <RankingBarras filas={rankingLotes} />
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Todavía no hay ventas registradas por lote.
          </p>
        ))}

      {vista === 'ciclos' &&
        (rankingCiclos.length > 0 ? (
          <RankingBarras filas={rankingCiclos} />
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Todavía no hay ventas registradas por ciclo.
          </p>
        ))}

      {vista === 'tiempo' && (
        <p className="mt-3 text-xs italic" style={{ color: 'var(--text-dim)' }}>
          Los gastos (compras + jornales) no están atados a un lote o ciclo, así que solo se pueden ver a nivel
          general.
        </p>
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
    </div>
  );
}
