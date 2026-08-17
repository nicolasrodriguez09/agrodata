import { useEffect, useState } from 'react';
import { escucharCompras } from '../lib/compras';
import type { CompraInsumo } from '../types/models';
import EmptyState from '../components/ui/EmptyState';
import FormularioCompra from '../components/FormularioCompra';
import DetalleCompra from '../components/DetalleCompra';
import { IconTag, IconUsers, IconWallet, IconPlus } from '../components/ui/Icons';

type Tab = 'jornales' | 'compras';

function FilaCompra({ compra, onClick }: { compra: CompraInsumo; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border p-3.5 text-left transition hover:brightness-95 active:scale-[0.99]"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {compra.fotoFacturaUrl ? (
        <img src={compra.fotoFacturaUrl} alt="" className="h-10 w-10 flex-none rounded-lg object-cover" />
      ) : (
        <div
          className="flex h-10 w-10 flex-none items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text-dim)' }}
        >
          <IconTag className="h-4.5 w-4.5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
            {compra.producto}
          </p>
          <p className="flex-none font-medium" style={{ color: 'var(--text)' }}>
            $ {compra.costo.toLocaleString('es-CO')}
          </p>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {compra.fecha}
          {compra.proveedor ? ` · ${compra.proveedor}` : ''} · compró {compra.personaQueCompro}
        </p>
      </div>
    </button>
  );
}

export default function Finanzas() {
  const [tab, setTab] = useState<Tab>('jornales');
  const [compras, setCompras] = useState<CompraInsumo[]>([]);
  const [mostrarFormCompra, setMostrarFormCompra] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraInsumo | null>(null);

  useEffect(() => escucharCompras(setCompras), []);

  const totalCompras = compras.reduce((s, c) => s + c.costo, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Finanzas
        </h1>
        {tab === 'compras' && (
          <button
            onClick={() => setMostrarFormCompra(true)}
            aria-label="Registrar compra"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            <IconPlus className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mb-5 text-sm" style={{ color: 'var(--text-dim)' }}>
        Jornales y compras de insumos de toda la finca
      </p>

      <div className="mb-5 flex gap-2">
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

      {tab === 'jornales' && (
        // TODO: HU-6.1 / HU-6.2 — registro y listado real de jornales.
        <EmptyState
          icon={<IconWallet className="h-6 w-6" />}
          title="Todavía no hay pagos de jornales"
          description="Próximamente vas a poder registrarlos acá."
        />
      )}

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
            <p className="mb-3 text-sm" style={{ color: 'var(--text-dim)' }}>
              <b style={{ color: 'var(--text)' }}>{compras.length}</b>{' '}
              {compras.length === 1 ? 'compra' : 'compras'} · total gastado{' '}
              <b style={{ color: 'var(--text)' }}>$ {totalCompras.toLocaleString('es-CO')}</b>
            </p>
            <div className="flex flex-col gap-2">
              {compras.map((c) => (
                <FilaCompra key={c.id} compra={c} onClick={() => setCompraSeleccionada(c)} />
              ))}
            </div>
          </>
        ))}

      {mostrarFormCompra && (
        <FormularioCompra onCerrar={() => setMostrarFormCompra(false)} onGuardado={() => {}} />
      )}
      {compraSeleccionada && (
        <DetalleCompra compra={compraSeleccionada} onCerrar={() => setCompraSeleccionada(null)} />
      )}
    </div>
  );
}
