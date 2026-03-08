'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';

type Perfil = Database['public']['Tables']['perfiles']['Row'];

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
        // Actualizar ultima_conexion al iniciar sesión
        if (event === 'SIGNED_IN') {
          supabase
            .from('perfiles')
            .update({ ultima_conexion: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(() => {}); // fire-and-forget
        }
      } else {
        setPerfil(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setPerfil(data);
    } catch (error) {
      console.error('Error fetching perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Usar signOut del cliente directamente para que el cookie adapter custom
    // (document.cookie) limpie la sesión localmente vía remove().
    // Además invalida el token en Supabase y dispara SIGNED_OUT en onAuthStateChange.
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
