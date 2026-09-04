import { useState, type FormEvent } from 'react';
import { crearRiego, actualizarRiego, borrarRiego } from '../lib/riegos';
import { useAuth } from '../lib/AuthContext';
import BotonBorrarRegistro from './ui/BotonBorrarRegistro';
import type { Riego } from '../types/models';
import { hoyISO } from '../lib/fechas';

interface Props {
  loteId: string;
  cicloId: string;
  riegoExistente?: Riego | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

const OPCIONES_METODO = ['Aspersión', 'Goteo', 'Manual'];
const OPCIONES_RESPONSABLE = ['Freddy', 'Emerson', 'Otro'];

export default function FormularioRiego({ loteId, cicloId, riegoExistente, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!riegoExistente;
  const [fecha, setFecha] = useState(riegoExistente?.fecha ?? hoyISO());
  const [duracion, setDuracion] = useState(riegoExistente?.duracion ?? '');
  const [metodo, setMetodo] = useState<string | null>(riegoExistente?.metodo ?? null);
  const responsableInicial = riegoExistente?.responsable ?? null;
  const esOpcionConocida = responsableInicial && OPCIONES_RESPONSABLE.slice(0, 2).includes(responsableInicial);
  const [responsableOpcion, setResponsableOpcion] = useState<string | null>(
    responsableInicial ? (esOpcionConocida ? responsableInicial : 'Otro') : null,
  );
  const [otroNombre, setOtroNombre] = useState(responsableInicial && !esOpcionConocida ? responsableInicial : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!responsableOpcion || (responsableOpcion === 'Otro' && !otroNombre.trim())) {
      setError('Elige quién regó.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const responsable = responsableOpcion === 'Otro' ? otroNombre.trim() : responsableOpcion;
      const datos = { fecha, duracion: duracion || undefined, metodo: metodo ?? undefined, responsable };
      if (editando) {
        await actualizarRiego(riegoExistente!.id, datos);
      } else {
        await crearRiego({ loteId, cicloId, ...datos, creadoPor: user!.uid });
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
          {editando ? 'Editar riego' : 'Registrar riego'}
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
          Duración (opcional)
        </label>
        <input
          placeholder="Ej. 2 horas, toda la mañana..."
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Método (opcional)
        </label>
        <div className="mb-4 flex gap-2">
          {OPCIONES_METODO.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setMetodo(metodo === op ? null : op)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                metodo === op
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {op}
            </button>
          ))}
        </div>

        <label className={label} style={{ color: 'var(--text)' }}>
          Quién regó <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <div className="mb-2 flex gap-2">
          {OPCIONES_RESPONSABLE.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setResponsableOpcion(op)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                responsableOpcion === op
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {op}
            </button>
          ))}
        </div>
        {responsableOpcion === 'Otro' && (
          <input
            required
            autoFocus
            placeholder="Nombre"
            value={otroNombre}
            onChange={(e) => setOtroNombre(e.target.value)}
            className={campo}
            style={campoEstilo}
          />
        )}
        {responsableOpcion !== 'Otro' && <div className="mb-4" />}

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
            etiqueta="este riego"
            onBorrar={() => borrarRiego(riegoExistente!.id)}
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
