import { Link, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { IconArrowLeft, IconDroplet, IconBasket, IconTag, IconUsers } from '../components/ui/Icons';

const acciones = [
  { label: 'Aplicación de insumo', Icon: IconDroplet, tono: 'text-green-700 bg-green-50' },
  { label: 'Registrar cosecha', Icon: IconBasket, tono: 'text-amber-700 bg-amber-50' },
  { label: 'Registrar venta', Icon: IconTag, tono: 'text-blue-700 bg-blue-50' },
  { label: 'Pago de jornal', Icon: IconUsers, tono: 'text-purple-700 bg-purple-50' },
];

export default function LoteDetalle() {
  const { loteId } = useParams();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <IconArrowLeft className="h-4 w-4" />
        Mis lotes
      </Link>

      <h1 className="text-xl font-semibold text-stone-900">Lote {loteId}</h1>

      {/* TODO: reemplazar por datos reales de Firestore (finca, área, árboles, ciclo activo) */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Card className="p-3.5">
          <p className="text-stone-500">Área</p>
          <p className="font-medium text-stone-900">— ha</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-stone-500">Árboles/plantas</p>
          <p className="font-medium text-stone-900">—</p>
        </Card>
      </div>

      <Card className="mt-4 border-green-200 bg-green-50/60 p-4">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Ciclo</p>
          <Badge tono="ambar">Sin abrir</Badge>
        </div>
        <p className="font-medium text-green-900">Todavía no hay un ciclo activo en este lote</p>
      </Card>

      <h2 className="mt-6 mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Acciones
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {acciones.map(({ label, Icon, tono }) => (
          <button
            key={label}
            className="rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-green-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${tono}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-medium text-stone-800">{label}</p>
          </button>
        ))}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Historial del ciclo
      </h2>
      <p className="text-sm text-stone-400">Todavía no hay registros.</p>
    </div>
  );
}
