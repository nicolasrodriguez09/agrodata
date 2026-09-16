import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Si la cuenta está en la lista de gente de la finca. null = todavía revisando. */
  autorizado: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState<boolean | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  /**
   * Estar logueado no alcanza: hay que estar en /usuarios. Cualquiera puede
   * crearse una cuenta contra la API pública de Firebase sin pasar por la app,
   * así que quien manda es la lista, no el login.
   *
   * Esto es solo para poder mostrar un mensaje claro. Quien de verdad bloquea
   * son las reglas de Firestore: si esta comprobación fallara, el intruso
   * igual no podría leer ni escribir nada.
   */
  useEffect(() => {
    if (!user) {
      setAutorizado(null);
      return;
    }
    let vigente = true;
    getDoc(doc(db, 'usuarios', user.uid))
      .then((snap) => {
        if (vigente) setAutorizado(snap.exists());
      })
      .catch((err) => {
        if (!vigente) return;
        // Sin señal y sin caché no se puede comprobar. En ese caso se deja
        // pasar: negarle la app a Freddy en el campo por una comprobación que
        // no se pudo hacer sería peor, y las reglas siguen protegiendo igual.
        setAutorizado(err?.code === 'permission-denied' ? false : true);
      });
    return () => {
      vigente = false;
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, autorizado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
