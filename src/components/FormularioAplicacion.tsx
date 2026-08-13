import { useState, type FormEvent } from 'react';
import { crearAplicacion } from '../lib/aplicaciones';
import { useAuth } from '../lib/AuthContext';

interface Props {
  loteId: string;
  cicloId: string;
  onCerrar: () => void;
  onGuardado: () => void;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function FormularioAplicacion({ loteId, cicloId, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const [producto, setProducto] = useState('');
  const [dosis, setDosis] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [responsable, setResponsable] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await crearAplicacion({
        loteId,
        cicloId,
        producto,
        dosis,
        cantidad,
        fecha,
        responsable,
        creadoPor: user!.uid,
      });
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
          Aplicación de insumo
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
        <input
          required
          placeholder="Ej. Emerson"
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
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
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
