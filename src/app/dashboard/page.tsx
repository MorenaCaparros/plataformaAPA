'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import VoluntarioDashboard from '@/components/dashboard/VoluntarioDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const { user, perfil, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
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
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Plataforma APA
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {perfil?.rol}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm sm:text-base touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Dashboard específico por rol */}
        {perfil?.rol === 'voluntario' ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Hola, voluntario/a! 👋
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Acá podés ver tus niños asignados y registrar sesiones fácilmente desde tu celular
              </p>
            </div>
            <VoluntarioDashboard userId={user?.id || ''} />
          </>
        ) : perfil?.rol === 'admin' ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Panel de Administración 🔧
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Gestión completa de la plataforma APA
              </p>
            </div>
            <AdminDashboard />
          </>
        ) : (
          <>
            {/* Dashboard original para otros roles */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Bienvenido/a al Dashboard
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                    Email:
                  </span>
                  <span className="text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {user?.email}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                    Rol:
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {perfil?.rol}
                  </span>
                </div>

                {perfil?.zona_id && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                      Zona:
                    </span>
                    <span className="text-gray-900 dark:text-white text-sm sm:text-base">
                      {perfil.zona_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Niños - Para coordinadores y otros roles */}
              <a
                href="/dashboard/ninos"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-shadow cursor-pointer group active:scale-98 min-h-[120px] flex flex-col justify-center touch-manipulation"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  👦 Niños
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Gestionar perfiles y evaluaciones
                </p>
              </a>

              {/* Historial */}
              <a
                href="/dashboard/sesiones"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-shadow cursor-pointer group active:scale-98 min-h-[120px] flex flex-col justify-center touch-manipulation"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  📝 Sesiones
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  Historial y análisis de sesiones
                </p>
              </a>

              {/* Biblioteca - Solo psicopedagogía y admin */}
              {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
                <a
                  href="/dashboard/biblioteca"
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-2xl transition-shadow cursor-pointer group active:scale-98 min-h-[120px] flex flex-col justify-center touch-manipulation"
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    📚 Biblioteca con IA
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
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
