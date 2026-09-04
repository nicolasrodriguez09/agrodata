import type { CSSProperties, ReactNode } from 'react';

type Tono = 'verde' | 'ambar' | 'gris' | 'rojo';

const tonos: Record<Tono, CSSProperties> = {
  verde: { backgroundColor: 'var(--recent)', color: 'var(--recent-text)' },
  ambar: { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' },
  gris: { backgroundColor: 'var(--dormant)', color: 'var(--dormant-text)' },
  rojo: { backgroundColor: 'var(--peligro-suave)', color: 'var(--peligro)' },
};

export default function Badge({ tono = 'gris', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={tonos[tono]}
    >
      {children}
    </span>
  );
}
