import { useEffect, useState } from 'react';
import { IconChevronRight } from '../ui/Icons';

export interface FilaRanking {
  id: string;
  label: string;
  sublabel?: string;
  valor: number;
}

export default function RankingBarras({ filas, onFilaClick }: { filas: FilaRanking[]; onFilaClick?: (id: string) => void }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    setMontado(false);
    const t = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(t);
  }, [filas]);

  const max = Math.max(1, ...filas.map((f) => f.valor));

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      {filas.map((f, i) => {
        const pct = f.valor > 0 ? Math.max((f.valor / max) * 100, 3) : 0;
        const esTop = i === 0 && f.valor > 0;
        const Contenedor = onFilaClick ? 'button' : 'div';
        return (
          <Contenedor
            key={f.id}
            type={onFilaClick ? 'button' : undefined}
            onClick={onFilaClick ? () => onFilaClick(f.id) : undefined}
            className={`mb-3.5 block w-full text-left last:mb-0 ${onFilaClick ? 'transition hover:brightness-95 active:scale-[0.99]' : ''}`}
          >
            <div className="mb-1 flex items-baseline gap-2">
              <span
                className="font-display flex-none text-[10px] font-black"
                style={{ color: esTop ? 'var(--gold)' : 'var(--text-dim)' }}
              >
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
                {f.label}
                {f.sublabel && (
                  <span className="ml-1 truncate text-xs font-normal" style={{ color: 'var(--text-dim)' }}>
                    · {f.sublabel}
                  </span>
                )}
              </p>
              <p className="flex-none text-xs font-medium" style={{ color: 'var(--text)' }}>
                $ {f.valor.toLocaleString('es-CO')}
              </p>
              {onFilaClick && <IconChevronRight className="h-3.5 w-3.5 flex-none" style={{ color: 'var(--text-dim)' }} />}
            </div>
            <div className="ml-4.5 h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--nodata)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: montado ? `${pct}%` : '0%',
                  backgroundColor: esTop ? 'var(--gold)' : 'var(--recent)',
                  transition: `width 650ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms`,
                }}
              />
            </div>
          </Contenedor>
        );
      })}
    </div>
  );
}
