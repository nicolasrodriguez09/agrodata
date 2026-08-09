import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { IconLeaf, IconWallet, IconChart } from './ui/Icons';

const navItems = [
  { to: '/', label: 'Lotes', end: true, Icon: IconLeaf },
  { to: '/finanzas', label: 'Finanzas', Icon: IconWallet },
  { to: '/admin', label: 'Panel', Icon: IconChart },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white">
            <IconLeaf className="h-4 w-4" />
          </div>
          <span className="font-semibold text-stone-900">AgroData</span>
        </div>
        <button onClick={() => logout()} className="text-sm font-medium text-stone-500 hover:text-stone-800">
          Salir
        </button>
      </header>

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {navItems.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  isActive ? 'text-green-700' : 'text-stone-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isActive ? 'bg-green-100' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
