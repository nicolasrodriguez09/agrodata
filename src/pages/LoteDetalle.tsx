import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { escucharFincas } from '../lib/fincas';
import { escucharLote, borrarLote } from '../lib/lotes';
import type { Finca, Lote } from '../types/models';
import FormularioLote from '../components/FormularioLote';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  IconArrowLeft,
  IconDroplet,
  IconBasket,
  IconTag,
  IconUsers,
  IconPencil,
  IconTrash,
} from '../components/ui/Icons';

const acciones = [
  { label: 'Aplicación de insumo', Icon: IconDroplet },
  { label: 'Registrar cosecha', Icon: IconBasket },
  { label: 'Registrar venta', Icon: IconTag },
  { label: 'Pago de jornal', Icon: IconUsers },
];

export default function LoteDetalle() {
  const { loteId } = useParams<{ loteId: string }>();
  const navigate = useNavigate();
  const [lote, setLote] = useState<Lote | null | undefined>(undefined);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [editando, setEditando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  useEffect(() => {
    if (!loteId) return;
    const unsubLote = escucharLote(loteId, setLote);
    const unsubFincas = escucharFincas(setFincas);
    return () => {
      unsubLote();
      unsubFincas();
    };
  }, [loteId]);

  if (lote === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p style={{ color: 'var(--text-dim)' }}>Cargando...</p>
      </div>
    );
  }

  if (lote === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          <IconArrowLeft className="h-4 w-4" />
          Mis lotes
        </Link>
        <p style={{ color: 'var(--text)' }}>Este lote no existe o fue borrado.</p>
      </div>
    );
  }

  const finca = fincas.find((f) => f.id === lote.fincaId);

  async function handleBorrar() {
    setConfirmarBorrado(false);
    await borrarLote(lote!.id);
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
        <IconArrowLeft className="h-4 w-4" />
        Mis lotes
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            {lote.nombre}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {finca ? finca.nombre : 'Lote suelto'} · {lote.cultivo}
          </p>
        </div>
        <div className="flex flex-none gap-1">
          <button
            onClick={() => setEditando(true)}
            aria-label="Editar lote"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmarBorrado(true)}
            aria-label="Borrar lote"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: '#b4552f' }}
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <p style={{ color: 'var(--text-dim)' }}>Área</p>
          <p className="font-medium" style={{ color: 'var(--text)' }}>
            {lote.areaHectareas != null ? `${lote.areaHectareas} ha` : '—'}
          </p>
        </div>
        <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <p style={{ color: 'var(--text-dim)' }}>Árboles/plantas</p>
          <p className="font-medium" style={{ color: 'var(--text)' }}>
            {lote.cantidadArboles != null ? lote.cantidadArboles : '—'}
          </p>
        </div>
      </div>

      <div
        className="mt-4 rounded-xl border p-4"
        style={{ borderColor: 'var(--gold)', backgroundColor: 'color-mix(in srgb, var(--gold) 12%, transparent)' }}
      >
        <p className="font-display mb-1 text-[11px] font-black tracking-wide uppercase" style={{ color: 'var(--gold)' }}>
          Ciclo
        </p>
        <p className="font-medium" style={{ color: 'var(--text)' }}>
          Todavía no hay un ciclo activo en este lote
        </p>
      </div>

      <h2 className="font-display mt-6 mb-3 text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
        Acciones
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {acciones.map(({ label, Icon }) => (
          <button
            key={label}
            className="rounded-xl border p-4 text-left transition hover:brightness-95 active:scale-[0.98]"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <div
              className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--gold)' }}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {label}
            </p>
          </button>
        ))}
      </div>

      <h2 className="font-display mt-6 mb-2 text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
        Historial del ciclo
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Todavía no hay registros.
      </p>

      {editando && <FormularioLote fincas={fincas} loteExistente={lote} onCerrar={() => setEditando(false)} />}

      <ConfirmDialog
        open={confirmarBorrado}
        title={`¿Borrar el lote "${lote.nombre}"?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        danger
        onConfirm={handleBorrar}
        onCancel={() => setConfirmarBorrado(false)}
      />
    </div>
  );
}
