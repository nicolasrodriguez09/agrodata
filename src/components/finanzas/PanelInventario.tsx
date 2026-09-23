import { useMemo, useState } from 'react';
import { clasificarInsumos, ROTULOS, ORDEN_ESTADOS, consejo, type EstadoInsumo } from '../../lib/estadoInsumo';
import { formatoCantidad } from '../../lib/cantidades';
import { pesos } from '../../lib/formatoDinero';
import type { InsumoInventario } from '../../types/models';
import { IconBox, IconSearch } from '../ui/Icons';

interface Props {
  insumos: InsumoInventario[];
  onAbrirInsumo: (insumo: InsumoInventario) => void;
}

export default function PanelInventario({ insumos, onAbrirInsumo }: Props) {
  const [filtro, setFiltro] = useState<EstadoInsumo | 'todo'>('todo');
  const [texto, setTexto] = useState('');

  const clasificados = useMemo(() => clasificarInsumos(insumos), [insumos]);

  const conteos = useMemo(() => {
    const c: Record<EstadoInsumo, number> = { negativo: 0, agotado: 0, bajo: 0, pendiente: 0, bien: 0 };
    clasificados.forEach((x) => (c[x.estado] += 1));
    return c;
  }, [clasificados]);

  const valorTotal = insumos.reduce((s, i) => s + i.stockActual * i.costoUnitario, 0);
  const necesitanAtencion = conteos.negativo + conteos.agotado + conteos.bajo + conteos.pendiente;

  const t = texto.trim().toLowerCase();
  const visibles = clasificados
    .filter((x) => (filtro === 'todo' ? true : x.estado === filtro))
    .filter((x) => (!t ? true : x.insumo.nombre.toLowerCase().includes(t)))
    .sort((a, b) => {
      const d = ORDEN_ESTADOS.indexOf(a.estado) - ORDEN_ESTADOS.indexOf(b.estado);
      return d !== 0 ? d : a.insumo.nombre.localeCompare(b.insumo.nombre);
    });

  return (
    <div>
      {/* Titular: lo primero es cuántos necesitan atención, no cuántos hay. */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              {necesitanAtencion > 0 ? 'Necesitan atención' : 'Todo en orden'}
            </p>
            <p
              className="font-serif text-xl font-semibold"
              style={{ color: necesitanAtencion > 0 ? 'var(--aviso)' : 'var(--recent)' }}
            >
              {necesitanAtencion > 0
                ? `${necesitanAtencion} de ${insumos.length} insumos`
                : `${insumos.length} ${insumos.length === 1 ? 'insumo' : 'insumos'}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              Valor en bodega
            </p>
            <p className="font-serif text-xl font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {pesos(valorTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros por estado, con el conteo a la vista. */}
      <div className="carrusel mt-3 flex gap-2 overflow-x-auto pb-1">
        {(['todo', ...ORDEN_ESTADOS] as const).map((e) => {
          const activo = filtro === e;
          const n = e === 'todo' ? insumos.length : conteos[e];
          if (e !== 'todo' && n === 0) return null;
          return (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className="flex h-10 flex-none items-center gap-1.5 rounded-xl border px-3.5 text-xs font-medium whitespace-nowrap"
              style={
                activo
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text-dim)', backgroundColor: 'var(--surface)' }
              }
            >
              {e !== 'todo' && (
                <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: ROTULOS[e].color }} />
              )}
              {e === 'todo' ? 'Todos' : ROTULOS[e].texto}
              <span style={{ opacity: 0.7 }}>{n}</span>
            </button>
          );
        })}
      </div>

      {insumos.length > 6 && (
        <div className="relative mt-3">
          <IconSearch className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar insumo..."
            className="h-11 w-full rounded-xl border pr-3 pl-10 text-sm focus:outline-none"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {visibles.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Ningún insumo en este estado.
          </p>
        )}
        {visibles.map(({ insumo, estado }) => {
          const rotulo = ROTULOS[estado];
          const esBien = estado === 'bien';
          return (
            <button
              key={insumo.id}
              type="button"
              onClick={() => onAbrirInsumo(insumo)}
              className="flex items-center gap-3 rounded-xl border p-3.5 text-left transition active:scale-[0.99]"
              style={{
                borderColor: esBien ? 'var(--border)' : rotulo.color,
                backgroundColor: 'var(--surface)',
              }}
            >
              <div
                className="flex h-10 w-10 flex-none items-center justify-center rounded-lg"
                style={{
                  backgroundColor: esBien ? 'var(--bg)' : rotulo.fondo,
                  color: esBien ? 'var(--text-dim)' : rotulo.color,
                }}
              >
                <IconBox className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-serif font-semibold" style={{ color: 'var(--text)' }}>
                    {insumo.nombre}
                  </p>
                  <p
                    className="flex-none font-medium tabular-nums"
                    style={{ color: esBien ? 'var(--text)' : rotulo.color }}
                  >
                    {formatoCantidad(insumo.stockActual)} {insumo.unidad}
                  </p>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
                    {consejo(estado, insumo.unidad)}
                  </p>
                  <p className="flex-none text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    {pesos(insumo.stockActual * insumo.costoUnitario)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
