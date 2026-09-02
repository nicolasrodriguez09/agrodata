import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { escucharLotes } from '../lib/lotes';
import { escucharFincas } from '../lib/fincas';
import { escucharCiclosDeLote } from '../lib/ciclos';
import { cargarResumenCiclo, type ResumenCiclo } from '../lib/resumenCiclo';
import { escucharAplicacionesDeCiclo, escucharTodasLasAplicaciones, formatoCantidadAplicacion } from '../lib/aplicaciones';
import { escucharCosechasDeCiclo, escucharTodasLasCosechas } from '../lib/cosechas';
import { escucharRiegosDeCiclo, escucharTodosLosRiegos } from '../lib/riegos';
import { escucharVentasDeCiclo, escucharTodasLasVentas } from '../lib/ventas';
import { escucharCompras } from '../lib/compras';
import { escucharJornales } from '../lib/jornales';
import { exportarExcel } from '../lib/exportarExcel';
import type { Aplicacion, Ciclo, CompraInsumo, Cosecha, Finca, Jornal, Lote, Riego, Venta } from '../types/models';
import { IconArrowLeft, IconDroplet, IconBasket, IconWaves, IconTag, IconUsers } from '../components/ui/Icons';

const COLOR_GASTO = '#b4552f';
const SUELTO = '__suelto__';

type Modo = 'ciclo' | 'periodo';

