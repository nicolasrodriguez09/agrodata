import { useEffect, useState, type FormEvent } from 'react';
import { crearJornal, actualizarJornal, borrarJornal } from '../lib/jornales';
import { escucharLotes } from '../lib/lotes';
import { escucharFincas } from '../lib/fincas';
import { useAuth } from '../lib/AuthContext';
import BotonBorrarRegistro from './ui/BotonBorrarRegistro';
import type { Finca, Jornal, Lote } from '../types/models';
import { hoyISO } from '../lib/fechas';

interface Props {
  jornalExistente?: Jornal | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

const OPCIONES_QUIEN_PAGO = ['Freddy', 'Emerson', 'Otro'];

export default function FormularioJornal({ jornalExistente, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!jornalExistente;
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loteId, setLoteId] = useState(jornalExistente?.loteId ?? '');
  const [trabajador, setTrabajador] = useState(jornalExistente?.trabajador ?? '');
  const [labor, setLabor] = useState(jornalExistente?.labor ?? '');
  const [fecha, setFecha] = useState(jornalExistente?.fecha ?? hoyISO());
  const [unidad, setUnidad] = useState<'dia' | 'hora'>(jornalExistente?.unidad ?? 'dia');
  const [cantidad, setCantidad] = useState(jornalExistente ? String(jornalExistente.cantidad) : '');
  const [tarifa, setTarifa] = useState(jornalExistente ? String(jornalExistente.tarifa) : '');
  const quienPagoInicial = jornalExistente?.quienPago ?? null;
  const esOpcionConocida = quienPagoInicial && OPCIONES_QUIEN_PAGO.slice(0, 2).includes(quienPagoInicial);
  const [quienPagoOpcion, setQuienPagoOpcion] = useState<string | null>(
    quienPagoInicial ? (esOpcionConocida ? quienPagoInicial : 'Otro') : null,
  );
  const [otroNombre, setOtroNombre] = useState(quienPagoInicial && !esOpcionConocida ? quienPagoInicial : '');
  const [pagado, setPagado] = useState<boolean | null>(jornalExistente?.pagado ?? null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => escucharLotes(setLotes), []);
  useEffect(() => escucharFincas(setFincas), []);

  function nombreFinca(fincaId: string | null) {
    if (fincaId === null) return 'Suelto';
    return fincas.find((f) => f.id === fincaId)?.nombre ?? 'Finca borrada';
  }

  const cantidadNum = Number(cantidad) || 0;
  const tarifaNum = Number(tarifa) || 0;
  const valor = cantidadNum * tarifaNum;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!quienPagoOpcion || (quienPagoOpcion === 'Otro' && !otroNombre.trim())) {
      setError('Elige quién pagó.');
      return;
    }
    if (pagado === null) {
      setError('Indica si ya se pagó o no.');
      return;
    }
    if (!cantidadNum || cantidadNum <= 0 || !tarifaNum || tarifaNum <= 0) {
      setError('Ingresa una cantidad y una tarifa válidas.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const quienPago = quienPagoOpcion === 'Otro' ? otroNombre.trim() : quienPagoOpcion;
      const datos = {
        loteId: loteId || undefined,
        trabajador,
        quienPago,
        labor: labor || undefined,
        fecha,
        unidad,
        cantidad: cantidadNum,
        tarifa: tarifaNum,
        pagado,
      };
      if (editando) {
        await actualizarJornal(jornalExistente!.id, datos);
      } else {
        await crearJornal({ ...datos, creadoPor: user!.uid });
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
          {editando ? 'Editar jornal' : 'Pago de jornal'}
        </h2>

        <label className={label} style={{ color: 'var(--text)' }}>
          Nombre de la persona <span style={{ color: 'var(--peligro)' }}>*</span>
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
          Lote (opcional)
        </label>
        <select
          value={loteId}
          onChange={(e) => setLoteId(e.target.value)}
          className={campo}
          style={campoEstilo}
        >
          <option value="">Sin lote / varios lotes</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre} · {nombreFinca(l.fincaId)}
            </option>
          ))}
        </select>

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
          Se paga por <span style={{ color: 'var(--peligro)' }}>*</span>
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
              {unidad === 'dia' ? 'Días trabajados' : 'Horas trabajadas'} <span style={{ color: 'var(--peligro)' }}>*</span>
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
              Valor por {unidad === 'dia' ? 'día' : 'hora'} <span style={{ color: 'var(--peligro)' }}>*</span>
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
          Quién pagó <span style={{ color: 'var(--peligro)' }}>*</span>
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
          ¿Ya se pagó? <span style={{ color: 'var(--peligro)' }}>*</span>
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
            etiqueta="este jornal"
            onBorrar={() => borrarJornal(jornalExistente!.id)}
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
