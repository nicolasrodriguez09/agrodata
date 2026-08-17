import type { CompraInsumo } from '../types/models';
import { IconTag } from './ui/Icons';

interface Props {
  compra: CompraInsumo;
  onCerrar: () => void;
}

export default function DetalleCompra({ compra, onCerrar }: Props) {
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={onCerrar}>
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {compra.producto}
        </h2>

        {compra.fotoFacturaUrl ? (
          <img
            src={compra.fotoFacturaUrl}
            alt="Factura"
            className="mb-4 w-full rounded-xl object-cover"
            style={{ border: '1px solid var(--border)', maxHeight: '320px' }}
          />
        ) : (
          <div
            className="mb-4 flex h-24 items-center justify-center rounded-xl border border-dashed text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            <IconTag className="mr-2 h-4 w-4" />
            Sin foto de factura
          </div>
        )}

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-dim)' }}>Costo</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              $ {compra.costo.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-dim)' }}>Fecha</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {compra.fecha}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-dim)' }}>Proveedor</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {compra.proveedor || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-dim)' }}>Compró</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {compra.personaQueCompro}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-5 w-full rounded-xl border py-3 text-sm font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
