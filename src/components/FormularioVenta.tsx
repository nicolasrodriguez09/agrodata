import { useState, type FormEvent } from 'react';
import { crearVenta } from '../lib/ventas';
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

export default function FormularioVenta({ loteId, cicloId, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(hoyISO());
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [comprador, setComprador] = useState('');
  const [cobrado, setCobrado] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cobrado === null) {
      setError('Decí si ya se cobró o no.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearVenta({
        loteId,
        cicloId,
        fecha,
        cantidad,
        precio: Number(precio),
        comprador,
        cobrado,
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
          Registrar venta
        </h2>

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
          Cantidad vendida <span className="text-red-500">*</span>
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
          Precio total ($) <span className="text-red-500">*</span>
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
          ¿Ya se cobró? <span className="text-red-500">*</span>
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
