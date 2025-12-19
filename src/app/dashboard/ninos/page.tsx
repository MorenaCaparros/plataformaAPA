'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Nino {
  id: string;
  alias: string;
  rango_etario: string;
  nivel_alfabetizacion: string;
  escolarizado: boolean;
  total_sesiones: number;
  ultima_sesion: string | null;
}

export default function MisNinosPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNinos();
    }
  }, [authLoading, user]);

  const fetchNinos = async () => {
    try {
      console.log('Fetching niños para user:', user?.id, 'rol:', perfil?.rol);
      
      // Psicopedagogía, coordinador, trabajador social y admin ven TODOS los niños
      const rolesConAccesoTotal = ['psicopedagogia', 'coordinador', 'trabajador_social', 'admin'];
      const tieneAccesoTotal = perfil?.rol && rolesConAccesoTotal.includes(perfil.rol);

      let ninosData: any[] = [];

      if (tieneAccesoTotal) {
        // Ver TODOS los niños
        const { data, error } = await supabase
          .from('ninos')
          .select('id, alias, rango_etario, nivel_alfabetizacion, escolarizado')
          .order('alias', { ascending: true });

        if (error) throw error;
        ninosData = data || [];
      } else {
        // Voluntarios: solo ven sus niños asignados
        const { data, error } = await supabase
          .from('nino_voluntarios')
          .select(`
            nino_id,
            ninos (
              id,
              alias,
              rango_etario,
              nivel_alfabetizacion,
              escolarizado
            )
          `)
          .eq('voluntario_id', user?.id)
          .eq('activo', true);

        if (error) throw error;
        ninosData = (data || []).map((item: any) => item.ninos);
      }

      console.log('Niños encontrados:', ninosData.length);

      // Para cada niño, obtener info de sesiones
      const ninosConSesiones = await Promise.all(
        ninosData.map(async (nino: any) => {
          // Contar TODAS las sesiones del niño (no filtrar por voluntario)
          const { data: sesiones } = await supabase
            .from('sesiones')
            .select('id, fecha')
            .eq('nino_id', nino.id)
            .order('fecha', { ascending: false });

          return {
            id: nino.id,
            alias: nino.alias,
            rango_etario: nino.rango_etario,
            nivel_alfabetizacion: nino.nivel_alfabetizacion,
            escolarizado: nino.escolarizado,
            total_sesiones: sesiones?.length || 0,
            ultima_sesion: sesiones?.[0]?.fecha || null
          };
        })
      );

      console.log('Niños con sesiones:', ninosConSesiones);
      setNinos(ninosConSesiones || []);
    } catch (error) {
      console.error('Error fetching niños:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-base sm:text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 transition min-h-[44px] flex items-center">
              ← Volver
            </Link>
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
              Niños
            </h1>
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Botón para registrar nuevo niño */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/dashboard/ninos/nuevo"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 min-h-[48px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm active:scale-95"
          >
            ➕ Registrar Nuevo Niño
          </Link>
        </div>

        {ninos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No tenés niños asignados todavía.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Registrá tu primer niño para empezar a trabajar.
            </p>
            <Link
              href="/dashboard/ninos/nuevo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium active:scale-95"
            >
              ➕ Registrar Primer Niño
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {ninos.map((nino) => (
              <div
                key={nino.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-2xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {nino.alias}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-semibold rounded-full">
                    {nino.rango_etario} años
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Nivel:</span> {nino.nivel_alfabetizacion}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Escolarizado:</span> {nino.escolarizado ? 'Sí' : 'No'}
                  </p>
                </div>

                {/* Stats de sesiones */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sesiones registradas:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{nino.total_sesiones}</span>
                  </div>
                  {nino.ultima_sesion && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Última: {new Date(nino.ultima_sesion).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Link
                    href={`/dashboard/sesiones/nueva/${nino.id}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 min-h-[48px] rounded-lg transition active:scale-95 flex items-center justify-center"
                  >
                    ➕ Registrar Sesión
                  </Link>
                  
                  {nino.total_sesiones > 0 && (
                    <>
                      <Link
                        href={`/dashboard/sesiones?nino=${nino.id}`}
                        className="block w-full text-center bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 min-h-[48px] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition text-sm active:scale-95 flex items-center justify-center"
                      >
                        📝 Ver historial ({nino.total_sesiones})
                      </Link>
                      <Link
                        href={`/dashboard/ninos/${nino.id}/analisis`}
                        className="block w-full text-center bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 font-medium py-3 px-4 min-h-[48px] rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition text-sm active:scale-95 flex items-center justify-center"
                      >
                        🧠 Análisis con IA
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
