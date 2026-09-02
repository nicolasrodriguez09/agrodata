import { useEffect, useState, type FormEvent } from 'react';
import { crearAplicacion, actualizarAplicacion } from '../lib/aplicaciones';
import { escucharInsumos } from '../lib/insumos';
import { useAuth } from '../lib/AuthContext';
import SelectorInsumo from './finanzas/SelectorInsumo';
import type { Aplicacion, InsumoInventario } from '../types/models';

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
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [insumoId, setInsumoId] = useState<string | null>(aplicacionExistente?.insumoId ?? null);
  const [dosis, setDosis] = useState(aplicacionExistente?.dosis ?? '');
  const [cantidad, setCantidad] = useState(
    typeof aplicacionExistente?.cantidad === 'number' ? String(aplicacionExistente.cantidad) : '',
  );
  const [fecha, setFecha] = useState(aplicacionExistente?.fecha ?? hoyISO());
  const responsableInicial = aplicacionExistente?.responsable ?? null;
  const esOpcionConocida = responsableInicial && OPCIONES_RESPONSABLE.slice(0, 2).includes(responsableInicial);
  const [responsableOpcion, setResponsableOpcion] = useState<string | null>(
    responsableInicial ? (esOpcionConocida ? responsableInicial : 'Otro') : null,
  );
  const [otroNombre, setOtroNombre] = useState(responsableInicial && !esOpcionConocida ? responsableInicial : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => escucharInsumos(setInsumos), []);

  const insumoSeleccionado = insumos.find((i) => i.id === insumoId) ?? null;
  const cantidadNum = Number(cantidad) || 0;
  const dejaStockNegativo = !!insumoSeleccionado && cantidadNum > insumoSeleccionado.stockActual;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!insumoSeleccionado) {
      setError('Elegí qué insumo aplicaste.');
      return;
    }
    if (!responsableOpcion || (responsableOpcion === 'Otro' && !otroNombre.trim())) {
      setError('Elegí quién la aplicó.');
      return;
    }
    if (!cantidadNum || cantidadNum <= 0) {
      setError('Ingresá una cantidad válida.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const responsable = responsableOpcion === 'Otro' ? otroNombre.trim() : responsableOpcion;
      const datos = {
        insumoId: insumoSeleccionado.id,
        producto: insumoSeleccionado.nombre,
        dosis,
        cantidad: cantidadNum,
        unidad: insumoSeleccionado.unidad,
        costoUnitario: insumoSeleccionado.costoUnitario,
        fecha,
        responsable,
      };
      if (editando) {
        await actualizarAplicacion(aplicacionExistente!, datos);
      } else {
        await crearAplicacion({ loteId, cicloId, ...datos, creadoPor: user!.uid });
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
          Insumo <span className="text-red-500">*</span>
        </label>
        <SelectorInsumo insumos={insumos} valor={insumoId} onChange={setInsumoId} creadoPor={user!.uid} />
        {insumoSeleccionado && (
          <p className="-mt-2.5 mb-4 text-xs" style={{ color: 'var(--text-dim)' }}>
            Stock disponible: {insumoSeleccionado.stockActual} {insumoSeleccionado.unidad}
          </p>
        )}

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
          Cantidad aplicada {insumoSeleccionado ? `(${insumoSeleccionado.unidad})` : ''} <span className="text-red-500">*</span>
        </label>
        <input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Ej. 20"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={campo}
          style={campoEstilo}
        />
        {dejaStockNegativo && (
          <p className="-mt-2.5 mb-4 text-xs" style={{ color: '#b4552f' }}>
            Vas a dejar el stock en negativo — puede que falte registrar una compra.
          </p>
        )}

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
