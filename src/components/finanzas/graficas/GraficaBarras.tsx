import { pesos } from '../../../lib/formatoDinero';

export interface FilaBarra {
  id: string;
  etiqueta: string;
  sublabel?: string;
  valor: number;
}

interface Props {
  filas: FilaBarra[];
  /** Una sola serie = un solo color. Nunca degradar el color según el tamaño:
   *  eso codifica dos veces lo mismo y gasta el único canal libre. */
  color?: string;
  formato?: (v: number) => string;
}

export default function GraficaBarras({ filas, color = 'var(--serie-1)', formato = pesos }: Props) {
  if (filas.length === 0) return null;
  const tope = Math.max(...filas.map((f) => f.valor), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {filas.map((f) => (
        <div key={f.id}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="truncate text-xs" style={{ color: 'var(--text)' }}>
              {f.etiqueta}
              {f.sublabel && (
                <span style={{ color: 'var(--text-dim)' }}>
                  {' '}
                  · {f.sublabel}
                </span>
              )}
            </p>
            <p className="flex-none text-xs font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {formato(f.valor)}
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-sm" style={{ backgroundColor: 'var(--grafica-grid)' }}>
            <div
              className="h-full rounded-r-sm"
              style={{ width: `${Math.max((f.valor / tope) * 100, 1)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
