import { useEffect, useState } from 'react';
import { crearInsumo } from '../../lib/insumos';
import type { InsumoInventario } from '../../types/models';

interface Props {
  insumos: InsumoInventario[];
  valor: string | null;
  onChange: (insumoId: string) => void;
  creadoPor: string;
}

const UNIDADES_COMUNES = ['litros', 'kg', 'gramos', 'bultos', 'unidades'];

export default function SelectorInsumo({ insumos, valor, onChange, creadoPor }: Props) {
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [unidadNuevo, setUnidadNuevo] = useState('');
  const [creando, setCreando] = useState(false);
  const [idPendiente, setIdPendiente] = useState<string | null>(null);

  // Una vez que el nuevo insumo aparece en la lista (vía onSnapshot en el padre), lo seleccionamos.
  useEffect(() => {
    if (idPendiente && insumos.some((i) => i.id === idPendiente)) {
      onChange(idPendiente);
      setIdPendiente(null);
      setCreandoNuevo(false);
      setNombreNuevo('');
      setUnidadNuevo('');
    }
  }, [insumos, idPendiente, onChange]);

  async function handleCrear() {
    if (!nombreNuevo.trim() || !unidadNuevo.trim()) return;
    setCreando(true);
    try {
      const id = await crearInsumo(nombreNuevo, unidadNuevo, creadoPor);
      setIdPendiente(id);
    } finally {
      setCreando(false);
    }
  }

  const campo = 'mb-4 w-full rounded-xl border px-4 py-3 text-base focus:outline-none';
  const campoEstilo = { borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' };

  if (creandoNuevo) {
    return (
      <div className="mb-4 rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text)' }}>
          Nuevo insumo
        </p>
        <input
          autoFocus
          placeholder="Nombre del insumo"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
          className="mb-2 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
          style={campoEstilo}
        />
        <input
          list="unidades-comunes"
          placeholder="Unidad (litros, kg, bultos...)"
          value={unidadNuevo}
          onChange={(e) => setUnidadNuevo(e.target.value)}
          className="mb-3 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
          style={campoEstilo}
        />
        <datalist id="unidades-comunes">
          {UNIDADES_COMUNES.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCreandoNuevo(false)}
            className="flex-1 rounded-xl border py-2 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCrear}
            disabled={creando || !nombreNuevo.trim() || !unidadNuevo.trim()}
            className="flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            {creando ? 'Creando...' : 'Crear insumo'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <select
      required
      value={valor ?? ''}
      onChange={(e) => {
        if (e.target.value === '__nuevo__') setCreandoNuevo(true);
        else onChange(e.target.value);
      }}
      className={campo}
      style={campoEstilo}
    >
      <option value="" disabled>
        Elegí un insumo
      </option>
      {insumos.map((i) => (
        <option key={i.id} value={i.id}>
          {i.nombre} ({i.unidad})
        </option>
      ))}
      <option value="__nuevo__">+ Nuevo insumo...</option>
    </select>
  );
}
