'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ArrowLeft, FileText, Calendar, Clock } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-sol-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando historial...</p>
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
                Historial
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Filtros flotantes */}
        <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] p-6 mb-6 space-y-5">
          {/* Búsqueda por nombre/apellido */}
          <div>
            <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
              Buscar por nombre o apellido
            </label>
            <input
              type="text"
              placeholder="Ej: Lucas, González, etc."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] placeholder:text-neutro-piedra/60 transition-all"
            />
          </div>

          {/* Filtro por niño */}
          <div>
            <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
              Filtrar por niño
            </label>
            <select
              value={filtroNino}
              onChange={(e) => setFiltroNino(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] transition-all"
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
            <div className="px-4 py-2 bg-sol-50/50 backdrop-blur-sm border border-sol-200/30 rounded-2xl inline-block">
              <span className="text-sm text-neutro-piedra font-outfit">
                Mostrando <span className="font-semibold text-neutro-carbon">{sesionesFiltradas.length}</span> de <span className="font-semibold text-neutro-carbon">{sesiones.length}</span> sesiones
              </span>
            </div>
          )}
        </div>

        {/* Lista de sesiones */}
        {sesionesFiltradas.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sol-400/20 to-crecimiento-400/20 flex items-center justify-center">
                <FileText className="w-12 h-12 text-sol-600" />
              </div>
              <p className="text-neutro-carbon font-outfit text-lg mb-6">No hay sesiones registradas todavía.</p>
              <Link
                href="/dashboard/ninos"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[56px] bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all font-outfit font-semibold shadow-[0_4px_16px_rgba(242,201,76,0.15)] active:scale-95"
              >
                Registrar primera sesión
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {sesionesFiltradas.map((sesion) => (
              <div key={sesion.id} className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 transition-all duration-300 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] hover:-translate-y-0.5 active:scale-[0.99]">
                <Link href={`/dashboard/sesiones/${sesion.id}`} className="block p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-neutro-carbon font-quicksand mb-1">{sesion.ninos.alias}</h3>
                      <p className="text-sm text-neutro-piedra font-outfit">{sesion.ninos.rango_etario} años</p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <p className="text-sm font-medium text-neutro-carbon font-outfit">{formatFecha(sesion.fecha)}</p>
                      <span className="px-3 py-1 bg-sol-50 text-sol-700 text-xs font-semibold font-outfit rounded-2xl border border-sol-200/30">
                        {sesion.duracion_minutos} min
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-neutro-piedra mb-2 font-outfit">Promedio general</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-neutro-lienzo rounded-full h-3 overflow-hidden border border-sol-200/30">
                        <div 
                          className="bg-gradient-to-r from-sol-400 to-crecimiento-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(242,201,76,0.4)]"
                          style={{ width: `${(parseFloat(String(calcularPromedio(sesion.items))) / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-base font-bold text-neutro-carbon font-quicksand min-w-[3rem] text-right">
                        {calcularPromedio(sesion.items)}/5
                      </span>
                    </div>
                  </div>

                  {sesion.observaciones_libres && (
                    <div className="mt-4 pt-4 border-t border-white/60">
                      <p className="text-xs text-neutro-piedra mb-2 font-outfit font-medium">Observaciones:</p>
                      <p className="text-sm text-neutro-carbon font-outfit line-clamp-2">
                        {sesion.observaciones_libres}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 text-right">
                    <span className="text-sm text-sol-600 font-medium font-outfit group-hover:text-crecimiento-600 transition-colors">
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
