import { useEffect, useState } from 'react';
import { IconChevronRight } from '../ui/Icons';

const COLOR_NEGATIVO = '#b4552f';

export interface FilaRanking {
  id: string;
  label: string;
  sublabel?: string;
  valor: number; // puede ser negativo (pérdida)
  extra?: string; // badge chico junto al valor, ej. "+38%"
}

export default function RankingBarras({ filas, onFilaClick }: { filas: FilaRanking[]; onFilaClick?: (id: string) => void }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    setMontado(false);
    const t = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(t);
  }, [filas]);

  const maxAbs = Math.max(1, ...filas.map((f) => Math.abs(f.valor)));

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      {filas.map((f, i) => {
        const esNegativo = f.valor < 0;
        const pct = f.valor !== 0 ? Math.max((Math.abs(f.valor) / maxAbs) * 100, 3) : 0;
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
              {f.extra && (
                <span
                  className="flex-none rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={
                    esNegativo
                      ? { backgroundColor: 'color-mix(in srgb, ' + COLOR_NEGATIVO + ' 15%, transparent)', color: COLOR_NEGATIVO }
                      : { backgroundColor: 'color-mix(in srgb, var(--recent) 15%, transparent)', color: 'var(--recent)' }
                  }
                >
                  {f.extra}
                </span>
              )}
              <p className="flex-none text-xs font-medium" style={{ color: esNegativo ? COLOR_NEGATIVO : 'var(--text)' }}>
                {esNegativo ? '-$ ' : '$ '}
                {Math.abs(f.valor).toLocaleString('es-CO')}
              </p>
              {onFilaClick && <IconChevronRight className="h-3.5 w-3.5 flex-none" style={{ color: 'var(--text-dim)' }} />}
            </div>
            <div className="ml-4.5 h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--nodata)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: montado ? `${pct}%` : '0%',
                  backgroundColor: esNegativo ? COLOR_NEGATIVO : esTop ? 'var(--gold)' : 'var(--recent)',
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
