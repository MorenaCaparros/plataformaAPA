'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Calendar, User, Target, FileText } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PlanIntervencion {
  id: string;
  nino_id: string;
  titulo: string;
  objetivo_general: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_semanas: number;
  activo: boolean;
  voluntario_asignado_id: string | null;
  nino: {
    nombre_completo: string;
    alias: string;
  };
  voluntario: {
    metadata: {
      nombre: string;
      apellido: string;
    };
  } | null;
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<PlanIntervencion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'activos' | 'completados'>('activos');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPlanes();
  }, [filter]);

  async function fetchPlanes() {
    try {
      setLoading(true);

      let query = supabase
        .from('planes_intervencion')
        .select(`
          *,
          nino:ninos(nombre_completo, alias),
          voluntario:perfiles!voluntario_asignado_id(metadata)
        `)
        .order('fecha_inicio', { ascending: false });

      if (filter === 'activos') {
        query = query.eq('activo', true);
      } else if (filter === 'completados') {
        query = query.eq('activo', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPlanes(data || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoading(false);
    }
  }

  const getEstadoColor = (plan: PlanIntervencion) => {
    if (!plan.activo) return 'bg-gray-100 text-gray-700 dark:bg-gray-800';
    
    // Verificar si está vencido
    if (plan.fecha_fin && new Date(plan.fecha_fin) < new Date()) {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    }
    
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  };

  const getEstadoTexto = (plan: PlanIntervencion) => {
    if (!plan.activo) return 'Completado';
    
    if (plan.fecha_fin && new Date(plan.fecha_fin) < new Date()) {
      return 'Vencido';
    }
    
    return 'Activo';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Planes de Intervención
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestión de objetivos y actividades semanales
              </p>
            </div>
          </div>
          
          <Link
            href="/dashboard/psicopedagogia/planes/nuevo"
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Nuevo Plan
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'todos'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('activos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'activos'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFilter('completados')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completados'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Completados
            </button>
          </div>
        </div>

        {/* Lista de Planes */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : planes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay planes {filter !== 'todos' ? filter : ''}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'activos' 
                ? 'Crea tu primer plan de intervención para comenzar'
                : 'No se encontraron planes con este filtro'}
            </p>
            <Link
              href="/dashboard/psicopedagogia/planes/nuevo"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Plan
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {planes.map((plan) => (
              <Link
                key={plan.id}
                href={`/dashboard/psicopedagogia/planes/${plan.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {plan.titulo}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                          {plan.objetivo_general}
                        </p>
                      </div>
                    </div>

                    {/* Información del niño y voluntario */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Niño: <strong>{plan.nino?.alias || 'Sin alias'}</strong>
                        </span>
                      </div>
                      
                      {plan.voluntario && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            Voluntario: <strong>
                              {plan.voluntario.metadata?.nombre} {plan.voluntario.metadata?.apellido}
                            </strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {plan.duracion_semanas} semanas
                        </span>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        Inicio: {new Date(plan.fecha_inicio).toLocaleDateString('es-AR')}
                      </span>
                      {plan.fecha_fin && (
                        <span>
                          Fin: {new Date(plan.fecha_fin).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getEstadoColor(plan)}`}>
                      {getEstadoTexto(plan)}
                    </span>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
