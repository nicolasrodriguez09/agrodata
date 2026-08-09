import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { escucharFincas } from '../lib/fincas';
import type { Finca, Lote } from '../types/models';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { IconLeaf, IconMap } from '../components/ui/Icons';

// TODO (HU-1.2): reemplazar por lotes reales de Firestore.
const lotesMock: Lote[] = [
  { id: 'lv-1', fincaId: 'la-vega', nombre: 'Lote 1', cultivo: 'Guayaba' },
  { id: 'lv-2', fincaId: 'la-vega', nombre: 'Lote 2', cultivo: 'Guayaba' },
  { id: 'lv-3', fincaId: 'la-vega', nombre: 'Lote 3', cultivo: 'Guayaba' },
  { id: 'ed-1', fincaId: 'el-doctor', nombre: 'Lote 1', cultivo: 'Guayaba' },
  { id: 'ed-2', fincaId: 'el-doctor', nombre: 'Lote 2', cultivo: 'Guayaba' },
  { id: 'ed-3', fincaId: 'el-doctor', nombre: 'Lote 3', cultivo: 'Guayaba' },
  { id: 'f3-1', fincaId: 'finca-3', nombre: 'Lote 1', cultivo: 'Guayaba' },
  { id: 'f3-2', fincaId: 'finca-3', nombre: 'Lote 2', cultivo: 'Guayaba' },
  { id: 'f3-3', fincaId: 'finca-3', nombre: 'Lote 3', cultivo: 'Guayaba' },
  { id: 'suelto-1', fincaId: null, nombre: 'Lote suelto 1', cultivo: 'Guayaba' },
  { id: 'suelto-2', fincaId: null, nombre: 'Lote suelto 2', cultivo: 'Guayaba' },
];

function LoteCard({ lote }: { lote: Lote }) {
  return (
    <Link to={`/lotes/${lote.id}`}>
      <Card className="p-4 transition hover:border-green-300 hover:shadow-md active:scale-[0.98]">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <IconLeaf className="h-4.5 w-4.5" />
        </div>
        <p className="font-medium text-stone-900">{lote.nombre}</p>
        <p className="text-sm text-stone-500">{lote.cultivo}</p>
      </Card>
    </Link>
  );
}

export default function Lotes() {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = escucharFincas((data) => {
      setFincas(data);
      setCargando(false);
    });
    return unsub;
  }, []);

  const lotesSueltos = lotesMock.filter((l) => l.fincaId === null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Mis lotes</h1>
          <p className="text-sm text-stone-500">Elegí un lote para ver o cargar información</p>
        </div>
        <Link
          to="/fincas"
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          <IconMap className="h-4 w-4" />
          Fincas
        </Link>
      </div>

      {cargando && <p className="text-sm text-stone-400">Cargando...</p>}

      {!cargando && fincas.length === 0 && (
        <EmptyState
          icon={<IconMap className="h-6 w-6" />}
          title="Todavía no registraste ninguna finca"
          description="Creá tu primera finca para empezar a organizar los lotes."
          action={
            <Link
              to="/fincas"
              className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
            >
              Registrar finca
            </Link>
          }
        />
      )}

      {fincas.map((finca) => (
        <section key={finca.id} className="mb-7">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {finca.nombre}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {lotesMock
              .filter((l) => l.fincaId === finca.id)
              .map((lote) => (
                <LoteCard key={lote.id} lote={lote} />
              ))}
          </div>
        </section>
      ))}

      {lotesSueltos.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            Lotes sueltos
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {lotesSueltos.map((lote) => (
              <LoteCard key={lote.id} lote={lote} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
