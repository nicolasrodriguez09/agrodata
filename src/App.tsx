import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { reintentarPendientes } from './lib/cloudinary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Lotes from './pages/Lotes';
import LoteDetalle from './pages/LoteDetalle';
import Finanzas from './pages/Finanzas';
import Admin from './pages/Admin';
import Fincas from './pages/Fincas';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">Cargando...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
