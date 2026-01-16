'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UsuarioEdit {
  email: string;
  nombre: string;
  apellido: string;
  rol: 'voluntario' | 'coordinador' | 'psicopedagogia' | 'admin';
  equipo: string;
  telefono: string;
  zona_id: string | null;
}

interface Zona {
  id: string;
  nombre: string;
}

export default function EditarUsuarioPage() {
  const { user, perfil } = useAuth();
  const router = useRouter();
  const params = useParams();
  const usuarioId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [formData, setFormData] = useState<UsuarioEdit>({
    email: '',
    nombre: '',
    apellido: '',
    rol: 'voluntario',
    equipo: '',
    telefono: '',
    zona_id: null,
  });

  useEffect(() => {
    if (!user || perfil?.rol !== 'admin') {
      router.push('/dashboard');
      return;
    }

    cargarUsuario();
    cargarZonas();
  }, [user, perfil]);

  const cargarZonas = async () => {
    const { data } = await supabase.from('zonas').select('id, nombre').order('nombre');
    if (data) setZonas(data);
  };

  const cargarUsuario = async () => {
    try {
      setLoading(true);

      // Obtener perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol, zona_id, metadata')
        .eq('id', usuarioId)
        .single();

      if (perfilError) throw perfilError;

      // Obtener email de auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/usuarios?id=${usuarioId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const { usuario } = await response.json();

      setFormData({
        email: usuario.email || '',
        nombre: perfilData.metadata?.nombre || '',
        apellido: perfilData.metadata?.apellido || '',
        rol: perfilData.rol,
        equipo: perfilData.metadata?.equipo || '',
        telefono: perfilData.metadata?.telefono || '',
        zona_id: perfilData.zona_id,
      });

    } catch (error) {
      console.error('Error cargando usuario:', error);
      alert('Error al cargar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.rol) {
      alert('Nombre y rol son obligatorios');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('perfiles')
        .update({
          rol: formData.rol,
          zona_id: formData.zona_id,
          metadata: {
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono,
            equipo: formData.equipo,
          },
        })
        .eq('id', usuarioId);

      if (error) throw error;

      alert('Usuario actualizado exitosamente');
      router.push('/dashboard/usuarios');

    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Usuario
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          {/* Email (solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Apellido
            </label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rol *
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="voluntario">Voluntario</option>
              <option value="coordinador">Coordinador</option>
              <option value="psicopedagogia">Psicopedagogía</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Equipo/Zona */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Equipo/Zona
            </label>
            <select
              value={formData.zona_id || ''}
              onChange={(e) => {
                const zonaId = e.target.value || null;
                const zonaNombre = zonas.find(z => z.id === zonaId)?.nombre || '';
                setFormData({ 
                  ...formData, 
                  zona_id: zonaId,
                  equipo: zonaNombre
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Sin equipo</option>
              {zonas.map(zona => (
                <option key={zona.id} value={zona.id}>{zona.nombre}</option>
              ))}
            </select>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/usuarios')}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
