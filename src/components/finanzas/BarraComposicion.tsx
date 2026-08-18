import { useEffect, useState } from 'react';

interface Segmento {
  label: string;
  valor: number;
  color: string;
}

export default function BarraComposicion({
  titulo,
  segmentos,
  onVerDetalles,
}: {
  titulo: string;
  segmentos: Segmento[];
  onVerDetalles?: () => void;
}) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(t);
  }, [segmentos]);

  const total = segmentos.reduce((s, seg) => s + seg.valor, 0);

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {titulo}
        </p>
        {onVerDetalles && (
          <button
            onClick={onVerDetalles}
            className="flex-none text-xs font-medium underline underline-offset-2"
            style={{ color: 'var(--gold)' }}
          >
            Ver detalles
          </button>
        )}
      </div>
      <div className="mb-3 flex h-3 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--nodata)' }}>
        {segmentos.map((seg, i) => {
          const pct = total > 0 ? (seg.valor / total) * 100 : 0;
          return (
            <div
              key={seg.label}
              style={{
                width: montado ? `${pct}%` : '0%',
                backgroundColor: seg.color,
                transition: `width 700ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {segmentos.map((seg) => {
          const pct = total > 0 ? Math.round((seg.valor / total) * 100) : 0;
          return (
            <div key={seg.label} className="flex items-center gap-1.5 text-xs">
              <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: seg.color }} />
              <span style={{ color: 'var(--text-dim)' }}>{seg.label}</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                $ {seg.valor.toLocaleString('es-CO')} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
