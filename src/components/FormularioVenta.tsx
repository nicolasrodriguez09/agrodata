import { useState, type FormEvent } from 'react';
import { crearVenta, actualizarVenta, borrarVenta } from '../lib/ventas';
import { useAuth } from '../lib/AuthContext';
import BotonBorrarRegistro from './ui/BotonBorrarRegistro';
import type { Venta } from '../types/models';
import { hoyISO } from '../lib/fechas';
import { pesos } from '../lib/formatoDinero';
import { UNIDADES_COSECHA, UNIDAD_POR_DEFECTO, textoCantidad, unidadDe } from '../lib/unidadesCosecha';

interface Props {
  loteId: string;
  cicloId: string;
  ventaExistente?: Venta | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export default function FormularioVenta({ loteId, cicloId, ventaExistente, onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const editando = !!ventaExistente;
  const [fecha, setFecha] = useState(ventaExistente?.fecha ?? hoyISO());
  // Por canastillas es lo normal en la finca; el texto libre queda para lo que
  // no se cuenta por canastilla (una carga suelta, media volqueta).
  const [porUnidad, setPorUnidad] = useState(ventaExistente ? ventaExistente.cantidadNum != null : true);
  const [cantidadNum, setCantidadNum] = useState(
    ventaExistente?.cantidadNum != null ? String(ventaExistente.cantidadNum) : '',
  );
  const [unidad, setUnidad] = useState(ventaExistente?.unidad ?? UNIDAD_POR_DEFECTO);
  const [precioUnitario, setPrecioUnitario] = useState(
    ventaExistente?.precioUnitario != null ? String(ventaExistente.precioUnitario) : '',
  );
  const [cantidad, setCantidad] = useState(ventaExistente?.cantidad ?? '');
  const [precio, setPrecio] = useState(ventaExistente ? String(ventaExistente.precio) : '');
  const [comprador, setComprador] = useState(ventaExistente?.comprador ?? '');
  const [cobrado, setCobrado] = useState<boolean | null>(ventaExistente?.cobrado ?? null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCalculado = (Number(cantidadNum) || 0) * (Number(precioUnitario) || 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cobrado === null) {
      setError('Indica si ya se cobró o no.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      // Con canastillas el total lo calcula la app: en el campo, multiplicar
      // 37 x 38.500 de cabeza es de donde salen los errores de plata.
      const n = Number(cantidadNum) || 0;
      const nUnitario = Number(precioUnitario) || 0;
      const datos = porUnidad
        ? {
            fecha,
            cantidad: textoCantidad(n, unidad),
            precio: Math.round(n * nUnitario),
            cantidadNum: n,
            unidad,
            precioUnitario: nUnitario,
            comprador,
            cobrado,
          }
        : { fecha, cantidad, precio: Number(precio), comprador, cobrado };
      if (editando) {
        await actualizarVenta(ventaExistente!.id, datos);
      } else {
        await crearVenta({ loteId, cicloId, ...datos, creadoPor: user!.uid });
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
        <h2 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {editando ? 'Editar venta' : 'Registrar venta'}
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

        <div className="mb-4 flex rounded-xl p-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
          {[
            { v: true, t: 'Por cantidad' },
            { v: false, t: 'Texto libre' },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setPorUnidad(o.v)}
              className="flex h-9 flex-1 items-center justify-center rounded-lg"
              style={
                porUnidad === o.v
                  ? { backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
                  : { color: 'var(--text-dim)' }
              }
            >
              {o.t}
            </button>
          ))}
        </div>

        {porUnidad ? (
          <>
            <label className={label} style={{ color: 'var(--text)' }}>
              ¿Cuánto vendiste? <span style={{ color: 'var(--peligro)' }}>*</span>
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
                className="flex-1 rounded-xl border px-4 py-3 text-base focus:outline-none"
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

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={label} style={{ color: 'var(--text)' }}>
                  Precio por {unidadDe(unidad).corto.replace(/s$/, '')} ($) <span style={{ color: 'var(--peligro)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  inputMode="numeric"
                  placeholder="Ej. 38500"
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(e.target.value)}
                  className={campo}
                  style={campoEstilo}
                />
              </div>
            </div>

            {/* El total se muestra antes de guardar: es la comprobacion de que
                no se colo un cero de mas al escribir el precio. */}
            <div
              className="mb-4 flex items-baseline justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Total de la venta
              </span>
              <span className="font-serif text-lg font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                {pesos(totalCalculado)}
              </span>
            </div>
          </>
        ) : (
          <>
            <label className={label} style={{ color: 'var(--text)' }}>
              Cantidad vendida <span style={{ color: 'var(--peligro)' }}>*</span>
            </label>
            <input
              required
              placeholder="Ej. media carga"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={campo}
              style={campoEstilo}
            />

            <label className={label} style={{ color: 'var(--text)' }}>
              Precio total ($) <span style={{ color: 'var(--peligro)' }}>*</span>
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
          </>
        )}

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
          ¿Ya se cobró? <span style={{ color: 'var(--peligro)' }}>*</span>
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
            etiqueta="esta venta"
            onBorrar={() => borrarVenta(ventaExistente!.id)}
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
