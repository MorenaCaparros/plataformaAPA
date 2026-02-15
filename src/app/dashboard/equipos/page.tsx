'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Equipo {
  id: string;
  nombre: string;
  descripcion: string | null;
  total_ninos: number;
  total_voluntarios: number;
  coordinador: string | null;
}

export default function EquiposPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchEquipos();
    }
  }, [authLoading, user]);

  const fetchEquipos = async () => {
    try {
      setLoading(true);

      // Obtener todos los equipos/zonas
      const { data: zonasData, error: zonasError } = await supabase
        .from('zonas')
        .select('id, nombre, descripcion')
        .order('nombre', { ascending: true });

      if (zonasError) throw zonasError;

      // Para cada equipo, contar niños y voluntarios
      const equiposConStats = await Promise.all(
        (zonasData || []).map(async (zona: any) => {
          // Contar niños de este equipo
          const { count: countNinos } = await supabase
            .from('ninos')
            .select('*', { count: 'exact', head: true })
            .eq('zona_id', zona.id);

          // Contar voluntarios de este equipo
          const { count: countVoluntarios } = await supabase
            .from('perfiles')
            .select('*', { count: 'exact', head: true })
            .eq('zona_id', zona.id)
            .eq('rol', 'voluntario');

          // Buscar coordinador
          const { data: coordinadores } = await supabase
            .from('perfiles')
            .select('nombre, apellido')
            .eq('zona_id', zona.id)
            .eq('rol', 'coordinador')
            .limit(1);

          return {
            id: zona.id,
            nombre: zona.nombre,
            descripcion: zona.descripcion,
            total_ninos: countNinos || 0,
            total_voluntarios: countVoluntarios || 0,
            coordinador: coordinadores?.[0] ? [coordinadores[0].nombre, coordinadores[0].apellido].filter(Boolean).join(' ') : null
          };
        })
      );

      setEquipos(equiposConStats);
    } catch (error) {
      console.error('Error cargando equipos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sol-50 to-crecimiento-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crecimiento-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sol-50 to-crecimiento-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-base sm:text-xl font-bold text-gray-900 dark:text-white hover:text-crecimiento-600 transition min-h-[44px] flex items-center">
              ← Volver
            </Link>
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
              Equipos/Zonas
            </h1>
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Gestión de equipos de trabajo organizados por barrios/zonas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {equipos.map((equipo) => (
            <div
              key={equipo.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {equipo.nombre}
                  </h3>
                  {equipo.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {equipo.descripcion}
                    </p>
                  )}
                </div>
                <div className="text-3xl">🏘️</div>
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Niños:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{equipo.total_ninos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Voluntarios:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{equipo.total_voluntarios}</span>
                </div>
                {equipo.coordinador && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Coordinador:</span>
                    <span className="font-semibold text-crecimiento-600 dark:text-crecimiento-400">{equipo.coordinador}</span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/ninos?zona=${equipo.id}`}
                  className="flex-1 text-center px-4 py-2 bg-crecimiento-500 text-white rounded-lg hover:bg-crecimiento-600 transition text-sm font-medium"
                >
                  Ver Niños
                </Link>
                <Link
                  href={`/dashboard/usuarios?zona=${equipo.id}`}
                  className="flex-1 text-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
                >
                  Ver Equipo
                </Link>
              </div>
            </div>
          ))}
        </div>

        {equipos.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No hay equipos configurados todavía.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
