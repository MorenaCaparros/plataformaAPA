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

      // Total voluntarios
      const { count: countVoluntarios } = await supabase
        .from('perfiles')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'voluntario');

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

      setMetricas({
        totalNinos: countNinos || 0,
        totalSesiones: countSesiones || 0,
        totalVoluntarios: countVoluntarios || 0,
        totalEquipos: countEquipos || 0,
        sesionesEsteMes: countSesionesMes || 0,
        ninosSinSesiones,
      });
    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  };

  return (
    <div>
      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Niños</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metricas.totalNinos}
              </p>
            </div>
            <Baby className="w-10 h-10 text-pink-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{metricas.ninosSinSesiones} sin sesiones</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metricas.totalSesiones}
              </p>
            </div>
            <FileText className="w-10 h-10 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{metricas.sesionesEsteMes} este mes</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Voluntarios</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metricas.totalVoluntarios}
              </p>
            </div>
            <UserCheck className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Equipos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metricas.totalEquipos}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Menú de opciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/dashboard/ninos"
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <Baby className="w-12 h-12 mb-3 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Gestionar Niños
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Perfiles, evaluaciones y planes de intervención
          </p>
        </Link>

        <Link
          href="/dashboard/sesiones"
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <Users className="w-12 h-12 mb-3 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Historial de Sesiones
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ver y analizar todas las sesiones registradas
          </p>
        </Link>

        <Link
          href="/dashboard/usuarios"
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <UserCheck className="w-12 h-12 mb-3 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Gestión de Usuarios
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Crear, editar y asignar roles a usuarios
          </p>
        </Link>

        <Link
          href="/dashboard/equipos"
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <Building2 className="w-12 h-12 mb-3 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Equipos/Zonas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestionar equipos y asignaciones
          </p>
        </Link>

        <Link
          href="/dashboard/biblioteca"
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <BookOpen className="w-12 h-12 mb-3 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Biblioteca
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Documentos psicopedagógicos y sistema RAG
          </p>
        </Link>

        <Link
          href="/dashboard/configuracion"
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <Settings className="w-12 h-12 mb-3 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Configuración
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ajustes del sistema y preferencias
          </p>
        </Link>
      </div>
    </div>
  );
}
