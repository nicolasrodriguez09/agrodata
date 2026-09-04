import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { mensajeParaUsuario } from '../../lib/errores';
import { IconTrash } from './Icons';

interface Props {
  /** Cómo se nombra el registro en la confirmación, ej. "esta venta". */
  etiqueta: string;
  /** Aclaración extra, ej. que borrarlo devuelve el insumo al inventario. */
  descripcion?: string;
  onBorrar: () => Promise<void>;
  onBorrado: () => void;
}

export default function BotonBorrarRegistro({ etiqueta, descripcion, onBorrar, onBorrado }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmar() {
    setConfirmando(false);
    setBorrando(true);
    setError(null);
    try {
      await onBorrar();
      onBorrado();
    } catch (err) {
      // Si el motivo es explicable (ej. dejaría el inventario en negativo) se
      // muestra tal cual; si es una falla técnica, el mensaje genérico.
      setError(mensajeParaUsuario(err, 'No se pudo borrar. Intenta de nuevo.'));
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      {error && <p className="mt-3 text-sm" style={{ color: 'var(--peligro)' }}>{error}</p>}
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        disabled={borrando}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-medium disabled:opacity-60"
        style={{ borderColor: '#b4552f', color: '#b4552f' }}
      >
        <IconTrash className="h-4 w-4" />
        {borrando ? 'Borrando...' : 'Borrar'}
      </button>

      <ConfirmDialog
        open={confirmando}
        title={`¿Borrar ${etiqueta}?`}
        description={descripcion ?? 'Esta acción no se puede deshacer.'}
        confirmLabel="Borrar"
        danger
        onConfirm={handleConfirmar}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
