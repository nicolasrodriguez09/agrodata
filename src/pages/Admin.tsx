import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { escucharLotes } from '../lib/lotes';
import { escucharFincas } from '../lib/fincas';
import { escucharCiclosDeLote } from '../lib/ciclos';
import { escucharTodasLasVentas } from '../lib/ventas';
import { escucharCompras } from '../lib/compras';
import { escucharJornales } from '../lib/jornales';
import { escucharTodasLasAplicaciones, formatoCantidadAplicacion } from '../lib/aplicaciones';
import { escucharTodasLasCosechas } from '../lib/cosechas';
import { escucharTodosLosRiegos } from '../lib/riegos';
import AgregarUsuario from '../components/AgregarUsuario';
import type { Aplicacion, Ciclo, CompraInsumo, Cosecha, Finca, Jornal, Lote, Riego, Venta } from '../types/models';
import { IconSearch, IconDroplet, IconBasket, IconWaves, IconTag, IconUsers, IconFileText, IconChevronRight } from '../components/ui/Icons';

const COLOR_GASTO = '#b4552f';
const SUELTO = '__suelto__';

type TipoRegistro = 'todo' | 'aplicacion' | 'cosecha' | 'riego' | 'venta' | 'compra' | 'jornal';
const TIPOS: { id: TipoRegistro; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'aplicacion', label: 'Aplicaciones' },
  { id: 'cosecha', label: 'Cosechas' },
  { id: 'riego', label: 'Riegos' },
  { id: 'venta', label: 'Ventas' },
  { id: 'compra', label: 'Compras' },
  { id: 'jornal', label: 'Jornales' },
];

type Item =
  | { tipo: 'aplicacion'; id: string; fecha: string; data: Aplicacion }
  | { tipo: 'cosecha'; id: string; fecha: string; data: Cosecha }
  | { tipo: 'riego'; id: string; fecha: string; data: Riego }
  | { tipo: 'venta'; id: string; fecha: string; data: Venta }
  | { tipo: 'compra'; id: string; fecha: string; data: CompraInsumo }
  | { tipo: 'jornal'; id: string; fecha: string; data: Jornal };

function loteIdDe(item: Item): string | undefined {
  switch (item.tipo) {
    case 'compra':
      return undefined;
    default:
      return item.data.loteId;
  }
}

function cicloIdDe(item: Item): string | undefined {
  switch (item.tipo) {
    case 'aplicacion':
    case 'cosecha':
    case 'riego':
    case 'venta':
      return item.data.cicloId;
    default:
      return undefined;
  }
}

function camposDeTexto(item: Item): (string | undefined)[] {
  switch (item.tipo) {
    case 'aplicacion':
      return [item.data.producto, item.data.responsable, item.data.dosis];
    case 'cosecha':
      return [item.data.calidad];
    case 'riego':
      return [item.data.metodo, item.data.responsable];
    case 'venta':
      return [item.data.comprador, item.data.cantidad];
    case 'compra':
      return [item.data.producto, item.data.proveedor, item.data.personaQueCompro];
    case 'jornal':
      return [item.data.trabajador, item.data.labor, item.data.quienPago];
  }
}

const ESTILO_TIPO: Record<TipoRegistro, { color: string; colorTexto: string; Icon: typeof IconDroplet } | null> = {
  todo: null,
  aplicacion: { color: 'var(--recent)', colorTexto: 'var(--recent-text)', Icon: IconDroplet },
  cosecha: { color: 'var(--cosecha)', colorTexto: 'var(--cosecha-text)', Icon: IconBasket },
  riego: { color: 'var(--riego)', colorTexto: 'var(--riego-text)', Icon: IconWaves },
  venta: { color: 'var(--gold)', colorTexto: 'var(--gold-ink)', Icon: IconTag },
  compra: { color: COLOR_GASTO, colorTexto: '#fbfaf2', Icon: IconTag },
  jornal: { color: COLOR_GASTO, colorTexto: '#fbfaf2', Icon: IconUsers },
};

function tituloDe(item: Item): string {
  switch (item.tipo) {
    case 'aplicacion':
      return item.data.producto;
    case 'cosecha':
      return `Cosecha: ${item.data.cantidad}`;
    case 'riego':
      return `Riego${item.data.metodo ? `: ${item.data.metodo}` : ''}`;
    case 'venta':
      return `$ ${item.data.precio.toLocaleString('es-CO')}`;
    case 'compra':
      return item.data.producto;
    case 'jornal':
      return item.data.trabajador;
  }
}

