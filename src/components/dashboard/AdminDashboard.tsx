'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, FileText, UserCheck, Building2, BookOpen, Settings, Baby } from 'lucide-react';

export default function AdminDashboard() {
  const { user, perfil } = useAuth();
  const router = useRouter();
  const [metricas, setMetricas] = useState({
    totalNinos: 0,
    totalSesiones: 0,
    totalVoluntarios: 0,
    totalEquipos: 0,
    sesionesEsteMes: 0,
    ninosSinSesiones: 0,
  });

  useEffect(() => {
    if (user) {
      cargarMetricas();
    }
  }, [user]);

  const cargarMetricas = async () => {
    try {
      console.log('🔍 Cargando métricas del dashboard...');
      
      // Total niños
      const { count: countNinos, error: errorNinos } = await supabase
        .from('ninos')
        .select('*', { count: 'exact', head: true });
      
      console.log('Total niños:', countNinos, errorNinos ? `Error: ${errorNinos.message}` : '✅');

      // Total sesiones
      const { count: countSesiones, error: errorSesiones } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true });
      
      console.log('Total sesiones:', countSesiones, errorSesiones ? `Error: ${errorSesiones.message}` : '✅');

      // Sesiones este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { count: countSesionesMes } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', inicioMes.toISOString());

      // Total usuarios (todos los perfiles)
      const { count: countVoluntarios } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true });

      // Total equipos
      const { count: countEquipos } = await supabase
        .from('zonas')
        .select('*', { count: 'exact', head: true });

      // Niños sin sesiones
      const { data: todosNinos } = await supabase
        .from('ninos')
        .select('id');

      let ninosSinSesiones = 0;
      if (todosNinos) {
        for (const nino of todosNinos) {
          const { count } = await supabase
            .from('sesiones')
            .select('*', { count: 'exact', head: true })
            .eq('nino_id', nino.id);
          if (count === 0) ninosSinSesiones++;
        }
      }

      const metricas = {
        totalNinos: countNinos || 0,
        totalSesiones: countSesiones || 0,
        totalVoluntarios: countVoluntarios || 0,
        totalEquipos: countEquipos || 0,
        sesionesEsteMes: countSesionesMes || 0,
        ninosSinSesiones,
      };
      
      console.log('📊 Métricas finales:', metricas);
      setMetricas(metricas);
    } catch (error) {
      console.error('❌ Error cargando métricas:', error);
    }
  };

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
      </div>
    </div>
  );
}
