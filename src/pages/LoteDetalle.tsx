import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { escucharFincas } from '../lib/fincas';
import { escucharLote, borrarLote } from '../lib/lotes';
import { escucharCiclosDeLote, cerrarCiclo } from '../lib/ciclos';
import { cargarResumenCiclo, type ResumenCiclo } from '../lib/resumenCiclo';
import { escucharAplicacionesDeCiclo } from '../lib/aplicaciones';
import { escucharCosechasDeCiclo } from '../lib/cosechas';
import { escucharVentasDeCiclo } from '../lib/ventas';
import type { Aplicacion, Ciclo, Cosecha, Finca, Lote, Venta } from '../types/models';
import FormularioLote from '../components/FormularioLote';
import FormularioCiclo from '../components/FormularioCiclo';
import FormularioAplicacion from '../components/FormularioAplicacion';
import FormularioCosecha from '../components/FormularioCosecha';
import FormularioVenta from '../components/FormularioVenta';
import CalendarioActividad from '../components/CalendarioActividad';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import InfoDialog from '../components/ui/InfoDialog';
import {
  IconArrowLeft,
  IconDroplet,
  IconBasket,
  IconTag,
  IconPencil,
  IconTrash,
  IconSearch,
} from '../components/ui/Icons';

const acciones = [
  { id: 'aplicacion', label: 'Aplicación de insumo', Icon: IconDroplet },
  { id: 'cosecha', label: 'Registrar cosecha', Icon: IconBasket },
  { id: 'venta', label: 'Registrar venta', Icon: IconTag },
] as const;

