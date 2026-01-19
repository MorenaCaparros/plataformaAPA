'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Calendar, User, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Evaluacion {
  id: string;
  nino_id: string;
  fecha: string;
  tipo: 'inicial' | 'seguimiento' | 'egreso';
  proxima_evaluacion: string | null;
  observaciones: string;
  resultados: any;
  nino: {
    nombre_completo: string;
    alias: string;
    fecha_nacimiento: string;
  };
  psicopedagogo: {
    metadata: {
      nombre: string;
      apellido: string;
    };
  };
}

interface NinoPendiente {
  id: string;
  alias: string;
  ultima_evaluacion: string | null;
  dias_desde_evaluacion: number | null;
}

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [ninosPendientes, setNinosPendientes] = useState<NinoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'evaluaciones' | 'pendientes'>('evaluaciones');

  useEffect(() => {
    if (tab === 'evaluaciones') {
      fetchEvaluaciones();
    } else {
      fetchNinosPendientes();
    }
  }, [tab]);

  async function fetchEvaluaciones() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('evaluaciones')
        .select(`
          *,
          nino:ninos(nombre_completo, alias, fecha_nacimiento),
          psicopedagogo:perfiles!psicopedagogo_id(metadata)
        `)
        .order('fecha', { ascending: false })
        .limit(50);

      if (error) throw error;

      setEvaluaciones(data || []);
    } catch (error) {
      console.error('Error al cargar evaluaciones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNinosPendientes() {
    try {
      setLoading(true);

      // Obtener todos los niños con su última evaluación
      const { data: ninos, error } = await supabase
        .from('ninos')
        .select(`
          id,
          alias,
          evaluaciones(fecha)
        `)
        .order('alias', { ascending: true });

      if (error) throw error;

      // Procesar para encontrar quiénes necesitan evaluación
      const pendientes: NinoPendiente[] = [];
      const hoy = new Date();

      for (const nino of ninos || []) {
        const evaluaciones = (nino as any).evaluaciones || [];
        
        if (evaluaciones.length === 0) {
          // Sin evaluaciones - prioridad alta
          pendientes.push({
            id: nino.id,
            alias: nino.alias,
            ultima_evaluacion: null,
            dias_desde_evaluacion: null
          });
        } else {
          // Ordenar por fecha descendente
          const ordenadas = evaluaciones.sort((a: any, b: any) => 
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          const ultimaEval = new Date(ordenadas[0].fecha);
          const diasDesde = Math.floor((hoy.getTime() - ultimaEval.getTime()) / (1000 * 60 * 60 * 24));

          // Si pasaron más de 180 días (6 meses)
          if (diasDesde >= 180) {
            pendientes.push({
              id: nino.id,
              alias: nino.alias,
              ultima_evaluacion: ordenadas[0].fecha,
              dias_desde_evaluacion: diasDesde
            });
          }
        }
      }

      setNinosPendientes(pendientes);
    } catch (error) {
      console.error('Error al cargar niños pendientes:', error);
    } finally {
      setLoading(false);
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'inicial':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'seguimiento':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'egreso':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'inicial':
        return 'Inicial';
      case 'seguimiento':
        return 'Seguimiento';
      case 'egreso':
        return 'Egreso';
      default:
        return tipo;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Evaluaciones Psicopedagógicas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Seguimiento del progreso cada 6 meses
              </p>
            </div>
          </div>
          
          <Link
            href="/dashboard/psicopedagogia/evaluaciones/nueva"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Nueva Evaluación
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('evaluaciones')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                tab === 'evaluaciones'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Historial de Evaluaciones
              </div>
            </button>
            <button
              onClick={() => setTab('pendientes')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors relative ${
                tab === 'pendientes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Evaluaciones Pendientes
                {ninosPendientes.length > 0 && tab !== 'pendientes' && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {ninosPendientes.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Contenido según tab */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : tab === 'evaluaciones' ? (
          // Lista de evaluaciones
          evaluaciones.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay evaluaciones registradas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comienza realizando la primera evaluación de un niño
              </p>
              <Link
                href="/dashboard/psicopedagogia/evaluaciones/nueva"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Primera Evaluación
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {evaluaciones.map((evaluacion) => (
                <Link
                  key={evaluacion.id}
                  href={`/dashboard/psicopedagogia/evaluaciones/${evaluacion.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Información principal */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                          <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {evaluacion.nino?.alias}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTipoColor(evaluacion.tipo)}`}>
                              {getTipoLabel(evaluacion.tipo)}
                            </span>
                          </div>
                          {evaluacion.observaciones && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                              {evaluacion.observaciones}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(evaluacion.fecha).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        {evaluacion.psicopedagogo && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {evaluacion.psicopedagogo.metadata?.nombre} {evaluacion.psicopedagogo.metadata?.apellido}
                            </span>
                          </div>
                        )}

                        {evaluacion.proxima_evaluacion && (
                          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">
                              Próxima: {new Date(evaluacion.proxima_evaluacion).toLocaleDateString('es-AR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Icono de ver más */}
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          // Lista de niños pendientes
          ninosPendientes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <AlertCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ¡Todas las evaluaciones al día!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No hay niños que requieran evaluación en este momento
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {ninosPendientes.map((nino) => (
                <Link
                  key={nino.id}
                  href={`/dashboard/psicopedagogia/evaluaciones/nueva?ninoId=${nino.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow p-5 border-l-4 border-red-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {nino.alias}
                        </h3>
                        {nino.ultima_evaluacion ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Última evaluación hace <strong>{nino.dias_desde_evaluacion}</strong> días
                            <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                              (Vencida)
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Sin evaluación inicial
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg font-medium">
                      <Plus className="w-4 h-4" />
                      Evaluar
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
