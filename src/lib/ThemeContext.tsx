import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Tema = 'light' | 'dark';
const CLAVE = 'agrodata_tema';

const ThemeContext = createContext<{ tema: Tema; alternar: () => void } | undefined>(undefined);

function temaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE);
  if (guardado === 'light' || guardado === 'dark') return guardado;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  const alternar = () => setTema((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ tema, alternar }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
