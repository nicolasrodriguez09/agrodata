import { useEffect, useState } from 'react';
import { escucharCiclosDeLote } from '../../lib/ciclos';
import { cargarResumenCiclo, type ResumenCiclo } from '../../lib/resumenCiclo';
import { escucharVentasDeCiclo } from '../../lib/ventas';
import { escucharAplicacionesDeCiclo, formatoCantidadAplicacion } from '../../lib/aplicaciones';
import type { Aplicacion, Ciclo, Lote, Venta } from '../../types/models';
import { IconArrowLeft, IconDroplet, IconTag } from '../ui/Icons';

interface Props {
  lote: Lote;
  nombreFinca: string;
  onCerrar: () => void;
}

const COLOR_GASTO = '#b4552f';

export default function DetalleFinancieroLote({ lote, nombreFinca, onCerrar }: Props) {
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [cicloSeleccionadoId, setCicloSeleccionadoId] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenCiclo | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);

  useEffect(() => escucharCiclosDeLote(lote.id, setCiclos), [lote.id]);

  // Al cargar los ciclos, elegimos el activo del lote (o el más reciente) como punto de partida.
  useEffect(() => {
    if (cicloSeleccionadoId || ciclos.length === 0) return;
    const activo = ciclos.find((c) => c.id === lote.cicloActivoId);
    const masReciente = [...ciclos].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))[0];
    setCicloSeleccionadoId((activo ?? masReciente)?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciclos]);

  useEffect(() => {
    if (!cicloSeleccionadoId) {
      setResumen(null);
      return;
    }
    let cancelado = false;
    cargarResumenCiclo(cicloSeleccionadoId).then((r) => {
      if (!cancelado) setResumen(r);
    });
    return () => {
      cancelado = true;
    };
  }, [cicloSeleccionadoId]);

  useEffect(() => {
    if (!cicloSeleccionadoId) {
      setVentas([]);
      setAplicaciones([]);
      return;
    }
    const unsubVentas = escucharVentasDeCiclo(cicloSeleccionadoId, setVentas);
    const unsubAplicaciones = escucharAplicacionesDeCiclo(cicloSeleccionadoId, setAplicaciones);
    return () => {
      unsubVentas();
      unsubAplicaciones();
    };
  }, [cicloSeleccionadoId]);

  const cicloSeleccionado = ciclos.find((c) => c.id === cicloSeleccionadoId);
  const ciclosOrdenados = [...ciclos].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button onClick={onCerrar} className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          <IconArrowLeft className="h-4 w-4" />
          Volver a lotes
        </button>

        <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          {lote.nombre}
        </h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
          {nombreFinca} · {lote.cultivo}
        </p>

        {ciclosOrdenados.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Este lote todavía no tiene ciclos.
          </p>
        ) : (
          <>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text)' }}>
              Ciclo
            </label>
            <select
              value={cicloSeleccionadoId ?? ''}
              onChange={(e) => setCicloSeleccionadoId(e.target.value)}
              className="mb-4 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            >
              {ciclosOrdenados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.estado === 'abierto' ? '(activo)' : `· cerrado ${c.fechaCierre}`}
                </option>
              ))}
            </select>

            {!resumen ? (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Cargando...
              </p>
            ) : (
              <div className="mb-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Gastado
                  </p>
                  <p className="font-serif text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    $ {resumen.totalGastado.toLocaleString('es-CO')}
                  </p>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Vendido
                  </p>
                  <p className="font-serif text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    $ {resumen.totalVendido.toLocaleString('es-CO')}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3 text-center"
                  style={{
                    borderColor: resumen.balance >= 0 ? 'var(--recent)' : COLOR_GASTO,
                    backgroundColor:
                      resumen.balance >= 0
                        ? 'color-mix(in srgb, var(--recent) 12%, transparent)'
                        : `color-mix(in srgb, ${COLOR_GASTO} 12%, transparent)`,
                  }}
                >
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    Balance
                  </p>
                  <p className="font-serif text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    $ {resumen.balance.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            )}

            <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
              Aplicaciones ({aplicaciones.length})
            </h2>
            {aplicaciones.length === 0 ? (
              <p className="mb-5 text-sm" style={{ color: 'var(--text-dim)' }}>
                Sin aplicaciones en este ciclo.
              </p>
            ) : (
              <div className="mb-5 flex flex-col gap-2">
                {aplicaciones.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }}>
                      <IconDroplet className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                          {a.producto}
                        </p>
                        <p className="flex-none font-medium" style={{ color: 'var(--text)' }}>
                          {a.costoEstimado != null ? `$ ${a.costoEstimado.toLocaleString('es-CO')}` : '—'}
                        </p>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                        {a.fecha} · {formatoCantidadAplicacion(a)} · aplicó {a.responsable}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
              Ventas ({ventas.length})
            </h2>
            {ventas.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Sin ventas en este ciclo.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {ventas.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}>
                      <IconTag className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                          $ {v.precio.toLocaleString('es-CO')}
                        </p>
                        <span
                          className="flex-none rounded-full px-2 py-0.5 text-xs font-medium"
                          style={
                            v.cobrado
                              ? { backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }
                              : { backgroundColor: 'var(--nodata)', color: 'var(--nodata-text)', border: '1px dashed var(--nodata-border)' }
                          }
                        >
                          {v.cobrado ? 'Cobrado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                        {v.fecha} · {v.cantidad}
                        {v.comprador ? ` · ${v.comprador}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
