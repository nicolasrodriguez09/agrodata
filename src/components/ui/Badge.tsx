import type { ReactNode } from 'react';

type Tono = 'verde' | 'ambar' | 'gris' | 'rojo';

const tonos: Record<Tono, string> = {
  verde: 'bg-green-100 text-green-800',
  ambar: 'bg-amber-100 text-amber-800',
  gris: 'bg-stone-100 text-stone-600',
  rojo: 'bg-red-100 text-red-700',
};

export default function Badge({ tono = 'gris', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tonos[tono]}`}>
      {children}
    </span>
  );
}
