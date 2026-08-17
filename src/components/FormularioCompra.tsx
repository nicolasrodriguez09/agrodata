import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { crearCompra } from '../lib/compras';
import { subirFoto } from '../lib/cloudinary';
import { useAuth } from '../lib/AuthContext';
import { IconCamera } from './ui/Icons';

interface Props {
  onCerrar: () => void;
  onGuardado: () => void;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const OPCIONES_PERSONA = ['Freddy', 'Emerson', 'Otro'];

export default function FormularioCompra({ onCerrar, onGuardado }: Props) {
  const { user } = useAuth();
  const [producto, setProducto] = useState('');
  const [costo, setCosto] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [proveedor, setProveedor] = useState('');
  const [personaOpcion, setPersonaOpcion] = useState<string | null>(null);
  const [otroNombre, setOtroNombre] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  function handleFotoSeleccionada(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFoto(file);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!personaOpcion || (personaOpcion === 'Otro' && !otroNombre.trim())) {
      setError('Elegí quién hizo la compra.');
      return;
    }
    const costoNum = Number(costo);
    if (!costoNum || costoNum <= 0) {
      setError('Ingresá un costo válido.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const personaQueCompro = personaOpcion === 'Otro' ? otroNombre.trim() : personaOpcion;
      const id = await crearCompra({
        producto,
        costo: costoNum,
        fecha,
        proveedor: proveedor || undefined,
        personaQueCompro,
        creadoPor: user!.uid,
      });
      if (foto) {
        setSubiendoFoto(true);
        await subirFoto(foto, { coleccion: 'compras', docId: id, campo: 'fotoFacturaUrl' });
      }
      onGuardado();
      onCerrar();
    } catch {
      setError('No se pudo guardar. Probá de nuevo.');
    } finally {
      setGuardando(false);
      setSubiendoFoto(false);
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
          Compra de insumo
        </h2>

        <label className={label} style={{ color: 'var(--text)' }}>
          Producto <span className="text-red-500">*</span>
        </label>
        <input
          required
          placeholder="Ej. Fungicida Cupravit"
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Costo <span className="text-red-500">*</span>
        </label>
        <input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Ej. 85000"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
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
          Proveedor / dónde se compró (opcional)
        </label>
        <input
          placeholder="Ej. Agroinsumos El Progreso"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className={campo}
          style={campoEstilo}
        />

        <label className={label} style={{ color: 'var(--text)' }}>
          Quién compró <span className="text-red-500">*</span>
        </label>
        <div className="mb-2 flex gap-2">
          {OPCIONES_PERSONA.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setPersonaOpcion(op)}
              className="flex-1 rounded-xl border py-2.5 text-sm font-medium"
              style={
                personaOpcion === op
                  ? { backgroundColor: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--gold-ink)' }
                  : { borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {op}
            </button>
          ))}
        </div>
        {personaOpcion === 'Otro' && (
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
        {personaOpcion !== 'Otro' && <div className="mb-4" />}

        <label className={label} style={{ color: 'var(--text)' }}>
          Foto de la factura (opcional)
        </label>
        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          onChange={handleFotoSeleccionada}
          className="hidden"
        />
        {fotoPreview ? (
          <div className="mb-4 flex items-center gap-3">
            <img src={fotoPreview} alt="Factura" className="h-16 w-16 flex-none rounded-lg object-cover" style={{ border: '1px solid var(--border)' }} />
            <button
              type="button"
              onClick={() => {
                setFoto(null);
                setFotoPreview(null);
                if (inputFotoRef.current) inputFotoRef.current.value = '';
              }}
              className="text-sm font-medium"
              style={{ color: 'var(--text-dim)' }}
            >
              Quitar foto
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            <IconCamera className="h-4.5 w-4.5" />
            Tomar foto o elegir de la galería
          </button>
        )}

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
            {subiendoFoto ? 'Subiendo foto...' : guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
