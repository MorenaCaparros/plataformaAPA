'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Nino {
  id: string;
  alias: string;
  rango_etario: string;
  nivel_alfabetizacion: string;
  escolarizado: boolean;
  metadata: any;
}

interface Sesion {
  id: string;
  fecha: string;
  duracion_minutos: number;
  observaciones_libres: string;
  voluntario_id: string;
  items: any;
}

export default function NinoPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const { user, perfil } = useAuth();
  const ninoId = params.ninoId as string;

  const [nino, setNino] = useState<Nino | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    total_sesiones: 0,
    mis_sesiones: 0,
    horas_totales: 0,
    primera_sesion: null as string | null,
    ultima_sesion: null as string | null
  });

  const isVoluntario = perfil?.rol === 'voluntario';

  useEffect(() => {
    fetchDatos();
  }, [ninoId, user]);

  const fetchDatos = async () => {
    try {
      setLoading(true);

      // Obtener datos del niño
      const { data: ninoData, error: ninoError } = await supabase
        .from('ninos')
        .select('*')
        .eq('id', ninoId)
        .single();

      if (ninoError) throw ninoError;
      setNino(ninoData);

      // Obtener sesiones
      let sesionesQuery = supabase
        .from('sesiones')
        .select('*')
        .eq('nino_id', ninoId)
        .order('fecha', { ascending: false });

      // Si es voluntario, solo ve sus propias sesiones
      if (isVoluntario) {
        sesionesQuery = sesionesQuery.eq('voluntario_id', user?.id);
      }

      const { data: sesionesData, error: sesionesError } = await sesionesQuery;

      if (sesionesError) throw sesionesError;
      setSesiones(sesionesData || []);

      // Calcular estadísticas
      const { count: totalSesiones } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .eq('nino_id', ninoId);

      const { count: misSesiones } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .eq('nino_id', ninoId)
        .eq('voluntario_id', user?.id);

      const horasTotales = (sesionesData || []).reduce(
        (acc: number, s: any) => acc + (s.duracion_minutos || 0),
        0
      );

      const fechaOrdenada = [...(sesionesData || [])].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

      setEstadisticas({
        total_sesiones: totalSesiones || 0,
        mis_sesiones: misSesiones || 0,
        horas_totales: Math.round(horasTotales / 60 * 10) / 10,
        primera_sesion: fechaOrdenada[0]?.fecha || null,
        ultima_sesion: fechaOrdenada[fechaOrdenada.length - 1]?.fecha || null
      });
    } catch (error) {
      console.error('Error fetching datos:', error);
      alert('Error al cargar los datos del niño');
      router.push('/dashboard/ninos');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearFechaRelativa = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 7) return `Hace ${diff} días`;
    if (diff < 30) return `Hace ${Math.floor(diff / 7)} semanas`;
    return formatearFecha(fecha);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!nino) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium mb-3 flex items-center gap-1 touch-manipulation min-h-[44px]"
          >
            ← Volver
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {nino.alias}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                  {nino.rango_etario} años
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {nino.nivel_alfabetizacion || 'Sin nivel'}
                </span>
                {nino.escolarizado && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    📚 Escolarizado
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => router.push(`/dashboard/sesiones/nueva/${ninoId}`)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all touch-manipulation min-h-[44px]"
            >
              📝 Nueva Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-xs text-gray-500 mb-1">Total Sesiones</p>
            <p className="text-3xl font-bold text-gray-900">{estadisticas.total_sesiones}</p>
          </div>

          {isVoluntario && (
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-xs text-gray-500 mb-1">Mis Sesiones</p>
              <p className="text-3xl font-bold text-blue-600">{estadisticas.mis_sesiones}</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-xs text-gray-500 mb-1">Horas Totales</p>
            <p className="text-3xl font-bold text-gray-900">{estadisticas.horas_totales}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-xs text-gray-500 mb-1">Última Sesión</p>
            <p className="text-sm font-bold text-gray-900">
              {estadisticas.ultima_sesion
                ? formatearFechaRelativa(estadisticas.ultima_sesion)
                : 'Ninguna'}
            </p>
          </div>
        </div>

        {/* Información Adicional (solo para no-voluntarios) */}
        {!isVoluntario && nino.metadata && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Información del Niño</h2>
            <div className="space-y-3 text-sm">
              {nino.metadata.dificultades && (
                <div>
                  <p className="text-gray-500 mb-1">Dificultades Identificadas:</p>
                  <p className="text-gray-900 font-medium">{nino.metadata.dificultades}</p>
                </div>
              )}
              {nino.metadata.observaciones && (
                <div>
                  <p className="text-gray-500 mb-1">Observaciones:</p>
                  <p className="text-gray-900">{nino.metadata.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Objetivos (visible para todos) */}
        {nino.metadata?.objetivos && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4">🎯 Objetivos Asignados</h2>
            <div className="space-y-3">
              {Array.isArray(nino.metadata.objetivos) ? (
                nino.metadata.objetivos.map((objetivo: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold">•</span>
                    <p className="text-purple-900 flex-1">{objetivo}</p>
                  </div>
                ))
              ) : (
                <p className="text-purple-900">{nino.metadata.objetivos}</p>
              )}
            </div>
          </div>
        )}

        {/* Historial de Sesiones */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">
              {isVoluntario ? '📝 Mis Sesiones Registradas' : '📝 Historial de Sesiones'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isVoluntario
                ? 'Tus sesiones con este niño'
                : 'Todas las sesiones registradas para este niño'}
            </p>
          </div>

          {sesiones.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-3">📚</div>
              <p className="text-gray-600 mb-2">
                {isVoluntario
                  ? 'Aún no registraste ninguna sesión con este niño'
                  : 'No hay sesiones registradas todavía'}
              </p>
              <button
                onClick={() => router.push(`/dashboard/sesiones/nueva/${ninoId}`)}
                className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-all touch-manipulation min-h-[44px]"
              >
                Registrar Primera Sesión
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sesiones.map((sesion) => (
                <div
                  key={sesion.id}
                  className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/sesiones/${sesion.id}`)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-1">
                        {formatearFecha(sesion.fecha)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duración: {sesion.duracion_minutos} minutos
                      </p>
                    </div>
                    <span className="text-2xl">→</span>
                  </div>
                  
                  {sesion.observaciones_libres && (
                    <p className="text-sm text-gray-700 line-clamp-2 mt-2">
                      {sesion.observaciones_libres}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mensaje informativo para voluntarios */}
        {isVoluntario && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Vista de Voluntario
                </p>
                <p className="text-sm text-blue-700">
                  Solo ves tus propias sesiones con este niño. Los coordinadores y psicopedagogos pueden ver todas las sesiones.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
