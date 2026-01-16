'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  FileText, 
  Target, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar,
  Upload,
  ClipboardList
} from 'lucide-react';

export default function PsicopedagogiaDashboard() {
  const { user, perfil } = useAuth();
  const router = useRouter();
  const [metricas, setMetricas] = useState({
    totalNinos: 0,
    evaluacionesPendientes: 0,
    planesActivos: 0,
    sesionesEsteMes: 0,
    alertasActivas: 0,
  });

  useEffect(() => {
    if (!user || perfil?.rol !== 'psicopedagogia') {
      router.push('/dashboard');
      return;
    }

    cargarMetricas();
  }, [user, perfil]);

  const cargarMetricas = async () => {
    try {
      // Total de niños
      const { count: totalNinos } = await supabase
        .from('ninos')
        .select('*', { count: 'exact', head: true });

      // Evaluaciones pendientes (niños sin evaluación en últimos 6 meses)
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
      
      const { count: evaluacionesPendientes } = await supabase
        .from('ninos')
        .select('*', { count: 'exact', head: true })
        .or(`ultima_evaluacion.is.null,ultima_evaluacion.lt.${seisMesesAtras.toISOString()}`);

      // Planes activos
      const { count: planesActivos } = await supabase
        .from('planes_intervencion')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // Sesiones este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { count: sesionesEsteMes } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', inicioMes.toISOString());

      setMetricas({
        totalNinos: totalNinos || 0,
        evaluacionesPendientes: evaluacionesPendientes || 0,
        planesActivos: planesActivos || 0,
        sesionesEsteMes: sesionesEsteMes || 0,
        alertasActivas: 0,
      });

    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Psicopedagogía
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestión integral de evaluaciones, planes de intervención y seguimiento educativo
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Niños</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metricas.totalNinos}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Evaluaciones Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">
                  {metricas.evaluacionesPendientes}
                </p>
              </div>
              <ClipboardList className="w-10 h-10 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Últimos 6 meses</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Planes Activos</p>
                <p className="text-3xl font-bold text-green-600">
                  {metricas.planesActivos}
                </p>
              </div>
              <Target className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones Este Mes</p>
                <p className="text-3xl font-bold text-purple-600">
                  {metricas.sesionesEsteMes}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Evaluaciones */}
          <Link
            href="/dashboard/psicopedagogia/evaluaciones"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 group"
          >
            <ClipboardList className="w-12 h-12 mb-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Evaluaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Crear y gestionar evaluaciones diagnósticas cada 6 meses
            </p>
            <div className="flex items-center text-blue-600 text-sm font-medium">
              Ver todas →
            </div>
          </Link>

          {/* Planes de Intervención */}
          <Link
            href="/dashboard/psicopedagogia/planes"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 group"
          >
            <Target className="w-12 h-12 mb-4 text-green-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Planes de Intervención
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Diseñar actividades semanales para voluntarios con cada niño
            </p>
            <div className="flex items-center text-green-600 text-sm font-medium">
              Gestionar planes →
            </div>
          </Link>

          {/* Biblioteca con IA */}
          <Link
            href="/dashboard/biblioteca"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 group"
          >
            <BookOpen className="w-12 h-12 mb-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Biblioteca con IA
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Subir documentos y consultar con sistema RAG inteligente
            </p>
            <div className="flex items-center text-indigo-600 text-sm font-medium">
              Acceder →
            </div>
          </Link>

          {/* Asignaciones */}
          <Link
            href="/dashboard/psicopedagogia/asignaciones"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 group"
          >
            <Users className="w-12 h-12 mb-4 text-purple-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Asignaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Asignar voluntarios a niños según necesidades y disponibilidad
            </p>
            <div className="flex items-center text-purple-600 text-sm font-medium">
              Gestionar asignaciones →
            </div>
          </Link>

          {/* Análisis y Reportes */}
          <Link
            href="/dashboard/psicopedagogia/analisis"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 group"
          >
            <TrendingUp className="w-12 h-12 mb-4 text-orange-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Análisis con IA
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Análisis de progreso y generación automática de informes
            </p>
            <div className="flex items-center text-orange-600 text-sm font-medium">
              Ver análisis →
            </div>
          </Link>

          {/* Niños */}
          <Link
            href="/dashboard/ninos"
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 group"
          >
            <FileText className="w-12 h-12 mb-4 text-pink-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Perfiles de Niños
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Ver y editar información completa de cada niño
            </p>
            <div className="flex items-center text-pink-600 text-sm font-medium">
              Ver todos →
            </div>
          </Link>
        </div>

        {/* Sección de acceso rápido */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/psicopedagogia/evaluaciones/nueva"
              className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Nueva Evaluación</p>
            </Link>

            <Link
              href="/dashboard/psicopedagogia/planes/nuevo"
              className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Nuevo Plan</p>
            </Link>

            <Link
              href="/dashboard/biblioteca/subir"
              className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Subir Documento</p>
            </Link>

            <Link
              href="/dashboard/ninos"
              className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow text-center"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Ver Niños</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
