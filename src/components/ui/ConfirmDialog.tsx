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
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/40 px-4 pb-4 sm:items-center sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div
          className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
            danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <IconAlert className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-stone-500">{description}</p>}

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
