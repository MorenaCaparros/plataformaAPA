'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Sesion {
  id: string;
  fecha: string;
  duracion_minutos: number;
  observaciones_libres: string;
  items: any[];
  ninos: {
    id?: string;
    alias: string;
    rango_etario: string;
    metadata?: {
      nombre_completo?: string;
      apellido?: string;
      numero_legajo?: string;
    };
  };
}

// Función helper para normalizar texto (quitar acentos)
const normalizarTexto = (texto: string) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export default function HistorialPage() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNino, setFiltroNino] = useState<string>('todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  const [ninos, setNinos] = useState<Array<{ id: string; alias: string }>>([]);

  useEffect(() => {
    if (user && perfil) {
      fetchNinos();
      fetchSesiones();
    }
  }, [user, perfil]);

  const fetchNinos = async () => {
    try {
      if (perfil?.rol === 'voluntario') {
        // Voluntario: solo sus niños asignados
        const { data } = await supabase
          .from('nino_voluntarios')
          .select(`
            nino_id,
            ninos (
              id,
              alias
            )
          `)
          .eq('voluntario_id', user?.id)
          .eq('activo', true);

        const ninosData = data?.map((item: any) => ({
          id: item.ninos.id,
          alias: item.ninos.alias
        })) || [];
        
        setNinos(ninosData);
      } else {
        // Director, psico, coordinador: todos los niños
        const { data, error } = await supabase
          .from('ninos')
          .select('id, alias')
          .order('alias', { ascending: true });

        if (error) throw error;
        setNinos(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSesiones = async () => {
    try {
      let query = supabase
        .from('sesiones')
        .select(`
          id,
          fecha,
          duracion_minutos,
          observaciones_libres,
          items,
          voluntario_id,
          perfiles!sesiones_voluntario_id_fkey (
            id,
            metadata
          ),
          ninos (
            id,
            alias,
            rango_etario,
            metadata
          )
        `)
        .order('fecha', { ascending: false });

      // Solo filtrar por voluntario_id si el rol es 'voluntario'
      if (perfil?.rol === 'voluntario') {
        query = query.eq('voluntario_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSesiones(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar sesiones
  const sesionesFiltradas = sesiones.filter(sesion => {
    // Filtro por niño específico
    if (filtroNino !== 'todos') {
      const ninoEncontrado = ninos.find(n => n.alias === sesion.ninos.alias);
      if (ninoEncontrado?.id !== filtroNino) return false;
    }

    // Filtro por búsqueda (nombre, apellido o alias) - sin acentos
    if (filtroBusqueda) {
      const busqueda = normalizarTexto(filtroBusqueda);
      const alias = normalizarTexto(sesion.ninos.alias || '');
      const metadata = (sesion.ninos as any).metadata || {};
      const nombreCompleto = normalizarTexto(metadata.nombre_completo || '');
      const apellido = normalizarTexto(metadata.apellido || '');

      return (
        alias.includes(busqueda) ||
        nombreCompleto.includes(busqueda) ||
        apellido.includes(busqueda)
      );
    }

    return true;
  });

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularPromedio = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + (item.valor || 0), 0);
    return (sum / items.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-blue-600 font-medium text-sm sm:text-base min-h-[44px] flex items-center">
              ← Volver
            </Link>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Historial</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 space-y-4">
          {/* Búsqueda por nombre/apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nombre o apellido
            </label>
            <input
              type="text"
              placeholder="Ej: Lucas, González, etc."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por niño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por niño
            </label>
            <select
              value={filtroNino}
              onChange={(e) => setFiltroNino(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los niños ({sesiones.length})</option>
              {ninos.map(nino => (
                <option key={nino.id} value={nino.id}>
                  {nino.alias} ({sesiones.filter(s => s.ninos.alias === nino.alias).length})
                </option>
              ))}
            </select>
          </div>

          {/* Contador de resultados */}
          {(filtroNino !== 'todos' || filtroBusqueda) && (
            <div className="text-sm text-gray-600">
              Mostrando {sesionesFiltradas.length} de {sesiones.length} sesiones
            </div>
          )}
        </div>

        {/* Lista de sesiones */}
        {sesionesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No hay sesiones registradas todavía.</p>
            <Link
              href="/dashboard/ninos"
              className="inline-block mt-4 px-6 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95"
            >
              Registrar primera sesión
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sesionesFiltradas.map((sesion) => (
              <div key={sesion.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
                <Link href={`/dashboard/sesiones/${sesion.id}`} className="block p-4 sm:p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">{sesion.ninos.alias}</h3>
                      <p className="text-sm text-gray-500">{sesion.ninos.rango_etario} años</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatFecha(sesion.fecha)}</p>
                      <p className="text-xs text-gray-500">{sesion.duracion_minutos} min</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Promedio general</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(parseFloat(String(calcularPromedio(sesion.items))) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {calcularPromedio(sesion.items)}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {sesion.observaciones_libres && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Observaciones:</p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {sesion.observaciones_libres}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 text-right">
                    <span className="text-sm text-blue-600 font-medium">
                      Ver detalle →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
