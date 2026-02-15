'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, UserPlus, Plus, Eye, Brain } from 'lucide-react';
import type { NinoListado, RangoEtario } from '@/types/database';

// Función helper para normalizar texto (quitar acentos)
const normalizarTexto = (texto: string) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

interface Zona {
  id: string;
  nombre: string;
}

function MisNinosPageContent() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const zonaParam = searchParams.get('zona');
  
  const [ninos, setNinos] = useState<NinoListado[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroZona, setFiltroZona] = useState<string>(zonaParam || 'todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Determinar si el usuario tiene acceso completo (ve datos sensibles)
  const rolesConAccesoCompleto = ['psicopedagogia', 'director', 'admin', 'coordinador', 'trabajadora_social'];
  const tieneAccesoCompleto = perfil?.rol && rolesConAccesoCompleto.includes(perfil.rol);

  // Roles con acceso a todos los niños
  const rolesConAccesoTotal = ['psicopedagogia', 'coordinador', 'director', 'admin', 'trabajadora_social'];
  const tieneAccesoTotal = perfil?.rol && rolesConAccesoTotal.includes(perfil.rol);

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
      let ninosData: any[] = [];

      if (tieneAccesoTotal) {
        // Roles con acceso total: ver TODOS los niños
        // Si tiene acceso completo (psico/director/admin), incluir datos sensibles
        const selectFields = tieneAccesoCompleto
          ? `
            id,
            alias,
            legajo,
            rango_etario,
            nivel_alfabetizacion,
            escolarizado,
            grado_escolar,
            activo,
            zona_id,
            zonas (
              id,
              nombre
            ),
            ninos_sensibles (
              nombre_completo_encrypted,
              apellido_encrypted
            )
          `
          : `
            id,
            alias,
            legajo,
            rango_etario,
            nivel_alfabetizacion,
            escolarizado,
            grado_escolar,
            activo,
            zona_id,
            zonas (
              id,
              nombre
            )
          `;

        const { data, error } = await supabase
          .from('ninos')
          .select(selectFields)
          .eq('activo', true)
          .order('alias', { ascending: true });

        if (error) throw error;
        ninosData = data || [];
      } else {
        // Voluntarios: solo ven sus niños asignados vía tabla asignaciones
        const { data, error } = await supabase
          .from('asignaciones')
          .select(`
            nino_id,
            ninos (
              id,
              alias,
              legajo,
              rango_etario,
              nivel_alfabetizacion,
              escolarizado,
              grado_escolar,
              activo,
              zonas (
                id,
                nombre
              )
            )
          `)
          .eq('voluntario_id', user?.id)
          .eq('activa', true);

        if (error) throw error;
        ninosData = (data || []).map((item: any) => item.ninos).filter(Boolean);
      }

      // Para cada niño, obtener conteo de sesiones (optimizado con count)
      const ninosConSesiones: NinoListado[] = await Promise.all(
        ninosData.map(async (nino: any) => {
          const { count } = await supabase
            .from('sesiones')
            .select('*', { count: 'exact', head: true })
            .eq('nino_id', nino.id);

          const { data: ultimaSesion } = await supabase
            .from('sesiones')
            .select('fecha')
            .eq('nino_id', nino.id)
            .order('fecha', { ascending: false })
            .limit(1)
            .single();

          return {
            id: nino.id,
            alias: nino.alias,
            legajo: nino.legajo,
            rango_etario: nino.rango_etario,
            nivel_alfabetizacion: nino.nivel_alfabetizacion,
            escolarizado: nino.escolarizado,
            grado_escolar: nino.grado_escolar,
            activo: nino.activo,
            zonas: nino.zonas || null,
            ninos_sensibles: nino.ninos_sensibles || null,
            total_sesiones: count || 0,
            ultima_sesion: ultimaSesion?.fecha || null
          };
        })
      );

      setNinos(ninosConSesiones);
    } catch (error) {
      console.error('Error fetching niños:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar niños
  const ninosFiltrados = ninos.filter(nino => {
    // Filtro por zona
    if (filtroZona !== 'todas' && nino.zonas?.id !== filtroZona) {
      return false;
    }

    // Filtro por búsqueda (alias, legajo, nombre/apellido encriptado)
    if (filtroBusqueda) {
      const busqueda = normalizarTexto(filtroBusqueda);
      const alias = normalizarTexto(nino.alias);
      const legajo = normalizarTexto(nino.legajo || '');
      
      // Datos sensibles solo si tiene acceso
      const nombreCompleto = normalizarTexto(nino.ninos_sensibles?.nombre_completo_encrypted || '');
      const apellido = normalizarTexto(nino.ninos_sensibles?.apellido_encrypted || '');

      return (
        alias.includes(busqueda) ||
        legajo.includes(busqueda) ||
        nombreCompleto.includes(busqueda) ||
        apellido.includes(busqueda)
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
          {tieneAccesoTotal && (
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
                placeholder="Buscar por alias, legajo..."
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
                    <h3 className="text-xl font-bold text-neutro-carbon font-quicksand mb-1">
                      {nino.alias}
                    </h3>
                    {/* Legajo siempre visible */}
                    {nino.legajo && (
                      <p className="text-xs text-neutro-piedra font-mono">
                        Legajo: {nino.legajo}
                      </p>
                    )}
                    {/* Datos sensibles solo para roles con acceso completo */}
                    {tieneAccesoCompleto && nino.ninos_sensibles && (
                      <div className="mt-2 space-y-1 bg-impulso-50/30 rounded-2xl p-3 border border-impulso-200/20">
                        {nino.ninos_sensibles.nombre_completo_encrypted && (
                          <p className="text-sm text-neutro-piedra font-outfit">
                            <span className="font-semibold text-neutro-carbon">Nombre:</span> {nino.ninos_sensibles.nombre_completo_encrypted}
                          </p>
                        )}
                        {nino.ninos_sensibles.apellido_encrypted && (
                          <p className="text-sm text-neutro-piedra font-outfit">
                            <span className="font-semibold text-neutro-carbon">Apellido:</span> {nino.ninos_sensibles.apellido_encrypted}
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
                  {/* Equipo/zona */}
                  {nino.zonas && (
                    <p className="text-sm text-neutro-piedra font-outfit">
                      <span className="font-semibold text-neutro-carbon">Equipo:</span> {nino.zonas.nombre}
                    </p>
                  )}
                  <p className="text-sm text-neutro-piedra font-outfit">
                    <span className="font-semibold text-neutro-carbon">Nivel:</span> {nino.nivel_alfabetizacion || 'Sin evaluar'}
                  </p>
                  <p className="text-sm text-neutro-piedra font-outfit">
                    <span className="font-semibold text-neutro-carbon">Escolarizado:</span> {nino.escolarizado ? 'Sí' : 'No'}
                    {nino.grado_escolar && ` (${nino.grado_escolar})`}
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
                  
                  {(nino.total_sesiones ?? 0) > 0 && (
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
