'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Plataforma APA
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Bienvenido/a al Dashboard
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Email:
              </span>
              <span className="text-gray-900 dark:text-white">
                {user?.email}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Rol:
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {perfil?.rol}
              </span>
            </div>

            {perfil?.zona_id && (
              <div className="flex items-center gap-3">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Zona:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {perfil.zona_id}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sesiones
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Registrar nuevas sesiones educativas
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Niños
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ver y gestionar perfiles de niños
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reportes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Generar informes y análisis
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
