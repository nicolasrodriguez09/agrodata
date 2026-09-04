import Button from './Button';
import { IconAlert } from './Icons';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0">
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
          style={
            danger
              ? { backgroundColor: 'var(--peligro-suave)', color: 'var(--peligro)' }
              : { backgroundColor: 'var(--aviso-suave)', color: 'var(--aviso)' }
          }
        >
          <IconAlert className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-base font-semibold" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            {description}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