function fila(estilo: { color: string; colorTexto: string; Icon: typeof IconDroplet }, titulo: string, subtitulo: string, monto: number | null, key: string) {
  const { color, colorTexto, Icon } = estilo;
  return (
    <div
      key={key}
      className="reporte-fila flex gap-3 rounded-xl border p-3.5"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg" style={{ backgroundColor: color, color: colorTexto }}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
            {titulo}
          </p>
          {monto != null && (
            <p className="flex-none font-medium" style={{ color: 'var(--text)' }}>
              $ {monto.toLocaleString('es-CO')}
            </p>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {subtitulo}
        </p>
      </div>
    </div>
  );
}

export default function Reporte() {
  const [searchParams] = useSearchParams();
  const [modo, setModo] = useState<Modo>('ciclo');

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [jornalesTodos, setJornalesTodos] = useState<Jornal[]>([]);

  // --- Modo ciclo ---
  const [fincaId, setFincaId] = useState('');
  const [loteId, setLoteId] = useState(searchParams.get('loteId') ?? '');
  const [ciclosDelLote, setCiclosDelLote] = useState<Ciclo[]>([]);
  const [cicloId, setCicloId] = useState(searchParams.get('cicloId') ?? '');
  const [resumenCiclo, setResumenCiclo] = useState<ResumenCiclo | null>(null);
  const [aplicacionesCiclo, setAplicacionesCiclo] = useState<Aplicacion[]>([]);
  const [cosechasCiclo, setCosechasCiclo] = useState<Cosecha[]>([]);
  const [riegosCiclo, setRiegosCiclo] = useState<Riego[]>([]);
  const [ventasCiclo, setVentasCiclo] = useState<Venta[]>([]);

  // --- Modo período ---
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [ventasTodas, setVentasTodas] = useState<Venta[]>([]);
  const [comprasTodas, setComprasTodas] = useState<CompraInsumo[]>([]);
  const [aplicacionesTodas, setAplicacionesTodas] = useState<Aplicacion[]>([]);
  const [cosechasTodas, setCosechasTodas] = useState<Cosecha[]>([]);
  const [riegosTodos, setRiegosTodos] = useState<Riego[]>([]);

  const [exportando, setExportando] = useState(false);

  useEffect(() => escucharLotes(setLotes), []);
  useEffect(() => escucharFincas(setFincas), []);
  useEffect(() => escucharJornales(setJornalesTodos), []);

  useEffect(() => {
    if (!loteId) {
      setCiclosDelLote([]);
      return;
    }
    return escucharCiclosDeLote(loteId, setCiclosDelLote);
  }, [loteId]);

  // Preselecciona el ciclo activo (o el más reciente) si no vino uno por la URL.
  useEffect(() => {
    if (cicloId || ciclosDelLote.length === 0) return;
    const lote = lotes.find((l) => l.id === loteId);
    const activo = ciclosDelLote.find((c) => c.id === lote?.cicloActivoId);
    const masReciente = [...ciclosDelLote].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))[0];
    setCicloId((activo ?? masReciente)?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciclosDelLote]);

  useEffect(() => {
    if (modo !== 'ciclo' || !cicloId) {
      setResumenCiclo(null);
      return;
    }
    let cancelado = false;
    cargarResumenCiclo(cicloId).then((r) => {
      if (!cancelado) setResumenCiclo(r);
    });
    return () => {
      cancelado = true;
    };
  }, [modo, cicloId]);

  useEffect(() => {
    if (modo !== 'ciclo' || !cicloId) {
      setAplicacionesCiclo([]);
      setCosechasCiclo([]);
      setRiegosCiclo([]);
      setVentasCiclo([]);
      return;
    }
    const u1 = escucharAplicacionesDeCiclo(cicloId, setAplicacionesCiclo);
    const u2 = escucharCosechasDeCiclo(cicloId, setCosechasCiclo);
    const u3 = escucharRiegosDeCiclo(cicloId, setRiegosCiclo);
    const u4 = escucharVentasDeCiclo(cicloId, setVentasCiclo);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [modo, cicloId]);

  useEffect(() => {
    if (modo !== 'periodo') return;
    const u1 = escucharTodasLasVentas(setVentasTodas);
    const u2 = escucharCompras(setComprasTodas);
    const u3 = escucharTodasLasAplicaciones(setAplicacionesTodas);
    const u4 = escucharTodasLasCosechas(setCosechasTodas);
    const u5 = escucharTodosLosRiegos(setRiegosTodos);
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
    };
  }, [modo]);

  function nombreFinca(fId: string | null) {
    if (fId === null) return 'Suelto';
    return fincas.find((f) => f.id === fId)?.nombre ?? 'Finca borrada';
  }
  function nombreLote(lId?: string) {
    if (!lId) return '—';
    const l = lotes.find((x) => x.id === lId);
    return l ? `${l.nombre} · ${nombreFinca(l.fincaId)}` : 'Lote borrado';
  }

  const lotesFiltrados = !fincaId ? lotes : fincaId === SUELTO ? lotes.filter((l) => l.fincaId === null) : lotes.filter((l) => l.fincaId === fincaId);
  const loteSeleccionado = lotes.find((l) => l.id === loteId);
  const cicloSeleccionado = ciclosDelLote.find((c) => c.id === cicloId);

  // Jornales del lote cuya fecha cae dentro del rango del ciclo — jornal no tiene cicloId,
  // así que esto es la mejor aproximación honesta (mismo criterio que DetalleFinancieroLote).
  const jornalesCiclo =
    modo === 'ciclo' && loteId && cicloSeleccionado
      ? jornalesTodos.filter(
          (j) => j.loteId === loteId && j.fecha >= cicloSeleccionado.fechaInicio && (!cicloSeleccionado.fechaCierre || j.fecha <= cicloSeleccionado.fechaCierre),
        )
      : [];

  const enRango = (fecha: string) => (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
  const ventasPeriodo = ventasTodas.filter((v) => enRango(v.fecha));
  const comprasPeriodo = comprasTodas.filter((c) => enRango(c.fecha));
  const aplicacionesPeriodo = aplicacionesTodas.filter((a) => enRango(a.fecha));
  const cosechasPeriodo = cosechasTodas.filter((c) => enRango(c.fecha));
  const riegosPeriodo = riegosTodos.filter((r) => enRango(r.fecha));
  const jornalesPeriodo = jornalesTodos.filter((j) => enRango(j.fecha));

  const aplicaciones = modo === 'ciclo' ? aplicacionesCiclo : aplicacionesPeriodo;
  const cosechas = modo === 'ciclo' ? cosechasCiclo : cosechasPeriodo;
  const riegos = modo === 'ciclo' ? riegosCiclo : riegosPeriodo;
  const ventas = modo === 'ciclo' ? ventasCiclo : ventasPeriodo;
  const compras = modo === 'ciclo' ? [] : comprasPeriodo;
  const jornales = modo === 'ciclo' ? jornalesCiclo : jornalesPeriodo;

  const totalVendido = ventas.reduce((s, v) => s + v.precio, 0);
  const totalInsumos = modo === 'ciclo' ? (resumenCiclo?.totalGastado ?? 0) : aplicaciones.reduce((s, a) => s + (a.costoEstimado ?? 0), 0);
  const totalJornalesMonto = jornales.reduce((s, j) => s + j.valor, 0);
  const totalCompras = compras.reduce((s, c) => s + c.costo, 0);
  const totalInvertido = totalInsumos + totalJornalesMonto + totalCompras;
  const balance = totalVendido - totalInvertido;
  const retornoPct = totalInvertido > 0 ? (balance / totalInvertido) * 100 : null;

  const listo = modo === 'ciclo' ? !!cicloId : true;
  const hayContenido = aplicaciones.length + cosechas.length + riegos.length + ventas.length + compras.length + jornales.length > 0;

  const alcance =
    modo === 'ciclo'
      ? loteSeleccionado && cicloSeleccionado
        ? `${loteSeleccionado.nombre} · ${nombreFinca(loteSeleccionado.fincaId)} — ${cicloSeleccionado.nombre}`
        : 'Elegí un lote y un ciclo'
      : `Toda la finca — ${desde ? desde : 'inicio'} a ${hasta ? hasta : 'hoy'}`;

  const generadoEl = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  async function handleExportarExcel() {
    setExportando(true);
    try {
      await exportarExcel({
        alcance,
        generadoEl,
        aplicaciones,
        cosechas,
        riegos,
        ventas,
        compras,
        jornales,
        nombreLote,
      });
    } finally {
      setExportando(false);
    }
  }

  const campo = 'w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none';
  const campoEstilo = { borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' };
  const label = 'mb-1 block text-xs';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <div className="no-imprimir">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          <IconArrowLeft className="h-4 w-4" />
          Volver al Panel
        </Link>

        <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Generar reporte
        </h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
          Armá un consolidado imprimible o en Excel para un crédito o un auditor.
        </p>

        <div
          className="font-display mb-4 flex rounded-full p-0.5 text-[11px] font-black tracking-wide"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {(
            [
              { id: 'ciclo' as const, label: 'Por ciclo' },
              { id: 'periodo' as const, label: 'Por período' },
            ]
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setModo(m.id)}
              className="flex-1 rounded-full py-2 uppercase transition"
              style={modo === m.id ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' } : { color: 'var(--text-dim)' }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {modo === 'ciclo' ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div>
              <label className={label} style={{ color: 'var(--text-dim)' }}>
                Finca
              </label>
              <select value={fincaId} onChange={(e) => setFincaId(e.target.value)} className={campo} style={campoEstilo}>
                <option value="">Todas</option>
                {fincas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
                <option value={SUELTO}>Sueltos</option>
              </select>
            </div>
            <div>
              <label className={label} style={{ color: 'var(--text-dim)' }}>
                Lote
              </label>
              <select
                value={loteId}
                onChange={(e) => {
                  setLoteId(e.target.value);
                  setCicloId('');
                }}
                className={campo}
                style={campoEstilo}
              >
                <option value="">Elegí un lote</option>
                {lotesFiltrados.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre} · {nombreFinca(l.fincaId)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={label} style={{ color: loteId ? 'var(--text-dim)' : 'var(--nodata-text)' }}>
                Ciclo
              </label>
              <select value={cicloId} onChange={(e) => setCicloId(e.target.value)} disabled={!loteId} className={`${campo} disabled:opacity-50`} style={campoEstilo}>
                <option value="">Elegí un ciclo</option>
                {[...ciclosDelLote]
                  .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.estado === 'abierto' ? '(activo)' : `· cerrado ${c.fechaCierre}`}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex gap-2">
            <div className="flex-1">
              <label className={label} style={{ color: 'var(--text-dim)' }}>
                Desde
              </label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={campo} style={campoEstilo} />
            </div>
            <div className="flex-1">
              <label className={label} style={{ color: 'var(--text-dim)' }}>
                Hasta
              </label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campo} style={campoEstilo} />
            </div>
          </div>
        )}

        {listo && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-xl py-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
            >
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={handleExportarExcel}
              disabled={exportando}
              className="flex-1 rounded-xl border py-3 text-sm font-medium disabled:opacity-60"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {exportando ? 'Generando...' : 'Exportar a Excel'}
            </button>
          </div>
        )}
      </div>

      {!listo ? (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Elegí un lote y un ciclo arriba para armar el reporte.
        </p>
      ) : (
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            AgroData — Reporte consolidado
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {alcance}
          </p>
          <p className="mb-4 text-xs" style={{ color: 'var(--text-dim)' }}>
            Generado el {generadoEl}
          </p>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Vendido
              </p>
              <p className="font-serif text-sm font-semibold" style={{ color: 'var(--text)' }}>
                $ {totalVendido.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Invertido
              </p>
              <p className="font-serif text-sm font-semibold" style={{ color: 'var(--text)' }}>
                $ {totalInvertido.toLocaleString('es-CO')}
              </p>
            </div>
            <div
              className="rounded-xl border p-3 text-center"
              style={{
                borderColor: balance >= 0 ? 'var(--recent)' : COLOR_GASTO,
                backgroundColor: balance >= 0 ? 'color-mix(in srgb, var(--recent) 12%, transparent)' : `color-mix(in srgb, ${COLOR_GASTO} 12%, transparent)`,
              }}
            >
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Balance
              </p>
              <p className="font-serif text-sm font-semibold" style={{ color: 'var(--text)' }}>
                $ {balance.toLocaleString('es-CO')}
              </p>
            </div>
            <div
              className="rounded-xl border p-3 text-center"
              style={{
                borderColor: (retornoPct ?? 0) >= 0 ? 'var(--recent)' : COLOR_GASTO,
                backgroundColor: (retornoPct ?? 0) >= 0 ? 'color-mix(in srgb, var(--recent) 12%, transparent)' : `color-mix(in srgb, ${COLOR_GASTO} 12%, transparent)`,
              }}
            >
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                % Retorno
              </p>
              <p className="font-serif text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {retornoPct != null ? `${retornoPct >= 0 ? '+' : ''}${Math.round(retornoPct)}%` : '—'}
              </p>
            </div>
          </div>
          {modo === 'ciclo' && (
            <p className="mb-5 text-xs italic" style={{ color: 'var(--text-dim)' }}>
              Insumos exactos (vía costo de inventario) + jornales marcados con este lote dentro de las fechas del ciclo. No incluye
              compras generales de la finca, que no son de un lote puntual.
            </p>
          )}
          {modo === 'periodo' && (
            <p className="mb-5 text-xs italic" style={{ color: 'var(--text-dim)' }}>
              Incluye toda la finca: insumos, compras generales y jornales del período elegido.
            </p>
          )}

          {!hayContenido ? (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              No hay registros para este alcance.
            </p>
          ) : (
            <>
              {aplicaciones.length > 0 && (
                <>
                  <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
                    Aplicaciones ({aplicaciones.length})
                  </h2>
                  <div className="mb-5 flex flex-col gap-2">
                    {aplicaciones.map((a) =>
                      fila(
                        { color: 'var(--recent)', colorTexto: 'var(--recent-text)', Icon: IconDroplet },
                        a.producto,
                        `${a.fecha} · ${formatoCantidadAplicacion(a)}${a.dosis ? ` · ${a.dosis}` : ''} · aplicó ${a.responsable}${modo === 'periodo' ? ` · ${nombreLote(a.loteId)}` : ''}`,
                        a.costoEstimado ?? null,
                        a.id,
                      ),
                    )}
                  </div>
                </>
              )}

              {cosechas.length > 0 && (
                <>
                  <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
                    Cosechas ({cosechas.length})
                  </h2>
                  <div className="mb-5 flex flex-col gap-2">
                    {cosechas.map((c) =>
                      fila(
                        { color: 'var(--cosecha)', colorTexto: 'var(--cosecha-text)', Icon: IconBasket },
                        `Cosecha: ${c.cantidad}`,
                        `${c.fecha} · ${c.calidad ?? 'Sin clasificar'}${modo === 'periodo' ? ` · ${nombreLote(c.loteId)}` : ''}`,
                        null,
                        c.id,
                      ),
                    )}
                  </div>
                </>
              )}

              {riegos.length > 0 && (
                <>
                  <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
                    Riegos ({riegos.length})
                  </h2>
                  <div className="mb-5 flex flex-col gap-2">
                    {riegos.map((r) =>
                      fila(
                        { color: 'var(--riego)', colorTexto: 'var(--riego-text)', Icon: IconWaves },
                        `Riego${r.metodo ? `: ${r.metodo}` : ''}`,
                        `${r.fecha} · ${r.duracion ? `${r.duracion} · ` : ''}regó ${r.responsable}${modo === 'periodo' ? ` · ${nombreLote(r.loteId)}` : ''}`,
                        null,
                        r.id,
                      ),
                    )}
                  </div>
                </>
              )}

              {ventas.length > 0 && (
                <>
                  <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
                    Ventas ({ventas.length})
                  </h2>
                  <div className="mb-5 flex flex-col gap-2">
                    {ventas.map((v) =>
                      fila(
                        { color: 'var(--gold)', colorTexto: 'var(--gold-ink)', Icon: IconTag },
                        `$ ${v.precio.toLocaleString('es-CO')}`,
                        `${v.fecha} · ${v.cantidad}${v.comprador ? ` · ${v.comprador}` : ''} · ${v.cobrado ? 'Cobrado' : 'Pendiente'}${modo === 'periodo' ? ` · ${nombreLote(v.loteId)}` : ''}`,
                        null,
                        v.id,
                      ),
                    )}
                  </div>
                </>
              )}

              {compras.length > 0 && (
                <>
                  <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
                    Compras ({compras.length})
                  </h2>
                  <div className="mb-5 flex flex-col gap-2">
                    {compras.map((c) => (
                      <div
                        key={c.id}
                        className="reporte-fila rounded-xl border p-3.5"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                              {c.producto}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                              {c.fecha}
                              {c.proveedor ? ` · ${c.proveedor}` : ''} · compró {c.personaQueCompro}
                            </p>
                          </div>
                          <p className="flex-none font-medium" style={{ color: 'var(--text)' }}>
                            $ {c.costo.toLocaleString('es-CO')}
                          </p>
                        </div>
                        {c.fotoFacturaUrl && (
                          <img
                            src={c.fotoFacturaUrl}
                            alt="Factura"
                            className="mt-2 max-h-64 rounded-lg object-contain"
                            style={{ border: '1px solid var(--border)' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {jornales.length > 0 && (
                <>
                  <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
                    Jornales ({jornales.length})
                  </h2>
                  <div className="mb-5 flex flex-col gap-2">
                    {jornales.map((j) =>
                      fila(
                        { color: COLOR_GASTO, colorTexto: '#fbfaf2', Icon: IconUsers },
                        j.trabajador,
                        `${j.fecha} · ${j.labor ? `${j.labor} · ` : ''}pagó ${j.quienPago}${modo === 'periodo' ? ` · ${nombreLote(j.loteId)}` : ''}`,
                        j.valor,
                        j.id,
                      ),
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
