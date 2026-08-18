import { useEffect, useState } from 'react';
import { escucharCompras } from '../lib/compras';
import { escucharJornales } from '../lib/jornales';
import type { CompraInsumo, Jornal } from '../types/models';
import EmptyState from '../components/ui/EmptyState';
import FormularioCompra from '../components/FormularioCompra';
import DetalleCompra from '../components/DetalleCompra';
import FormularioJornal from '../components/FormularioJornal';
import ResumenFinanzas from '../components/ResumenFinanzas';
import FilaJornal from '../components/finanzas/FilaJornal';
import FilaCompra from '../components/finanzas/FilaCompra';
import { IconTag, IconUsers, IconWallet, IconPlus, IconSearch, IconChart } from '../components/ui/Icons';

type Tab = 'resumen' | 'jornales' | 'compras';

export default function Finanzas() {
  const [tab, setTab] = useState<Tab>('resumen');
  const [compras, setCompras] = useState<CompraInsumo[]>([]);
  const [mostrarFormCompra, setMostrarFormCompra] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraInsumo | null>(null);
  const [filtroTextoCompras, setFiltroTextoCompras] = useState('');
  const [fechaDesdeCompras, setFechaDesdeCompras] = useState('');
  const [fechaHastaCompras, setFechaHastaCompras] = useState('');
  const [jornales, setJornales] = useState<Jornal[]>([]);
  const [mostrarFormJornal, setMostrarFormJornal] = useState(false);
  const [filtroTextoJornales, setFiltroTextoJornales] = useState('');
  const [fechaDesdeJornales, setFechaDesdeJornales] = useState('');
  const [fechaHastaJornales, setFechaHastaJornales] = useState('');

  useEffect(() => escucharCompras(setCompras), []);
  useEffect(() => escucharJornales(setJornales), []);

  const textoCompras = filtroTextoCompras.trim().toLowerCase();
  const comprasFiltradas = compras.filter((c) => {
    if (fechaDesdeCompras && c.fecha < fechaDesdeCompras) return false;
    if (fechaHastaCompras && c.fecha > fechaHastaCompras) return false;
    if (!textoCompras) return true;
    return (
      c.producto.toLowerCase().includes(textoCompras) ||
      (c.proveedor ?? '').toLowerCase().includes(textoCompras) ||
      c.personaQueCompro.toLowerCase().includes(textoCompras)
    );
  });
  const hayFiltrosComprasActivos = !!textoCompras || !!fechaDesdeCompras || !!fechaHastaCompras;
  const totalCompras = comprasFiltradas.reduce((s, c) => s + c.costo, 0);

  const textoJornales = filtroTextoJornales.trim().toLowerCase();
  const jornalesFiltrados = jornales.filter((j) => {
    if (fechaDesdeJornales && j.fecha < fechaDesdeJornales) return false;
    if (fechaHastaJornales && j.fecha > fechaHastaJornales) return false;
    if (!textoJornales) return true;
    return (
      j.trabajador.toLowerCase().includes(textoJornales) ||
      (j.labor ?? '').toLowerCase().includes(textoJornales) ||
      j.quienPago.toLowerCase().includes(textoJornales)
    );
  });
  const hayFiltrosJornalesActivos = !!textoJornales || !!fechaDesdeJornales || !!fechaHastaJornales;
  const totalJornales = jornalesFiltrados.reduce((s, j) => s + j.valor, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Finanzas
        </h1>
        {tab !== 'resumen' && (
          <button
            onClick={() => (tab === 'compras' ? setMostrarFormCompra(true) : setMostrarFormJornal(true))}
            aria-label={tab === 'compras' ? 'Registrar compra' : 'Registrar pago de jornal'}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            <IconPlus className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-dim)' }}>
        Resumen, jornales y compras de insumos de toda la finca
      </p>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab('resumen')}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"
          style={
            tab === 'resumen'
              ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
              : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
          }
        >
          <IconChart className="h-4 w-4" />
          Resumen
        </button>
        <button
          onClick={() => setTab('jornales')}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"
          style={
            tab === 'jornales'
              ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
              : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
          }
        >
          <IconUsers className="h-4 w-4" />
          Jornales
        </button>
        <button
          onClick={() => setTab('compras')}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"
          style={
            tab === 'compras'
              ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
              : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
          }
        >
          <IconTag className="h-4 w-4" />
          Compras de insumos
        </button>
      </div>

      {tab === 'resumen' && <ResumenFinanzas />}

      {tab === 'jornales' &&
        (jornales.length === 0 ? (
          <EmptyState
            icon={<IconWallet className="h-6 w-6" />}
            title="Todavía no hay pagos de jornales"
            description="Registrá un jornal para llevar el costo real de la mano de obra."
            action={
              <button
                onClick={() => setMostrarFormJornal(true)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
              >
                Registrar jornal
              </button>
            }
          />
        ) : (
          <>
            <div className="relative mb-3">
              <IconSearch
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--text-dim)' }}
              />
              <input
                value={filtroTextoJornales}
                onChange={(e) => setFiltroTextoJornales(e.target.value)}
                placeholder="Buscar por trabajador, labor o quién pagó..."
                className="w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>

            <div className="mb-3 flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesdeJornales}
                  onChange={(e) => setFechaDesdeJornales(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaHastaJornales}
                  onChange={(e) => setFechaHastaJornales(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                />
              </div>
              {hayFiltrosJornalesActivos && (
                <button
                  onClick={() => {
                    setFiltroTextoJornales('');
                    setFechaDesdeJornales('');
                    setFechaHastaJornales('');
                  }}
                  className="flex-none self-end rounded-xl border px-3 py-2 text-xs font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
                >
                  Limpiar
                </button>
              )}
            </div>

            <p className="mb-3 text-sm" style={{ color: 'var(--text-dim)' }}>
              <b style={{ color: 'var(--text)' }}>{jornalesFiltrados.length}</b>{' '}
              {jornalesFiltrados.length === 1 ? 'jornal' : 'jornales'}
              {hayFiltrosJornalesActivos ? ' (filtrados)' : ''} · total{' '}
              <b style={{ color: 'var(--text)' }}>$ {totalJornales.toLocaleString('es-CO')}</b>
            </p>

            {jornalesFiltrados.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Nada coincide con los filtros.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {jornalesFiltrados.map((j) => (
                  <FilaJornal key={j.id} jornal={j} />
                ))}
              </div>
            )}
          </>
        ))}

      {tab === 'compras' &&
        (compras.length === 0 ? (
          <EmptyState
            icon={<IconWallet className="h-6 w-6" />}
            title="Todavía no hay compras registradas"
            description="Registrá una compra de insumo para llevar el costo real del negocio."
            action={
              <button
                onClick={() => setMostrarFormCompra(true)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
              >
                Registrar compra
              </button>
            }
          />
        ) : (
          <>
            <div className="relative mb-3">
              <IconSearch
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--text-dim)' }}
              />
              <input
                value={filtroTextoCompras}
                onChange={(e) => setFiltroTextoCompras(e.target.value)}
                placeholder="Buscar por producto, proveedor o quién compró..."
                className="w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>

            <div className="mb-3 flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesdeCompras}
                  onChange={(e) => setFechaDesdeCompras(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs" style={{ color: 'var(--text-dim)' }}>
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaHastaCompras}
                  onChange={(e) => setFechaHastaCompras(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                />
              </div>
              {hayFiltrosComprasActivos && (
                <button
                  onClick={() => {
                    setFiltroTextoCompras('');
                    setFechaDesdeCompras('');
                    setFechaHastaCompras('');
                  }}
                  className="flex-none self-end rounded-xl border px-3 py-2 text-xs font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
                >
                  Limpiar
                </button>
              )}
            </div>

            <p className="mb-3 text-sm" style={{ color: 'var(--text-dim)' }}>
              <b style={{ color: 'var(--text)' }}>{comprasFiltradas.length}</b>{' '}
              {comprasFiltradas.length === 1 ? 'compra' : 'compras'}
              {hayFiltrosComprasActivos ? ' (filtradas)' : ''} · total{' '}
              <b style={{ color: 'var(--text)' }}>$ {totalCompras.toLocaleString('es-CO')}</b>
            </p>

            {comprasFiltradas.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Nada coincide con los filtros.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {comprasFiltradas.map((c) => (
                  <FilaCompra key={c.id} compra={c} onClick={() => setCompraSeleccionada(c)} />
                ))}
              </div>
            )}
          </>
        ))}

      {mostrarFormCompra && (
        <FormularioCompra onCerrar={() => setMostrarFormCompra(false)} onGuardado={() => {}} />
      )}
      {compraSeleccionada && (
        <DetalleCompra compra={compraSeleccionada} onCerrar={() => setCompraSeleccionada(null)} />
      )}
      {mostrarFormJornal && (
        <FormularioJornal onCerrar={() => setMostrarFormJornal(false)} onGuardado={() => {}} />
      )}
    </div>
  );
}
