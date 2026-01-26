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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-crecimiento-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar flotante */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <span className="text-lg">←</span>
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand">
                Configuración
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sistema */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] transition-all">
            <h3 className="text-xl font-bold text-neutro-carbon mb-5 flex items-center gap-3 font-quicksand">
              <span className="text-3xl">⚙️</span>
              Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-white/40">
                <span className="text-neutro-piedra font-outfit">Versión:</span>
                <span className="font-semibold text-neutro-carbon font-outfit">1.0.0</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/40">
                <span className="text-neutro-piedra font-outfit">Entorno:</span>
                <span className="font-semibold text-neutro-carbon font-outfit">
                  {process.env.NODE_ENV}
                </span>
              </div>
              <button className="w-full mt-4 px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Ver logs del sistema
              </button>
            </div>
          </div>

          {/* Base de datos */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] transition-all">
            <h3 className="text-xl font-bold text-neutro-carbon mb-5 flex items-center gap-3 font-quicksand">
              <span className="text-3xl">💾</span>
              Base de Datos
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all font-medium font-outfit min-h-[56px] shadow-[0_4px_16px_rgba(242,201,76,0.15)] active:scale-95">
                Exportar datos
              </button>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-medium font-outfit min-h-[56px] shadow-[0_4px_16px_rgba(164,198,57,0.15)] active:scale-95">
                Crear backup manual
              </button>
              <button className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Restaurar backup
              </button>
            </div>
          </div>

          {/* Evaluaciones */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] transition-all">
            <h3 className="text-xl font-bold text-neutro-carbon mb-5 flex items-center gap-3 font-quicksand">
              <span className="text-3xl">📊</span>
              Sistema de Evaluación
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Gestionar áreas de evaluación
              </button>
              <button className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Gestionar habilidades
              </button>
              <button className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Configurar escalas
              </button>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] transition-all">
            <h3 className="text-xl font-bold text-neutro-carbon mb-5 flex items-center gap-3 font-quicksand">
              <span className="text-3xl">🔔</span>
              Notificaciones
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/40">
                <span className="text-neutro-piedra font-outfit">Alertas de sistema</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-neutro-lienzo peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-crecimiento-300/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutro-piedra/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crecimiento-400"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-neutro-piedra font-outfit">Recordatorios</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-neutro-lienzo peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-crecimiento-300/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutro-piedra/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crecimiento-400"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 md:col-span-2 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] transition-all">
            <h3 className="text-xl font-bold text-neutro-carbon mb-5 flex items-center gap-3 font-quicksand">
              <span className="text-3xl">🔒</span>
              Seguridad y Privacidad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Ver log de accesos
              </button>
              <button className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Auditoría de permisos
              </button>
              <button className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Configurar RLS
              </button>
              <button className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-medium font-outfit min-h-[56px] active:scale-95">
                Gestionar claves de encriptación
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
