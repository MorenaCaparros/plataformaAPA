'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { formatearEdad } from '@/lib/utils/date-helpers';
import Link from 'next/link';

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

interface TrainingStatus {
  necesitaCapacitacion: boolean;
  areasPendientes: string[];
  autoevaluacionesPendientes: number;
  haCompletadoAlgunaAutoeval: boolean;
  autoevalPuntaje: number | null; // 0..10 score from autoevaluación
  autoevalPorcentaje: number | null; // 0..100
  scoresPorArea: { area: string; score_final: number; necesita_capacitacion: boolean }[];
}

const AREA_LABELS: Record<string, string> = {
  lenguaje: 'Lenguaje y Vocabulario',
  lenguaje_vocabulario: 'Lenguaje y Vocabulario',
  grafismo: 'Grafismo y Motricidad Fina',
  grafismo_motricidad: 'Grafismo y Motricidad Fina',
  lectura_escritura: 'Lectura y Escritura',
  nociones_matematicas: 'Nociones Matemáticas',
  matematicas: 'Nociones Matemáticas',
};

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

  // Training status query
  const { data: trainingStatus } = useQuery<TrainingStatus>({
    queryKey: ['voluntario-training-status', userId],
    queryFn: async () => {
      // 1. Check scores per area for necesita_capacitacion
      const { data: scores } = await supabase
        .from('scores_voluntarios_por_area')
        .select('area, necesita_capacitacion, score_final')
        .eq('voluntario_id', userId);

      const areasPendientes = (scores || [])
        .filter((s: any) => s.necesita_capacitacion)
        .map((s: any) => s.area);

      // 2. Check how many autoevaluaciones exist that volunteer hasn't completed
      const { data: autoevals } = await supabase
        .from('capacitaciones')
        .select('id')
        .eq('tipo', 'autoevaluacion')
        .eq('activa', true);

      const { data: completadas } = await supabase
        .from('voluntarios_capacitaciones')
        .select('capacitacion_id, estado')
        .eq('voluntario_id', userId)
        .in('estado', ['completada', 'aprobada', 'reprobada']);

      const completadasIds = new Set((completadas || []).map((c: any) => c.capacitacion_id));
      const pendientes = (autoevals || []).filter((a: any) => !completadasIds.has(a.id));

      const haCompletadoAlgunaAutoeval = (completadas || []).length > 0;

      // 3. Get autoevaluación puntaje (most recent completed)
      const { data: volCaps } = await supabase
        .from('voluntarios_capacitaciones')
        .select('puntaje_final, puntaje_maximo, porcentaje, capacitacion_id')
        .eq('voluntario_id', userId)
        .in('estado', ['completada', 'aprobada', 'reprobada'])
        .order('fecha_completado', { ascending: false })
        .limit(1);

      const autoevalResult = volCaps?.[0] || null;

      // 4. Build per-area score map
      const scoresPorArea = (scores || []).map((s: any) => ({
        area: s.area as string,
        score_final: s.score_final as number,
        necesita_capacitacion: s.necesita_capacitacion as boolean,
      }));

      return {
        necesitaCapacitacion: areasPendientes.length > 0,
        areasPendientes,
        autoevaluacionesPendientes: pendientes.length,
        haCompletadoAlgunaAutoeval,
        autoevalPuntaje: autoevalResult ? autoevalResult.puntaje_final : null,
        autoevalPorcentaje: autoevalResult ? autoevalResult.porcentaje : null,
        scoresPorArea,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const ninos = data?.ninos || [];
  const estadisticas = data?.estadisticas || {
    total_ninos: 0,
    sesiones_este_mes: 0,
    horas_este_mes: 0,
    ultima_sesion: null
  };

  // Volunteer is blocked from operations if they need capacitación
  const operacionBloqueada = !!(trainingStatus?.necesitaCapacitacion && trainingStatus.haCompletadoAlgunaAutoeval);

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

      {/* 🟡 Training Gate — Autoevaluaciones pendientes */}
      {(trainingStatus?.autoevaluacionesPendientes ?? 0) > 0 && (
        <Link
          href="/dashboard/autoevaluaciones"
          className="block w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📋</span>
            <div className="flex-1">
              <p className="font-bold text-amber-900 text-sm sm:text-base">
                {trainingStatus!.autoevaluacionesPendientes === 1
                  ? 'Tenés 1 autoevaluación pendiente'
                  : `Tenés ${trainingStatus!.autoevaluacionesPendientes} autoevaluaciones pendientes`}
              </p>
              <p className="text-xs sm:text-sm text-amber-700 mt-0.5">
                Completá tus autoevaluaciones para que podamos asignarte niños según tus fortalezas.
              </p>
            </div>
            <span className="text-amber-600 text-lg flex-shrink-0">→</span>
          </div>
        </Link>
      )}

      {/* 🔴 Training Gate — Necesita capacitación (score no perfecto) */}
      {trainingStatus?.necesitaCapacitacion && trainingStatus.haCompletadoAlgunaAutoeval && (
        <div className="w-full bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-2 border-red-300 rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
          {/* Decorative blocked icon */}
          <div className="absolute -right-4 -top-4 opacity-[0.06] pointer-events-none">
            <span className="text-[120px]">🚫</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 border border-red-200">
              <span className="text-2xl">⛔</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900 text-base sm:text-lg">
                Operación bloqueada — Capacitación requerida
              </p>
              <p className="text-sm text-red-700 mt-1 leading-relaxed">
                Tu puntaje en las siguientes áreas no fue perfecto en la autoevaluación. 
                No podés registrar sesiones ni operar con niños hasta completar las capacitaciones correspondientes.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {trainingStatus.areasPendientes.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-800 border border-red-300/60"
                  >
                    ⚠️ {AREA_LABELS[area] || area}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/capacitaciones"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-md hover:shadow-lg"
                >
                  📚 Completar Capacitaciones
                </Link>
                <Link
                  href="/dashboard/autoevaluaciones"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold text-sm transition-all active:scale-95"
                >
                  📋 Ver Autoevaluaciones
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Puntaje Autoevaluación + Capacitaciones por Área */}
      {trainingStatus?.haCompletadoAlgunaAutoeval && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Mi Progreso
            </h2>
          </div>
          <div className="p-4 sm:p-6 space-y-5">
            {/* Autoevaluación score — 5 stars */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-sol-50 to-amber-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-4 border border-sol-200/40">
              <div className="text-center sm:text-left flex-1">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Autoevaluación</p>
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const puntaje = trainingStatus.autoevalPuntaje ?? 0;
                    // Map 0-10 score to 0-5 stars
                    const starsEarned = puntaje / 2;
                    const filled = star <= Math.round(starsEarned);
                    return (
                      <span
                        key={star}
                        className={`text-2xl sm:text-3xl ${filled ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {trainingStatus.autoevalPuntaje != null
                    ? `${trainingStatus.autoevalPuntaje}/10 puntos (${trainingStatus.autoevalPorcentaje ?? 0}%)`
                    : 'Sin puntaje aún'}
                </p>
              </div>
            </div>

            {/* Capacitaciones por Área — 4 áreas con estrellas y colores */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Capacitaciones por Área</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['lenguaje', 'grafismo', 'lectura_escritura', 'nociones_matematicas'] as const).map((areaKey) => {
                  const areaScore = trainingStatus.scoresPorArea.find(
                    (s) => s.area === areaKey || s.area === areaKey.replace('nociones_matematicas', 'matematicas')
                  );
                  const score = areaScore?.score_final ?? 0;
                  const necesita = areaScore?.necesita_capacitacion ?? (trainingStatus.autoevalPorcentaje != null && trainingStatus.autoevalPorcentaje < 100);
                  // Map 0-10 score to 0-5 stars
                  const starsEarned = score / 2;

                  const areaColorMap: Record<string, { bg: string; border: string; text: string }> = {
                    lenguaje: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200/50', text: 'text-blue-700 dark:text-blue-300' },
                    grafismo: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200/50', text: 'text-green-700 dark:text-green-300' },
                    lectura_escritura: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200/50', text: 'text-purple-700 dark:text-purple-300' },
                    nociones_matematicas: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200/50', text: 'text-orange-700 dark:text-orange-300' },
                  };
                  const colors = areaColorMap[areaKey] || areaColorMap.lenguaje;

                  // Star color based on status
                  const starColor = necesita ? 'text-gray-300 dark:text-gray-600' : 'text-amber-400';
                  const starFilledColor = score > 0 ? (necesita ? 'text-red-400' : 'text-amber-400') : 'text-gray-300 dark:text-gray-600';

                  return (
                    <div key={areaKey} className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                      <p className={`text-xs font-semibold ${colors.text} mb-1.5 truncate`}>
                        {AREA_LABELS[areaKey] || areaKey}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const filled = star <= Math.round(starsEarned);
                          return (
                            <span
                              key={star}
                              className={`text-lg ${filled ? starFilledColor : 'text-gray-300 dark:text-gray-600'}`}
                            >
                              ★
                            </span>
                          );
                        })}
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {score > 0 ? `${score}/10` : '—'}
                        </span>
                      </div>
                      {necesita && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">
                          Capacitación pendiente
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
                      onClick={() => !operacionBloqueada && router.push(`/dashboard/sesiones/nueva/${nino.id}`)}
                      disabled={operacionBloqueada}
                      className={`px-4 py-2.5 rounded-lg font-medium shadow-md transition-all touch-manipulation min-w-[120px] text-sm sm:text-base ${
                        operacionBloqueada
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                          : 'bg-crecimiento-500 hover:bg-crecimiento-600 active:bg-crecimiento-700 text-white hover:shadow-lg'
                      }`}
                      style={{ minHeight: '44px' }} // iOS touch target
                      title={operacionBloqueada ? 'Debés completar las capacitaciones pendientes antes de registrar sesiones' : ''}
                    >
                      {operacionBloqueada ? '🔒 Bloqueado' : '📝 Nueva Sesión'}
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
            onClick={() => router.push('/dashboard/biblioteca')}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-all touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px' }}
          >
            📚 Biblioteca
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
