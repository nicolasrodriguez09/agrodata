import { useState, type FormEvent } from 'react';
import { crearCosecha, actualizarCosecha } from '../lib/cosechas';
import { useAuth } from '../lib/AuthContext';
import type { Cosecha } from '../types/models';

interface Props {
  loteId: string;
  cicloId: string;
  cosechaExistente?: Cosecha | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const OPCIONES_CALIDAD = ['Selecta', 'No selecta'];

export default function FormularioCosecha({ loteId, cicloId, cosechaExistente, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!cosechaExistente;
  const [fecha, setFecha] = useState(cosechaExistente?.fecha ?? hoyISO());
  const [cantidad, setCantidad] = useState(cosechaExistente?.cantidad ?? '');
  const [calidad, setCalidad] = useState<string | null>(cosechaExistente?.calidad ?? null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        await actualizarCosecha(cosechaExistente!.id, { fecha, cantidad, calidad: calidad ?? undefined });
      } else {
        await crearCosecha({ loteId, cicloId, fecha, cantidad, calidad: calidad ?? undefined, creadoPor: user!.uid });
      }
      onGuardado();
      onCerrar();
    } catch {
      setError('No se pudo guardar. Probá de nuevo.');
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
        className="w-full rounded-t-2xl p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h2 className="font-serif mb-1 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {editando ? 'Editar cosecha' : 'Registrar cosecha'}
        </h2>
        {!editando && (
          <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
            Si hoy recogieron más de una calidad, cargá un registro por cada una.
          </p>
        )}
        {editando && <div className="mb-4" />}

        <label className={label} style={{ color: 'var(--text)' }}>
          Fecha <span className="text-red-500">*</span>
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
          Cantidad <span className="text-red-500">*</span>
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
          Calidad (opcional)
        </label>
        <div className="mb-4 flex gap-2">
          {OPCIONES_CALIDAD.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setCalidad(calidad === op ? null : op)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                calidad === op
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {op}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

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
      </form>
    </div>
  );
}
