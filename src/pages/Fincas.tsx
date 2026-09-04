import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { escucharFincas, crearFinca, actualizarFinca, borrarFinca } from '../lib/fincas';
import type { Finca } from '../types/models';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import InfoDialog from '../components/ui/InfoDialog';
import { IconArrowLeft, IconMap, IconPencil, IconPlus, IconTrash } from '../components/ui/Icons';

export default function Fincas() {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [cargando, setCargando] = useState(true);

  const [editando, setEditando] = useState<Finca | null>(null);
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [aBorrar, setABorrar] = useState<Finca | null>(null);
  const [avisoNoSeBorra, setAvisoNoSeBorra] = useState(false);

  useEffect(() => {
    const unsub = escucharFincas((data) => {
      setFincas(data);
      setCargando(false);
    });
    return unsub;
  }, []);

  function abrirNueva() {
    setEditando(null);
    setNombre('');
    setUbicacion('');
    setError(null);
    setMostrarForm(true);
  }

  function abrirEditar(finca: Finca) {
    setEditando(finca);
    setNombre(finca.nombre);
    setUbicacion(finca.ubicacion ?? '');
    setError(null);
    setMostrarForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        await actualizarFinca(editando.id, { nombre, ubicacion });
      } else {
        await crearFinca({ nombre, ubicacion });
      }
      setMostrarForm(false);
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!aBorrar) return;
    const finca = aBorrar;
    setABorrar(null);
    try {
      await borrarFinca(finca.id);
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_SE_PUEDE_BORRAR_TIENE_LOTES') {
        setAvisoNoSeBorra(true);
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-dim)' }}>
        <IconArrowLeft className="h-4 w-4" />
        Mis lotes
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Fincas
        </h1>
        <Button onClick={abrirNueva} className="px-4 py-2.5 text-sm">
          <IconPlus className="h-4 w-4" />
          Nueva finca
        </Button>
      </div>

      {cargando && (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Cargando...
        </p>
      )}

      {!cargando && fincas.length === 0 && (
        <EmptyState
          icon={<IconMap className="h-6 w-6" />}
          title="Todavía no hay fincas"
          description="Registra la primera para empezar a agrupar tus lotes."
        />
      )}

      <div className="space-y-2.5">
        {fincas.map((finca) => (
          <Card key={finca.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'var(--recent)', color: 'var(--recent-text)' }}
              >
                <IconMap className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="font-serif font-semibold" style={{ color: 'var(--text)' }}>
                  {finca.nombre}
                </p>
                {finca.ubicacion && (
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                    {finca.ubicacion}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => abrirEditar(finca)}
                aria-label="Editar"
                className="rounded-lg p-2"
                style={{ color: 'var(--text-dim)' }}
              >
                <IconPencil className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => setABorrar(finca)}
                aria-label="Borrar"
                className="rounded-lg p-2"
                style={{ color: 'var(--peligro)' }}
              >
                <IconTrash className="h-4.5 w-4.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-t-2xl border p-6 shadow-xl sm:max-w-sm sm:rounded-2xl"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {editando ? 'Editar finca' : 'Nueva finca'}
            </h2>

            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text)' }}>
              Nombre <span style={{ color: 'var(--peligro)' }}>*</span>
            </label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mb-4 w-full rounded-xl border px-4 py-3 text-base focus:outline-none"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
            />

            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text)' }}>
              Ubicación (opcional)
            </label>
            <input
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="mb-4 w-full rounded-xl border px-4 py-3 text-base focus:outline-none"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
            />

            {error && (
              <p className="mb-3 text-sm" style={{ color: 'var(--peligro)' }}>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="flex-1">
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!aBorrar}
        title={`¿Borrar la finca "${aBorrar?.nombre}"?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        danger
        onConfirm={confirmarBorrado}
        onCancel={() => setABorrar(null)}
      />

      <InfoDialog
        open={avisoNoSeBorra}
        title="No se puede borrar esta finca"
        description="Todavía tiene lotes asociados. Mueve o borra esos lotes primero."
        tono="error"
        onClose={() => setAvisoNoSeBorra(false)}
      />
    </div>
  );
}
