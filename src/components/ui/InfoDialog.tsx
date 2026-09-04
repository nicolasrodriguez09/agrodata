import Button from './Button';
import { IconAlert, IconCheck } from './Icons';

interface InfoDialogProps {
  open: boolean;
  title: string;
  description?: string;
  tono?: 'error' | 'exito' | 'aviso';
  onClose: () => void;
}

const tonos = {
  error: { fondo: 'var(--peligro-suave)', color: 'var(--peligro)' },
  aviso: { fondo: 'var(--aviso-suave)', color: 'var(--aviso)' },
  exito: { fondo: 'var(--recent)', color: 'var(--recent-text)' },
};

export default function InfoDialog({ open, title, description, tono = 'error', onClose }: InfoDialogProps) {
  if (!open) return null;
  const esError = tono !== 'exito';

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0">
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: tonos[tono].fondo, color: tonos[tono].color }}
        >
          {esError ? <IconAlert className="h-5 w-5" /> : <IconCheck className="h-5 w-5" />}
        </div>
        <h2 className="font-serif text-base font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            {description}
          </p>
        )}

        <Button onClick={onClose} className="mt-5 w-full">
          Entendido
        </Button>
      </div>
    </div>
  );
}
