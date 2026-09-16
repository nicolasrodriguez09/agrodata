import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import { reintentarPendientes } from './lib/cloudinary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Lotes from './pages/Lotes';
import LoteDetalle from './pages/LoteDetalle';
import Finanzas from './pages/Finanzas';
import Admin from './pages/Admin';
import Fincas from './pages/Fincas';
import Reporte from './pages/Reporte';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, autorizado, logout } = useAuth();

  if (loading || (user && autorizado === null)) {
    return <div className="flex min-h-screen items-center justify-center" style={{ color: 'var(--text-dim)' }}>Cargando...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Tener cuenta no es lo mismo que ser de la finca. Sin este mensaje, quien no
  // esté en la lista vería la app entera vacía, sin entender por qué.
  if (autorizado === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: 'var(--header-bg)' }}>
        <div
          className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-xl"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h1 className="font-serif text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Esta cuenta no tiene acceso a la finca
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            Tu correo <b style={{ color: 'var(--text)' }}>{user.email}</b> no está en la lista de personas
            autorizadas. Pídele a Freddy que te agregue desde el Panel de la aplicación.
          </p>
          <button
            onClick={() => logout()}
            className="mt-5 h-11 w-full rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--gold)', color: 'var(--gold-ink)' }}
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/reporte"
        element={
          <RequireAuth>
            <Reporte />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Lotes />} />
        <Route path="/fincas" element={<Fincas />} />
        <Route path="/lotes/:loteId" element={<LoteDetalle />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    reintentarPendientes();
    window.addEventListener('online', reintentarPendientes);
    return () => window.removeEventListener('online', reintentarPendientes);
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
