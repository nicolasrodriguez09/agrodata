import type { Jornal, Lote } from '../../types/models';
import { formatoFecha } from '../../lib/fechas';

export default function FilaJornal({
  jornal,
  lotes,
  onClick,
}: {
  jornal: Jornal;
  lotes?: Lote[];
  onClick?: () => void;
}) {
  const lote = jornal.loteId ? lotes?.find((l) => l.id === jornal.loteId) : undefined;
  const Contenedor = onClick ? 'button' : 'div';
  return (
    <Contenedor
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`block w-full rounded-xl border p-3.5 text-left ${onClick ? 'transition hover:brightness-95 active:scale-[0.99]' : ''}`}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
          {jornal.trabajador}
        </p>
        <p className="flex-none font-medium" style={{ color: 'var(--text)' }}>
          $ {jornal.valor.toLocaleString('es-CO')}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {formatoFecha(jornal.fecha)}
          {jornal.labor ? ` · ${jornal.labor}` : ''} · {jornal.cantidad}{' '}
          {jornal.unidad === 'dia' ? (jornal.cantidad === 1 ? 'día' : 'días') : jornal.cantidad === 1 ? 'hora' : 'horas'} · pagó{' '}
          {jornal.quienPago}
          {lote ? ` · ${lote.nombre}` : ''}
        </p>
        <span
          className="flex-none rounded-full px-2 py-0.5 text-xs font-medium"
          style={
            jornal.pagado
              ? { backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }
              : { backgroundColor: 'var(--nodata)', color: 'var(--nodata-text)', border: '1px dashed var(--nodata-border)' }
          }
        >
          {jornal.pagado ? 'Pagado' : 'Pendiente'}
        </span>
      </div>
    </Contenedor>
  );
}
