'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ArrowLeft, Plus, BookOpen, ClipboardList, Target, Info, ChevronRight, UserCheck } from 'lucide-react';
import type { Nino, NinoSensible, Zona, Escuela, Perfil } from '@/types/database';

interface NinoCompleto extends Nino {
  zonas: Pick<Zona, 'id' | 'nombre'> | null;
  escuelas: Pick<Escuela, 'id' | 'nombre'> | null;
  ninos_sensibles: NinoSensible | null;
}

interface Sesion {
  id: string;
  fecha: string;
  duracion_minutos: number;
  observaciones_libres: string;
  voluntario_id: string;
}

interface AsignacionActiva {
  id: string;
  fecha_asignacion: string;
  score_matching: number | null;
  voluntario: Pick<Perfil, 'id' | 'nombre' | 'apellido'> | null;
}

export default function NinoPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const { user, perfil } = useAuth();
  const ninoId = params.ninoId as string;

  const [nino, setNino] = useState<NinoCompleto | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [asignacionActiva, setAsignacionActiva] = useState<AsignacionActiva | null>(null);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    total_sesiones: 0,
    mis_sesiones: 0,
    horas_totales: 0,
    primera_sesion: null as string | null,
    ultima_sesion: null as string | null
  });

  const isVoluntario = perfil?.rol === 'voluntario';
  const tieneAccesoCompleto = perfil?.rol && ['psicopedagogia', 'director', 'admin'].includes(perfil.rol);

  useEffect(() => {
    if (user) fetchDatos();
  }, [ninoId, user]);

  const fetchDatos = async () => {
    try {
      setLoading(true);

      // Obtener datos del niño con relaciones
      const selectFields = tieneAccesoCompleto
        ? `*, zonas(id, nombre), escuelas(id, nombre), ninos_sensibles(*)`
        : `*, zonas(id, nombre), escuelas(id, nombre)`;

      const { data: ninoData, error: ninoError } = await supabase
        .from('ninos')
        .select(selectFields)
        .eq('id', ninoId)
        .single();

      if (ninoError) throw ninoError;
      setNino(ninoData as NinoCompleto);

      // Obtener asignación activa directamente de la tabla asignaciones
      const { data: asignacionData } = await supabase
        .from('asignaciones')
        .select(`
          id,
          fecha_asignacion,
          score_matching,
          perfiles!asignaciones_voluntario_id_fkey (
            id,
            nombre,
            apellido
          )
        `)
        .eq('nino_id', ninoId)
        .eq('activa', true)
        .limit(1)
        .single();

      if (asignacionData) {
        setAsignacionActiva({
          id: asignacionData.id,
          fecha_asignacion: asignacionData.fecha_asignacion,
          score_matching: asignacionData.score_matching,
          voluntario: (asignacionData as any).perfiles || null
        });
      } else {
        setAsignacionActiva(null);
      }

      // Obtener sesiones
      let sesionesQuery = supabase
        .from('sesiones')
        .select('id, fecha, duracion_minutos, observaciones_libres, voluntario_id')
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crecimiento-500 mx-auto mb-4"></div>
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
            className="text-crecimiento-600 hover:text-crecimiento-700 font-medium mb-3 flex items-center gap-2 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {nino.alias}
              </h1>
              {nino.legajo && (
                <p className="text-sm text-gray-500 font-mono mb-2">Legajo: {nino.legajo}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {nino.rango_etario && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-sol-100 text-sol-700 font-medium">
                    {nino.rango_etario} años
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {nino.nivel_alfabetizacion || 'Sin nivel'}
                </span>
                {nino.escolarizado && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    <BookOpen className="w-4 h-4" />
                    Escolarizado
                    {nino.grado_escolar && ` (${nino.grado_escolar})`}
                  </span>
                )}
                {nino.zonas && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                    {nino.zonas.nombre}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {/* Botón asignar voluntario (solo para coordinador, psico, director) */}
              {!isVoluntario && (
                <button
                  onClick={() => router.push(`/dashboard/ninos/${ninoId}/asignar-voluntario`)}
                  className="px-4 py-2.5 bg-gradient-to-r from-impulso-400 to-crecimiento-500 hover:from-impulso-500 hover:to-crecimiento-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all touch-manipulation min-h-[44px] flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Asignar Voluntario
                </button>
              )}
              
              <button
                onClick={() => router.push(`/dashboard/sesiones/nueva/${ninoId}`)}
                className="px-4 py-2.5 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all touch-manipulation min-h-[44px] flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nueva Sesión
              </button>
            </div>
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
              <p className="text-3xl font-bold text-crecimiento-600">{estadisticas.mis_sesiones}</p>
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

        {/* Datos sensibles - solo para roles con acceso */}
        {tieneAccesoCompleto && nino.ninos_sensibles && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
              🔒 Datos Sensibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-0.5">Nombre completo</p>
                <p className="font-medium text-gray-900">{nino.ninos_sensibles.nombre_completo_encrypted}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Apellido</p>
                <p className="font-medium text-gray-900">{nino.ninos_sensibles.apellido_encrypted}</p>
              </div>
              {nino.ninos_sensibles.dni_encrypted && (
                <div>
                  <p className="text-gray-500 mb-0.5">DNI</p>
                  <p className="font-medium text-gray-900">{nino.ninos_sensibles.dni_encrypted}</p>
                </div>
              )}
              {nino.ninos_sensibles.direccion && (
                <div>
                  <p className="text-gray-500 mb-0.5">Dirección</p>
                  <p className="font-medium text-gray-900">{nino.ninos_sensibles.direccion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información del niño */}
        {!isVoluntario && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Información del Niño
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {nino.genero && (
                <div>
                  <p className="text-gray-500 mb-0.5">Género</p>
                  <p className="font-medium text-gray-900 capitalize">{nino.genero.replace('_', ' ')}</p>
                </div>
              )}
              {nino.escuelas && (
                <div>
                  <p className="text-gray-500 mb-0.5">Escuela</p>
                  <p className="font-medium text-gray-900">{nino.escuelas.nombre}</p>
                </div>
              )}
              {nino.turno_escolar && (
                <div>
                  <p className="text-gray-500 mb-0.5">Turno escolar</p>
                  <p className="font-medium text-gray-900 capitalize">{nino.turno_escolar}</p>
                </div>
              )}
              {nino.fecha_ingreso && (
                <div>
                  <p className="text-gray-500 mb-0.5">Fecha de ingreso</p>
                  <p className="font-medium text-gray-900">{formatearFecha(nino.fecha_ingreso)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voluntario Asignado (solo para no-voluntarios) */}
        {!isVoluntario && (
          <div className="bg-gradient-to-br from-crecimiento-50 to-sol-50 border border-crecimiento-200 rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-xl font-bold text-crecimiento-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              Voluntario Asignado
            </h2>
            
            {asignacionActiva ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crecimiento-500 to-sol-400 flex items-center justify-center text-white font-bold text-lg">
                    {asignacionActiva.voluntario?.nombre?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {asignacionActiva.voluntario
                        ? `${asignacionActiva.voluntario.nombre} ${asignacionActiva.voluntario.apellido}`
                        : 'Sin nombre'}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>
                        Asignado: {formatearFecha(asignacionActiva.fecha_asignacion)}
                      </span>
                      {asignacionActiva.score_matching != null && asignacionActiva.score_matching > 0 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Score: {asignacionActiva.score_matching}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => router.push(`/dashboard/ninos/${ninoId}/asignar-voluntario`)}
                  className="px-4 py-2 text-sm bg-white border border-crecimiento-300 text-crecimiento-700 rounded-lg hover:bg-crecimiento-50 transition-colors font-medium"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Sin voluntario asignado</p>
                </div>
                
                <button
                  onClick={() => router.push(`/dashboard/ninos/${ninoId}/asignar-voluntario`)}
                  className="px-4 py-2 text-sm bg-crecimiento-500 text-white rounded-lg hover:bg-crecimiento-600 transition-colors font-medium"
                >
                  Asignar Voluntario
                </button>
              </div>
            )}
          </div>
        )}

        {/* Historial de Sesiones */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              {isVoluntario ? 'Mis Sesiones Registradas' : 'Historial de Sesiones'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isVoluntario
                ? 'Tus sesiones con este niño'
                : 'Todas las sesiones registradas para este niño'}
            </p>
          </div>

          {sesiones.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-2">
                {isVoluntario
                  ? 'Aún no registraste ninguna sesión con este niño'
                  : 'No hay sesiones registradas todavía'}
              </p>
              <button
                onClick={() => router.push(`/dashboard/sesiones/nueva/${ninoId}`)}
                className="mt-4 px-6 py-2.5 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-lg font-semibold shadow-md transition-all touch-manipulation min-h-[44px]"
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
                    <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
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
          <div className="bg-sol-50 border border-sol-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-6 h-6 text-sol-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-sol-900 font-medium mb-1">
                  Vista de Voluntario
                </p>
                <p className="text-sm text-sol-700">
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
