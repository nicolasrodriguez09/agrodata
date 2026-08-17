import { useState, type FormEvent } from 'react';
import { crearAplicacion, actualizarAplicacion } from '../lib/aplicaciones';
import { useAuth } from '../lib/AuthContext';
import type { Aplicacion } from '../types/models';

interface Props {
  loteId: string;
  cicloId: string;
  aplicacionExistente?: Aplicacion | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const OPCIONES_RESPONSABLE = ['Freddy', 'Emerson', 'Otro'];

export default function FormularioAplicacion({ loteId, cicloId, aplicacionExistente, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!aplicacionExistente;
  const [producto, setProducto] = useState(aplicacionExistente?.producto ?? '');
  const [dosis, setDosis] = useState(aplicacionExistente?.dosis ?? '');
  const [cantidad, setCantidad] = useState(aplicacionExistente?.cantidad ?? '');
  const [fecha, setFecha] = useState(aplicacionExistente?.fecha ?? hoyISO());
  const responsableInicial = aplicacionExistente?.responsable ?? null;
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
      setError('Elegí quién la aplicó.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const responsable = responsableOpcion === 'Otro' ? otroNombre.trim() : responsableOpcion;
      if (editando) {
        await actualizarAplicacion(aplicacionExistente!.id, { producto, dosis, cantidad, fecha, responsable });
      } else {
        await crearAplicacion({ loteId, cicloId, producto, dosis, cantidad, fecha, responsable, creadoPor: user!.uid });
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
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h2 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {editando ? 'Editar aplicación' : 'Aplicación de insumo'}
        </h2>

        <label className={label} style={{ color: 'var(--text)' }}>
          Producto <span className="text-red-500">*</span>
        </label>
        <input
          required
          placeholder="Ej. Fungicida XYZ"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Dosis (opcional)
        </label>
        <input
          placeholder="Ej. 2 ml por litro"
          value={dosis}
          onChange={(e) => setDosis(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Cantidad aplicada <span className="text-red-500">*</span>
        </label>
        <input
          required
          placeholder="Ej. 20 litros"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

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
          Quién la aplicó <span className="text-red-500">*</span>
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
