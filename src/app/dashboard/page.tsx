'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import TourGuide, { TourStep } from '@/components/ui/TourGuide';
import VoluntarioDashboard from '@/components/dashboard/VoluntarioDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PsicopedagogiaDashboard from '@/components/dashboard/PsicopedagogiaDashboard';
import EquipoProfesionalDashboard from '@/components/dashboard/EquipoProfesionalDashboard';
import DashboardNavCard from '@/components/dashboard/ui/DashboardNavCard';
import DashboardHeader from '@/components/dashboard/ui/DashboardHeader';
import { Baby, FileText, BookOpen } from 'lucide-react';
import Link from 'next/link';

/* ─── Atajos rápidos para mobile ────────────────────────────────────── */
interface Shortcut { href: string; emoji: string; label: string }

function MobileShortcuts({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <div className="lg:hidden overflow-x-auto scrollbar-none -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2 mb-5">
      <div className="flex gap-3 w-max">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex flex-col items-center gap-1.5 min-w-[72px] max-w-[72px] px-1 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-2xl leading-none">{s.emoji}</span>
            <span className="text-[10px] font-outfit font-semibold text-neutro-carbon text-center leading-tight tracking-tight">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Shortcuts por rol ──────────────────────────────────────────────── */
const SHORTCUTS: Record<string, Shortcut[]> = {
  voluntario: [
    { href: '/dashboard/ninos', emoji: '👧', label: 'Mis Niños' },
    { href: '/dashboard/sesiones', emoji: '📝', label: 'Sesiones' },
    { href: '/dashboard/asistencia', emoji: '✅', label: 'Asistencia' },
    { href: '/dashboard/autoevaluaciones', emoji: '🎓', label: 'Caps.' },
    { href: '/dashboard/mi-perfil', emoji: '👤', label: 'Mi Perfil' },
  ],
  equipo: [
    { href: '/dashboard/ninos', emoji: '👧', label: 'Niños' },
    { href: '/dashboard/sesiones', emoji: '📝', label: 'Sesiones' },
    { href: '/dashboard/asignaciones', emoji: '🤝', label: 'Asignaciones' },
    { href: '/dashboard/equipos', emoji: '📍', label: 'Zonas' },
    { href: '/dashboard/ia', emoji: '🧠', label: 'Módulo IA' },
    { href: '/dashboard/metricas', emoji: '📊', label: 'Métricas' },
  ],
  psicopedagogia: [
    { href: '/dashboard/ninos', emoji: '👧', label: 'Niños' },
    { href: '/dashboard/psicopedagogia/evaluaciones', emoji: '📋', label: 'Evaluaciones' },
    { href: '/dashboard/psicopedagogia/planes', emoji: '🎯', label: 'Planes IA' },
    { href: '/dashboard/asignaciones', emoji: '🤝', label: 'Asignaciones' },
    { href: '/dashboard/biblioteca/drive', emoji: '📚', label: 'Biblioteca' },
    { href: '/dashboard/ia', emoji: '🧠', label: 'Módulo IA' },
  ],
  admin: [
    { href: '/dashboard/ninos', emoji: '👧', label: 'Niños' },
    { href: '/dashboard/usuarios', emoji: '👥', label: 'Usuarios' },
    { href: '/dashboard/equipos', emoji: '📍', label: 'Zonas' },
    { href: '/dashboard/metricas', emoji: '📊', label: 'Métricas' },
    { href: '/dashboard/sesiones', emoji: '📝', label: 'Sesiones' },
    { href: '/dashboard/configuracion', emoji: '⚙️', label: 'Config.' },
  ],
};

const TOUR_STEPS: Record<string, TourStep[]> = {
  voluntario: [
    { title: '¡Bienvenido/a! 👋', description: 'Este es tu panel principal. Desde acá podés ver el resumen de tus niños asignados y el estado de tus sesiones recientes.' },
    { title: 'Registrar asistencia ✅', description: 'Antes de cada sesión, registrá si el niño estuvo presente. Encontrás el botón en el menú como "Asistencia".' },
    { title: 'Registrar sesión 📝', description: 'Después de cada encuentro, completá el formulario de sesión. Tarda menos de 5 minutos y nos ayuda a seguir el progreso de cada niño.' },
    { title: 'Mesón lateral 🚶', description: 'Desde el menú lateral (o tocando el ☰ en mobile) podés navegar a todas las secciones: tus niños, sesiones, biblioteca y más.' },
    { title: '¿Neces itás ayuda? ❓', description: 'Cualquier momento podés tocar el botón ❓ para volver a ver esta guía. ¡Éxito!' },
  ],
  admin: [
    { title: 'Panel de administración 📊', description: 'Desde acá tenés una vista general del programa: métricas, usuarios, zonas y estado del sistema.' },
    { title: 'Gestión de usuarios 👥', description: 'En "Usuarios" podés crear, editar y desactivar perfiles. Podés asignar roles y zonas a cada persona.' },
    { title: 'Configuración del sistema ⚙️', description: 'En "Configuración" encontrás los logs de auditoría, términos y condiciones y opciones avanzadas.' },
    { title: '¿Neces itás ayuda? ❓', description: 'Tocá el ❓ cuando quieras para ver esta guía de nuevo.' },
  ],
  equipo: [
    { title: 'Bienvenido/a al panel 👋', description: 'Desde acá podsé coordinar tu equipo, revisar sesiones y monitorear el progreso de los niños en tu zona.' },
    { title: 'Niños y asignaciones 🤝', description: 'En "Asignaciones" podsé ver qué voluntario trabaja con cada niño y ajustar los emparejamientos.' },
    { title: 'Módulo de IA 🧠', description: 'El módulo de IA genera resúmenes automáticos del progreso de los niños y sugiere intervenciones.' },
    { title: '¿Neces itás ayuda? ❓', description: 'Tocá el ❓ cuando quieras para ver esta guía de nuevo.' },
  ],
};

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
          <>
            <AdminDashboard />
          </>

        /* Psicopedagogía — dashboard especializado */
        ) : rol === 'psicopedagogia' ? (
          <>
            <PsicopedagogiaDashboard />
          </>

        /* Coordinador, Equipo Profesional, Trabajador/a Social */
        ) : rol === 'coordinador' || rol === 'trabajador_social' || rol === 'trabajadora_social' || rol === 'equipo_profesional' ? (
          <>
            <EquipoProfesionalDashboard
              title={
                rol === 'coordinador' ? 'Panel de Coordinación 📊' :
                rol === 'trabajador_social' || rol === 'trabajadora_social' ? 'Panel de Trabajo Social 🤝' :
                'Panel de Profesionales 🎯'
              }
            />
          </>

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

      {/* Tour de ayuda por rol */}
      {rol && TOUR_STEPS[rol === 'director' ? 'admin' : rol === 'coordinador' || rol === 'equipo_profesional' || rol === 'trabajador_social' || rol === 'trabajadora_social' ? 'equipo' : rol] && (
        <TourGuide
          tourId={`dashboard-${rol}`}
          steps={TOUR_STEPS[rol === 'director' ? 'admin' : rol === 'coordinador' || rol === 'equipo_profesional' || rol === 'trabajador_social' || rol === 'trabajadora_social' ? 'equipo' : rol]}
          autoStart
        />
      )}
    </div>
  );
}
