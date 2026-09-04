import { useEffect, useMemo, useState } from 'react';
import { escucharCompras } from '../lib/compras';
import { escucharJornales } from '../lib/jornales';
import { escucharInsumos, crearInsumo } from '../lib/insumos';
import { escucharLotes } from '../lib/lotes';
import { useAuth } from '../lib/AuthContext';
import type { CompraInsumo, InsumoInventario, Jornal, Lote } from '../types/models';
import EmptyState from '../components/ui/EmptyState';
import FormularioCompra from '../components/FormularioCompra';
import DetalleCompra from '../components/DetalleCompra';
import FormularioJornal from '../components/FormularioJornal';
import ResumenFinanzas from '../components/ResumenFinanzas';
import FilaJornal from '../components/finanzas/FilaJornal';
import FilaCompra from '../components/finanzas/FilaCompra';
import DetalleInsumo from '../components/finanzas/DetalleInsumo';
import { IconTag, IconUsers, IconWallet, IconPlus, IconSearch, IconChart, IconBox } from '../components/ui/Icons';
import VerMas from '../components/ui/VerMas';
import { usePaginacion } from '../lib/usePaginacion';
import { formatoCantidad } from '../lib/cantidades';

type Tab = 'resumen' | 'jornales' | 'compras' | 'inventario';

const UNIDADES_COMUNES = ['litros', 'kg', 'gramos', 'bultos', 'unidades'];

