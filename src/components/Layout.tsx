import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { IconLeaf, IconWallet, IconChart, IconSun, IconMoon } from './ui/Icons';

const navItems = [
  { to: '/', label: 'Lotes', end: true, Icon: IconLeaf },
  { to: '/finanzas', label: 'Finanzas', Icon: IconWallet },
  { to: '/admin', label: 'Panel', Icon: IconChart },
];

export default function Layout() {
  const { logout } = useAuth();
  const { tema, alternar } = useTheme();

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3.5"
        style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-text)' }}
      >
        <div className="font-display flex items-center gap-2 text-lg font-black tracking-wide">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
          AGRODATA
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={alternar}
            aria-label="Cambiar tema"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            style={{ color: 'var(--gold)' }}
          >
            {tema === 'dark' ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => logout()}
            className="ml-1 text-sm font-medium opacity-70 hover:opacity-100"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 border-t"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-2xl">
          {navItems.map(({ to, label, end, Icon }) => (
            <NavLink key={to} to={to} end={end} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium">
              {({ isActive }) => (
                <>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: isActive ? 'var(--gold)' : 'transparent' }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: isActive ? 'var(--gold-ink)' : 'var(--text-dim)' }}
                    />
                  </span>
                  <span style={{ color: isActive ? 'var(--text)' : 'var(--text-dim)' }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
