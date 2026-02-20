'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Users, FileText, UserCheck, Building2, BookOpen, Settings, Baby, BarChart3, Timer, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { user, perfil } = useAuth();
  const router = useRouter();

  const { data: metricas = {
    totalNinos: 0,
    totalSesiones: 0,
    totalVoluntarios: 0,
    totalEquipos: 0,
    sesionesEsteMes: 0,
    ninosSinSesiones: 0,
  }} = useQuery({
    queryKey: ['admin-metricas'],
    queryFn: async () => {
      // Total niños
      const { count: countNinos } = await supabase
        .from('ninos')
        .select('*', { count: 'exact', head: true });

      // Total sesiones
      const { count: countSesiones } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true });

      // Sesiones este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { count: countSesionesMes } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', inicioMes.toISOString());

      // Total usuarios
      const { count: countVoluntarios } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true });

      // Total equipos
      const { count: countEquipos } = await supabase
        .from('zonas')
        .select('*', { count: 'exact', head: true });

      // Niños sin sesiones — UNA SOLA QUERY en vez del loop N+1
      const { data: ninosConSesiones } = await supabase
        .from('sesiones')
        .select('nino_id');

      const ninosConSesionesSet = new Set(
        (ninosConSesiones || []).map((s: any) => s.nino_id)
      );
      const ninosSinSesiones = (countNinos || 0) - ninosConSesionesSet.size;

      return {
        totalNinos: countNinos || 0,
        totalSesiones: countSesiones || 0,
        totalVoluntarios: countVoluntarios || 0,
        totalEquipos: countEquipos || 0,
        sesionesEsteMes: countSesionesMes || 0,
        ninosSinSesiones: Math.max(0, ninosSinSesiones),
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // ─── Sesiones activas hoy (concurrentes) ──────────────────────────────────
  const { data: sesionesHoy = [], refetch: refetchSesionesHoy } = useQuery({
    queryKey: ['admin-sesiones-hoy'],
    queryFn: async () => {
      const hoyInicio = new Date();
      hoyInicio.setHours(0, 0, 0, 0);
      const hoyFin = new Date();
      hoyFin.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('sesiones')
        .select(`
          id,
          fecha,
          duracion_minutos,
          tipo_sesion,
          ninos!inner(alias, rango_etario)
        `)
        .gte('fecha', hoyInicio.toISOString())
        .lte('fecha', hoyFin.toISOString())
        .order('fecha', { ascending: false });

      if (error) {
        console.warn('Error cargando sesiones de hoy:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 30, // Refrescar cada 30 segundos
    refetchInterval: 1000 * 30,
  });

  return (
    <div>
      {/* Header con saludo */}
      <div className="mb-8">
        <h1 className="font-quicksand text-3xl font-bold text-neutro-carbon mb-2">
          Panel de Administración
        </h1>
        <p className="font-outfit text-neutro-piedra">
          Gestión integral del programa APA
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Tarjeta Niños (Rojo/Impulso) */}
        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(230,57,70,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(230,57,70,0.25)] hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-impulso-50 flex items-center justify-center mb-4 text-impulso-500 group-hover:scale-110 transition-transform">
            <Baby className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">
            {metricas.totalNinos}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm mb-2">Niños Activos</p>
          <p className="font-outfit text-xs text-impulso-600">
            {metricas.ninosSinSesiones} sin sesiones
          </p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-impulso-400 animate-pulse" />
        </div>

        {/* Tarjeta Sesiones (Amarillo/Sol) */}
        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(242,201,76,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(242,201,76,0.25)] hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-sol-50 flex items-center justify-center mb-4 text-sol-500 group-hover:scale-110 transition-transform">
            <FileText className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">
            {metricas.totalSesiones}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm mb-2">Sesiones Totales</p>
          <p className="font-outfit text-xs text-sol-600">
            {metricas.sesionesEsteMes} este mes
          </p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-sol-400 animate-pulse" />
        </div>

        {/* Tarjeta Usuarios (Verde/Crecimiento) */}
        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(164,198,57,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(164,198,57,0.25)] hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
            <UserCheck className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">
            {metricas.totalVoluntarios}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm">Usuarios Totales</p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-crecimiento-400 animate-pulse" />
        </div>

        {/* Tarjeta Equipos (Verde/Crecimiento) */}
        <div className="relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(164,198,57,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(164,198,57,0.25)] hover:-translate-y-1">
          <div className="h-14 w-14 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
            <Building2 className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">
            {metricas.totalEquipos}
          </h3>
          <p className="font-outfit font-medium text-neutro-piedra text-sm">Equipos/Zonas</p>
          <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-crecimiento-400 animate-pulse" />
        </div>
      </div>

      {/* ─── Sesiones activas hoy ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-crecimiento-50 flex items-center justify-center text-crecimiento-600">
              <Activity className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-quicksand font-bold text-neutro-carbon text-lg leading-tight">
                Sesiones de hoy
              </h2>
              <p className="font-outfit text-xs text-neutro-piedra">
                Actualiza cada 30 segundos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-quicksand font-bold text-2xl text-neutro-carbon">
              {sesionesHoy.length}
            </span>
            <button
              onClick={() => refetchSesionesHoy()}
              className="p-2 rounded-xl hover:bg-white/60 transition-colors text-neutro-piedra hover:text-neutro-carbon"
              title="Actualizar"
            >
              <Timer className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {sesionesHoy.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 text-center shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-neutro-piedra/10 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-5 h-5 text-neutro-piedra" strokeWidth={2} />
            </div>
            <p className="font-outfit text-neutro-piedra text-sm">No hay sesiones registradas hoy</p>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 overflow-hidden shadow-[0_8px_32px_-8px_rgba(164,198,57,0.12)]">
            {/* Barra de resumen */}
            <div className="px-5 py-3 bg-crecimiento-50/60 border-b border-white/60 flex items-center gap-4 flex-wrap">
              {(['individual', 'con_padres', 'grupal'] as const).map(tipo => {
                const count = sesionesHoy.filter((s: any) => (s.tipo_sesion || 'individual') === tipo).length;
                if (count === 0) return null;
                const labels = { individual: '🧒 Individual', con_padres: '👨‍👩‍👧 Con familia', grupal: '👥 Grupal' };
                return (
                  <span key={tipo} className="font-outfit text-xs font-semibold text-neutro-carbon bg-white/70 px-3 py-1 rounded-full border border-white/60">
                    {labels[tipo]}: <span className="text-crecimiento-700">{count}</span>
                  </span>
                );
              })}
              <span className="ml-auto font-outfit text-xs text-neutro-piedra">
                {sesionesHoy.reduce((acc: number, s: any) => acc + (s.duracion_minutos || 0), 0)} min totales
              </span>
            </div>

            {/* Lista de sesiones */}
            <div className="divide-y divide-white/60 max-h-72 overflow-y-auto">
              {sesionesHoy.map((sesion: any) => {
                const nino = Array.isArray(sesion.ninos) ? sesion.ninos[0] : sesion.ninos;
                const prof = Array.isArray(sesion.perfiles) ? sesion.perfiles[0] : sesion.perfiles;
                const tipo = sesion.tipo_sesion || 'individual';
                const tipoEmoji = tipo === 'con_padres' ? '👨‍👩‍👧' : tipo === 'grupal' ? '👥' : '🧒';
                const hora = new Date(sesion.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={sesion.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/40 transition-colors">
                    <span className="text-xl flex-shrink-0">{tipoEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-outfit font-semibold text-neutro-carbon text-sm truncate">
                        {nino?.alias || '—'}
                        {nino?.rango_etario && (
                          <span className="ml-1.5 text-xs font-normal text-neutro-piedra">
                            ({nino.rango_etario})
                          </span>
                        )}
                      </p>
                      <p className="font-outfit text-xs text-neutro-piedra truncate">
                        {prof ? `${prof.nombre || ''} ${prof.apellido || ''}`.trim() : '—'}
                        {prof?.rol && (
                          <span className="ml-1.5 opacity-70">· {prof.rol}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-outfit text-xs font-semibold text-neutro-carbon">{hora}</p>
                      {sesion.duracion_minutos > 0 && (
                        <p className="font-outfit text-[10px] text-neutro-piedra">{sesion.duracion_minutos} min</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Menú de opciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/dashboard/ninos"
          className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_8px_32px_-8px_rgba(230,57,70,0.12)] hover:shadow-[0_16px_48px_-8px_rgba(230,57,70,0.2)] hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-2xl bg-impulso-50 flex items-center justify-center mb-4 text-impulso-500 group-hover:scale-110 transition-transform">
            <Baby className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-2">
            Gestionar Niños
          </h3>
          <p className="font-outfit text-sm text-neutro-piedra">
            Perfiles, evaluaciones y planes de intervención
          </p>
        </Link>

        <Link
          href="/dashboard/sesiones"
          className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_8px_32px_-8px_rgba(242,201,76,0.12)] hover:shadow-[0_16px_48px_-8px_rgba(242,201,76,0.2)] hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-2xl bg-sol-50 flex items-center justify-center mb-4 text-sol-500 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-2">
            Historial de Sesiones
          </h3>
          <p className="font-outfit text-sm text-neutro-piedra">
            Ver y analizar todas las sesiones registradas
          </p>
        </Link>

        <Link
          href="/dashboard/usuarios"
          className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_8px_32px_-8px_rgba(164,198,57,0.12)] hover:shadow-[0_16px_48px_-8px_rgba(164,198,57,0.2)] hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
            <UserCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-2">
            Gestión de Usuarios
          </h3>
          <p className="font-outfit text-sm text-neutro-piedra">
            Crear, editar y asignar roles a usuarios
          </p>
        </Link>

        <Link
          href="/dashboard/equipos"
          className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_8px_32px_-8px_rgba(164,198,57,0.12)] hover:shadow-[0_16px_48px_-8px_rgba(164,198,57,0.2)] hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500 group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-2">
            Equipos/Zonas
          </h3>
          <p className="font-outfit text-sm text-neutro-piedra">
            Gestionar equipos y asignaciones
          </p>
        </Link>

        <Link
          href="/dashboard/biblioteca"
          className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_8px_32px_-8px_rgba(242,201,76,0.12)] hover:shadow-[0_16px_48px_-8px_rgba(242,201,76,0.2)] hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-2xl bg-sol-50 flex items-center justify-center mb-4 text-sol-500 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-2">
            Biblioteca
          </h3>
          <p className="font-outfit text-sm text-neutro-piedra">
            Documentos psicopedagógicos y sistema RAG
          </p>
        </Link>

        <Link
          href="/dashboard/configuracion"
          className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-lg shadow-neutro-piedra/5 hover:shadow-neutro-piedra/10 hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-2xl bg-neutro-piedra/10 flex items-center justify-center mb-4 text-neutro-piedra group-hover:scale-110 transition-transform">
            <Settings className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-2">
            Configuración
          </h3>
          <p className="font-outfit text-sm text-neutro-piedra">
            Ajustes del sistema y preferencias
          </p>
        </Link>

        <Link
          href="/dashboard/metricas"
          className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-[0_8px_32px_-8px_rgba(20,184,166,0.12)] hover:shadow-[0_16px_48px_-8px_rgba(20,184,166,0.2)] hover:-translate-y-1"
        >
          <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 text-teal-500 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-2">
            Métricas Generales
          </h3>
          <p className="font-outfit text-sm text-neutro-piedra">
            Estadísticas globales de toda la plataforma
          </p>
        </Link>
      </div>
    </div>
  );
}