export default function Finanzas() {
  const { user } = useAuth();
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
  const [insumos, setInsumos] = useState<InsumoInventario[]>([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<InsumoInventario | null>(null);
  const [mostrarFormInsumo, setMostrarFormInsumo] = useState(false);
  const [nombreInsumoNuevo, setNombreInsumoNuevo] = useState('');
  const [unidadInsumoNuevo, setUnidadInsumoNuevo] = useState('');
  const [creandoInsumo, setCreandoInsumo] = useState(false);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [editandoJornal, setEditandoJornal] = useState<Jornal | null>(null);
  const [editandoCompra, setEditandoCompra] = useState<CompraInsumo | null>(null);

  useEffect(() => escucharCompras(setCompras), []);
  useEffect(() => escucharJornales(setJornales), []);
  useEffect(() => escucharInsumos(setInsumos), []);
  useEffect(() => escucharLotes(setLotes), []);

  async function handleCrearInsumo() {
    if (!nombreInsumoNuevo.trim() || !unidadInsumoNuevo.trim()) return;
    setCreandoInsumo(true);
    try {
      await crearInsumo(nombreInsumoNuevo, unidadInsumoNuevo, user!.uid);
      setNombreInsumoNuevo('');
      setUnidadInsumoNuevo('');
      setMostrarFormInsumo(false);
    } finally {
      setCreandoInsumo(false);
    }
  }

  const textoCompras = filtroTextoCompras.trim().toLowerCase();
  // Memoizado para no re-filtrar toda la coleccion en cada tecla del buscador.
  const comprasFiltradas = useMemo(
    () =>
      compras.filter((c) => {
        if (fechaDesdeCompras && c.fecha < fechaDesdeCompras) return false;
        if (fechaHastaCompras && c.fecha > fechaHastaCompras) return false;
        if (!textoCompras) return true;
        return (
          c.producto.toLowerCase().includes(textoCompras) ||
          (c.proveedor ?? '').toLowerCase().includes(textoCompras) ||
          c.personaQueCompro.toLowerCase().includes(textoCompras)
        );
      }),
    [compras, fechaDesdeCompras, fechaHastaCompras, textoCompras],
  );
  const paginaCompras = usePaginacion(
    comprasFiltradas,
    `${textoCompras}|${fechaDesdeCompras}|${fechaHastaCompras}`,
  );
  const hayFiltrosComprasActivos = !!textoCompras || !!fechaDesdeCompras || !!fechaHastaCompras;
  const totalCompras = comprasFiltradas.reduce((s, c) => s + c.costo, 0);

  const textoJornales = filtroTextoJornales.trim().toLowerCase();
  const jornalesFiltrados = useMemo(
    () =>
      jornales.filter((j) => {
        if (fechaDesdeJornales && j.fecha < fechaDesdeJornales) return false;
        if (fechaHastaJornales && j.fecha > fechaHastaJornales) return false;
        if (!textoJornales) return true;
        return (
          j.trabajador.toLowerCase().includes(textoJornales) ||
          (j.labor ?? '').toLowerCase().includes(textoJornales) ||
          j.quienPago.toLowerCase().includes(textoJornales)
        );
      }),
    [jornales, fechaDesdeJornales, fechaHastaJornales, textoJornales],
  );
  const paginaJornales = usePaginacion(
    jornalesFiltrados,
    `${textoJornales}|${fechaDesdeJornales}|${fechaHastaJornales}`,
  );
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
            onClick={() => {
              if (tab === 'compras') setMostrarFormCompra(true);
              else if (tab === 'jornales') setMostrarFormJornal(true);
              else setMostrarFormInsumo(true);
            }}
            aria-label={tab === 'compras' ? 'Registrar compra' : tab === 'jornales' ? 'Registrar pago de jornal' : 'Nuevo insumo'}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            <IconPlus className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-dim)' }}>
        Resumen, jornales, compras e inventario de insumos de toda la finca
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
        <button
          onClick={() => setTab('inventario')}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"
          style={
            tab === 'inventario'
              ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
              : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
          }
        >
          <IconBox className="h-4 w-4" />
          Inventario
        </button>
      </div>

      {tab === 'resumen' && <ResumenFinanzas />}

      {tab === 'jornales' &&
        (jornales.length === 0 ? (
          <EmptyState
            icon={<IconWallet className="h-6 w-6" />}
            title="Todavía no hay pagos de jornales"
            description="Registra un jornal para llevar el costo real de la mano de obra."
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
                {paginaJornales.visibles.map((j) => (
                  <FilaJornal key={j.id} jornal={j} lotes={lotes} onClick={() => setEditandoJornal(j)} />
                ))}
                <VerMas
                  mostrando={paginaJornales.mostrando}
                  total={paginaJornales.total}
                  hayMas={paginaJornales.hayMas}
                  onVerMas={paginaJornales.verMas}
                  onVerTodos={paginaJornales.verTodos}
                  etiqueta="jornales"
                />
              </div>
            )}
          </>
        ))}

      {tab === 'compras' &&
        (compras.length === 0 ? (
          <EmptyState
            icon={<IconWallet className="h-6 w-6" />}
            title="Todavía no hay compras registradas"
            description="Registra una compra de insumo para llevar el costo real del negocio."
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
                {paginaCompras.visibles.map((c) => (
                  <FilaCompra key={c.id} compra={c} onClick={() => setCompraSeleccionada(c)} />
                ))}
                <VerMas
                  mostrando={paginaCompras.mostrando}
                  total={paginaCompras.total}
                  hayMas={paginaCompras.hayMas}
                  onVerMas={paginaCompras.verMas}
                  onVerTodos={paginaCompras.verTodos}
                  etiqueta="compras"
                />
              </div>
            )}
          </>
        ))}

      {tab === 'inventario' && (
        <>
          {mostrarFormInsumo && (
            <div className="mb-3 rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="mb-2 text-sm font-medium" style={{ color: 'var(--text)' }}>
                Nuevo insumo
              </p>
              <input
                autoFocus
                placeholder="Nombre del insumo"
                value={nombreInsumoNuevo}
                onChange={(e) => setNombreInsumoNuevo(e.target.value)}
                className="mb-2 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
              />
              <input
                list="unidades-comunes-finanzas"
                placeholder="Unidad (litros, kg, bultos...)"
                value={unidadInsumoNuevo}
                onChange={(e) => setUnidadInsumoNuevo(e.target.value)}
                className="mb-3 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
              />
              <datalist id="unidades-comunes-finanzas">
                {UNIDADES_COMUNES.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarFormInsumo(false)}
                  className="flex-1 rounded-xl border py-2 text-sm font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearInsumo}
                  disabled={creandoInsumo || !nombreInsumoNuevo.trim() || !unidadInsumoNuevo.trim()}
                  className="flex-1 rounded-xl py-2 text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
                >
                  {creandoInsumo ? 'Creando...' : 'Crear insumo'}
                </button>
              </div>
            </div>
          )}

          {insumos.length === 0 ? (
            <EmptyState
              icon={<IconBox className="h-6 w-6" />}
              title="Todavía no hay insumos en el inventario"
              description="Registra un insumo para llevar el stock y el costo de cada aplicación."
              action={
                <button
                  onClick={() => setMostrarFormInsumo(true)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
                >
                  Nuevo insumo
                </button>
              }
            />
          ) : (
            <>
              <p className="mb-3 text-sm" style={{ color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--text)' }}>{insumos.length}</b> {insumos.length === 1 ? 'insumo' : 'insumos'} ·
                valor total en stock{' '}
                <b style={{ color: 'var(--text)' }}>
                  $ {insumos.reduce((s, i) => s + i.stockActual * i.costoUnitario, 0).toLocaleString('es-CO')}
                </b>
              </p>
              <div className="flex flex-col gap-2">
                {insumos.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setInsumoSeleccionado(i)}
                    className="flex items-center gap-3 rounded-xl border p-3.5 text-left transition hover:brightness-95 active:scale-[0.99]"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                  >
                    <div
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-lg"
                      style={{ backgroundColor: 'var(--bg)', color: i.stockActual < 0 ? '#b4552f' : 'var(--text-dim)' }}
                    >
                      <IconBox className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                          {i.nombre}
                        </p>
                        <p className="flex-none font-medium" style={{ color: i.stockActual < 0 ? '#b4552f' : 'var(--text)' }}>
                          {formatoCantidad(i.stockActual)} {i.unidad}
                        </p>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                        $ {i.costoUnitario.toLocaleString('es-CO')} / {i.unidad.replace(/s$/, '')} · valor en stock $
                        {(i.stockActual * i.costoUnitario).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {mostrarFormCompra && (
        <FormularioCompra onCerrar={() => setMostrarFormCompra(false)} onGuardado={() => {}} />
      )}
      {compraSeleccionada && (
        <DetalleCompra
          compra={compraSeleccionada}
          onEditar={() => {
            setEditandoCompra(compraSeleccionada);
            setCompraSeleccionada(null);
          }}
          onCerrar={() => setCompraSeleccionada(null)}
        />
      )}
      {editandoCompra && (
        <FormularioCompra
          compraExistente={editandoCompra}
          onCerrar={() => setEditandoCompra(null)}
          onGuardado={() => {}}
        />
      )}
      {mostrarFormJornal && (
        <FormularioJornal onCerrar={() => setMostrarFormJornal(false)} onGuardado={() => {}} />
      )}
      {editandoJornal && (
        <FormularioJornal
          jornalExistente={editandoJornal}
          onCerrar={() => setEditandoJornal(null)}
          onGuardado={() => {}}
        />
      )}
      {insumoSeleccionado && (
        <DetalleInsumo insumo={insumoSeleccionado} onCerrar={() => setInsumoSeleccionado(null)} />
      )}
    </div>
  );
}
