import { useState } from 'react';
import type { CompraInsumo, Jornal } from '../../types/models';
import FilaCompra from './FilaCompra';
import FilaJornal from './FilaJornal';
import DetalleCompra from '../DetalleCompra';
import { IconArrowLeft } from '../ui/Icons';

interface Props {
  compras: CompraInsumo[];
  jornales: Jornal[];
  etiquetaPeriodo: string;
  onCerrar: () => void;
}

type Item =
  | { tipo: 'compra'; id: string; fecha: string; data: CompraInsumo }
  | { tipo: 'jornal'; id: string; fecha: string; data: Jornal };

const COLOR_GASTO = '#b4552f';

export default function DetalleGastosPeriodo({ compras, jornales, etiquetaPeriodo, onCerrar }: Props) {
  const [filtroTipo, setFiltroTipo] = useState<'todo' | 'compra' | 'jornal'>('todo');
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraInsumo | null>(null);

  const items: Item[] = [
    ...compras.map((c) => ({ tipo: 'compra' as const, id: c.id, fecha: c.fecha, data: c })),
    ...jornales.map((j) => ({ tipo: 'jornal' as const, id: j.id, fecha: j.fecha, data: j })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const itemsFiltrados = filtroTipo === 'todo' ? items : items.filter((i) => i.tipo === filtroTipo);
  const total = compras.reduce((s, c) => s + c.costo, 0) + jornales.reduce((s, j) => s + j.valor, 0);

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
          Gastos
        </h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
          {etiquetaPeriodo}
        </p>

        <div
          className="mb-4 rounded-xl border p-4"
          style={{ borderColor: COLOR_GASTO, backgroundColor: `color-mix(in srgb, ${COLOR_GASTO} 10%, transparent)` }}
        >
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Total gastado
          </p>
          <p className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            $ {total.toLocaleString('es-CO')}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-dim)' }}>
            {compras.length} {compras.length === 1 ? 'compra' : 'compras'} · {jornales.length}{' '}
            {jornales.length === 1 ? 'jornal' : 'jornales'}
          </p>
        </div>

        <div className="mb-3 flex gap-2">
          {(['todo', 'compra', 'jornal'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className="rounded-full px-3 py-1.5 text-xs font-medium"
              style={
                filtroTipo === t
                  ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
              }
            >
              {t === 'todo' ? 'Todo' : t === 'compra' ? 'Compras' : 'Jornales'}
            </button>
          ))}
        </div>

        {itemsFiltrados.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            No hay gastos en este período.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {itemsFiltrados.map((item) =>
              item.tipo === 'compra' ? (
                <FilaCompra key={`c-${item.id}`} compra={item.data} onClick={() => setCompraSeleccionada(item.data)} />
              ) : (
                <FilaJornal key={`j-${item.id}`} jornal={item.data} />
              ),
            )}
          </div>
        )}
      </div>

      {compraSeleccionada && (
        <DetalleCompra compra={compraSeleccionada} onCerrar={() => setCompraSeleccionada(null)} />
      )}
    </div>
  );
}
