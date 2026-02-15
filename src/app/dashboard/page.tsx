'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import VoluntarioDashboard from '@/components/dashboard/VoluntarioDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import EquipoProfesionalDashboard from '@/components/dashboard/EquipoProfesionalDashboard';

export default function DashboardPage() {
  const { user, perfil, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

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

  // 🔍 DEBUG: Ver qué datos tenemos
  console.log('🔍 Dashboard Debug:', {
    user: user?.id,
    email: user?.email,
    perfil: perfil,
    rol: perfil?.rol,
    loading
  });

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 bg-white/60 backdrop-blur-lg border-b border-sol-400/20" style={{ zIndex: 30 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="lg:flex-1">
              <h1 className="font-quicksand text-xl font-bold text-neutro-carbon ml-16 lg:ml-0">
                Plataforma APA
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-crecimiento-50 text-crecimiento-700 border border-crecimiento-400/30">
                {perfil?.rol}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gradient-to-r from-impulso-400 to-impulso-500 hover:shadow-glow-impulso text-white font-medium rounded-2xl transition-all duration-200 text-sm"
                style={{ minHeight: '44px' }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard específico por rol */}
        {perfil?.rol === 'voluntario' ? (
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
        ) : perfil?.rol === 'director' || perfil?.rol === 'admin' ? (
          <AdminDashboard />
        ) : perfil?.rol === 'psicopedagogia' || perfil?.rol === 'coordinador' || perfil?.rol === 'trabajador_social' ? (
          <EquipoProfesionalDashboard 
            title={
              perfil?.rol === 'psicopedagogia' ? 'Panel de Profesionales 🎯' :
              perfil?.rol === 'coordinador' ? 'Panel de Coordinación 📊' :
              'Panel de Trabajo Social 🤝'
            }
          />
        ) : (
          <>
            {/* Dashboard original para otros roles */}
            <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-8 mb-8 shadow-xl">
              <h2 className="font-quicksand text-3xl font-bold text-neutro-carbon mb-6">
                Bienvenido/a al Dashboard
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-outfit text-neutro-piedra font-medium">
                    Email:
                  </span>
                  <span className="font-outfit text-neutro-carbon truncate">
                    {user?.email}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-outfit text-neutro-piedra font-medium">
                    Rol:
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-crecimiento-50 text-crecimiento-700 border border-crecimiento-400/30">
                    {perfil?.rol}
                  </span>
                </div>

                {perfil?.zona_id && (
                  <div className="flex items-center gap-3">
                    <span className="font-outfit text-neutro-piedra font-medium">
                      Zona:
                    </span>
                    <span className="font-outfit text-neutro-carbon">
                      {perfil.zona_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Niños - Para coordinadores y otros roles */}
              <a
                href="/dashboard/ninos"
                className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-xl shadow-impulso-500/5 hover:shadow-impulso-500/10 hover:-translate-y-1 flex flex-col justify-center touch-manipulation"
              >
                <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2 group-hover:text-impulso-600 transition">
                  👦 Niños
                </h3>
                <p className="font-outfit text-neutro-piedra text-sm">
                  Gestionar perfiles y evaluaciones
                </p>
              </a>

              {/* Historial */}
              <a
                href="/dashboard/sesiones"
                className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-xl shadow-sol-500/5 hover:shadow-sol-500/10 hover:-translate-y-1 flex flex-col justify-center touch-manipulation"
              >
                <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2 group-hover:text-sol-600 transition">
                  📝 Sesiones
                </h3>
                <p className="font-outfit text-neutro-piedra text-sm">
                  Historial y análisis de sesiones
                </p>
              </a>

              {/* Biblioteca - Solo profesionales y director */}
              {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
                <a
                  href="/dashboard/biblioteca"
                  className="group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 shadow-xl shadow-sol-500/5 hover:shadow-sol-500/10 hover:-translate-y-1 flex flex-col justify-center touch-manipulation"
                >
                  <h3 className="font-quicksand text-xl font-semibold text-neutro-carbon mb-2 group-hover:text-sol-600 transition">
                    📚 Biblioteca con IA
                  </h3>
                  <p className="font-outfit text-neutro-piedra text-sm">
                    Documentos y chat con IA
                  </p>
                </a>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
