import { useEffect, useState, type FormEvent } from 'react';
import { crearLote, actualizarLote } from '../lib/lotes';
import type { Finca, Lote } from '../types/models';

interface Props {
  fincas: Finca[];
  loteExistente?: Lote | null;
  onCerrar: () => void;
}

export default function FormularioLote({ fincas, loteExistente, onCerrar }: Props) {
  const [nombre, setNombre] = useState('');
  const [fincaId, setFincaId] = useState<string>('');
  const [cultivo, setCultivo] = useState('Guayaba');
  const [area, setArea] = useState('');
  const [arboles, setArboles] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loteExistente) {
      setNombre(loteExistente.nombre);
      setFincaId(loteExistente.fincaId ?? '');
      setCultivo(loteExistente.cultivo);
      setArea(loteExistente.areaHectareas != null ? String(loteExistente.areaHectareas) : '');
      setArboles(loteExistente.cantidadArboles != null ? String(loteExistente.cantidadArboles) : '');
    }
  }, [loteExistente]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const datos = {
        nombre,
        fincaId: fincaId === '' ? null : fincaId,
        cultivo,
        areaHectareas: area.trim() === '' ? undefined : Number(area),
        cantidadArboles: arboles.trim() === '' ? undefined : Number(arboles),
      };
      if (loteExistente) {
        await actualizarLote(loteExistente.id, datos);
      } else {
        await crearLote(datos);
      }
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
        className="w-full rounded-t-2xl p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <h2 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {loteExistente ? 'Editar lote' : 'Nuevo lote'}
        </h2>

        <label className={label} style={{ color: 'var(--text)' }}>
          Nombre <span className="text-red-500">*</span>
        </label>
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} style={campoEstilo} />

        <label className={label} style={{ color: 'var(--text)' }}>
          Finca
        </label>
        <select value={fincaId} onChange={(e) => setFincaId(e.target.value)} className={campo} style={campoEstilo}>
          <option value="">Sin finca (suelto)</option>
          {fincas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>

        <label className={label} style={{ color: 'var(--text)' }}>
          Cultivo actual <span className="text-red-500">*</span>
        </label>
        <input required value={cultivo} onChange={(e) => setCultivo(e.target.value)} className={campo} style={campoEstilo} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} style={{ color: 'var(--text)' }}>
              Área (ha)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={campo}
              style={campoEstilo}
            />
          </div>
          <div>
            <label className={label} style={{ color: 'var(--text)' }}>
              Árboles/plantas
            </label>
            <input
              type="number"
              min="0"
              value={arboles}
              onChange={(e) => setArboles(e.target.value)}
              className={campo}
              style={campoEstilo}
            />
          </div>
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
