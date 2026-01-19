'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ConfiguracionPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      // Solo director (administrador) puede acceder
      if (perfil?.rol !== 'director') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, user, perfil, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-base sm:text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 transition min-h-[44px] flex items-center">
              ← Volver
            </Link>
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
              Configuración
            </h1>
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sistema */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Versión:</span>
                <span className="font-semibold text-gray-900 dark:text-white">1.0.0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Entorno:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {process.env.NODE_ENV}
                </span>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                Ver logs del sistema
              </button>
            </div>
          </div>

          {/* Base de datos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">💾</span>
              Base de Datos
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                Exportar datos
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                Crear backup manual
              </button>
              <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium">
                Restaurar backup
              </button>
            </div>
          </div>

          {/* Evaluaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Sistema de Evaluación
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                Gestionar áreas de evaluación
              </button>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                Gestionar habilidades
              </button>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                Configurar escalas
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              Notificaciones
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Alertas de sistema</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Recordatorios</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              Seguridad y Privacidad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                Ver log de accesos
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                Auditoría de permisos
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                Configurar RLS
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                Gestionar claves de encriptación
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
