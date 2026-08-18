import type { Jornal } from '../../types/models';

export default function FilaJornal({ jornal }: { jornal: Jornal }) {
  return (
    <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
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
          {jornal.fecha}
          {jornal.labor ? ` · ${jornal.labor}` : ''} · {jornal.cantidad}{' '}
          {jornal.unidad === 'dia' ? (jornal.cantidad === 1 ? 'día' : 'días') : jornal.cantidad === 1 ? 'hora' : 'horas'} · pagó{' '}
          {jornal.quienPago}
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
    </div>
  );
}
