import { useState, type FormEvent } from 'react';
import { crearUsuario } from '../lib/adminUsers';
import Button from './ui/Button';

export default function AgregarUsuario() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    setLoading(true);
    try {
      await crearUsuario(email, password);
      setMensaje({ tipo: 'ok', texto: `Usuario ${email} creado correctamente.` });
      setEmail('');
      setPassword('');
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      const texto =
        code === 'auth/weak-password'
          ? 'La contraseña debe tener al menos 6 caracteres.'
          : code === 'auth/email-already-in-use'
          ? 'Ese correo ya tiene una cuenta.'
          : 'No se pudo crear el usuario.';
      setMensaje({ tipo: 'error', texto });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5"
    >
      <h3 className="mb-3 text-sm font-semibold text-stone-700">Agregar usuario</h3>

      <input
        type="email"
        required
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100"
      />
      <input
        type="text"
        required
        minLength={6}
        placeholder="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100"
      />

      {mensaje && (
        <p className={`mb-2 text-sm ${mensaje.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {mensaje.texto}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full py-2.5 text-sm">
        {loading ? 'Creando...' : 'Agregar usuario'}
      </Button>
    </form>
  );
}
