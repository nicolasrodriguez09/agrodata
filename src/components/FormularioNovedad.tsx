import { useState, type FormEvent } from 'react';
import { crearNovedad, actualizarNovedad, borrarNovedad, CATEGORIAS_NOVEDAD } from '../lib/novedades';
import { useAuth } from '../lib/AuthContext';
import BotonBorrarRegistro from './ui/BotonBorrarRegistro';
import type { Novedad } from '../types/models';
import { hoyISO, formatoFechaLarga } from '../lib/fechas';

interface Props {
  loteId: string;
  cicloId: string;
  novedadExistente?: Novedad | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export default function FormularioNovedad({ loteId, cicloId, novedadExistente, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!novedadExistente;
  const [fecha, setFecha] = useState(novedadExistente?.fecha ?? hoyISO());
  const [categoria, setCategoria] = useState<string | null>(novedadExistente?.categoria ?? null);
  const [descripcion, setDescripcion] = useState(novedadExistente?.descripcion ?? '');
  const [resuelta, setResuelta] = useState(novedadExistente?.resuelta ?? false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoria) {
      setError('Elige de qué tipo es la novedad.');
      return;
    }
    if (!descripcion.trim()) {
      setError('Cuenta qué pasó.');
      return;
    }
    setGuardando(true);
    setError(null);
    const datos = { fecha, categoria, descripcion, resuelta };
    if (editando) actualizarNovedad(novedadExistente!.id, datos);
    else crearNovedad({ loteId, cicloId, ...datos, creadoPor: user!.uid });
    onGuardado();
    onCerrar();
  }

  const campo = 'mb-4 w-full rounded-xl border px-4 py-3 text-base focus:outline-none';
  const campoEstilo = { borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' };
  const label = 'mb-1.5 block text-sm font-medium';

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h2 className="font-serif mb-1 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {editando ? 'Editar novedad' : 'Registrar novedad'}
        </h2>
        {!editando && (
          <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
            Algo que pasó y que explica cómo va el ciclo: no hubo agua, granizó, se dañó la bomba.
          </p>
        )}

        <label className={label} style={{ color: 'var(--text)' }}>
          ¿Cuándo pasó? <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} style={campoEstilo} />

        <label className={label} style={{ color: 'var(--text)' }}>
          ¿De qué se trata? <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIAS_NOVEDAD.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className="flex h-10 items-center rounded-xl border px-3.5 text-sm font-medium"
              style={
                categoria === c
                  ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)', borderColor: 'var(--gold)' }
                  : { borderColor: 'var(--border)', color: 'var(--text-dim)' }
              }
            >
              {c}
            </button>
          ))}
        </div>

        <label className={label} style={{ color: 'var(--text)' }}>
          ¿Qué pasó? <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <textarea
          required
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej. No se pudo regar el lote porque se fue el agua toda la semana."
          className={`${campo} resize-none`}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          ¿Ya se resolvió?
        </label>
        <div className="mb-4 flex gap-2">
          {[
            { v: false, t: 'Sigue afectando' },
            { v: true, t: 'Ya se resolvió' },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setResuelta(o.v)}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium"
              style={
                resuelta === o.v
                  ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)', borderColor: 'var(--gold)' }
                  : { borderColor: 'var(--border)', color: 'var(--text-dim)' }
              }
            >
              {o.t}
            </button>
          ))}
        </div>

        {/* Cuándo se anotó es dato aparte de cuándo pasó: es lo que le da valor
            de constancia ante un banco o un seguro. */}
        {editando && novedadExistente?.creadoEn && (
          <p className="-mt-2 mb-4 text-xs" style={{ color: 'var(--text-dim)' }}>
            Anotada el {formatoFechaLarga(new Date(novedadExistente.creadoEn).toISOString().slice(0, 10))}
          </p>
        )}

        {error && (
          <p className="mb-3 text-sm" style={{ color: 'var(--peligro)' }}>
            {error}
          </p>
        )}

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
            etiqueta="esta novedad"
            onBorrar={async () => borrarNovedad(novedadExistente!.id)}
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
