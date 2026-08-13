import { useState, type FormEvent } from 'react';
import { abrirCiclo } from '../lib/ciclos';

interface Props {
  loteId: string;
  onCerrar: () => void;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function FormularioCiclo({ loteId, onCerrar }: Props) {
  const [nombre, setNombre] = useState(`Ciclo ${new Date().getFullYear()}-1`);
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await abrirCiclo(loteId, { nombre, fechaInicio });
      onCerrar();
    } catch {
      setError('No se pudo abrir el ciclo. Probá de nuevo.');
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
          Abrir nuevo ciclo
        </h2>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
          Todo lo que registres en este lote (aplicaciones, jornales, compras, cosechas y ventas)
          va a quedar agrupado bajo este ciclo hasta que lo cierres.
        </p>

        <label className={label} style={{ color: 'var(--text)' }}>
          Nombre o identificador <span className="text-red-500">*</span>
        </label>
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} style={campoEstilo} />

        <label className={label} style={{ color: 'var(--text)' }}>
          Fecha de inicio <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          required
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

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
            {guardando ? 'Abriendo...' : 'Abrir ciclo'}
          </button>
        </div>
      </form>
    </div>
  );
}
