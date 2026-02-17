'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { formatearEdad } from '@/lib/utils/date-helpers';

interface NinoAsignado {
  id: string;
  alias: string;
  rango_etario: string;
  fecha_nacimiento: string | null;
  nivel_alfabetizacion: string;
  total_sesiones: number;
  ultima_sesion: string | null;
  mis_sesiones: number;
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

  const [activeSession, setActiveSession] = useState<{ ninoId: string; alias: string; minutes: number } | null>(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['voluntario-dashboard', userId],
    queryFn: async () => {
      // 1. Traer niños asignados al voluntario desde la tabla asignaciones
      //    (esto incluye niños SIN sesiones)
      const { data: asignaciones, error: asignError } = await supabase
        .from('asignaciones')
        .select('nino_id, ninos (id, alias, rango_etario, fecha_nacimiento, nivel_alfabetizacion)')
        .eq('voluntario_id', userId)
        .eq('activa', true);

      if (asignError) throw asignError;

      // Mapa de niños asignados
      const ninosMap = new Map<string, any>();
      (asignaciones || []).forEach((a: any) => {
        if (a.ninos && !ninosMap.has(a.ninos.id)) {
          ninosMap.set(a.ninos.id, {
            ...a.ninos,
            mis_sesiones: 0,
            total_sesiones: 0,
            ultima_sesion: null,
          });
        }
      });

      // 2. Traer TODAS las sesiones del voluntario
      const { data: misSesiones, error: sesionesError } = await supabase
        .from('sesiones')
        .select('id, nino_id, fecha, duracion_minutos, ninos!inner(id, alias, rango_etario, fecha_nacimiento, nivel_alfabetizacion)')
        .eq('voluntario_id', userId)
        .order('fecha', { ascending: false });

      if (sesionesError) throw sesionesError;

      // 3. Merge session data into niños map
      (misSesiones || []).forEach((sesion: any) => {
        const nino = sesion.ninos;
        if (!ninosMap.has(nino.id)) {
          // Niño with sessions but no active assignment (edge case) — still show
          ninosMap.set(nino.id, {
            ...nino,
            mis_sesiones: 0,
            total_sesiones: 0,
            ultima_sesion: null,
          });
        }
        const entry = ninosMap.get(nino.id);
        entry.mis_sesiones++;
        if (!entry.ultima_sesion) {
          entry.ultima_sesion = sesion.fecha; // already DESC order
        }
      });

      // 4. Get total session counts (all volunteers) for relevant niños
      const ninoIds = Array.from(ninosMap.keys());
      let totalSesionesPorNino: Record<string, number> = {};
      
      if (ninoIds.length > 0) {
        const { data: todasSesiones } = await supabase
          .from('sesiones')
          .select('nino_id')
          .in('nino_id', ninoIds);

        (todasSesiones || []).forEach((s: any) => {
          totalSesionesPorNino[s.nino_id] = (totalSesionesPorNino[s.nino_id] || 0) + 1;
        });
      }

      const ninosArray: NinoAsignado[] = Array.from(ninosMap.values()).map((nino) => ({
        ...nino,
        total_sesiones: totalSesionesPorNino[nino.id] || nino.total_sesiones,
      }));

      // 5. Estadísticas del mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const sesionesMes = (misSesiones || []).filter(
        (s: any) => new Date(s.fecha) >= inicioMes
      );

      const horasTotales = sesionesMes.reduce(
        (acc: number, s: any) => acc + (s.duracion_minutos || 0),
        0
      );

      const estadisticas: EstadisticasVoluntario = {
        total_ninos: ninosArray.length,
        sesiones_este_mes: sesionesMes.length,
        horas_este_mes: Math.round(horasTotales / 60 * 10) / 10,
        ultima_sesion: misSesiones?.[0]
          ? {
              id: misSesiones[0].id,
              nino_alias: (misSesiones[0] as any).ninos.alias,
              fecha: misSesiones[0].fecha,
              duracion_minutos: misSesiones[0].duracion_minutos || 0
            }
          : null
      };

      return { ninos: ninosArray, estadisticas };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const ninos = data?.ninos || [];
  const estadisticas = data?.estadisticas || {
    total_ninos: 0,
    sesiones_este_mes: 0,
    horas_este_mes: 0,
    ultima_sesion: null
  };

  // Check for active session timer (runs after data is available)
  useEffect(() => {
    const checkActiveSession = () => {
      const activeNinoId = localStorage.getItem('sesion_timer_active');
      if (!activeNinoId) {
        setActiveSession(null);
        return;
      }
      const start = localStorage.getItem(`sesion_timer_${activeNinoId}_start`);
      if (!start) {
        setActiveSession(null);
        return;
      }
      const paused = parseInt(localStorage.getItem(`sesion_timer_${activeNinoId}_paused`) || '0', 10);
      const pauseAt = localStorage.getItem(`sesion_timer_${activeNinoId}_pauseAt`);
      let totalPaused = paused;
      if (pauseAt) totalPaused += Date.now() - parseInt(pauseAt, 10);
      const elapsed = Math.max(0, Date.now() - parseInt(start, 10) - totalPaused);
      const minutes = Math.round(elapsed / 60000);

      const ninoData = ninos.find((n) => n.id === activeNinoId);
      setActiveSession({
        ninoId: activeNinoId,
        alias: ninoData?.alias || 'Niño',
        minutes,
      });
    };

    checkActiveSession();
    const interval = setInterval(checkActiveSession, 30000);
    return () => clearInterval(interval);
  }, [ninos]);

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
      {/* 🔴 Active Session Banner */}
      {activeSession && (
        <button
          onClick={() => router.push(`/dashboard/sesiones/nueva/${activeSession.ninoId}`)}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] animate-pulse-slow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div className="text-left">
                <p className="font-bold text-sm sm:text-base">Sesión en curso con {activeSession.alias}</p>
                <p className="text-xs sm:text-sm opacity-90">
                  {activeSession.minutes} min transcurridos — Tocá para volver
                </p>
              </div>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </button>
      )}

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => router.push('/dashboard/sesiones')}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            📋 Mis Sesiones
          </button>
          <button
            onClick={() => router.push('/dashboard/asistencia')}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            ✅ Asistencia
          </button>
          <button
            onClick={() => router.push('/dashboard/ninos')}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            👦 Ver Niños
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
