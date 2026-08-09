import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { escucharFincas } from '../lib/fincas';
import type { Finca, Lote } from '../types/models';
import EmptyState from '../components/ui/EmptyState';
import { IconChevronDown, IconChevronRight, IconMap } from '../components/ui/Icons';

// TODO (HU-1.2): reemplazar por lotes reales de Firestore (área incluida).
const lotesMock: Lote[] = [
  { id: 'lv-1', fincaId: 'la-vega', nombre: 'Lote 1', cultivo: 'Guayaba' },
  { id: 'lv-2', fincaId: 'la-vega', nombre: 'Lote 2', cultivo: 'Guayaba' },
  { id: 'lv-3', fincaId: 'la-vega', nombre: 'Lote 3', cultivo: 'Guayaba' },
  { id: 'ed-1', fincaId: 'el-doctor', nombre: 'Lote 1', cultivo: 'Guayaba' },
  { id: 'ed-2', fincaId: 'el-doctor', nombre: 'Lote 2', cultivo: 'Guayaba' },
  { id: 'ed-3', fincaId: 'el-doctor', nombre: 'Lote 3', cultivo: 'Guayaba' },
  { id: 'f3-1', fincaId: 'finca-3', nombre: 'Lote 1', cultivo: 'Guayaba' },
  { id: 'f3-2', fincaId: 'finca-3', nombre: 'Lote 2', cultivo: 'Guayaba' },
  { id: 'f3-3', fincaId: 'finca-3', nombre: 'Lote 3', cultivo: 'Guayaba' },
  { id: 'suelto-1', fincaId: null, nombre: 'Lote suelto 1', cultivo: 'Guayaba' },
  { id: 'suelto-2', fincaId: null, nombre: 'Lote suelto 2', cultivo: 'Guayaba' },
];

// TODO (Épica 3): cuando exista el registro de aplicaciones, calcular esto de
// verdad (días desde la última aplicación de cada lote). Por ahora, honesto:
// como todavía no hay aplicaciones cargadas, todo lote aparece "sin registrar".
function estadoDe(dias: number | null) {
  if (dias === null) return { estilo: 'nodata', texto: 'Sin registrar' } as const;
  if (dias <= 7) return { estilo: 'recent', texto: `Aplicado hace ${dias} d` } as const;
  if (dias <= 21) return { estilo: 'mid', texto: `Aplicado hace ${dias} d` } as const;
  return { estilo: 'dormant', texto: `Aplicado hace ${dias} d` } as const;
}

const ESTILOS_CHIP = {
  recent: { background: 'var(--recent)', color: 'var(--recent-text)' },
  mid: { background: 'var(--mid)', color: 'var(--mid-text)' },
  dormant: { background: 'var(--dormant)', color: 'var(--dormant-text)' },
  nodata: {
    background: 'var(--nodata)',
    color: 'var(--nodata-text)',
    border: '1px dashed var(--nodata-border)',
  },
} as const;

const MOSTRAR_INICIAL = 4;

function FilaLote({ lote }: { lote: Lote }) {
  const estado = estadoDe(null);
  return (
    <Link
      to={`/lotes/${lote.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:brightness-95"
    >
      <div className="min-w-0">
        <p className="font-serif truncate font-semibold" style={{ color: 'var(--text)' }}>
          {lote.nombre}
        </p>
        <p className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
          {lote.cultivo}
        </p>
      </div>
      <div className="flex flex-none items-center gap-2">
        <span
          className="font-display rounded-full px-2.5 py-1 text-[10.5px] font-black tracking-wide uppercase"
          style={ESTILOS_CHIP[estado.estilo]}
        >
          {estado.texto}
        </span>
        <IconChevronRight className="h-4 w-4" style={{ color: 'var(--text-dim)', opacity: 0.5 }} />
      </div>
    </Link>
  );
}

function SeccionFinca({ nombre, dotColor, lotes }: { nombre: string; dotColor: string; lotes: Lote[] }) {
  const [expandido, setExpandido] = useState(false);
  const visibles = expandido ? lotes : lotes.slice(0, MOSTRAR_INICIAL);
  const ocultos = lotes.length - visibles.length;
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className="h-1.75 w-1.75 flex-none rounded-full" style={{ backgroundColor: dotColor }} />
        <h2 className="font-display text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text)' }}>
          {nombre}
        </h2>
        {/* TODO (HU-1.2): agregar "· X ha" cuando el lote tenga área real cargada. */}
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          · {lotes.length} {lotes.length === 1 ? 'lote' : 'lotes'}
        </span>
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div>
          {visibles.map((lote) => (
            <div key={lote.id} className="[&:not(:last-child)]:border-b" style={{ borderColor: 'var(--border)' }}>
              <FilaLote lote={lote} />
            </div>
          ))}
        </div>

        {lotes.length > MOSTRAR_INICIAL && (
          <button
            onClick={() => setExpandido((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 border-t py-2.5 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            {expandido ? 'Ver menos' : `Ver los ${ocultos} restantes`}
            <IconChevronDown className={`h-4 w-4 transition-transform ${expandido ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </section>
  );
}

export default function Lotes() {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = escucharFincas((data) => {
      setFincas(data);
      setCargando(false);
    });
    return unsub;
  }, []);

  const lotesSueltos = lotesMock.filter((l) => l.fincaId === null);
  const totalLotes = lotesMock.length;
  const totalFincas = fincas.length + (lotesSueltos.length > 0 ? 1 : 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-2 flex items-center justify-between">
        <Link
          to="/fincas"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', backgroundColor: 'var(--surface)' }}
        >
          <IconMap className="h-3.5 w-3.5" />
          Administrar fincas
        </Link>
      </div>

      <h1 className="font-serif text-[32px] leading-tight font-semibold" style={{ color: 'var(--text)' }}>
        Mis fincas
      </h1>
      {!cargando && fincas.length > 0 && (
        <p className="mb-5 text-sm" style={{ color: 'var(--text-dim)' }}>
          <b style={{ color: 'var(--text)' }}>{totalFincas}</b> fincas ·{' '}
          <b style={{ color: 'var(--text)' }}>{totalLotes}</b> lotes en total
        </p>
      )}

      {cargando && <p className="mt-4 text-sm" style={{ color: 'var(--text-dim)' }}>Cargando...</p>}

      {!cargando && fincas.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={<IconMap className="h-6 w-6" />}
            title="Todavía no registraste ninguna finca"
            description="Creá tu primera finca para empezar a organizar los lotes."
            action={
              <Link
                to="/fincas"
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
              >
                Registrar finca
              </Link>
            }
          />
        </div>
      )}

      <div className="mt-5">
        {fincas.map((finca) => (
          <SeccionFinca
            key={finca.id}
            nombre={finca.nombre}
            dotColor="var(--gold)"
            lotes={lotesMock.filter((l) => l.fincaId === finca.id)}
          />
        ))}

        {lotesSueltos.length > 0 && (
          <SeccionFinca nombre="Lotes sueltos" dotColor="var(--sueltos)" lotes={lotesSueltos} />
        )}
      </div>

      {(fincas.length > 0 || lotesSueltos.length > 0) && (
        <div className="mt-2 rounded-2xl border p-4" style={{ borderColor: 'var(--border)' }}>
          <p className="font-display mb-2 text-[10.5px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
            Días desde la última aplicación
          </p>
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--recent)' }} />
              0–7
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--mid)' }} />
              8–21
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--dormant)' }} />
              22+
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded"
                style={{ backgroundColor: 'var(--nodata)', border: '1px dashed var(--nodata-border)' }}
              />
              Sin registrar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
