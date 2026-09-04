import { useEffect, useState } from 'react';
import { escucharMovimientosDeInsumo, actualizarInsumo, borrarInsumo } from '../../lib/insumos';
import { escucharLotes } from '../../lib/lotes';
import type { InsumoInventario, Lote, MovimientoInventario } from '../../types/models';
import ConfirmDialog from '../ui/ConfirmDialog';
import InfoDialog from '../ui/InfoDialog';
import { IconArrowLeft, IconBox, IconPencil, IconTrash } from '../ui/Icons';
import { formatoFecha } from '../../lib/fechas';
import { formatoCantidad } from '../../lib/cantidades';

interface Props {
  insumo: InsumoInventario;
  onCerrar: () => void;
}

export default function DetalleInsumo({ insumo, onCerrar }: Props) {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(insumo.nombre);
  const [unidad, setUnidad] = useState(insumo.unidad);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [avisoNoSeBorra, setAvisoNoSeBorra] = useState(false);

  async function handleGuardar() {
    if (!nombre.trim() || !unidad.trim()) return;
    setGuardando(true);
    try {
      await actualizarInsumo(insumo.id, nombre, unidad);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  async function handleBorrar() {
    setConfirmarBorrado(false);
    try {
      await borrarInsumo(insumo.id);
      onCerrar();
    } catch {
      setAvisoNoSeBorra(true);
    }
  }

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

        {editando ? (
          <div className="mb-4 rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text)' }}>
              Editar insumo
            </p>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del insumo"
              className="mb-2 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
            />
            <input
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              placeholder="Unidad"
              className="mb-3 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNombre(insumo.nombre);
                  setUnidad(insumo.unidad);
                  setEditando(false);
                }}
                className="flex-1 rounded-xl border py-2 text-sm font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !nombre.trim() || !unidad.trim()}
                className="flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
                {insumo.nombre}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Costo por {insumo.unidad.replace(/s$/, '')}: $ {insumo.costoUnitario.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="flex flex-none gap-1">
              <button
                onClick={() => setEditando(true)}
                aria-label="Editar insumo"
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
              >
                <IconPencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmarBorrado(true)}
                aria-label="Borrar insumo"
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: '#b4552f' }}
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Stock actual
            </p>
            <p className="font-serif text-xl font-semibold" style={{ color: insumo.stockActual < 0 ? '#b4552f' : 'var(--text)' }}>
              {formatoCantidad(insumo.stockActual)} {insumo.unidad}
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
                        {formatoCantidad(m.cantidad)} {insumo.unidad}
                      </p>
                      <p className="flex-none text-xs" style={{ color: 'var(--text-dim)' }}>
                        {formatoFecha(m.fecha)}
                      </p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                      {m.origen === 'compra'
                        ? 'Compra'
                        : m.origen === 'ajuste'
                          ? 'Ajuste por corrección'
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

      <ConfirmDialog
        open={confirmarBorrado}
        title={`¿Borrar el insumo "${insumo.nombre}"?`}
        description="Solo se puede borrar si todavía no tiene compras ni aplicaciones registradas."
        confirmLabel="Borrar"
        danger
        onConfirm={handleBorrar}
        onCancel={() => setConfirmarBorrado(false)}
      />

      <InfoDialog
        open={avisoNoSeBorra}
        title="Este insumo ya tiene movimientos"
        description="No se puede borrar porque tiene compras o aplicaciones asociadas. Si ya no lo usas, déjalo con stock en cero."
        tono="error"
        onClose={() => setAvisoNoSeBorra(false)}
      />
    </div>
  );
}
