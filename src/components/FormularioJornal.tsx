import { useState, type FormEvent } from 'react';
import { crearJornal } from '../lib/jornales';
import { useAuth } from '../lib/AuthContext';

interface Props {
  onCerrar: () => void;
  onGuardado: () => void;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const OPCIONES_QUIEN_PAGO = ['Freddy', 'Emerson', 'Otro'];

export default function FormularioJornal({ onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const [trabajador, setTrabajador] = useState('');
  const [labor, setLabor] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [unidad, setUnidad] = useState<'dia' | 'hora'>('dia');
  const [cantidad, setCantidad] = useState('');
  const [tarifa, setTarifa] = useState('');
  const [quienPagoOpcion, setQuienPagoOpcion] = useState<string | null>(null);
  const [otroNombre, setOtroNombre] = useState('');
  const [pagado, setPagado] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cantidadNum = Number(cantidad) || 0;
  const tarifaNum = Number(tarifa) || 0;
  const valor = cantidadNum * tarifaNum;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!quienPagoOpcion || (quienPagoOpcion === 'Otro' && !otroNombre.trim())) {
      setError('Elegí quién pagó.');
      return;
    }
    if (pagado === null) {
      setError('Decí si ya se pagó o no.');
      return;
    }
    if (!cantidadNum || cantidadNum <= 0 || !tarifaNum || tarifaNum <= 0) {
      setError('Ingresá una cantidad y una tarifa válidas.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const quienPago = quienPagoOpcion === 'Otro' ? otroNombre.trim() : quienPagoOpcion;
      await crearJornal({
        trabajador,
        quienPago,
        labor: labor || undefined,
        fecha,
        unidad,
        cantidad: cantidadNum,
        tarifa: tarifaNum,
        pagado,
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
          Pago de jornal
        </h2>

        <label className={label} style={{ color: 'var(--text)' }}>
          Nombre de la persona <span className="text-red-500">*</span>
        </label>
        <input
          required
          placeholder="Ej. Don José"
          value={trabajador}
          onChange={(e) => setTrabajador(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Labor realizada (opcional)
        </label>
        <input
          placeholder="Ej. Poda, fumigación, recolección..."
          value={labor}
          onChange={(e) => setLabor(e.target.value)}
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
          Se paga por <span className="text-red-500">*</span>
        </label>
        <div className="mb-4 flex gap-2">
          {[
            { valor: 'dia' as const, texto: 'Día' },
            { valor: 'hora' as const, texto: 'Hora' },
          ].map((op) => (
            <button
              key={op.valor}
              type="button"
              onClick={() => setUnidad(op.valor)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                unidad === op.valor
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {op.texto}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={label} style={{ color: 'var(--text)' }}>
              {unidad === 'dia' ? 'Días trabajados' : 'Horas trabajadas'} <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.5"
              placeholder="Ej. 2"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={campo}
              style={campoEstilo}
            />
          </div>
          <div className="flex-1">
            <label className={label} style={{ color: 'var(--text)' }}>
              Valor por {unidad === 'dia' ? 'día' : 'hora'} <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              step="1"
              placeholder="Ej. 50000"
              value={tarifa}
              onChange={(e) => setTarifa(e.target.value)}
              className={campo}
              style={campoEstilo}
            />
          </div>
        </div>

        {valor > 0 && (
          <div
            className="mb-4 flex items-center justify-between rounded-xl px-4 py-3"
            style={{ backgroundColor: 'color-mix(in srgb, var(--gold) 12%, transparent)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Valor a pagar
            </span>
            <span className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
              $ {valor.toLocaleString('es-CO')}
            </span>
          </div>
        )}

        <label className={label} style={{ color: 'var(--text)' }}>
          Quién pagó <span className="text-red-500">*</span>
        </label>
        <div className="mb-2 flex gap-2">
          {OPCIONES_QUIEN_PAGO.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setQuienPagoOpcion(op)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                quienPagoOpcion === op
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {op}
            </button>
          ))}
        </div>
        {quienPagoOpcion === 'Otro' && (
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
        {quienPagoOpcion !== 'Otro' && <div className="mb-4" />}

        <label className={label} style={{ color: 'var(--text)' }}>
          ¿Ya se pagó? <span className="text-red-500">*</span>
        </label>
        <div className="mb-4 flex gap-2">
          {[
            { valor: true, texto: 'Sí, pagado' },
            { valor: false, texto: 'Pendiente' },
          ].map((op) => (
            <button
              key={String(op.valor)}
              type="button"
              onClick={() => setPagado(op.valor)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                pagado === op.valor
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