export default function LoteDetalle() {
  const { loteId } = useParams<{ loteId: string }>();
  const navigate = useNavigate();
  const [lote, setLote] = useState<Lote | null | undefined>(undefined);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [editando, setEditando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [abriendoCiclo, setAbriendoCiclo] = useState(false);
  const [confirmarCierreCiclo, setConfirmarCierreCiclo] = useState(false);
  const [cicloSeleccionadoId, setCicloSeleccionadoId] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenCiclo | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [mostrarFormAplicacion, setMostrarFormAplicacion] = useState(false);
  const [mostrarFormCosecha, setMostrarFormCosecha] = useState(false);
  const [mostrarFormVenta, setMostrarFormVenta] = useState(false);
  const [avisoSinCiclo, setAvisoSinCiclo] = useState(false);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todo' | 'aplicacion' | 'cosecha'>('todo');
  const [vistaHistorial, setVistaHistorial] = useState<'lista' | 'calendario'>('lista');

  useEffect(() => {
    if (!loteId) return;
    const unsubLote = escucharLote(loteId, setLote);
    const unsubFincas = escucharFincas(setFincas);
    const unsubCiclos = escucharCiclosDeLote(loteId, setCiclos);
    return () => {
      unsubLote();
      unsubFincas();
      unsubCiclos();
    };
  }, [loteId]);

  // La selección sigue al ciclo activo del lote: cada vez que se abre o se
  // cierra un ciclo, vuelve a mostrar ese (o "sin ciclo activo" si se cerró).
  // Elegir manualmente un histórico no se pisa hasta que este valor cambie de nuevo.
  useEffect(() => {
    setCicloSeleccionadoId(lote?.cicloActivoId ?? null);
  }, [lote?.cicloActivoId]);

  useEffect(() => {
    if (!cicloSeleccionadoId) {
      setResumen(null);
      return;
    }
    let cancelado = false;
    cargarResumenCiclo(cicloSeleccionadoId).then((r) => {
      if (!cancelado) setResumen(r);
    });
    return () => {
      cancelado = true;
    };
  }, [cicloSeleccionadoId, refreshTick]);

  useEffect(() => {
    if (!cicloSeleccionadoId) {
      setAplicaciones([]);
      return;
    }
    return escucharAplicacionesDeCiclo(cicloSeleccionadoId, setAplicaciones);
  }, [cicloSeleccionadoId]);

  useEffect(() => {
    if (!cicloSeleccionadoId) {
      setCosechas([]);
      return;
    }
    return escucharCosechasDeCiclo(cicloSeleccionadoId, setCosechas);
  }, [cicloSeleccionadoId]);

  useEffect(() => {
    if (!cicloSeleccionadoId) {
      setVentas([]);
      return;
    }
    return escucharVentasDeCiclo(cicloSeleccionadoId, setVentas);
  }, [cicloSeleccionadoId]);

  if (lote === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p style={{ color: 'var(--text-dim)' }}>Cargando...</p>
      </div>
    );
  }

  if (lote === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
          <IconArrowLeft className="h-4 w-4" />
          Mis lotes
        </Link>
        <p style={{ color: 'var(--text)' }}>Este lote no existe o fue borrado.</p>
      </div>
    );
  }

  const finca = fincas.find((f) => f.id === lote.fincaId);
  const cicloActivo = ciclos.find((c) => c.id === lote.cicloActivoId && c.estado === 'abierto');
  const ciclosCerrados = ciclos.filter((c) => c.estado === 'cerrado');
  const cicloSeleccionado = ciclos.find((c) => c.id === cicloSeleccionadoId);
  const viendoHistorico = !!cicloSeleccionado && cicloSeleccionado.id !== cicloActivo?.id;

  async function handleCerrarCiclo() {
    setConfirmarCierreCiclo(false);
    await cerrarCiclo(lote!.id, cicloActivo!.id);
  }

  function handleClickAccion(id: string) {
    if (!cicloActivo) {
      setAvisoSinCiclo(true);
      return;
    }
    if (id === 'aplicacion') setMostrarFormAplicacion(true);
    if (id === 'cosecha') setMostrarFormCosecha(true);
    if (id === 'venta') setMostrarFormVenta(true);
  }

  async function handleBorrar() {
    setConfirmarBorrado(false);
    await borrarLote(lote!.id);
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
        <IconArrowLeft className="h-4 w-4" />
        Mis lotes
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            {lote.nombre}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {finca ? finca.nombre : 'Lote suelto'} · {lote.cultivo}
          </p>
        </div>
        <div className="flex flex-none gap-1">
          <button
            onClick={() => setEditando(true)}
            aria-label="Editar lote"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmarBorrado(true)}
            aria-label="Borrar lote"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: '#b4552f' }}
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <p style={{ color: 'var(--text-dim)' }}>Área</p>
          <p className="font-medium" style={{ color: 'var(--text)' }}>
            {lote.areaHectareas != null ? `${lote.areaHectareas} ha` : '—'}
          </p>
        </div>
        <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <p style={{ color: 'var(--text-dim)' }}>Árboles/plantas</p>
          <p className="font-medium" style={{ color: 'var(--text)' }}>
            {lote.cantidadArboles != null ? lote.cantidadArboles : '—'}
          </p>
        </div>
      </div>

      <div
        className="mt-4 rounded-xl border p-4"
        style={{
          borderColor: viendoHistorico ? 'var(--border)' : 'var(--gold)',
          backgroundColor: viendoHistorico ? 'var(--surface)' : 'color-mix(in srgb, var(--gold) 12%, transparent)',
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p
            className="font-display text-[11px] font-black tracking-wide uppercase"
            style={{ color: viendoHistorico ? 'var(--text-dim)' : 'var(--gold)' }}
          >
            Ciclo
          </p>
          {ciclos.length > 1 && (
            <select
              value={cicloSeleccionadoId ?? ''}
              onChange={(e) => setCicloSeleccionadoId(e.target.value)}
              className="rounded-lg border px-2 py-1 text-xs"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
            >
              {ciclos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.estado === 'abierto' ? '(activo)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {!cicloSeleccionado && (
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium" style={{ color: 'var(--text)' }}>
              No hay un ciclo activo en este lote
            </p>
            <button
              onClick={() => setAbriendoCiclo(true)}
              className="flex-none rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
            >
              Abrir ciclo
            </button>
          </div>
        )}

        {cicloSeleccionado && !viendoHistorico && (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium" style={{ color: 'var(--text)' }}>
                {cicloSeleccionado.nombre}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Abierto desde el {cicloSeleccionado.fechaInicio}
              </p>
            </div>
            <button
              onClick={() => setConfirmarCierreCiclo(true)}
              className="flex-none rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
            >
              Cerrar ciclo
            </button>
          </div>
        )}

        {cicloSeleccionado && viendoHistorico && (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium" style={{ color: 'var(--text)' }}>
                {cicloSeleccionado.nombre}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Del {cicloSeleccionado.fechaInicio} al {cicloSeleccionado.fechaCierre} · solo consulta
              </p>
            </div>
            {cicloActivo && (
              <button
                onClick={() => setCicloSeleccionadoId(cicloActivo.id)}
                className="flex-none rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
              >
                Ver ciclo activo
              </button>
            )}
          </div>
        )}
      </div>

      {cicloSeleccionado && (
        <>
          <h2 className="font-display mt-6 mb-3 text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
            Resumen del ciclo
          </h2>
          {!resumen ? (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Cargando...
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Tamaño
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  {lote.areaHectareas != null ? `${lote.areaHectareas} ha` : '—'}
                </p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Árboles/plantas
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  {lote.cantidadArboles != null ? lote.cantidadArboles : '—'}
                </p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Aplicaciones
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  {resumen.aplicaciones}
                </p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Cosechas
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  {resumen.cosechas}
                </p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Gastado en insumos
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  $ {resumen.totalGastado.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Total vendido
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  $ {resumen.totalVendido.toLocaleString('es-CO')}
                </p>
              </div>
              <div
                className="col-span-2 rounded-xl border p-3 sm:col-span-2"
                style={{
                  borderColor: resumen.balance >= 0 ? 'var(--recent)' : '#b4552f',
                  backgroundColor:
                    resumen.balance >= 0
                      ? 'color-mix(in srgb, var(--recent) 12%, transparent)'
                      : 'color-mix(in srgb, #b4552f 12%, transparent)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Balance
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  $ {resumen.balance.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="font-display mt-6 mb-3 text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
        Acciones
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {acciones.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleClickAccion(id)}
            className="rounded-xl border p-4 text-left transition hover:brightness-95 active:scale-[0.98]"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <div
              className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--gold)' }}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {label}
            </p>
          </button>
        ))}
      </div>

      {cicloSeleccionado && (() => {
        const items: Array<
          | { tipo: 'aplicacion'; id: string; fecha: string; data: Aplicacion }
          | { tipo: 'cosecha'; id: string; fecha: string; data: Cosecha }
        > = [
          ...aplicaciones.map((a) => ({ tipo: 'aplicacion' as const, id: a.id, fecha: a.fecha, data: a })),
          ...cosechas.map((c) => ({ tipo: 'cosecha' as const, id: c.id, fecha: c.fecha, data: c })),
        ].sort((x, y) => y.fecha.localeCompare(x.fecha));

        const hayAlgo = items.length > 0;
        const itemsPorTipo = filtroTipo === 'todo' ? items : items.filter((i) => i.tipo === filtroTipo);
        const texto = filtroTexto.trim().toLowerCase();
        const itemsFiltrados = itemsPorTipo.filter((i) => {
          if (!texto) return true;
          if (i.tipo === 'aplicacion') return i.data.producto.toLowerCase().includes(texto);
          return (i.data.calidad ?? '').toLowerCase().includes(texto);
        });

        return (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
                Historial del ciclo
              </h2>
              {hayAlgo && (
                <div
                  className="font-display flex rounded-full p-0.5 text-[10.5px] font-black tracking-wide"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {(['lista', 'calendario'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVistaHistorial(v)}
                      className="rounded-full px-2.5 py-1 uppercase transition"
                      style={
                        vistaHistorial === v
                          ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
                          : { color: 'var(--text-dim)' }
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!hayAlgo ? (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                Todavía no hay aplicaciones ni cosechas registradas en este ciclo.
              </p>
            ) : vistaHistorial === 'calendario' ? (
              <CalendarioActividad aplicaciones={aplicaciones} cosechas={cosechas} />
            ) : (
              <>
                <div className="mb-3 flex gap-2">
                  {(['todo', 'aplicacion', 'cosecha'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFiltroTipo(t)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={
                        filtroTipo === t
                          ? { backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }
                          : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }
                      }
                    >
                      {t === 'todo' ? 'Todo' : t === 'aplicacion' ? 'Aplicaciones' : 'Cosechas'}
                    </button>
                  ))}
                </div>

                <div className="relative mb-3">
                  <IconSearch
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                    style={{ color: 'var(--text-dim)' }}
                  />
                  <input
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    placeholder="Buscar por producto o calidad..."
                    className="w-full rounded-xl border py-2.5 pr-3 pl-9 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                  />
                </div>

                {itemsFiltrados.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    Nada coincide con "{filtroTexto}".
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {itemsFiltrados.map((item) => (
                      <div
                        key={`${item.tipo}-${item.id}`}
                        className="flex gap-3 rounded-xl border p-3.5"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                      >
                        <div
                          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                          style={
                            item.tipo === 'aplicacion'
                              ? { backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }
                              : { backgroundColor: 'var(--cosecha)', color: 'var(--cosecha-text)' }
                          }
                        >
                          {item.tipo === 'aplicacion' ? (
                            <IconDroplet className="h-4.5 w-4.5" />
                          ) : (
                            <IconBasket className="h-4.5 w-4.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                              {item.tipo === 'aplicacion' ? item.data.producto : `Cosecha: ${item.data.cantidad}`}
                            </p>
                            <p className="flex-none text-xs" style={{ color: 'var(--text-dim)' }}>
                              {item.fecha}
                            </p>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                            {item.tipo === 'aplicacion'
                              ? `${item.data.cantidad}${item.data.dosis ? ` · ${item.data.dosis}` : ''} · aplicó ${item.data.responsable}`
                              : (item.data.calidad ?? 'Sin clasificar')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        );
      })()}

      {cicloSeleccionado && (
        <>
          <h2 className="font-display mt-6 mb-3 text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
            Ventas registradas
          </h2>
          {ventas.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Todavía no hay ventas registradas en este ciclo.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {ventas.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border p-3.5"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                      $ {v.precio.toLocaleString('es-CO')}
                    </p>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        v.cobrado
                          ? { backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }
                          : { backgroundColor: 'var(--nodata)', color: 'var(--nodata-text)', border: '1px dashed var(--nodata-border)' }
                      }
                    >
                      {v.cobrado ? 'Cobrado' : 'Pendiente de cobro'}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    {v.cantidad}
                    {v.comprador ? ` · ${v.comprador}` : ''} · {v.fecha}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="font-display mt-6 mb-2 text-[13px] font-black tracking-wider uppercase" style={{ color: 'var(--text-dim)' }}>
        Ciclos anteriores
      </h2>
      {ciclosCerrados.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Todavía no hay ciclos cerrados.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {ciclosCerrados.map((c) => (
            <button
              key={c.id}
              onClick={() => setCicloSeleccionadoId(c.id)}
              className="flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition hover:brightness-95"
              style={{
                borderColor: c.id === cicloSeleccionadoId ? 'var(--gold)' : 'var(--border)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                {c.nombre}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>
                {c.fechaInicio} → {c.fechaCierre}
              </span>
            </button>
          ))}
        </div>
      )}

      {editando && <FormularioLote fincas={fincas} loteExistente={lote} onCerrar={() => setEditando(false)} />}
      {abriendoCiclo && <FormularioCiclo loteId={lote.id} onCerrar={() => setAbriendoCiclo(false)} />}
      {mostrarFormAplicacion && cicloActivo && (
        <FormularioAplicacion
          loteId={lote.id}
          cicloId={cicloActivo.id}
          onCerrar={() => setMostrarFormAplicacion(false)}
          onGuardado={() => setRefreshTick((t) => t + 1)}
        />
      )}
      {mostrarFormCosecha && cicloActivo && (
        <FormularioCosecha
          loteId={lote.id}
          cicloId={cicloActivo.id}
          onCerrar={() => setMostrarFormCosecha(false)}
          onGuardado={() => setRefreshTick((t) => t + 1)}
        />
      )}
      {mostrarFormVenta && cicloActivo && (
        <FormularioVenta
          loteId={lote.id}
          cicloId={cicloActivo.id}
          onCerrar={() => setMostrarFormVenta(false)}
          onGuardado={() => setRefreshTick((t) => t + 1)}
        />
      )}

      <InfoDialog
        open={avisoSinCiclo}
        title="Primero abrí un ciclo"
        description="Para registrar aplicaciones, cosechas o ventas, este lote necesita un ciclo activo."
        tono="error"
        onClose={() => setAvisoSinCiclo(false)}
      />

      <ConfirmDialog
        open={confirmarCierreCiclo}
        title={`¿Cerrar el ciclo "${cicloActivo?.nombre}"?`}
        description="Vas a poder abrir un ciclo nuevo después. El historial de este queda guardado."
        confirmLabel="Cerrar ciclo"
        onConfirm={handleCerrarCiclo}
        onCancel={() => setConfirmarCierreCiclo(false)}
      />

      <ConfirmDialog
        open={confirmarBorrado}
        title={`¿Borrar el lote "${lote.nombre}"?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        danger
        onConfirm={handleBorrar}
        onCancel={() => setConfirmarBorrado(false)}
      />
    </div>
  );
}
