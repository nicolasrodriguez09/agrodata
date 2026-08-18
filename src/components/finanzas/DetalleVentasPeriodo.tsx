import { useState } from 'react';
import type { Finca, Lote, Venta } from '../../types/models';
import { IconArrowLeft } from '../ui/Icons';

interface Props {
  ventas: Venta[];
  lotes: Lote[];
  fincas: Finca[];
  etiquetaPeriodo: string;
  onCerrar: () => void;
}

export default function DetalleVentasPeriodo({ ventas, lotes, fincas, etiquetaPeriodo, onCerrar }: Props) {
  const [filtro, setFiltro] = useState<'todo' | 'cobrado' | 'pendiente'>('todo');

  function nombreFinca(fincaId: string | null) {
    if (fincaId === null) return 'Suelto';
    return fincas.find((f) => f.id === fincaId)?.nombre ?? 'Finca borrada';
  }

  const ordenadas = [...ventas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const filtradas = ordenadas.filter((v) => {
    if (filtro === 'cobrado') return v.cobrado;
    if (filtro === 'pendiente') return !v.cobrado;
    return true;
  });

  const total = ventas.reduce((s, v) => s + v.precio, 0);
  const totalCobrado = ventas.filter((v) => v.cobrado).reduce((s, v) => s + v.precio, 0);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={onCerrar}
          className="mb-3 inline-flex items-center gap-1 text-sm"
          style={{ color: 'var(--text-dim)' }}
        >
          <IconArrowLeft className="h-4 w-4" />
          Volver al resumen
        </button>

        <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Ventas
        </h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
          {etiquetaPeriodo}
        </p>

        <div
          className="mb-4 rounded-xl border p-4"
          style={{ borderColor: 'var(--recent)', backgroundColor: 'color-mix(in srgb, var(--recent) 10%, transparent)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Total vendido
          </p>
          <p className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            $ {total.toLocaleString('es-CO')}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
            {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'} · $ {totalCobrado.toLocaleString('es-CO')} cobrado
          </p>
        </div>

        <div className="mb-3 flex gap-2">
          {(['todo', 'cobrado', 'pendiente'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={
                filtro === f
                  ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
              }
            >
              {f === 'todo' ? 'Todo' : f === 'cobrado' ? 'Cobrado' : 'Pendiente'}
            </button>
          ))}
        </div>

        {filtradas.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            No hay ventas en este período.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtradas.map((v) => {
              const lote = lotes.find((l) => l.id === v.loteId);
              return (
                <div
                  key={v.id}
                  className="rounded-xl border p-3.5"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
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
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-dim)' }}>
                    {lote ? `${lote.nombre} · ${nombreFinca(lote.fincaId)}` : 'Lote borrado'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
