'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatearEdad } from '@/lib/utils/date-helpers';

interface NinoAsignado {
  id: string;
  alias: string;
  rango_etario: string;
  fecha_nacimiento: string | null;
  nivel_alfabetizacion: string;
  total_sesiones: number;
  ultima_sesion: string | null;
  mis_sesiones: number; // Sesiones que este voluntario ha hecho
}

interface UltimaSesion {
  id: string;
  nino_alias: string;
  fecha: string;
  duracion_minutos: number;
}

interface EstadisticasVoluntario {
  total_ninos: number;
  sesiones_este_mes: number;
  horas_este_mes: number;
  ultima_sesion: UltimaSesion | null;
}

interface VoluntarioDashboardProps {
  userId: string;
}

export default function VoluntarioDashboard({ userId }: VoluntarioDashboardProps) {
  const router = useRouter();
  const [ninos, setNinos] = useState<NinoAsignado[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasVoluntario>({
    total_ninos: 0,
    sesiones_este_mes: 0,
    horas_este_mes: 0,
    ultima_sesion: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatos();
  }, [userId]);

  const fetchDatos = async () => {
    try {
      setLoading(true);

      // Obtener niños asignados a este voluntario (que tienen al menos una sesión con él)
      const { data: sesionesData, error: sesionesError } = await supabase
        .from('sesiones')
        .select('nino_id, ninos!inner(id, alias, rango_etario, fecha_nacimiento, nivel_alfabetizacion)')
        .eq('voluntario_id', userId);

      if (sesionesError) throw sesionesError;

      // Agrupar por niño y contar sesiones
      const ninosMap = new Map<string, any>();
      sesionesData?.forEach((sesion: any) => {
        const nino = sesion.ninos;
        if (!ninosMap.has(nino.id)) {
          ninosMap.set(nino.id, {
            ...nino,
            mis_sesiones: 0
          });
        }
        ninosMap.get(nino.id).mis_sesiones++;
      });

      // Obtener total de sesiones y última sesión por niño
      const ninosArray = Array.from(ninosMap.values());
      const ninosConDetalles = await Promise.all(
        ninosArray.map(async (nino) => {
          // Total de sesiones del niño
          const { count: totalSesiones } = await supabase
            .from('sesiones')
            .select('*', { count: 'exact', head: true })
            .eq('nino_id', nino.id);

          // Última sesión del niño
          const { data: ultimaSesion } = await supabase
            .from('sesiones')
            .select('fecha')
            .eq('nino_id', nino.id)
            .order('fecha', { ascending: false })
            .limit(1)
            .single();

          return {
            ...nino,
            total_sesiones: totalSesiones || 0,
            ultima_sesion: ultimaSesion?.fecha || null
          };
        })
      );

      setNinos(ninosConDetalles);

      // Calcular estadísticas del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: sesionesMes, error: sesionesError2 } = await supabase
        .from('sesiones')
        .select('id, duracion_minutos, fecha, ninos!inner(alias)')
        .eq('voluntario_id', userId)
        .gte('fecha', inicioMes.toISOString())
        .order('fecha', { ascending: false });

      if (sesionesError2) throw sesionesError2;

      const horasTotales = (sesionesMes || []).reduce(
        (acc: number, s: any) => acc + (s.duracion_minutos || 0),
        0
      );

      setEstadisticas({
        total_ninos: ninosConDetalles.length,
        sesiones_este_mes: sesionesMes?.length || 0,
        horas_este_mes: Math.round(horasTotales / 60 * 10) / 10,
        ultima_sesion: sesionesMes?.[0]
          ? {
              id: sesionesMes[0].id,
              nino_alias: sesionesMes[0].ninos.alias,
              fecha: sesionesMes[0].fecha,
              duracion_minutos: sesionesMes[0].duracion_minutos || 0
            }
          : null
      });
    } catch (error) {
      console.error('Error fetching datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'Nunca';
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 7) return `Hace ${diff} días`;
    if (diff < 30) return `Hace ${Math.floor(diff / 7)} semanas`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crecimiento-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Estadísticas Rápidas - Mobile First */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="bg-gradient-to-br from-crecimiento-500 to-crecimiento-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">Niños Asignados</p>
          <p className="text-3xl sm:text-4xl font-bold">{estadisticas.total_ninos}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">Sesiones (Mes)</p>
          <p className="text-3xl sm:text-4xl font-bold">{estadisticas.sesiones_este_mes}</p>
        </div>

        <div className="bg-gradient-to-br from-impulso-400 to-impulso-500 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">Horas (Mes)</p>
          <p className="text-3xl sm:text-4xl font-bold">{estadisticas.horas_este_mes}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">Última Sesión</p>
          <p className="text-sm sm:text-base font-semibold">
            {estadisticas.ultima_sesion
              ? formatearFecha(estadisticas.ultima_sesion.fecha)
              : 'Ninguna'}
          </p>
        </div>
      </div>

      {/* Lista de Niños Asignados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Mis Niños Asignados
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Toca en un niño para ver su perfil o registrar una sesión
          </p>
        </div>

        {ninos.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Aún no tenés niños asignados
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Cuando empieces a registrar sesiones, aparecerán acá
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {ninos.map((nino) => (
              <div
                key={nino.id}
                className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Nombre y edad */}
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {nino.alias}
                    </h3>
                    
                    {/* Info secundaria */}
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sol-100 dark:bg-sol-900 text-sol-700 dark:text-sol-200 font-medium">
                        {formatearEdad(nino.fecha_nacimiento, nino.rango_etario)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {nino.nivel_alfabetizacion || 'Sin nivel'}
                      </span>
                    </div>

                    {/* Estadísticas del niño */}
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {nino.mis_sesiones}
                        </span>
                        sesiones tuyas
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {nino.total_sesiones}
                        </span>
                        en total
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span>
                        Última: {formatearFecha(nino.ultima_sesion)}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción - Mobile optimized */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/sesiones/nueva/${nino.id}`)}
                      className="px-4 py-2.5 bg-crecimiento-500 hover:bg-crecimiento-600 active:bg-crecimiento-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all touch-manipulation min-w-[120px] text-sm sm:text-base"
                      style={{ minHeight: '44px' }} // iOS touch target
                    >
                      📝 Nueva Sesión
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/ninos/${nino.id}`)}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all touch-manipulation min-w-[120px] text-sm sm:text-base"
                      style={{ minHeight: '44px' }} // iOS touch target
                    >
                      👁️ Ver Perfil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acceso rápido a todas las sesiones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/dashboard/sesiones')}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            📋 Ver Mis Sesiones
          </button>
          <button
            onClick={() => router.push('/dashboard/ninos')}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            👦 Ver Todos los Niños
          </button>
          <button
            onClick={() => router.push('/dashboard/metricas')}
            className="px-4 py-3 bg-gradient-to-r from-impulso-400 to-impulso-500 hover:from-impulso-500 hover:to-impulso-600 text-white rounded-lg font-medium transition-all touch-manipulation text-sm sm:text-base shadow-md"
            style={{ minHeight: '44px' }}
          >
            📊 Mis Métricas
          </button>
        </div>
      </div>
    </div>
  );
}
