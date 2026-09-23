import { useState, type FormEvent } from 'react';
import { crearCosecha, actualizarCosecha, borrarCosecha } from '../lib/cosechas';
import { crearVenta } from '../lib/ventas';
import { pesos } from '../lib/formatoDinero';
import { UNIDADES_COSECHA, UNIDAD_POR_DEFECTO, textoCantidad, unidadDe, enKilos } from '../lib/unidadesCosecha';
import { useAuth } from '../lib/AuthContext';
import BotonBorrarRegistro from './ui/BotonBorrarRegistro';
import type { Cosecha } from '../types/models';
import { hoyISO } from '../lib/fechas';

interface Props {
  loteId: string;
  cicloId: string;
  cosechaExistente?: Cosecha | null;
  /** Si esta cosecha ya tiene una venta asociada. Si no, se puede agregar
   *  después desde acá mismo: se cosecha hoy y se vende mañana. */
  yaVendida?: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
}

const OPCIONES_CALIDAD = ['Selecta', 'No selecta'];

export default function FormularioCosecha({ loteId, cicloId, cosechaExistente, yaVendida, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!cosechaExistente;
  const [fecha, setFecha] = useState(cosechaExistente?.fecha ?? hoyISO());
  const [cantidadNum, setCantidadNum] = useState(
    cosechaExistente?.cantidadNum != null ? String(cosechaExistente.cantidadNum) : '',
  );
  const [unidad, setUnidad] = useState(cosechaExistente?.unidad ?? UNIDAD_POR_DEFECTO);
  const [calidad, setCalidad] = useState<string | null>(cosechaExistente?.calidad ?? null);

  // En esta finca se cosecha para vender, siempre. Tenerlo como opcional era un
  // paso de más en el único caso que ocurre de verdad, así que la venta va
  // siempre incluida: un solo formulario, un solo momento.
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [comprador, setComprador] = useState('');
  const [cobrado, setCobrado] = useState<boolean | null>(null);
  const totalVenta = (Number(cantidadNum) || 0) * (Number(precioUnitario) || 0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const n = Number(cantidadNum) || 0;
      const texto = textoCantidad(n, unidad);

      if (editando) {
        await actualizarCosecha(cosechaExistente!.id, {
          fecha,
          cantidad: texto,
          cantidadNum: n,
          unidad,
          calidad: calidad ?? undefined,
        });
        // Cosecha que ya estaba registrada y todavía no tenía venta: se crea
        // ahora, desde el mismo formulario.
        if (!yaVendida) {
          if (cobrado === null) {
            setError('Indica si ya te la cobraron o no.');
            setGuardando(false);
            return;
          }
          crearVenta({
            loteId, cicloId, fecha,
            cantidad: texto,
            precio: Math.round(n * (Number(precioUnitario) || 0)),
            cantidadNum: n,
            unidad,
            precioUnitario: Number(precioUnitario) || 0,
            comprador,
            cobrado,
            cosechaId: cosechaExistente!.id,
            creadoPor: user!.uid,
          });
        }
      } else {
        if (cobrado === null) {
          setError('Indica si ya te la cobraron o no.');
          setGuardando(false);
          return;
        }
        // Los dos ids se generan en el telefono, asi que se pueden enlazar
        // mutuamente sin esperar al servidor — funciona igual sin senal.
        const cosechaId = crearCosecha({
          loteId, cicloId, fecha, cantidad: texto, cantidadNum: n, unidad,
          calidad: calidad ?? undefined, creadoPor: user!.uid,
        });
        crearVenta({
          loteId, cicloId, fecha,
          cantidad: texto,
          precio: Math.round(n * (Number(precioUnitario) || 0)),
          cantidadNum: n,
          unidad,
          precioUnitario: Number(precioUnitario) || 0,
          comprador,
          cobrado,
          cosechaId,
          creadoPor: user!.uid,
        });
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
        className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h2 className="font-serif mb-1 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {editando ? 'Editar cosecha' : 'Cosecha y venta'}
        </h2>
        {!editando && (
          <p className="mb-4 text-sm" style={{ color: 'var(--text-dim)' }}>
            Anota lo que se recogió y, si ya se vendió, el precio. Todo en un solo paso.
          </p>
        )}
        {editando && <div className="mb-4" />}

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
          ¿Cuánto se recogió? <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <div className="mb-4 flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            required
            inputMode="decimal"
            placeholder="Ej. 850"
            value={cantidadNum}
            onChange={(e) => setCantidadNum(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-base focus:outline-none"
            style={campoEstilo}
          />
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            className="flex-none rounded-xl border px-3 py-3 text-base focus:outline-none"
            style={campoEstilo}
          >
            {UNIDADES_COSECHA.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
        {/* Si no se mide en kilos, se muestra el equivalente: es lo que permite
            comparar lotes y calcular el costo por kilo. */}
        {unidad !== 'kg' && enKilos(Number(cantidadNum) || 0, unidad) != null && (Number(cantidadNum) || 0) > 0 && (
          <p className="-mt-3 mb-4 text-xs" style={{ color: 'var(--text-dim)' }}>
            Equivale a unos {enKilos(Number(cantidadNum) || 0, unidad)!.toLocaleString('es-CO')} kg
          </p>
        )}

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

        {/* La venta va acá adentro porque en la finca las dos cosas pasan juntas:
            se recoge y se despacha el mismo día. Abrirla es opcional. */}
        {/* La venta va siempre: acá se cosecha para vender, y el interruptor de
            "¿ya vendiste?" era un paso de más en el único caso que ocurre. */}
        {!yaVendida && (
          <div className="mb-4 rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
            <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text)' }}>
              Datos de la venta
            </p>

            <label className={label} style={{ color: 'var(--text)' }}>
              Precio por {unidadDe(unidad).corto.replace(/s$/, '')} ($) <span style={{ color: 'var(--peligro)' }}>*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              inputMode="numeric"
              placeholder="Ej. 1800"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(e.target.value)}
              className={campo}
              style={campoEstilo}
            />

            <div
              className="mb-4 flex items-baseline justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                {textoCantidad(Number(cantidadNum) || 0, unidad)} × {pesos(Number(precioUnitario) || 0)}
              </span>
              <span className="font-serif text-lg font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                {pesos(totalVenta)}
              </span>
            </div>

            <label className={label} style={{ color: 'var(--text)' }}>
              ¿A quién le vendiste? (opcional)
            </label>
            <input
              placeholder="Ej. Central de Abastos"
              value={comprador}
              onChange={(e) => setComprador(e.target.value)}
              className={campo}
              style={campoEstilo}
            />

            <label className={label} style={{ color: 'var(--text)' }}>
              ¿Ya te la cobraron? <span style={{ color: 'var(--peligro)' }}>*</span>
            </label>
            <div className="flex gap-2">
              {[
                { v: true, t: 'Sí, cobrado' },
                { v: false, t: 'Todavía no' },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => setCobrado(o.v)}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium"
                  style={
                    cobrado === o.v
                      ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                      : { borderColor: 'var(--border)', color: 'var(--text)' }
                  }
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>
        )}

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
            etiqueta="esta cosecha"
            onBorrar={() => borrarCosecha(cosechaExistente!.id)}
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
