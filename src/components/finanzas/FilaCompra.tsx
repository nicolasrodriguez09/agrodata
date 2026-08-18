import type { CompraInsumo } from '../../types/models';
import { IconTag } from '../ui/Icons';

export default function FilaCompra({ compra, onClick }: { compra: CompraInsumo; onClick: () => void }) {
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
