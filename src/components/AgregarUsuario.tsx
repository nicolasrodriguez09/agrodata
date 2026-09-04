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
      className="rounded-2xl border p-4"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <h3 className="mb-3 font-serif text-base font-semibold" style={{ color: 'var(--text)' }}>
        Agregar usuario
      </h3>

      <input
        type="email"
        required
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
      />
      <input
        type="text"
        required
        minLength={6}
        placeholder="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-2 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
      />

      {mensaje && (
        <p className="mb-2 text-sm" style={{ color: mensaje.tipo === 'ok' ? 'var(--recent)' : 'var(--peligro)' }}>
          {mensaje.texto}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full py-2.5 text-sm">
        {loading ? 'Creando...' : 'Agregar usuario'}
      </Button>
    </form>
  );
}
