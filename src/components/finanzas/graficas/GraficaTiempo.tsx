import { useMemo, useState } from 'react';
import { pesos, pesosCorto, marcasDeEje } from '../../../lib/formatoDinero';

export interface SerieTiempo {
  nombre: string;
  color: string;
  valores: number[];
  /** Relleno bajo la línea, al 10%. Solo para la serie protagonista. */
  conArea?: boolean;
}

interface Props {
  etiquetas: string[];
  series: SerieTiempo[];
  /** Cuando hay una sola serie no va leyenda: el título ya dice qué se grafica. */
  alto?: number;
}

const ANCHO = 320;
const PAD_IZQ = 46;
const PAD_DER = 10;
const PAD_ARRIBA = 12;
const PAD_ABAJO = 26;

/**
 * Líneas en el tiempo, una o dos series.
 *
 * La curva pasa por cada punto (Catmull-Rom convertida a Bézier): con el método
 * anterior —los datos como punto de control hacia el punto medio— la línea
 * nunca tocaba sus propios datos y en un mes de pico el marcador quedaba
 * flotando lejos de la curva.
 */
export default function GraficaTiempo({ etiquetas, series, alto = 190 }: Props) {
  const [activo, setActivo] = useState<number | null>(null);

  const { maximo, marcas } = useMemo(() => {
    const todos = series.flatMap((s) => s.valores);
    const max = Math.max(1, ...todos);
    const m = marcasDeEje(max);
    return { maximo: m[m.length - 1] || max, marcas: m };
  }, [series]);

  const n = etiquetas.length;
  const utilX = ANCHO - PAD_IZQ - PAD_DER;
  const utilY = alto - PAD_ARRIBA - PAD_ABAJO;
  const x = (i: number) => (n === 1 ? PAD_IZQ + utilX / 2 : PAD_IZQ + (i * utilX) / (n - 1));
  const y = (v: number) => PAD_ARRIBA + utilY - (v / maximo) * utilY;

  function camino(valores: number[]) {
    const pts = valores.map((v, i) => ({ x: x(i), y: y(v) }));
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    const en = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = en(i - 1), p1 = en(i), p2 = en(i + 1), p3 = en(i + 2);
      d += ` C ${p1.x + (p2.x - p0.x) / 8} ${p1.y + (p2.y - p0.y) / 8}, ${p2.x - (p3.x - p1.x) / 8} ${p2.y - (p3.y - p1.y) / 8}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  if (n === 0) return null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${ANCHO} ${alto}`} className="w-full" style={{ overflow: 'visible' }} role="img">
        {/* Rejilla: línea de un pelo, sólida y discreta. Nunca punteada. */}
        {marcas.map((m) => (
          <g key={m}>
            <line x1={PAD_IZQ} y1={y(m)} x2={ANCHO - PAD_DER} y2={y(m)} stroke="var(--grafica-grid)" strokeWidth="1" />
            <text x={PAD_IZQ - 6} y={y(m) + 3} textAnchor="end" fontSize="7.5" fill="var(--text-dim)">
              {m === 0 ? '0' : pesosCorto(m)}
            </text>
          </g>
        ))}

        {series.map((s) =>
          s.conArea ? (
            <path
              key={`area-${s.nombre}`}
              d={`${camino(s.valores)} L ${x(n - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`}
              fill={s.color}
              opacity="0.1"
            />
          ) : null,
        )}

        {series.map((s) => (
          <path
            key={`linea-${s.nombre}`}
            d={camino(s.valores)}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Marcador solo en el punto final: etiquetar cada punto es ruido. */}
        {series.map((s) => (
          <circle
            key={`fin-${s.nombre}`}
            cx={x(n - 1)}
            cy={y(s.valores[n - 1] ?? 0)}
            r="4"
            fill={s.color}
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}

        {activo != null && (
          <>
            <line x1={x(activo)} y1={PAD_ARRIBA} x2={x(activo)} y2={PAD_ARRIBA + utilY} stroke="var(--grafica-eje)" strokeWidth="1" />
            {series.map((s) => (
              <circle
                key={`hover-${s.nombre}`}
                cx={x(activo)}
                cy={y(s.valores[activo] ?? 0)}
                r="4.5"
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth="2"
              />
            ))}
          </>
        )}

        {etiquetas.map((e, i) => (
          <text key={e} x={x(i)} y={alto - 8} textAnchor="middle" fontSize="7.5" fill="var(--text-dim)">
            {e}
          </text>
        ))}

        {/* Zonas de toque anchas: el punto de 8px es muy chico para un dedo. */}
        {etiquetas.map((e, i) => (
          <rect
            key={`zona-${e}`}
            x={x(i) - utilX / (n * 2 || 1)}
            y={PAD_ARRIBA}
            width={utilX / (n || 1)}
            height={utilY}
            fill="transparent"
            onMouseEnter={() => setActivo(i)}
            onMouseLeave={() => setActivo(null)}
            onTouchStart={() => setActivo(i)}
          />
        ))}
      </svg>

      {activo != null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border px-2.5 py-2 text-xs shadow-lg"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            left: `${((x(activo) - PAD_IZQ) / (ANCHO - PAD_IZQ - PAD_DER)) * 100}%`,
            top: 0,
            transform: activo > etiquetas.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
          }}
        >
          <p className="mb-1 font-medium" style={{ color: 'var(--text)' }}>
            {etiquetas[activo]}
          </p>
          {series.map((s) => (
            <p key={s.nombre} className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
              <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: s.color }} />
              {s.nombre}: <b style={{ color: 'var(--text)' }}>{pesos(s.valores[activo] ?? 0)}</b>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
