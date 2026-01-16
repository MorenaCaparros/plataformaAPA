'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Upload, UserPlus } from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  rol: string;
  zona_id: string | null;
  zona_nombre: string | null;
  created_at: string;
  metadata: any;
}

export default function UsuariosPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const zonaParam = searchParams.get('zona');
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroZona, setFiltroZona] = useState<string>(zonaParam || 'todas');

  useEffect(() => {
    if (!authLoading && user) {
      // Solo admin puede acceder
      if (perfil?.rol !== 'admin' && perfil?.rol !== 'psicopedagogia') {
        router.push('/dashboard');
        return;
      }
      fetchUsuarios();
    }
  }, [authLoading, user, perfil]);

  // Actualizar filtro cuando cambia el parámetro de la URL
  useEffect(() => {
    if (zonaParam) {
      setFiltroZona(zonaParam);
    }
  }, [zonaParam]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);

      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Llamar al API route que tiene acceso a auth.admin
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const { usuarios } = await response.json();
      setUsuarios(usuarios);

    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    // Filtro por rol
    if (filtroRol !== 'todos' && u.rol !== filtroRol) {
      return false;
    }
    // Filtro por zona
    if (filtroZona !== 'todas' && u.zona_id !== filtroZona) {
      return false;
    }
    return true;
  });

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'psicopedagogia':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'coordinador':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'voluntario':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRolNombre = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'psicopedagogia':
        return 'Psicopedagogía';
      case 'coordinador':
        return 'Coordinador';
      case 'voluntario':
        return 'Voluntario';
      default:
        return rol;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
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
              Gestión de Usuarios
            </h1>
            <div className="w-16 sm:w-20"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Opciones de gestión */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <Link
            href="/dashboard/usuarios/importar"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm active:scale-95"
          >
            <Upload className="w-5 h-5" />
            Importar desde CSV
          </Link>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro por rol */}
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[48px]"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="psicopedagogia">Psicopedagogía</option>
              <option value="coordinador">Coordinadores</option>
              <option value="voluntario">Voluntarios</option>
            </select>

            {/* Filtro por zona */}
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[48px]"
            >
              <option value="todas">Todos los equipos</option>
              {[...new Set(usuarios.map(u => u.zona_nombre).filter(Boolean))].map((zona) => (
                <option key={zona} value={usuarios.find(u => u.zona_nombre === zona)?.zona_id || ''}>
                  {zona}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Mostrando {usuariosFiltrados.length} usuarios
          {filtroRol !== 'todos' && ` (${getRolNombre(filtroRol)})`}
          {filtroZona !== 'todas' && ` de ${usuarios.find(u => u.zona_id === filtroZona)?.zona_nombre || 'equipo seleccionado'}`}
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Equipo/Zona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {usuario.metadata?.nombre || 'Sin nombre'} {usuario.metadata?.apellido || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {usuario.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRolBadgeColor(usuario.rol)}`}>
                        {getRolNombre(usuario.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {usuario.zona_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(usuario.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/usuarios/${usuario.id}/editar`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {usuariosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron usuarios con los filtros seleccionados.
          </div>
        )}
      </main>
    </div>
  );
}
