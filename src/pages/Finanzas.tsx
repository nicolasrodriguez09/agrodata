import { useState } from 'react';
import EmptyState from '../components/ui/EmptyState';
import { IconTag, IconUsers, IconWallet } from '../components/ui/Icons';

type Tab = 'jornales' | 'compras';

export default function Finanzas() {
  const [tab, setTab] = useState<Tab>('jornales');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold text-stone-900">Finanzas</h1>
      <p className="mb-5 text-sm text-stone-500">Jornales y compras de insumos de toda la finca</p>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab('jornales')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === 'jornales' ? 'bg-green-700 text-white' : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          <IconUsers className="h-4 w-4" />
          Jornales
        </button>
        <button
          onClick={() => setTab('compras')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === 'compras' ? 'bg-green-700 text-white' : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          <IconTag className="h-4 w-4" />
          Compras de insumos
        </button>
      </div>

      {/* TODO: listado real desde Firestore con buscador y filtros (HU-5.3 / HU-6.2) */}
      <EmptyState
        icon={<IconWallet className="h-6 w-6" />}
        title={tab === 'jornales' ? 'Todavía no hay pagos de jornales' : 'Todavía no hay compras registradas'}
        description="Los vas a poder cargar desde el detalle de cada lote."
      />
    </div>
  );
}
