'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { 
  ClipboardList, 
  Target, 
  BookOpen, 
  Users, 
  TrendingUp, 
  FileText,
  UserPlus,
  FileEdit,
  Upload,
  BarChart3,
  UserCog,
  Baby
} from 'lucide-react';

interface Metrics {
  totalNinos: number;
  evaluacionesPendientes: number;
  planesActivos: number;
  sesionesEsteMes: number;
}

export default function EquipoProfesionalDashboard({ title }: { title: string }) {
  const { perfil } = useAuth();
  const [metrics, setMetrics] = useState<Metrics>({
    totalNinos: 0,
    evaluacionesPendientes: 0,
    planesActivos: 0,
    sesionesEsteMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Total de niños
      const { count: ninosCount } = await supabase
        .from('ninos')
        .select('*', { count: 'exact', head: true });

      // Evaluaciones pendientes (>180 días o sin evaluación inicial)
      const { data: ninos } = await supabase
        .from('ninos')
        .select(`
          id,
          evaluaciones (
            fecha,
            tipo
          )
        `)
        .order('evaluaciones.fecha', { ascending: false });

      let evaluacionesPendientes = 0;
      const hoy = new Date();
      
      ninos?.forEach(nino => {
        const evaluaciones = (nino as any).evaluaciones || [];
        if (evaluaciones.length === 0) {
          evaluacionesPendientes++;
        } else {
          const ultimaEvaluacion = new Date(evaluaciones[0].fecha);
          const diasDesdeUltima = Math.floor((hoy.getTime() - ultimaEvaluacion.getTime()) / (1000 * 60 * 60 * 24));
          if (diasDesdeUltima > 180) {
            evaluacionesPendientes++;
          }
        }
      });

      // Planes activos
      const { count: planesCount } = await supabase
        .from('planes_intervencion')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // Sesiones este mes
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const { count: sesionesCount } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', inicioMes.toISOString());

      setMetrics({
        totalNinos: ninosCount || 0,
        evaluacionesPendientes,
        planesActivos: planesCount || 0,
        sesionesEsteMes: sesionesCount || 0
      });
    } catch (error) {
      console.error('Error cargando métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">Acceso completo a evaluaciones, planes y biblioteca</p>
        </div>
        <Link
          href="/dashboard/ninos/ingreso-completo"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg hover:shadow-xl transition min-h-[48px]"
        >
          <Baby className="w-5 h-5" />
          Ingreso Completo de Niño
        </Link>
      </div>

      {/* Métricas Principales */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <Users className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm font-medium opacity-90">Total de Niños</p>
            <p className="text-3xl font-bold mt-1">{metrics.totalNinos}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <ClipboardList className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm font-medium opacity-90">Evaluaciones Pendientes</p>
            <p className="text-3xl font-bold mt-1">{metrics.evaluacionesPendientes}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <Target className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm font-medium opacity-90">Planes Activos</p>
            <p className="text-3xl font-bold mt-1">{metrics.planesActivos}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm font-medium opacity-90">Sesiones este Mes</p>
            <p className="text-3xl font-bold mt-1">{metrics.sesionesEsteMes}</p>
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚡ Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/dashboard/psicopedagogia/evaluaciones/nueva"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition min-h-[64px]"
          >
            <FileEdit className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Nueva Evaluación</span>
          </Link>

          <Link
            href="/dashboard/psicopedagogia/planes/nuevo"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition min-h-[64px]"
          >
            <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Nuevo Plan con IA</span>
          </Link>

          <Link
            href="/dashboard/biblioteca/subir"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition min-h-[64px]"
          >
            <Upload className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Subir Documento</span>
          </Link>

          <Link
            href="/dashboard/ninos"
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition min-h-[64px]"
          >
            <Users className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Ver Niños</span>
          </Link>
        </div>
      </div>

      {/* Secciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Evaluaciones */}
        <Link
          href="/dashboard/psicopedagogia/evaluaciones"
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border-2 border-transparent hover:border-blue-500 min-h-[200px] flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            {metrics.evaluacionesPendientes > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {metrics.evaluacionesPendientes}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Evaluaciones</h3>
          <p className="text-sm text-gray-600 flex-grow">
            Evaluaciones diagnósticas, seguimiento y egresos. Historial completo por niño.
          </p>
          <div className="mt-4 text-blue-600 font-medium text-sm">
            Ver evaluaciones →
          </div>
        </Link>

        {/* Planes de Intervención */}
        <Link
          href="/dashboard/psicopedagogia/planes"
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border-2 border-transparent hover:border-green-500 min-h-[200px] flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <Target className="w-8 h-8 text-green-600" />
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              IA
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Planes de Intervención</h3>
          <p className="text-sm text-gray-600 flex-grow">
            Crear y gestionar planes con asistencia de IA. Actividades semanales para voluntarios.
          </p>
          <div className="mt-4 text-green-600 font-medium text-sm">
            Ver planes →
          </div>
        </Link>

        {/* Biblioteca Psicopedagógica */}
        <Link
          href="/dashboard/biblioteca"
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border-2 border-transparent hover:border-purple-500 min-h-[200px] flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              RAG
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Biblioteca</h3>
          <p className="text-sm text-gray-600 flex-grow">
            Documentos, guías y papers. Chat con IA para consultas especializadas.
          </p>
          <div className="mt-4 text-purple-600 font-medium text-sm">
            Ir a biblioteca →
          </div>
        </Link>

        {/* Asignaciones */}
        <Link
          href="/dashboard/psicopedagogia/asignaciones"
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border-2 border-transparent hover:border-indigo-500 min-h-[200px] flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <UserCog className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Asignaciones</h3>
          <p className="text-sm text-gray-600 flex-grow">
            Gestionar asignación de voluntarios a niños. Ver disponibilidad y zonas.
          </p>
          <div className="mt-4 text-indigo-600 font-medium text-sm">
            Ver asignaciones →
          </div>
        </Link>

        {/* Análisis con IA */}
        <Link
          href="/dashboard/psicopedagogia/analisis"
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border-2 border-transparent hover:border-pink-500 min-h-[200px] flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-pink-600" />
            <span className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              IA
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Análisis con IA</h3>
          <p className="text-sm text-gray-600 flex-grow">
            Patrones, tendencias y recomendaciones basadas en datos agregados.
          </p>
          <div className="mt-4 text-pink-600 font-medium text-sm">
            Ver análisis →
          </div>
        </Link>

        {/* Perfiles de Niños */}
        <Link
          href="/dashboard/ninos"
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6 border-2 border-transparent hover:border-orange-500 min-h-[200px] flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Perfiles de Niños</h3>
          <p className="text-sm text-gray-600 flex-grow">
            Acceso completo a datos, historial, sesiones y progreso de cada niño.
          </p>
          <div className="mt-4 text-orange-600 font-medium text-sm">
            Ver perfiles →
          </div>
        </Link>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-xl">👥</span>
          Equipo Profesional
        </h3>
        <p className="text-sm text-blue-800 mb-3">
          Como parte del equipo profesional (psicopedagogía, coordinador, trabajadora social), 
          tenés acceso completo a todas las funcionalidades de la plataforma.
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Acceso a datos completos de todos los niños (incluyendo datos sensibles)</li>
          <li>Gestión de evaluaciones, planes de intervención y asignaciones</li>
          <li>Herramientas de IA para análisis y generación de contenido</li>
          <li>Biblioteca psicopedagógica con sistema RAG</li>
          <li>Ingreso completo de niños con entrevista inicial (grabación + OCR)</li>
        </ul>
      </div>
    </div>
  );
}
