interface Props {
  mostrando: number;
  total: number;
  hayMas: boolean;
  onVerMas: () => void;
  onVerTodos: () => void;
  etiqueta: string;
}

/** Pie de una lista paginada: cuántas se ven de cuántas, y cómo traer más. */
export default function VerMas({ mostrando, total, hayMas, onVerMas, onVerTodos, etiqueta }: Props) {
  if (total === 0) return null;

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
        Mostrando {mostrando.toLocaleString('es-CO')} de {total.toLocaleString('es-CO')} {etiqueta}
      </p>
      {hayMas && (
        <div className="flex w-full gap-2">
          <button
            onClick={onVerMas}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold active:scale-[0.98]"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            Ver 20 más
          </button>
          <button
            onClick={onVerTodos}
            className="flex-none rounded-xl border px-4 py-2.5 text-sm font-medium active:scale-[0.98]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
          >
            Ver todos
          </button>
        </div>
      )}
    </div>
  );
}
