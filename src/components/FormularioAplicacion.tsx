import { useEffect, useState, type FormEvent } from 'react';
import { crearAplicacion, actualizarAplicacion, borrarAplicacion } from '../lib/aplicaciones';
import { escucharInsumos } from '../lib/insumos';
import { useAuth } from '../lib/AuthContext';
import BotonBorrarRegistro from './ui/BotonBorrarRegistro';
import SelectorInsumo from './finanzas/SelectorInsumo';
import type { Aplicacion, InsumoInventario } from '../types/models';
import { hoyISO } from '../lib/fechas';
import { formatoCantidad } from '../lib/cantidades';
import { mensajeParaUsuario } from '../lib/errores';

interface Props {
  loteId: string;
  cicloId: string;
  aplicacionExistente?: Aplicacion | null;
  onCerrar: () => void;
  onGuardado: () => void;
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
  const cantidadPrevia =
    aplicacionExistente && typeof aplicacionExistente.cantidad === 'number' && aplicacionExistente.insumoId === insumoId
      ? aplicacionExistente.cantidad
      : 0;
  const disponible = (insumoSeleccionado?.stockActual ?? 0) + cantidadPrevia;
  const noAlcanza = !!insumoSeleccionado && cantidadNum > disponible;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!insumoSeleccionado) {
      setError('Elige qué insumo aplicaste.');
      return;
    }
    if (!responsableOpcion || (responsableOpcion === 'Otro' && !otroNombre.trim())) {
      setError('Elige quién la aplicó.');
      return;
    }
    if (!cantidadNum || cantidadNum <= 0) {
      setError('Ingresa una cantidad válida.');
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
    } catch (err) {
      setError(mensajeParaUsuario(err, 'No se pudo guardar. Intenta de nuevo.'));
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
          {editando ? 'Editar aplicación' : 'Aplicación de insumo'}
        </h2>

        <label className={label} style={{ color: 'var(--text)' }}>
          Insumo <span style={{ color: 'var(--peligro)' }}>*</span>
        </label>
        <SelectorInsumo insumos={insumos} valor={insumoId} onChange={setInsumoId} creadoPor={user!.uid} />
        {insumoSeleccionado && (
          <p className="-mt-2.5 mb-4 text-xs" style={{ color: 'var(--text-dim)' }}>
            Stock disponible: {formatoCantidad(insumoSeleccionado.stockActual)} {insumoSeleccionado.unidad}
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
          Cantidad aplicada {insumoSeleccionado ? `(${insumoSeleccionado.unidad})` : ''} <span style={{ color: 'var(--peligro)' }}>*</span>
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
        {/* Bloqueo, no advertencia: un stock negativo significa haber aplicado
            algo que nunca entró, y en producción eso descuadra el inventario y
            el costo del lote. Se corta acá y se dice qué hacer. */}
        {noAlcanza && (
          <div
            className="-mt-2.5 mb-4 rounded-xl border px-3.5 py-3"
            style={{ borderColor: 'var(--peligro)', backgroundColor: 'var(--peligro-suave)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--peligro)' }}>
              No alcanza el inventario
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text)' }}>
              Hay {formatoCantidad(disponible)} {insumoSeleccionado!.unidad} y estás aplicando{' '}
              {formatoCantidad(cantidadNum)}. Registra primero la compra en Finanzas → Compras.
            </p>
          </div>
        )}

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
          Quién la aplicó <span style={{ color: 'var(--peligro)' }}>*</span>
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
            disabled={guardando || noAlcanza}
            className="flex-1 rounded-xl py-3 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {editando && (
          <BotonBorrarRegistro
            etiqueta="esta aplicación"
            descripcion="Se le va a devolver al inventario el insumo que esta aplicación había descontado."
            onBorrar={() => borrarAplicacion(aplicacionExistente!)}
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
