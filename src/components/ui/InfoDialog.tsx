import Button from './Button';
import { IconAlert, IconCheck } from './Icons';

interface InfoDialogProps {
  open: boolean;
  title: string;
  description?: string;
  tono?: 'error' | 'exito';
  onClose: () => void;
}

export default function InfoDialog({ open, title, description, tono = 'error', onClose }: InfoDialogProps) {
  if (!open) return null;
  const esError = tono === 'error';

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-stone-900/40 px-4 pb-4 sm:items-center sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div
          className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
            esError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
          }`}
        >
          {esError ? <IconAlert className="h-5 w-5" /> : <IconCheck className="h-5 w-5" />}
        </div>
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-stone-500">{description}</p>}

        <Button onClick={onClose} className="mt-5 w-full">
          Entendido
        </Button>
      </div>
    </div>
  );
}
