'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import VoluntarioDashboard from '@/components/dashboard/VoluntarioDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PsicopedagogiaDashboard from '@/components/dashboard/PsicopedagogiaDashboard';
import EquipoProfesionalDashboard from '@/components/dashboard/EquipoProfesionalDashboard';
import DashboardNavCard from '@/components/dashboard/ui/DashboardNavCard';
import DashboardHeader from '@/components/dashboard/ui/DashboardHeader';
import { Baby, FileText, BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const { user, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crecimiento-400 mx-auto mb-4"></div>
          <p className="font-outfit text-neutro-piedra">Cargando...</p>
        </div>
      </div>
    );
  }

  const rol = perfil?.rol;

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Voluntario */}
        {rol === 'voluntario' ? (
          <>
            <div className="mb-6">
              <h2 className="font-quicksand text-3xl font-bold text-neutro-carbon mb-2">
                ¡Hola, voluntario/a! 👋
              </h2>
              <p className="font-outfit text-neutro-piedra">
                Acá podés ver tus niños asignados y registrar sesiones fácilmente desde tu celular
              </p>
            </div>
            <VoluntarioDashboard userId={user?.id || ''} />
          </>

        /* Admin / Director */
        ) : rol === 'director' || rol === 'admin' ? (
          <AdminDashboard />

        /* Psicopedagogía — dashboard especializado */
        ) : rol === 'psicopedagogia' ? (
          <PsicopedagogiaDashboard />

        /* Coordinador, Equipo Profesional, Trabajador/a Social */
        ) : rol === 'coordinador' || rol === 'trabajador_social' || rol === 'trabajadora_social' || rol === 'equipo_profesional' ? (
          <EquipoProfesionalDashboard
            title={
              rol === 'coordinador' ? 'Panel de Coordinación 📊' :
              rol === 'trabajador_social' || rol === 'trabajadora_social' ? 'Panel de Trabajo Social 🤝' :
              'Panel de Profesionales 🎯'
            }
          />

        /* Fallback para cualquier rol no mapeado */
        ) : (
          <>
            <DashboardHeader
              title="Bienvenido/a al Dashboard"
              subtitle={`Sesión iniciada como: ${perfil?.rol ?? user?.email}`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardNavCard
                href="/dashboard/ninos"
                icon={Baby}
                title="Niños"
                description="Gestionar perfiles y evaluaciones"
                colorClass="impulso"
              />
              <DashboardNavCard
                href="/dashboard/sesiones"
                icon={FileText}
                title="Sesiones"
                description="Historial y análisis de sesiones"
                colorClass="sol"
              />
              {(rol === 'psicopedagogia' || rol === 'director') && (
                <DashboardNavCard
                  href="/dashboard/biblioteca"
                  icon={BookOpen}
                  title="Biblioteca con IA"
                  description="Documentos y chat con IA"
                  colorClass="sol"
                />
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
