import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { escucharFincas } from '../lib/fincas';
import { escucharLotes } from '../lib/lotes';
import type { Finca, Lote } from '../types/models';
import EmptyState from '../components/ui/EmptyState';
import FormularioLote from '../components/FormularioLote';
import { IconChevronDown, IconChevronRight, IconMap, IconPlus } from '../components/ui/Icons';

// TODO (Épica 3): reemplazar por el cálculo real (días desde la última
// aplicación registrada de cada lote) cuando exista ese módulo. Mientras
// tanto, de muestra — igual que el resto de lotesMock — para poder revisar
// cómo se ve el sistema de colores completo.
const diasUltimaAplicacionMock: Record<string, number | null> = {
  'lv-1': 4,
  'lv-2': 12,
  'lv-3': 26,
  'ed-1': 2,
  'ed-2': 9,
  'ed-3': null,
  'f3-1': 18,
  'f3-2': 31,
  'f3-3': 6,
  'suelto-1': null,
  'suelto-2': 40,
};

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

function descripcionLote(lote: Lote) {
  return lote.areaHectareas != null ? `${lote.cultivo} · ${lote.areaHectareas} ha` : lote.cultivo;
}

function TileLote({ lote }: { lote: Lote }) {
  const estado = estadoDe(diasUltimaAplicacionMock[lote.id] ?? null);
  const estilo = ESTILOS_CHIP[estado.estilo];
  const esNodata = estado.estilo === 'nodata';

  return (
    <Link
      to={`/lotes/${lote.id}`}
      className="flex min-h-[104px] flex-col justify-between rounded-xl p-3.5 transition hover:brightness-95 active:brightness-90"
      style={{
        backgroundColor: estilo.background,
        color: estilo.color,
        border: esNodata ? `1.5px dashed var(--nodata-border)` : undefined,
      }}
    >
      <div>
        <p className="font-serif truncate text-base font-semibold">{lote.nombre}</p>
        <p className="truncate text-xs" style={{ opacity: 0.75 }}>
          {descripcionLote(lote)}
        </p>
      </div>
      <p className="text-xs" style={{ opacity: 0.85 }}>
        {estado.texto}
      </p>
    </Link>
  );
}

function FilaLote({ lote }: { lote: Lote }) {
  const estado = estadoDe(diasUltimaAplicacionMock[lote.id] ?? null);
  const estilo = ESTILOS_CHIP[estado.estilo];
  const esNodata = estado.estilo === 'nodata';

  return (
    <Link
      to={`/lotes/${lote.id}`}
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition hover:brightness-95 active:brightness-90"
      style={{
        backgroundColor: estilo.background,
        color: estilo.color,
        border: esNodata ? `1.5px dashed var(--nodata-border)` : undefined,
      }}
    >
      <div className="min-w-0">
        <p className="font-serif truncate text-base font-semibold">{lote.nombre}</p>
        <p className="truncate text-xs" style={{ opacity: 0.75 }}>
          {descripcionLote(lote)}
        </p>
      </div>
      <div className="flex flex-none items-center gap-2">
        <span className="text-xs" style={{ opacity: 0.85 }}>
          {estado.texto}
        </span>
        <IconChevronRight className="h-4 w-4" style={{ opacity: 0.55 }} />
      </div>
    </Link>
  );
}

function SeccionFinca({
  nombre,
  dotColor,
  lotes,
  vista,
}: {
  nombre: string;
  dotColor: string;
  lotes: Lote[];
  vista: 'lista' | 'croquis';
}) {
  const [expandido, setExpandido] = useState(false);
  const visibles = expandido ? lotes : lotes.slice(0, MOSTRAR_INICIAL);
  const ocultos = lotes.length - visibles.length;

  const areaConocida = lotes.some((l) => l.areaHectareas != null);
  const totalHa = lotes.reduce((s, l) => s + (l.areaHectareas ?? 0), 0);

  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className="h-1.75 w-1.75 flex-none rounded-full" style={{ backgroundColor: dotColor }} />
        <h2 className="font-display text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text)' }}>
          {nombre}
        </h2>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {areaConocida && `· ${totalHa.toFixed(1)} ha `}· {lotes.length} {lotes.length === 1 ? 'lote' : 'lotes'}
        </span>
      </div>

      {lotes.length === 0 && (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          Todavía no hay lotes acá.
        </p>
      )}

      {vista === 'lista' ? (
        <div className="flex flex-col gap-2">
          {visibles.map((lote) => (
            <FilaLote key={lote.id} lote={lote} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {visibles.map((lote) => (
            <TileLote key={lote.id} lote={lote} />
          ))}
        </div>
      )}

      {lotes.length > MOSTRAR_INICIAL && (
        <button
          onClick={() => setExpandido((v) => !v)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          {expandido ? 'Ver menos' : `Ver los ${ocultos} restantes`}
          <IconChevronDown className={`h-4 w-4 transition-transform ${expandido ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  );
}

export default function Lotes() {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'croquis'>('lista');
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    const unsubFincas = escucharFincas(setFincas);
    const unsubLotes = escucharLotes((data) => {
      setLotes(data);
      setCargando(false);
    });
    return () => {
      unsubFincas();
      unsubLotes();
    };
  }, []);

  const lotesSueltos = lotes.filter((l) => l.fincaId === null);
  const totalLotes = lotes.length;
  const totalFincas = fincas.length + (lotesSueltos.length > 0 ? 1 : 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link
          to="/fincas"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', backgroundColor: 'var(--surface)' }}
        >
          <IconMap className="h-3.5 w-3.5" />
          Fincas
        </Link>

        <div className="flex items-center gap-2">
          <div className="font-display flex rounded-full p-0.5 text-[11px] font-black tracking-wide" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            {(['lista', 'croquis'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className="rounded-full px-3 py-1.5 uppercase transition"
                style={
                  vista === v
                    ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
                    : { color: 'var(--text-dim)' }
                }
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMostrarForm(true)}
            aria-label="Nuevo lote"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            <IconPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h1 className="font-serif text-[32px] leading-tight font-semibold" style={{ color: 'var(--text)' }}>
        Mis fincas
      </h1>
      {!cargando && totalLotes > 0 && (
        <p className="mb-5 text-sm" style={{ color: 'var(--text-dim)' }}>
          <b style={{ color: 'var(--text)' }}>{totalFincas}</b> fincas ·{' '}
          <b style={{ color: 'var(--text)' }}>{totalLotes}</b> lotes en total
        </p>
      )}

      {cargando && <p className="mt-4 text-sm" style={{ color: 'var(--text-dim)' }}>Cargando...</p>}

      {!cargando && fincas.length === 0 && lotesSueltos.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={<IconMap className="h-6 w-6" />}
            title="Todavía no registraste ninguna finca ni lote"
            description="Creá tu primera finca, o directamente un lote suelto si preferís empezar por ahí."
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
            lotes={lotes.filter((l) => l.fincaId === finca.id)}
            vista={vista}
          />
        ))}

        {lotesSueltos.length > 0 && (
          <SeccionFinca nombre="Lotes sueltos" dotColor="var(--sueltos)" lotes={lotesSueltos} vista={vista} />
        )}
      </div>

      {mostrarForm && <FormularioLote fincas={fincas} onCerrar={() => setMostrarForm(false)} />}

      {totalLotes > 0 && (
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
