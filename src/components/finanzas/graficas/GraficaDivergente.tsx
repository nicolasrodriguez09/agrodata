import { pesos } from '../../../lib/formatoDinero';

export interface FilaDivergente {
  id: string;
  etiqueta: string;
  sublabel?: string;
  valor: number;
}

interface Props {
  filas: FilaDivergente[];
  onClickFila?: (id: string) => void;
  /** Texto del valor, por si no son pesos (ej. "$ 8.4 M / ha"). */
  formato?: (v: number) => string;
}

/**
 * Barras que salen de un cero central: a la derecha ganancia, a la izquierda
 * pérdida. El signo y el número van siempre escritos al lado, así que el color
 * refuerza pero nunca es la única pista — que es lo que exige no depender del
 * color para leer el dato.
 */
export default function GraficaDivergente({ filas, onClickFila, formato = pesos }: Props) {
  if (filas.length === 0) return null;
  const tope = Math.max(...filas.map((f) => Math.abs(f.valor)), 1);

  return (
    <div className="flex flex-col gap-2">
      {filas.map((f) => {
        const positivo = f.valor >= 0;
        const ancho = (Math.abs(f.valor) / tope) * 50; // 50% a cada lado del cero
        const Contenedor = onClickFila ? 'button' : 'div';
        return (
          <Contenedor
            key={f.id}
            {...(onClickFila ? { onClick: () => onClickFila(f.id), type: 'button' as const } : {})}
            className="w-full text-left"
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-medium" style={{ color: 'var(--text)' }}>
                {f.etiqueta}
                {f.sublabel && (
                  <span className="font-normal" style={{ color: 'var(--text-dim)' }}>
                    {' '}
                    · {f.sublabel}
                  </span>
                )}
              </p>
              <p
                className="flex-none text-xs font-semibold tabular-nums"
                style={{ color: positivo ? 'var(--text)' : 'var(--serie-2)' }}
              >
                {formato(f.valor)}
              </p>
            </div>
            <div className="relative h-2">
              <div
                className="absolute inset-y-0"
                style={{
                  backgroundColor: positivo ? 'var(--serie-3)' : 'var(--serie-2)',
                  left: positivo ? '50%' : `${50 - ancho}%`,
                  width: `${ancho}%`,
                  // Extremo redondeado del lado del dato, cuadrado contra el cero.
                  borderTopRightRadius: positivo ? 4 : 0,
                  borderBottomRightRadius: positivo ? 4 : 0,
                  borderTopLeftRadius: positivo ? 0 : 4,
                  borderBottomLeftRadius: positivo ? 0 : 4,
                }}
              />
              {/* El eje cero va ENCIMA de la barra: debajo quedaba tapado y la
                  referencia de dónde empieza cada barra se perdía. Se extiende
                  un poco arriba y abajo para que se lea como eje y no como borde. */}
              <div
                className="absolute left-1/2 w-px"
                style={{ backgroundColor: 'var(--grafica-eje)', top: -3, bottom: -3 }}
              />
            </div>
          </Contenedor>
        );
      })}
    </div>
  );
}
