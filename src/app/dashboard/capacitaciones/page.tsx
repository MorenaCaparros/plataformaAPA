'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Habilidad {
  area: string;
  estrellas: number;
  capacitaciones_completadas: number;
}

interface Capacitacion {
  id: string;
  nombre: string;
  descripcion: string;
  area: string;
  tipo: 'autoevaluacion' | 'capacitacion';
  puntaje_minimo_aprobacion: number;
  duracion_estimada_minutos: number;
}

interface CapacitacionAsignada {
  id: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'aprobada' | 'reprobada';
  created_at: string;
  fecha_completado?: string;
  puntaje_final?: number;
  capacitacion: Capacitacion;
}

export default function CapacitacionesPage() {
  const { user, perfil } = useAuth();
  const router = useRouter();
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [capacitacionesAsignadas, setCapacitacionesAsignadas] = useState<CapacitacionAsignada[]>([]);
  const [capacitacionesSugeridas, setCapacitacionesSugeridas] = useState<Capacitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [promedio, setPromedio] = useState(0);

  useEffect(() => {
    if (!user || !perfil) return;
    
    // Solo voluntarios pueden acceder a esta vista
    if (perfil.rol !== 'voluntario') {
      router.push('/dashboard');
      return;
    }

    cargarDatos();
  }, [user, perfil, router]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // 1. Cargar habilidades (estrellas por área)
      const resHabilidades = await fetch(`/api/voluntarios/habilidades?voluntario_id=${perfil?.id}`);
      const dataHabilidades = await resHabilidades.json();
      setHabilidades(dataHabilidades.habilidades || []);
      setPromedio(dataHabilidades.promedio || 0);

      // 2. Cargar capacitaciones asignadas
      const resAsignadas = await fetch(`/api/voluntarios/capacitaciones?voluntario_id=${perfil?.id}`);
      const dataAsignadas = await resAsignadas.json();
      setCapacitacionesAsignadas(dataAsignadas.capacitaciones || []);

      // 3. Cargar capacitaciones disponibles (sugeridas)
      const resDisponibles = await fetch('/api/capacitaciones');
      const dataDisponibles = await resDisponibles.json();
      
      // Filtrar sugerencias: áreas con menos de 3 estrellas
      const areasDébiles = dataHabilidades.habilidades.filter((h: Habilidad) => h.estrellas < 3);
      const sugeridas = dataDisponibles.capacitaciones.filter((cap: Capacitacion) => 
        areasDébiles.some((area: Habilidad) => area.area === cap.area)
      );
      setCapacitacionesSugeridas(sugeridas);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNivelColor = (estrellas: number) => {
    if (estrellas >= 4) return 'text-green-600 bg-green-100';
    if (estrellas >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getNivelTexto = (estrellas: number) => {
    if (estrellas >= 4) return 'Fuerte';
    if (estrellas >= 2) return 'Medio';
    if (estrellas > 0) return 'Inicial';
    return 'Sin evaluar';
  };

  const getAreaNombre = (area: string) => {
    const nombres: Record<string, string> = {
      'lenguaje': 'Lenguaje y Vocabulario',
      'grafismo': 'Grafismo y Motricidad Fina',
      'lectura_escritura': 'Lectura y Escritura',
      'matematicas': 'Nociones Matemáticas'
    };
    return nombres[area] || area;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crecimiento-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mis Capacitaciones
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona tu formación y habilidades como voluntario alfabetizador
          </p>
        </div>

        {/* Tarjeta de Resumen */}
        <div className="bg-gradient-to-r from-crecimiento-500 to-crecimiento-700 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-crecimiento-100 text-sm font-medium">Tu promedio general</p>
              <p className="text-4xl font-bold mt-2">{promedio.toFixed(1)} ⭐</p>
            </div>
            <div className="text-right">
              <p className="text-crecimiento-100 text-sm">Capacitaciones completadas</p>
              <p className="text-3xl font-bold mt-2">
                {capacitacionesAsignadas.filter(c => c.estado === 'completada').length}
              </p>
            </div>
          </div>
        </div>

        {/* Mis Habilidades */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Mis Habilidades por Área
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habilidades.map((hab) => (
              <div key={hab.area} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {getAreaNombre(hab.area)}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getNivelColor(hab.estrellas)}`}>
                    {getNivelTexto(hab.estrellas)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= hab.estrellas ? 'text-yellow-400' : 'text-gray-300'}>
                      ⭐
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    ({hab.estrellas.toFixed(1)})
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {hab.capacitaciones_completadas} capacitación(es) completada(s)
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Capacitaciones Sugeridas */}
        {capacitacionesSugeridas.length > 0 && (
          <div className="bg-sol-50 dark:bg-sol-900/20 border border-sol-200 dark:border-sol-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-sol-600 dark:text-sol-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-sol-900 dark:text-sol-200 mb-2">
                  Te recomendamos fortalecer estas áreas
                </h3>
                <p className="text-sm text-sol-800 dark:text-sol-300 mb-4">
                  Según tu nivel actual, estas capacitaciones te ayudarían:
                </p>
                <div className="space-y-2">
                  {capacitacionesSugeridas.slice(0, 3).map((cap) => (
                    <div key={cap.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{cap.nombre}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getAreaNombre(cap.area)} • Aprobación: {cap.puntaje_minimo_aprobacion}% • {cap.duracion_estimada_minutos} min
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-sol-600 hover:bg-sol-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Solicitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capacitaciones Asignadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Mis Capacitaciones Asignadas
          </h2>

          {capacitacionesAsignadas.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Aún no tienes capacitaciones asignadas
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Tu coordinador te asignará capacitaciones según las necesidades del programa
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {capacitacionesAsignadas.map((asignada) => (
                <div key={asignada.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {asignada.capacitacion.nombre}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          ['completada', 'aprobada'].includes(asignada.estado) ? 'bg-green-100 text-green-800' :
                          asignada.estado === 'en_progreso' ? 'bg-sol-100 text-sol-700' :
                          asignada.estado === 'reprobada' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {['completada', 'aprobada'].includes(asignada.estado) ? 'Completada' :
                           asignada.estado === 'en_progreso' ? 'En curso' :
                           asignada.estado === 'reprobada' ? 'No aprobada' :
                           'Pendiente'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {asignada.capacitacion.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                          </svg>
                          {getAreaNombre(asignada.capacitacion.area)}
                        </span>
                        <span>{asignada.capacitacion.duracion_estimada_minutos} minutos</span>
                        <span>Aprobación: {asignada.capacitacion.puntaje_minimo_aprobacion}%</span>
                      </div>

                      {['completada', 'aprobada'].includes(asignada.estado) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Completada el {new Date(asignada.fecha_completado!).toLocaleDateString('es-AR')}
                            {asignada.puntaje_final != null && ` • Puntaje: ${asignada.puntaje_final}%`}
                          </p>
                        </div>
                      )}
                    </div>

                    {asignada.estado === 'pendiente' && (
                      <button className="ml-4 px-4 py-2 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-lg text-sm font-medium transition-colors">
                        Iniciar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
