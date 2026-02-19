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
  ClipboardList,
  Brain,
  Sparkles,
  BarChart3
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

      // Evaluaciones pendientes (niños sin entrevista en últimos 6 meses)
      // Query ninos and their entrevistas to find pending ones
      const { data: ninosConEval } = await supabase
        .from('ninos')
        .select('id, entrevistas(fecha)')
        .order('alias', { ascending: true });
      
      let evaluacionesPendientes = 0;
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
      
      (ninosConEval || []).forEach((nino: any) => {
        const evals = nino.entrevistas || [];
        if (evals.length === 0) {
          evaluacionesPendientes++;
        } else {
          const fechas = evals.map((e: any) => new Date(e.fecha).getTime());
          const ultimaFecha = new Date(Math.max(...fechas));
          if (ultimaFecha < seisMesesAtras) {
            evaluacionesPendientes++;
          }
        }
      });

      // Planes activos
      const { count: planesActivos } = await supabase
        .from('planes_intervencion')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo');

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
      console.error('Error cargando metricas:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-quicksand text-3xl font-bold text-neutro-carbon mb-2">
          Panel de Profesionales
        </h1>
        <p className="font-outfit text-neutro-piedra">
          Gestión integral de evaluaciones, planes de intervención y seguimiento educativo
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-xl shadow-impulso-500/5 hover:shadow-impulso-500/10 hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-impulso-50 flex items-center justify-center mb-4 text-impulso-500 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">
            {metricas.totalNinos}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm">Total Niños</p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-impulso-400 animate-pulse" />
        </div>

        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-xl shadow-sol-500/5 hover:shadow-sol-500/10 hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-sol-50 flex items-center justify-center mb-4 text-sol-500 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-sol-600 mb-1">
            {metricas.evaluacionesPendientes}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm mb-2">Evaluaciones Pendientes</p>
          <p className="font-outfit text-xs text-sol-600">Últimos 6 meses</p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-sol-400 animate-pulse" />
        </div>

        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-xl shadow-crecimiento-500/5 hover:shadow-crecimiento-500/10 hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
            <Target className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">
            {metricas.planesActivos}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm">Planes Activos</p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-crecimiento-400 animate-pulse" />
        </div>

        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-xl shadow-crecimiento-500/5 hover:shadow-crecimiento-500/10 hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">
            {metricas.sesionesEsteMes}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm">Sesiones Este Mes</p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-crecimiento-400 animate-pulse" />
        </div>
      </div>

        {/* Acciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Evaluaciones */}
          <Link
            href="/dashboard/psicopedagogia/evaluaciones"
            className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-sol-500/5 hover:shadow-sol-500/10 hover:-translate-y-1"
          >
            <div className="h-12 w-12 rounded-2xl bg-sol-50 flex items-center justify-center mb-4 text-sol-500 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2">
              Evaluaciones
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm mb-4">
              Crear y gestionar evaluaciones diagnósticas cada 6 meses
            </p>
            <div className="flex items-center text-sol-600 text-sm font-medium">
              Ver todas →
            </div>
          </Link>

          {/* Planes de Intervención */}
          <Link
            href="/dashboard/psicopedagogia/planes"
            className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-crecimiento-500/5 hover:shadow-crecimiento-500/10 hover:-translate-y-1"
          >
            <div className="h-12 w-12 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2">
              Planes de Intervención
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm mb-4">
              Diseñar actividades semanales para voluntarios con cada niño
            </p>
            <div className="flex items-center text-crecimiento-600 text-sm font-medium">
              Gestionar planes →
            </div>
          </Link>

          {/* Biblioteca con IA */}
          <Link
            href="/dashboard/biblioteca"
            className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-sol-500/5 hover:shadow-sol-500/10 hover:-translate-y-1"
          >
            <div className="h-12 w-12 rounded-2xl bg-sol-50 flex items-center justify-center mb-4 text-sol-500 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2">
              Biblioteca con IA
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm mb-4">
              Subir documentos y consultar con sistema RAG inteligente
            </p>
            <div className="flex items-center text-sol-600 text-sm font-medium">
              Acceder →
            </div>
          </Link>

          {/* Asignaciones */}
          <Link
            href="/dashboard/asignaciones"
            className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-crecimiento-500/5 hover:shadow-crecimiento-500/10 hover:-translate-y-1"
          >
            <div className="h-12 w-12 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2">
              Asignaciones
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm mb-4">
              Asignar voluntarios a niños según necesidades y disponibilidad
            </p>
            <div className="flex items-center text-crecimiento-600 text-sm font-medium">
              Gestionar asignaciones →
            </div>
          </Link>

          {/* Análisis y Reportes */}
          <Link
            href="/dashboard/psicopedagogia/analisis"
            className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 hover:-translate-y-1"
          >
            <span className="absolute top-4 right-4 px-2 py-0.5 bg-gradient-to-r from-impulso-400 to-impulso-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              IA
            </span>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-impulso-100 to-impulso-200 flex items-center justify-center mb-4 text-impulso-500 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2">
              Análisis con IA
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm mb-4">
              Patrones, tendencias y recomendaciones inteligentes
            </p>
            <div className="flex items-center text-impulso-500 text-sm font-medium">
              Ver análisis →
            </div>
          </Link>

          {/* Niños */}
          <Link
            href="/dashboard/ninos"
            className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-impulso-500/5 hover:shadow-impulso-500/10 hover:-translate-y-1"
          >
            <div className="h-12 w-12 rounded-2xl bg-impulso-50 flex items-center justify-center mb-4 text-impulso-500 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2">
              Perfiles de Niños
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm mb-4">
              Ver y editar información completa de cada niño
            </p>
            <div className="flex items-center text-impulso-600 text-sm font-medium">
              Ver todos →
            </div>
          </Link>

          {/* Métricas */}
          <Link
            href="/dashboard/metricas"
            className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-teal-500/5 hover:shadow-teal-500/10 hover:-translate-y-1"
          >
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 text-teal-500 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2">
              Métricas
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm mb-4">
              Estadísticas de la zona: niños, voluntarios y sesiones
            </p>
            <div className="flex items-center text-teal-600 text-sm font-medium">
              Ver métricas →
            </div>
          </Link>
        </div>
    </div>
  );
}
