import { useState, type FormEvent } from 'react';
import { crearVenta, actualizarVenta, borrarVenta } from '../lib/ventas';
import { useAuth } from '../lib/AuthContext';
import BotonBorrarRegistro from './ui/BotonBorrarRegistro';
import type { Venta } from '../types/models';
import { hoyISO } from '../lib/fechas';

interface Props {
  loteId: string;
  cicloId: string;
  ventaExistente?: Venta | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export default function FormularioVenta({ loteId, cicloId, ventaExistente, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!ventaExistente;
  const [fecha, setFecha] = useState(ventaExistente?.fecha ?? hoyISO());
  const [cantidad, setCantidad] = useState(ventaExistente?.cantidad ?? '');
  const [precio, setPrecio] = useState(ventaExistente ? String(ventaExistente.precio) : '');
  const [comprador, setComprador] = useState(ventaExistente?.comprador ?? '');
  const [cobrado, setCobrado] = useState<boolean | null>(ventaExistente?.cobrado ?? null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cobrado === null) {
      setError('Indica si ya se cobró o no.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const datos = { fecha, cantidad, precio: Number(precio), comprador, cobrado };
      if (editando) {
        await actualizarVenta(ventaExistente!.id, datos);
      } else {
        await crearVenta({ loteId, cicloId, ...datos, creadoPor: user!.uid });
      }
      onGuardado();
      onCerrar();
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const campo = 'mb-4 w-full rounded-xl border px-4 py-3 text-base focus:outline-none';
  const campoEstilo = { borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' };
  const label = 'mb-1.5 block text-sm font-medium';

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h2 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {editando ? 'Editar venta' : 'Registrar venta'}
        </h2>

        <label className={label} style={{ color: 'var(--text)' }}>
          Fecha <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <input
          type="date"
          required
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Cantidad vendida <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <input
          required
          placeholder="Ej. 20 cajas"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Precio total ($) <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <input
          type="number"
          min="0"
          step="1"
          required
          placeholder="Ej. 150000"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Comprador (opcional)
        </label>
        <input
          placeholder="Ej. Don Carlos"
          value={comprador}
          onChange={(e) => setComprador(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          ¿Ya se cobró? <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <div className="mb-4 flex gap-2">
          {[
            { valor: true, texto: 'Sí, cobrado' },
            { valor: false, texto: 'Todavía no' },
          ].map((op) => (
            <button
              key={String(op.valor)}
              type="button"
              onClick={() => setCobrado(op.valor)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                cobrado === op.valor
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {op.texto}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm" style={{ color: 'var(--peligro)' }}>{error}</p>}

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            className="flex-1 rounded-xl border py-3 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 rounded-xl py-3 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {editando && (
          <BotonBorrarRegistro
            etiqueta="esta venta"
            onBorrar={() => borrarVenta(ventaExistente!.id)}
            onBorrado={() => {
              onGuardado();
              onCerrar();
            }}
          />
        )}
      </form>
    </div>
  );
}
