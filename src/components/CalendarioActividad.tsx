import { useMemo, useState } from 'react';
import type { Aplicacion, Cosecha } from '../types/models';
import { IconChevronRight } from './ui/Icons';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function hoyISO() {
  const h = new Date();
  return iso(h.getFullYear(), h.getMonth(), h.getDate());
}

interface Props {
  aplicaciones: Aplicacion[];
  cosechas: Cosecha[];
}

export default function CalendarioActividad({ aplicaciones, cosechas }: Props) {
  const todasLasFechas = [...aplicaciones.map((a) => a.fecha), ...cosechas.map((c) => c.fecha)].sort();
  const primerFecha = todasLasFechas[todasLasFechas.length - 1] ?? hoyISO();
  const [year, setYear] = useState(Number(primerFecha.slice(0, 4)));
  const [month, setMonth] = useState(Number(primerFecha.slice(5, 7)) - 1);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const aplicacionesPorDia = useMemo(() => {
    const mapa = new Map<string, Aplicacion[]>();
    for (const a of aplicaciones) mapa.set(a.fecha, [...(mapa.get(a.fecha) ?? []), a]);
    return mapa;
  }, [aplicaciones]);

  const cosechasPorDia = useMemo(() => {
    const mapa = new Map<string, Cosecha[]>();
    for (const c of cosechas) mapa.set(c.fecha, [...(mapa.get(c.fecha) ?? []), c]);
    return mapa;
  }, [cosechas]);

  const celdas = useMemo(() => {
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0).getDate();
    let offset = primerDia.getDay();
    offset = offset === 0 ? 6 : offset - 1;
    const dias: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= ultimoDia; d++) dias.push(d);
    return dias;
  }, [year, month]);

  function cambiarMes(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
    setDiaSeleccionado(null);
  }

  const hoy = hoyISO();
  const aplicacionesDelDia = diaSeleccionado ? (aplicacionesPorDia.get(diaSeleccionado) ?? []) : [];
  const cosechasDelDia = diaSeleccionado ? (cosechasPorDia.get(diaSeleccionado) ?? []) : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => cambiarMes(-1)}
          aria-label="Mes anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ color: 'var(--text-dim)' }}
        >
          <IconChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
          {MESES[month]} {year}
        </p>
        <button
          onClick={() => cambiarMes(1)}
          aria-label="Mes siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ color: 'var(--text-dim)' }}
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
            {d}
          </div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={i} />;
          const fecha = iso(year, month, dia);
          const hayAplicacion = aplicacionesPorDia.has(fecha);
          const hayCosecha = cosechasPorDia.has(fecha);
          const esHoy = fecha === hoy;
          const seleccionado = fecha === diaSeleccionado;

          let backgroundColor = 'transparent';
          let backgroundImage: string | undefined;
          let color = 'var(--text)';
          if (hayAplicacion && hayCosecha) {
            backgroundImage = `linear-gradient(90deg, var(--recent) 50%, var(--cosecha) 50%)`;
            color = 'var(--recent-text)';
          } else if (hayAplicacion) {
            backgroundColor = 'var(--recent)';
            color = 'var(--recent-text)';
          } else if (hayCosecha) {
            backgroundColor = 'var(--cosecha)';
            color = 'var(--cosecha-text)';
          }

          return (
            <button
              key={i}
              onClick={() => setDiaSeleccionado(seleccionado ? null : fecha)}
              className="flex items-center justify-center rounded-lg py-2 text-sm font-medium transition"
              style={{
                backgroundColor,
                backgroundImage,
                color,
                border: seleccionado
                  ? '2px solid var(--gold)'
                  : esHoy
                    ? '1px solid var(--gold)'
                    : '1px solid transparent',
              }}
            >
              {dia}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: 'var(--text-dim)' }}>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--recent)' }} />
          Aplicación
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--cosecha)' }} />
          Cosecha
        </span>
      </div>

      {diaSeleccionado && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="font-display text-[11px] font-black tracking-wide uppercase" style={{ color: 'var(--text-dim)' }}>
            {diaSeleccionado}
          </p>
          {aplicacionesDelDia.length === 0 && cosechasDelDia.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Nada registrado este día.
            </p>
          ) : (
            <>
              {aplicacionesDelDia.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                    {a.producto}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    {a.cantidad}
                    {a.dosis ? ` · ${a.dosis}` : ''} · aplicó {a.responsable}
                  </p>
                </div>
              ))}
              {cosechasDelDia.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                    Cosecha: {c.cantidad}
                  </p>
                  {c.calidad && (
                    <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                      {c.calidad}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