function subtituloDe(item: Item): string {
  switch (item.tipo) {
    case 'aplicacion':
      return `${formatoCantidadAplicacion(item.data)}${item.data.dosis ? ` · ${item.data.dosis}` : ''} · aplicó ${item.data.responsable}`;
    case 'cosecha':
      return item.data.calidad ?? 'Sin clasificar';
    case 'riego':
      return `${item.data.duracion ? `${item.data.duracion} · ` : ''}regó ${item.data.responsable}`;
    case 'venta':
      return `${item.data.cantidad}${item.data.comprador ? ` · ${item.data.comprador}` : ''}`;
    case 'compra':
      return `${item.data.proveedor ? `${item.data.proveedor} · ` : ''}compró ${item.data.personaQueCompro}`;
    case 'jornal':
      return `${item.data.labor ? `${item.data.labor} · ` : ''}pagó ${item.data.quienPago}`;
  }
}

function montoDe(item: Item): number | null {
  switch (item.tipo) {
    case 'aplicacion':
      return item.data.costoEstimado ?? null;
    case 'compra':
      return item.data.costo;
    case 'jornal':
      return item.data.valor;
    default:
      return null;
  }
}

export default function Admin() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [ciclosDelLote, setCiclosDelLote] = useState<Ciclo[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<CompraInsumo[]>([]);
  const [jornales, setJornales] = useState<Jornal[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [riegos, setRiegos] = useState<Riego[]>([]);

  const [fincaId, setFincaId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [cicloId, setCicloId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tipo, setTipo] = useState<TipoRegistro>('todo');
  const [texto, setTexto] = useState('');

  useEffect(() => escucharLotes(setLotes), []);
  useEffect(() => escucharFincas(setFincas), []);
  useEffect(() => escucharTodasLasVentas(setVentas), []);
  useEffect(() => escucharCompras(setCompras), []);
  useEffect(() => escucharJornales(setJornales), []);
  useEffect(() => escucharTodasLasAplicaciones(setAplicaciones), []);
  useEffect(() => escucharTodasLasCosechas(setCosechas), []);
  useEffect(() => escucharTodosLosRiegos(setRiegos), []);

  useEffect(() => {
    if (!loteId) {
      setCiclosDelLote([]);
      setCicloId('');
      return;
    }
    return escucharCiclosDeLote(loteId, setCiclosDelLote);
  }, [loteId]);

  useEffect(() => {
    setLoteId('');
  }, [fincaId]);

  function nombreFinca(fId: string | null) {
    if (fId === null) return 'Suelto';
    return fincas.find((f) => f.id === fId)?.nombre ?? 'Finca borrada';
  }

  const lotesFiltrados = !fincaId
    ? lotes
    : fincaId === SUELTO
      ? lotes.filter((l) => l.fincaId === null)
      : lotes.filter((l) => l.fincaId === fincaId);

  const items: Item[] = [
    ...aplicaciones.map((a) => ({ tipo: 'aplicacion' as const, id: a.id, fecha: a.fecha, data: a })),
    ...cosechas.map((c) => ({ tipo: 'cosecha' as const, id: c.id, fecha: c.fecha, data: c })),
    ...riegos.map((r) => ({ tipo: 'riego' as const, id: r.id, fecha: r.fecha, data: r })),
    ...ventas.map((v) => ({ tipo: 'venta' as const, id: v.id, fecha: v.fecha, data: v })),
    ...compras.map((c) => ({ tipo: 'compra' as const, id: c.id, fecha: c.fecha, data: c })),
    ...jornales.map((j) => ({ tipo: 'jornal' as const, id: j.id, fecha: j.fecha, data: j })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const textoNorm = texto.trim().toLowerCase();
  const itemsFiltrados = items.filter((item) => {
    if (tipo !== 'todo' && item.tipo !== tipo) return false;
    if (desde && item.fecha < desde) return false;
    if (hasta && item.fecha > hasta) return false;

    const itemLoteId = loteIdDe(item);
    if (loteId) {
      if (itemLoteId !== loteId) return false;
    } else if (fincaId) {
      const lote = itemLoteId ? lotes.find((l) => l.id === itemLoteId) : undefined;
      const perteneceALaFinca = fincaId === SUELTO ? lote?.fincaId === null : lote?.fincaId === fincaId;
      if (!perteneceALaFinca) return false;
    }
    if (cicloId && cicloIdDe(item) !== cicloId) return false;

    if (!textoNorm) return true;
    return camposDeTexto(item).some((c) => c?.toLowerCase().includes(textoNorm));
  });

  const hayFiltrosActivos = !!fincaId || !!loteId || !!cicloId || !!desde || !!hasta || tipo !== 'todo' || !!textoNorm;

  const campo = 'w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none';
  const campoEstilo = { borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' };
  const label = 'mb-1 block text-xs';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
        Panel
      </h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-dim)' }}>
        Buscá cualquier registro de toda la finca desde acá, sin entrar lote por lote.
      </p>

      <Link
        to="/reporte"
        className="mb-6 flex items-center gap-3 rounded-xl border p-3.5 transition hover:brightness-95 active:scale-[0.99]"
        style={{ borderColor: 'var(--gold)', backgroundColor: 'color-mix(in srgb, var(--gold) 12%, transparent)' }}
      >
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}>
          <IconFileText className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
            Generar reporte
          </p>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Consolidado imprimible o en Excel, para crédito o auditoría.
          </p>
        </div>
        <IconChevronRight className="h-4 w-4 flex-none" style={{ color: 'var(--text-dim)' }} />
      </Link>

      <h2 className="font-display mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
        Buscar en todos los registros
      </h2>

      <div className="relative mb-3">
        <IconSearch
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          style={{ color: 'var(--text-dim)' }}
        />
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por producto, persona, proveedor..."
          className="w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm focus:outline-none"
          style={campoEstilo}
        />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTipo(t.id)}
            className="flex-none rounded-full px-3 py-1.5 text-xs font-medium"
            style={
              tipo === t.id
                ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
                : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className={label} style={{ color: 'var(--text-dim)' }}>
            Finca
          </label>
          <select value={fincaId} onChange={(e) => setFincaId(e.target.value)} className={campo} style={campoEstilo}>
            <option value="">Todas</option>
            {fincas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
            <option value={SUELTO}>Sueltos</option>
          </select>
        </div>
        <div>
          <label className={label} style={{ color: 'var(--text-dim)' }}>
            Lote
          </label>
          <select value={loteId} onChange={(e) => setLoteId(e.target.value)} className={campo} style={campoEstilo}>
            <option value="">Todos</option>
            {lotesFiltrados.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre} · {nombreFinca(l.fincaId)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className={label} style={{ color: loteId ? 'var(--text-dim)' : 'var(--nodata-text)' }}>
          Ciclo
        </label>
        <select
          value={cicloId}
          onChange={(e) => setCicloId(e.target.value)}
          disabled={!loteId}
          className={`${campo} disabled:opacity-50`}
          style={campoEstilo}
        >
          <option value="">Todos</option>
          {ciclosDelLote.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.estado === 'abierto' ? '(activo)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 flex gap-2">
        <div className="flex-1">
          <label className={label} style={{ color: 'var(--text-dim)' }}>
            Desde
          </label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={campo} style={campoEstilo} />
        </div>
        <div className="flex-1">
          <label className={label} style={{ color: 'var(--text-dim)' }}>
            Hasta
          </label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campo} style={campoEstilo} />
        </div>
      </div>

      {hayFiltrosActivos && (
        <button
          onClick={() => {
            setFincaId('');
            setLoteId('');
            setCicloId('');
            setDesde('');
            setHasta('');
            setTipo('todo');
            setTexto('');
          }}
          className="mb-3 rounded-xl border px-3 py-2 text-xs font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          Limpiar filtros
        </button>
      )}

      <p className="mb-3 text-sm" style={{ color: 'var(--text-dim)' }}>
        <b style={{ color: 'var(--text)' }}>{itemsFiltrados.length}</b>{' '}
        {itemsFiltrados.length === 1 ? 'registro' : 'registros'}
        {hayFiltrosActivos ? ' (filtrados)' : ''}
      </p>

      {itemsFiltrados.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Nada coincide con los filtros.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {itemsFiltrados.map((item) => {
            const estilo = ESTILO_TIPO[item.tipo]!;
            const Icon = estilo.Icon;
            const monto = montoDe(item);
            const itemLoteId = loteIdDe(item);
            const lote = itemLoteId ? lotes.find((l) => l.id === itemLoteId) : undefined;
            return (
              <div
                key={`${item.tipo}-${item.id}`}
                className="flex gap-3 rounded-xl border p-3.5"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              >
                <div
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                  style={{ backgroundColor: estilo.color, color: estilo.colorTexto }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                      {tituloDe(item)}
                    </p>
                    <p className="flex-none text-xs" style={{ color: 'var(--text-dim)' }}>
                      {item.fecha}
                    </p>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    {subtituloDe(item)}
                    {lote ? ` · ${lote.nombre} · ${nombreFinca(lote.fincaId)}` : ''}
                  </p>
                  {monto != null && (
                    <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--text)' }}>
                      $ {monto.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="font-display mt-6 mb-2 text-[12px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
        Usuarios
      </h2>
      <AgregarUsuario />
    </div>
  );
}
