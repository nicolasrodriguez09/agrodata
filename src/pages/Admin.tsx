import AgregarUsuario from '../components/AgregarUsuario';
import Card from '../components/ui/Card';
import { IconChart, IconSearch } from '../components/ui/Icons';

const resumen = [
  { label: 'Total invertido', valor: '$ 0', tono: 'text-stone-900' },
  { label: 'Total vendido', valor: '$ 0', tono: 'text-green-700' },
  { label: 'Balance', valor: '$ 0', tono: 'text-amber-700' },
];

export default function Admin() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold text-stone-900">Panel administrativo</h1>
      <p className="mb-5 text-sm text-stone-500">Rentabilidad y estado general de la finca</p>

      <div className="grid grid-cols-3 gap-3">
        {resumen.map((item) => (
          <Card key={item.label} className="p-3.5 text-center">
            <p className="text-xs text-stone-500">{item.label}</p>
            <p className={`text-lg font-semibold ${item.tono}`}>{item.valor}</p>
          </Card>
        ))}
      </div>

      {/* Las gráficas de gastos vs. ventas (HU-7.1) viven en Finanzas > Resumen, a pedido del usuario. */}
      {/* TODO: rentabilidad por lote (HU-7.2) */}
      <Card className="mt-6 flex flex-col items-center border-dashed p-10 text-center text-stone-400 shadow-none">
        <IconChart className="mb-2 h-6 w-6" />
        <p className="text-sm">La rentabilidad por lote va acá una vez conectado Firestore.</p>
      </Card>

      <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Buscar en todos los registros
      </h2>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por lote, finca, trabajador, producto..."
          className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-3 text-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100"
        />
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Usuarios
      </h2>
      <AgregarUsuario />
    </div>
  );
}
