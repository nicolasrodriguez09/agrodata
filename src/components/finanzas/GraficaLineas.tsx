import { useEffect, useState } from 'react';

export interface PuntoSerie {
  label: string;
  ventas: number;
  gastos: number;
}

const ANCHO = 300;
const ALTO = 150;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;

function puntosDe(valores: number[], max: number) {
  const n = valores.length;
  const alturaUtil = ALTO - PAD_TOP - PAD_BOTTOM;
  return valores.map((v, i) => {
    const x = n === 1 ? ANCHO / 2 : PAD_X + (i * (ANCHO - PAD_X * 2)) / (n - 1);
    const y = PAD_TOP + alturaUtil - (max > 0 ? (v / max) * alturaUtil : 0);
    return { x, y };
  });
}

/** Curva suave por punto medio: control = punto original, destino = punto medio con el siguiente. */
function pathSuave(puntos: { x: number; y: number }[]) {
  if (puntos.length === 0) return '';
  if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y} L ${puntos[0].x} ${puntos[0].y}`;
  let d = `M ${puntos[0].x} ${puntos[0].y}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const actual = puntos[i];
    const siguiente = puntos[i + 1];
    const mx = (actual.x + siguiente.x) / 2;
    const my = (actual.y + siguiente.y) / 2;
    d += ` Q ${actual.x} ${actual.y}, ${mx} ${my}`;
  }
  const ultimo = puntos[puntos.length - 1];
  d += ` L ${ultimo.x} ${ultimo.y}`;
  return d;
}

function pathArea(puntos: { x: number; y: number }[]) {
  if (puntos.length === 0) return '';
  const base = ALTO - PAD_BOTTOM;
  return `${pathSuave(puntos)} L ${puntos[puntos.length - 1].x} ${base} L ${puntos[0].x} ${base} Z`;
}

export default function GraficaLineas({ datos }: { datos: PuntoSerie[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(false);
    const t = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(t);
  }, [datos]);

  const max = Math.max(1, ...datos.map((d) => Math.max(d.ventas, d.gastos)));
  const puntosVentas = puntosDe(datos.map((d) => d.ventas), max);
  const puntosGastos = puntosDe(datos.map((d) => d.gastos), max);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="degVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--recent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--recent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="degGastos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b4552f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#b4552f" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* líneas guía horizontales */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={ANCHO - PAD_X}
            y1={PAD_TOP + (ALTO - PAD_TOP - PAD_BOTTOM) * f}
            y2={PAD_TOP + (ALTO - PAD_TOP - PAD_BOTTOM) * f}
            stroke="var(--border)"
            strokeWidth="0.5"
          />
        ))}

        <path d={pathArea(puntosGastos)} fill="url(#degGastos)" style={{ opacity: montado ? 1 : 0, transition: 'opacity 700ms ease 200ms' }} />
        <path d={pathArea(puntosVentas)} fill="url(#degVentas)" style={{ opacity: montado ? 1 : 0, transition: 'opacity 700ms ease 200ms' }} />

        <path
          d={pathSuave(puntosGastos)}
          fill="none"
          stroke="#b4552f"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: montado ? 0 : 1000,
            transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        <path
          d={pathSuave(puntosVentas)}
          fill="none"
          stroke="var(--recent)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: montado ? 0 : 1000,
            transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        {puntosVentas.map((p, i) => (
          <circle
            key={`v-${i}`}
            cx={p.x}
            cy={p.y}
            r={activo === i ? 4.5 : 3}
            fill="var(--surface)"
            stroke="var(--recent)"
            strokeWidth="2"
            style={{
              opacity: montado ? 1 : 0,
              transform: montado ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${p.x}px ${p.y}px`,
              transition: `opacity 400ms ease ${300 + i * 60}ms, transform 400ms ease ${300 + i * 60}ms, r 150ms ease`,
              cursor: 'pointer',
            }}
            onClick={() => setActivo(activo === i ? null : i)}
          />
        ))}
        {puntosGastos.map((p, i) => (
          <circle
            key={`g-${i}`}
            cx={p.x}
            cy={p.y}
            r={activo === i ? 4.5 : 3}
            fill="var(--surface)"
            stroke="#b4552f"
            strokeWidth="2"
            style={{
              opacity: montado ? 1 : 0,
              transform: montado ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${p.x}px ${p.y}px`,
              transition: `opacity 400ms ease ${300 + i * 60}ms, transform 400ms ease ${300 + i * 60}ms, r 150ms ease`,
              cursor: 'pointer',
            }}
            onClick={() => setActivo(activo === i ? null : i)}
          />
        ))}

        {/* área táctil ancha por punto, para que sea fácil tocar en el celular */}
        {datos.map((_, i) => {
          const x = datos.length === 1 ? ANCHO / 2 : PAD_X + (i * (ANCHO - PAD_X * 2)) / (datos.length - 1);
          return (
            <rect
              key={`hit-${i}`}
              x={x - ANCHO / datos.length / 2}
              y={0}
              width={ANCHO / datos.length}
              height={ALTO - PAD_BOTTOM}
              fill="transparent"
              onClick={() => setActivo(activo === i ? null : i)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between px-1">
        {datos.map((d, i) => (
          <span
            key={d.label}
            onClick={() => setActivo(activo === i ? null : i)}
            className="cursor-pointer text-[10px] font-medium"
            style={{ color: activo === i ? 'var(--text)' : 'var(--text-dim)' }}
          >
            {d.label}
          </span>
        ))}
      </div>

      {activo !== null && datos[activo] && (
        <div
          className="mt-3 flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
        >
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            {datos[activo].label}
          </span>
          <span className="flex gap-3">
            <span style={{ color: 'var(--recent)' }}>$ {datos[activo].ventas.toLocaleString('es-CO')}</span>
            <span style={{ color: '#b4552f' }}>$ {datos[activo].gastos.toLocaleString('es-CO')}</span>
          </span>
        </div>
      )}
    </div>
  );
}
