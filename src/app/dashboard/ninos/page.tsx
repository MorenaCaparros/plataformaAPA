'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, UserPlus, Plus, Eye, Brain } from 'lucide-react';

// Función helper para normalizar texto (quitar acentos)
const normalizarTexto = (texto: string) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

interface Nino {
  id: string;
  alias: string;
  rango_etario: string;
  nivel_alfabetizacion: string;
  escolarizado: boolean;
  metadata?: {
    nombre_completo?: string;
    apellido?: string;
    numero_legajo?: string;
  };
  zona?: {
    id: string;
    nombre: string;
  } | null;
  total_sesiones: number;
  ultima_sesion: string | null;
}

interface Zona {
  id: string;
  nombre: string;
}

function MisNinosPageContent() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const zonaParam = searchParams.get('zona');
  
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroZona, setFiltroZona] = useState<string>(zonaParam || 'todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Determinar si el usuario tiene acceso completo
  const rolesConAccesoCompleto = ['psicopedagogia', 'director'];
  const tieneAccesoCompleto = perfil?.rol && rolesConAccesoCompleto.includes(perfil.rol);

  useEffect(() => {
    if (!authLoading && user) {
      fetchZonas();
      fetchNinos();
    }
  }, [authLoading, user]);

  // Actualizar filtro cuando cambia el parámetro de la URL
  useEffect(() => {
    if (zonaParam) {
      setFiltroZona(zonaParam);
    }
  }, [zonaParam]);

  const fetchZonas = async () => {
    try {
      const { data, error } = await supabase
        .from('zonas')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setZonas(data || []);
    } catch (error) {
      console.error('Error fetching zonas:', error);
    }
  };

  const fetchNinos = async () => {
    try {
      console.log('Fetching niños para user:', user?.id, 'rol:', perfil?.rol);
      
      // Psicopedagogía, coordinador y director ven TODOS los niños
      const rolesConAccesoTotal = ['psicopedagogia', 'coordinador', 'director'];
      const tieneAccesoTotal = perfil?.rol && rolesConAccesoTotal.includes(perfil.rol);

      let ninosData: any[] = [];

      if (tieneAccesoTotal) {
        // Ver TODOS los niños CON metadata y zona
        const { data, error } = await supabase
          .from('ninos')
          .select(`
            id,
            alias,
            rango_etario,
            nivel_alfabetizacion,
            escolarizado,
            metadata,
            zona_id,
            zonas (
              id,
              nombre
            )
          `)
          .order('alias', { ascending: true });

        if (error) throw error;
        ninosData = data || [];
      } else {
        // Voluntarios: solo ven sus niños asignados
        const { data, error } = await supabase
          .from('nino_voluntarios')
          .select(`
            nino_id,
            ninos (
              id,
              alias,
              rango_etario,
              nivel_alfabetizacion,
              escolarizado
            )
          `)
          .eq('voluntario_id', user?.id)
          .eq('activo', true);

        if (error) throw error;
        ninosData = (data || []).map((item: any) => item.ninos);
      }

      console.log('Niños encontrados:', ninosData.length);

      // Para cada niño, obtener info de sesiones
      const ninosConSesiones = await Promise.all(
        ninosData.map(async (nino: any) => {
          // Contar TODAS las sesiones del niño (no filtrar por voluntario)
          const { data: sesiones } = await supabase
            .from('sesiones')
            .select('id, fecha')
            .eq('nino_id', nino.id)
            .order('fecha', { ascending: false });

          return {
            id: nino.id,
            alias: nino.alias,
            rango_etario: nino.rango_etario,
            nivel_alfabetizacion: nino.nivel_alfabetizacion,
            escolarizado: nino.escolarizado,
            metadata: nino.metadata || {},
            zona: nino.zonas || null,
            total_sesiones: sesiones?.length || 0,
            ultima_sesion: sesiones?.[0]?.fecha || null
          };
        })
      );

      console.log('Niños con sesiones:', ninosConSesiones);
      setNinos(ninosConSesiones || []);
    } catch (error) {
      console.error('Error fetching niños:', error);
    } finally {
      setLoading(false);
    }
  };
  // Filtrar niños
  const ninosFiltrados = ninos.filter(nino => {
    // Filtro por zona
    if (filtroZona !== 'todas' && nino.zona?.id !== filtroZona) {
      return false;
    }

    // Filtro por búsqueda (nombre, apellido, legajo) - sin acentos
    if (filtroBusqueda) {
      const busqueda = normalizarTexto(filtroBusqueda);
      const nombreCompleto = normalizarTexto(nino.metadata?.nombre_completo || '');
      const apellido = normalizarTexto(nino.metadata?.apellido || '');
      const legajo = normalizarTexto(nino.metadata?.numero_legajo || '');
      const alias = normalizarTexto(nino.alias);

      return (
        nombreCompleto.includes(busqueda) ||
        apellido.includes(busqueda) ||
        legajo.includes(busqueda) ||
        alias.includes(busqueda)
      );
    }

    return true;
  });
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-crecimiento-400 mx-auto mb-4"></div>
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
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand">
                Niños
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Botón para registrar nuevo niño + Filtros */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <Link
            href="/dashboard/ninos/nuevo"
            className="inline-flex items-center justify-center gap-2 w-full lg:w-auto px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold shadow-[0_4px_16px_rgba(164,198,57,0.15)] active:scale-95"
          >
            <UserPlus className="w-6 h-6" /> Registrar Nuevo Niño
          </Link>

          {/* Filtros */}
          {tieneAccesoCompleto && (
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Filtro por zona */}
              <select
                value={filtroZona}
                onChange={(e) => setFiltroZona(e.target.value)}
                className="px-4 py-3 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] transition-all"
              >
                <option value="todas">Todos los equipos</option>
                {zonas.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </select>

              {/* Búsqueda */}
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o legajo..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="px-4 py-3 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] w-full sm:w-72 placeholder:text-neutro-piedra/60 transition-all"
              />
            </div>
          )}
        </div>

        {/* Contador de resultados */}
        {(filtroZona !== 'todas' || filtroBusqueda) && (
          <div className="mb-4 px-4 py-2 bg-sol-50/50 backdrop-blur-sm border border-sol-200/30 rounded-2xl inline-block">
            <span className="text-sm text-neutro-piedra font-outfit">
              Mostrando <span className="font-semibold text-neutro-carbon">{ninosFiltrados.length}</span> de <span className="font-semibold text-neutro-carbon">{ninos.length}</span> niños
            </span>
          </div>
        )}

        {ninosFiltrados.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sol-400/20 to-crecimiento-400/20 flex items-center justify-center">
                <span className="text-4xl">👶</span>
              </div>
              <p className="text-neutro-carbon font-outfit text-lg mb-3">
                {ninos.length === 0 
                  ? "No tenés niños asignados todavía."
                  : "No se encontraron niños con los filtros seleccionados."}
              </p>
              {ninos.length === 0 && (
                <>
                  <p className="text-sm text-neutro-piedra mb-6 font-outfit">
                    Registrá tu primer niño para empezar a trabajar.
                  </p>
                  <Link
                    href="/dashboard/ninos/nuevo"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold shadow-[0_4px_16px_rgba(164,198,57,0.15)] active:scale-95"
                  >
                    <UserPlus className="w-6 h-6" /> Registrar Primer Niño
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ninosFiltrados.map((nino) => (
              <div
                key={nino.id}
                className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 transition-all duration-300 shadow-[0_8px_32px_-8px_rgba(230,57,70,0.12)] hover:shadow-[0_16px_48px_-8px_rgba(230,57,70,0.2)] hover:-translate-y-1"
              >
                {/* Título con alias */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutro-carbon font-quicksand mb-2">
                      {nino.alias}
                    </h3>
                    {/* Mostrar nombre completo, apellido y legajo para admin/psico */}
                    {tieneAccesoCompleto && nino.metadata && (
                      <div className="mt-2 space-y-1 bg-impulso-50/30 rounded-2xl p-3 border border-impulso-200/20">
                        {nino.metadata.nombre_completo && (
                          <p className="text-sm text-neutro-piedra font-outfit">
                            <span className="font-semibold text-neutro-carbon">Nombre:</span> {nino.metadata.nombre_completo}
                          </p>
                        )}
                        {nino.metadata.apellido && (
                          <p className="text-sm text-neutro-piedra font-outfit">
                            <span className="font-semibold text-neutro-carbon">Apellido:</span> {nino.metadata.apellido}
                          </p>
                        )}
                        {nino.metadata.numero_legajo && (
                          <p className="text-sm text-neutro-piedra font-outfit">
                            <span className="font-semibold text-neutro-carbon">Legajo:</span> {nino.metadata.numero_legajo}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="px-3 py-1.5 bg-impulso-50 text-impulso-700 text-sm font-semibold font-outfit rounded-2xl border border-impulso-200/30 whitespace-nowrap ml-3">
                    {nino.rango_etario} años
                  </span>
                </div>

                <div className="space-y-2.5 mb-5">
                  {/* Mostrar equipo/zona */}
                  {nino.zona && (
                    <p className="text-sm text-neutro-piedra font-outfit">
                      <span className="font-semibold text-neutro-carbon">Equipo:</span> {nino.zona.nombre}
                    </p>
                  )}
                  <p className="text-sm text-neutro-piedra font-outfit">
                    <span className="font-semibold text-neutro-carbon">Nivel:</span> {nino.nivel_alfabetizacion}
                  </p>
                  <p className="text-sm text-neutro-piedra font-outfit">
                    <span className="font-semibold text-neutro-carbon">Escolarizado:</span> {nino.escolarizado ? 'Sí' : 'No'}
                  </p>
                </div>

                {/* Stats de sesiones */}
                <div className="bg-sol-50/40 backdrop-blur-sm rounded-2xl p-4 mb-5 border border-sol-200/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutro-piedra font-outfit">Sesiones registradas:</span>
                    <span className="font-bold text-neutro-carbon font-quicksand text-lg">{nino.total_sesiones}</span>
                  </div>
                  {nino.ultima_sesion && (
                    <div className="mt-2 text-xs text-neutro-piedra font-outfit">
                      Última: {new Date(nino.ultima_sesion).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Link
                    href={`/dashboard/sesiones/nueva/${nino.id}`}
                    className="block w-full text-center bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] text-white font-semibold py-3.5 px-4 min-h-[56px] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 touch-manipulation font-outfit shadow-[0_4px_16px_rgba(164,198,57,0.15)]"
                  >
                    <Plus className="w-5 h-5" /> Registrar Sesión
                  </Link>
                  
                  <Link
                    href={`/dashboard/ninos/${nino.id}`}
                    className="block w-full text-center bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon font-medium py-3.5 px-4 min-h-[56px] rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all text-sm active:scale-95 flex items-center justify-center gap-2 touch-manipulation font-outfit"
                  >
                    <Eye className="w-5 h-5" /> Ver Perfil
                  </Link>
                  
                  {nino.total_sesiones > 0 && (
                    <Link
                      href={`/dashboard/ninos/${nino.id}/analisis`}
                      className="block w-full text-center bg-sol-50 border border-sol-200/40 text-sol-700 font-medium py-3.5 px-4 min-h-[56px] rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.2)] transition-all text-sm active:scale-95 flex items-center justify-center gap-2 touch-manipulation font-outfit"
                    >
                      <Brain className="w-5 h-5" /> Análisis con IA
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MisNinosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando...</p>
        </div>
      </div>
    }>
      <MisNinosPageContent />
    </Suspense>
  );
}
