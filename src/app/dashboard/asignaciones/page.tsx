'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  MapPin,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Zona {
  id: string;
  nombre: string;
}

interface NinoConAsignacion {
  id: string;
  alias: string;
  rango_etario: string;
  zona_id: string | null;
  zona_nombre: string | null;
  asignacion: {
    id: string;
    voluntario_id: string;
    voluntario_nombre: string;
    fecha_asignacion: string;
    score_matching: number;
  } | null;
  tiene_deficits: boolean;
}

interface VoluntarioConCarga {
  id: string;
  nombre: string;
  zona_id: string | null;
  zona_nombre: string | null;
  asignaciones_activas: number;
  disponibilidad: 'alta' | 'media' | 'baja';
  tiene_autoevaluacion: boolean;
  ninos_asignados: {
    id: string;
    alias: string;
    score: number;
  }[];
}

interface EstadisticasGlobales {
  total_ninos: number;
  ninos_asignados: number;
  ninos_sin_asignar: number;
  total_voluntarios: number;
  voluntarios_disponibles: number;
  voluntarios_sobrecargados: number;
}

function AsignacionesPageContent() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const zonaParam = searchParams.get('zona');
  
  const [loading, setLoading] = useState(true);
  const [ninos, setNinos] = useState<NinoConAsignacion[]>([]);
  const [voluntarios, setVoluntarios] = useState<VoluntarioConCarga[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGlobales | null>(null);
  
  // Filtros
  const [filtroZona, setFiltroZona] = useState<string>(zonaParam || 'todas');
  const [filtroEstadoNino, setFiltroEstadoNino] = useState<'todos' | 'asignado' | 'sin_asignar'>('todos');
  const [filtroDisponibilidadVol, setFiltroDisponibilidadVol] = useState<'todos' | 'alta' | 'media' | 'baja'>('todos');
  const [busqueda, setBusqueda] = useState('');
  
  // Vista activa
  const [vistaActiva, setVistaActiva] = useState<'ninos' | 'voluntarios'>('ninos');

  // Verificar permisos
  const rolesPermitidos = ['director', 'coordinador', 'psicopedagogia'];
  const tieneAcceso = perfil?.rol && rolesPermitidos.includes(perfil.rol);

  useEffect(() => {
    if (!authLoading && user) {
      if (!tieneAcceso) {
        router.push('/dashboard');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, perfil, tieneAcceso]);

  useEffect(() => {
    if (zonaParam) {
      setFiltroZona(zonaParam);
    }
  }, [zonaParam]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      await Promise.all([
        fetchZonas(),
        fetchNinosConAsignaciones(session.access_token),
        fetchVoluntariosConCarga(session.access_token),
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZonas = async () => {
    const { data, error } = await supabase
      .from('zonas')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (!error && data) {
      setZonas(data);
    }
  };

  const fetchNinosConAsignaciones = async (token: string) => {
    try {
      // Obtener todos los niños
      const { data: ninosData, error: ninosError } = await supabase
        .from('ninos')
        .select(`
          id,
          alias,
          rango_etario,
          zona_id,
          metadata,
          zona:zonas(nombre)
        `)
        .order('alias', { ascending: true });

      if (ninosError) throw ninosError;

      // Obtener todas las asignaciones activas
      const response = await fetch('/api/asignaciones?activo=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al obtener asignaciones');
      
      const { asignaciones } = await response.json();

      // Combinar datos
      const ninosConAsignacion: NinoConAsignacion[] = (ninosData || []).map((nino: any) => {
        const asignacion = asignaciones?.find((a: any) => a.nino_id === nino.id);
        const metadata = nino.metadata as any;
        
        return {
          id: nino.id,
          alias: nino.alias,
          rango_etario: nino.rango_etario,
          zona_id: nino.zona_id,
          zona_nombre: nino.zona?.nombre || null,
          tiene_deficits: Array.isArray(metadata?.deficits) && metadata.deficits.length > 0,
          asignacion: asignacion ? {
            id: asignacion.id,
            voluntario_id: asignacion.voluntario_id,
            voluntario_nombre: asignacion.voluntario?.metadata?.nombre_completo || 'Voluntario',
            fecha_asignacion: asignacion.fecha_asignacion,
            score_matching: asignacion.score_matching,
          } : null,
        };
      });

      setNinos(ninosConAsignacion);

      // Calcular estadísticas
      const totalNinos = ninosConAsignacion.length;
      const ninosAsignados = ninosConAsignacion.filter(n => n.asignacion !== null).length;

      setEstadisticas(prev => ({
        ...prev!,
        total_ninos: totalNinos,
        ninos_asignados: ninosAsignados,
        ninos_sin_asignar: totalNinos - ninosAsignados,
      }));

    } catch (error) {
      console.error('Error fetching niños:', error);
    }
  };

  const fetchVoluntariosConCarga = async (token: string) => {
    try {
      // Obtener voluntarios con sus zonas
      const { data: voluntariosData, error: volError } = await supabase
        .from('perfiles')
        .select(`
          id,
          metadata,
          zona_id,
          zona:zonas(nombre)
        `)
        .eq('rol', 'voluntario');

      if (volError) throw volError;

      // Obtener asignaciones activas
      const response = await fetch('/api/asignaciones?activo=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al obtener asignaciones');
      
      const { asignaciones } = await response.json();

      // Obtener autoevaluaciones completadas
      const { data: autoevaluaciones } = await supabase
        .from('respuestas_autoevaluacion')
        .select('voluntario_id')
        .eq('estado', 'evaluada');

      const voluntariosConAutoeval = new Set(
        autoevaluaciones?.map((a: { voluntario_id: string }) => a.voluntario_id) || []
      );

      // Combinar datos
      const voluntariosConCarga: VoluntarioConCarga[] = (voluntariosData || []).map((vol: any) => {
        const asignacionesVol = asignaciones?.filter((a: any) => a.voluntario_id === vol.id) || [];
        const numAsignaciones = asignacionesVol.length;
        
        let disponibilidad: 'alta' | 'media' | 'baja' = 'alta';
        if (numAsignaciones >= 3) disponibilidad = 'baja';
        else if (numAsignaciones >= 2) disponibilidad = 'media';

        return {
          id: vol.id,
          nombre: vol.metadata?.nombre_completo || 'Sin nombre',
          zona_id: vol.zona_id,
          zona_nombre: vol.zona?.nombre || null,
          asignaciones_activas: numAsignaciones,
          disponibilidad,
          tiene_autoevaluacion: voluntariosConAutoeval.has(vol.id),
          ninos_asignados: asignacionesVol.map((a: any) => ({
            id: a.nino?.id,
            alias: a.nino?.alias || 'Sin alias',
            score: a.score_matching || 0,
          })),
        };
      });

      setVoluntarios(voluntariosConCarga);

      // Actualizar estadísticas de voluntarios
      const totalVol = voluntariosConCarga.length;
      const volDisponibles = voluntariosConCarga.filter(v => v.disponibilidad === 'alta').length;
      const volSobrecargados = voluntariosConCarga.filter(v => v.disponibilidad === 'baja').length;

      setEstadisticas(prev => ({
        total_ninos: prev?.total_ninos || 0,
        ninos_asignados: prev?.ninos_asignados || 0,
        ninos_sin_asignar: prev?.ninos_sin_asignar || 0,
        total_voluntarios: totalVol,
        voluntarios_disponibles: volDisponibles,
        voluntarios_sobrecargados: volSobrecargados,
      }));

    } catch (error) {
      console.error('Error fetching voluntarios:', error);
    }
  };

  // Filtrar niños
  const ninosFiltrados = ninos.filter(nino => {
    // Filtro por zona
    if (filtroZona !== 'todas' && nino.zona_id !== filtroZona) return false;
    
    // Filtro por estado de asignación
    if (filtroEstadoNino === 'asignado' && !nino.asignacion) return false;
    if (filtroEstadoNino === 'sin_asignar' && nino.asignacion) return false;
    
    // Filtro por búsqueda
    if (busqueda) {
      const search = busqueda.toLowerCase();
      return nino.alias.toLowerCase().includes(search);
    }
    
    return true;
  });

  // Filtrar voluntarios
  const voluntariosFiltrados = voluntarios.filter(vol => {
    // Filtro por zona
    if (filtroZona !== 'todas' && vol.zona_id !== filtroZona) return false;
    
    // Filtro por disponibilidad
    if (filtroDisponibilidadVol !== 'todos' && vol.disponibilidad !== filtroDisponibilidadVol) return false;
    
    // Filtro por búsqueda
    if (busqueda) {
      const search = busqueda.toLowerCase();
      return vol.nombre.toLowerCase().includes(search);
    }
    
    return true;
  });

  const getDisponibilidadColor = (disp: string) => {
    switch (disp) {
      case 'alta': return 'bg-green-100 text-green-700';
      case 'media': return 'bg-yellow-100 text-yellow-700';
      case 'baja': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!tieneAcceso) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Asignaciones de Voluntarios
                </h1>
                <p className="text-sm text-gray-500">
                  Gestión global de asignaciones voluntario-niño
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Estadísticas Globales */}
        {estadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total_ninos}</p>
                  <p className="text-xs text-gray-500">Total Niños</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.ninos_asignados}</p>
                  <p className="text-xs text-gray-500">Asignados</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.ninos_sin_asignar}</p>
                  <p className="text-xs text-gray-500">Sin Asignar</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total_voluntarios}</p>
                  <p className="text-xs text-gray-500">Voluntarios</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.voluntarios_disponibles}</p>
                  <p className="text-xs text-gray-500">Disponibles</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{estadisticas.voluntarios_sobrecargados}</p>
                  <p className="text-xs text-gray-500">Sobrecargados</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y Controles */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tabs Vista */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setVistaActiva('ninos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaActiva === 'ninos'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 inline-block mr-2" />
                Niños
              </button>
              <button
                onClick={() => setVistaActiva('voluntarios')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vistaActiva === 'voluntarios'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserCheck className="w-4 h-4 inline-block mr-2" />
                Voluntarios
              </button>
            </div>

            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Buscar ${vistaActiva === 'ninos' ? 'niño' : 'voluntario'}...`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Filtro Zona */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <select
                value={filtroZona}
                onChange={(e) => setFiltroZona(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="todas">Todas las zonas</option>
                {zonas.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtros específicos según vista */}
            {vistaActiva === 'ninos' ? (
              <select
                value={filtroEstadoNino}
                onChange={(e) => setFiltroEstadoNino(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="asignado">Con voluntario</option>
                <option value="sin_asignar">Sin voluntario</option>
              </select>
            ) : (
              <select
                value={filtroDisponibilidadVol}
                onChange={(e) => setFiltroDisponibilidadVol(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="todos">Toda disponibilidad</option>
                <option value="alta">Alta disponibilidad</option>
                <option value="media">Media disponibilidad</option>
                <option value="baja">Baja disponibilidad</option>
              </select>
            )}
          </div>
        </div>

        {/* Vista de Niños */}
        {vistaActiva === 'ninos' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Niños ({ninosFiltrados.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {ninosFiltrados.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron niños con los filtros seleccionados</p>
                </div>
              ) : (
                ninosFiltrados.map((nino) => (
                  <div
                    key={nino.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar / Estado */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          nino.asignacion
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {nino.asignacion ? (
                            <UserCheck className="w-6 h-6" />
                          ) : (
                            <UserX className="w-6 h-6" />
                          )}
                        </div>
                        
                        {/* Info del niño */}
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/dashboard/ninos/${nino.id}`}
                              className="font-medium text-gray-900 hover:text-orange-600"
                            >
                              {nino.alias}
                            </Link>
                            {nino.tiene_deficits && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                Con evaluación
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{nino.rango_etario}</span>
                            {nino.zona_nombre && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {nino.zona_nombre}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Asignación o acción */}
                      <div className="flex items-center gap-4">
                        {nino.asignacion ? (
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">
                                {nino.asignacion.voluntario_nombre}
                              </span>
                              <span className={`font-semibold ${getScoreColor(nino.asignacion.score_matching)}`}>
                                {nino.asignacion.score_matching?.toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Desde {new Date(nino.asignacion.fecha_asignacion).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin voluntario asignado</span>
                        )}
                        
                        <Link
                          href={`/dashboard/ninos/${nino.id}/asignar-voluntario`}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            nino.asignacion
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {nino.asignacion ? 'Cambiar' : 'Asignar'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Vista de Voluntarios */}
        {vistaActiva === 'voluntarios' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Voluntarios ({voluntariosFiltrados.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {voluntariosFiltrados.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron voluntarios con los filtros seleccionados</p>
                </div>
              ) : (
                voluntariosFiltrados.map((vol) => (
                  <div
                    key={vol.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 font-semibold text-lg">
                            {vol.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Info del voluntario */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{vol.nombre}</span>
                            {vol.tiene_autoevaluacion ? (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Evaluado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Sin evaluación
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {vol.zona_nombre && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {vol.zona_nombre}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDisponibilidadColor(vol.disponibilidad)}`}>
                              {vol.disponibilidad === 'alta' ? 'Alta disponibilidad' :
                               vol.disponibilidad === 'media' ? 'Media disponibilidad' : 'Baja disponibilidad'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Niños asignados */}
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {vol.asignaciones_activas} niño{vol.asignaciones_activas !== 1 ? 's' : ''}
                        </p>
                        {vol.ninos_asignados.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-end mt-1">
                            {vol.ninos_asignados.slice(0, 3).map((nino) => (
                              <Link
                                key={nino.id}
                                href={`/dashboard/ninos/${nino.id}`}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >
                                {nino.alias}
                              </Link>
                            ))}
                            {vol.ninos_asignados.length > 3 && (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                +{vol.ninos_asignados.length - 3} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AsignacionesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <AsignacionesPageContent />
    </Suspense>
  );
}
