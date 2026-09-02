import { useEffect, useState } from 'react';
import { escucharMovimientosDeInsumo } from '../../lib/insumos';
import { escucharLotes } from '../../lib/lotes';
import type { InsumoInventario, Lote, MovimientoInventario } from '../../types/models';
import { IconArrowLeft, IconBox } from '../ui/Icons';

interface Props {
  insumo: InsumoInventario;
  onCerrar: () => void;
}

export default function DetalleInsumo({ insumo, onCerrar }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);

  useEffect(() => escucharMovimientosDeInsumo(insumo.id, setMovimientos), [insumo.id]);
  useEffect(() => escucharLotes(setLotes), []);

  const valorEnStock = insumo.stockActual * insumo.costoUnitario;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button onClick={onCerrar} className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          <IconArrowLeft className="h-4 w-4" />
          Volver al inventario
        </button>

        <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          {insumo.nombre}
        </h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
          Costo por {insumo.unidad.replace(/s$/, '')}: $ {insumo.costoUnitario.toLocaleString('es-CO')}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Stock actual
            </p>
            <p className="font-serif text-xl font-semibold" style={{ color: insumo.stockActual < 0 ? '#b4552f' : 'var(--text)' }}>
              {insumo.stockActual} {insumo.unidad}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Valor en stock
            </p>
            <p className="font-serif text-xl font-semibold" style={{ color: 'var(--text)' }}>
              $ {valorEnStock.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        <h2 className="font-display mb-3 text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
          Movimientos
        </h2>

        {movimientos.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Todavía no hay movimientos de este insumo.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {movimientos.map((m) => {
              const lote = m.loteId ? lotes.find((l) => l.id === m.loteId) : undefined;
              const esEntrada = m.tipo === 'entrada';
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border p-3.5"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <div
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                    style={
                      esEntrada
                        ? { backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }
                        : { backgroundColor: '#b4552f', color: '#fbfaf2' }
                    }
                  >
                    <IconBox className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                        {esEntrada ? '+' : '−'}
                        {m.cantidad} {insumo.unidad}
                      </p>
                      <p className="flex-none text-xs" style={{ color: 'var(--text-dim)' }}>
                        {m.fecha}
                      </p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                      {m.origen === 'compra'
                        ? 'Compra'
                        : m.origen === 'ajuste'
                          ? 'Ajuste por edición'
                          : lote
                            ? `Aplicado en ${lote.nombre}`
                            : 'Aplicación'}{' '}
                      · $ {m.costoUnitario.toLocaleString('es-CO')} / {insumo.unidad.replace(/s$/, '')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
