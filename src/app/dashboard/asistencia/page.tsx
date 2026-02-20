'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle, XCircle, Users, Calendar, Save, AlertTriangle, Filter } from 'lucide-react';

interface NinoAsistencia {
  id: string;
  alias: string;
  rango_etario: string | null;
  zona_nombre: string | null;
  zona_id: string | null;
}

interface Zona {
  id: string;
  nombre: string;
}

interface AsistenciaExistente {
  id: string;
  nino_id: string;
  presente: boolean;
  motivo_ausencia: string | null;
}

export default function AsistenciaPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();

  const [ninos, setNinos] = useState<NinoAsistencia[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [zonaFiltro, setZonaFiltro] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [seleccion, setSeleccion] = useState<Record<string, 'presente' | 'ausente' | null>>({});
  const [seleccionOriginal, setSeleccionOriginal] = useState<Record<string, 'presente' | 'ausente' | null>>({});
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [existentes, setExistentes] = useState<Record<string, AsistenciaExistente>>({});
  const [saved, setSaved] = useState(false);

  const esVoluntario = perfil?.rol === 'voluntario';
  const esCoordinadorOSuperior = perfil?.rol && ['coordinador', 'psicopedagogia', 'director', 'admin', 'trabajador_social'].includes(perfil.rol);
  const puedeVerZonas = !esVoluntario;

  useEffect(() => {
    if (!authLoading && user && perfil) {
      fetchNinos();
      if (puedeVerZonas) fetchZonas();
    }
  }, [authLoading, user, perfil]);

  useEffect(() => {
    if (ninos.length > 0) fetchExistentes();
  }, [fecha, ninos]);

  const fetchZonas = async () => {
    const { data } = await supabase.from('zonas').select('id, nombre').order('nombre');
    setZonas(data || []);
  };

  const fetchNinos = async () => {
    try {
      setLoading(true);
      let ninosData: NinoAsistencia[] = [];

      if (esVoluntario) {
        // Voluntarios: SOLO sus niños asignados
        const { data, error } = await supabase
          .from('asignaciones')
          .select('nino_id, ninos (id, alias, rango_etario, zona_id, zonas (nombre))')
          .eq('voluntario_id', user!.id)
          .eq('activa', true);

        if (error) throw error;
        ninosData = (data || [])
          .map((a: any) => a.ninos)
          .filter(Boolean)
          .map((n: any) => ({
            id: n.id,
            alias: n.alias,
            rango_etario: n.rango_etario,
            zona_id: n.zona_id || null,
            zona_nombre: n.zonas?.nombre || null,
          }));
      } else {
        const query = supabase
          .from('ninos')
          .select('id, alias, rango_etario, zona_id, zonas (nombre)')
          .eq('activo', true)
          .order('alias', { ascending: true });

        if (perfil?.rol === 'coordinador' && perfil?.zona_id) {
          query.eq('zona_id', perfil.zona_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        ninosData = (data || []).map((n: any) => ({
          id: n.id,
          alias: n.alias,
          rango_etario: n.rango_etario,
          zona_id: n.zona_id || null,
          zona_nombre: n.zonas?.nombre || null,
        }));
      }

      setNinos(ninosData);
    } catch (error) {
      console.error('Error fetching niños:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistentes = async () => {
    try {
      const ninoIds = ninos.map(n => n.id);
      if (ninoIds.length === 0) return;

      const { data, error } = await supabase
        .from('asistencias')
        .select('id, nino_id, presente, motivo_ausencia')
        .eq('fecha', fecha)
        .in('nino_id', ninoIds);

      if (error) throw error;

      const map: Record<string, AsistenciaExistente> = {};
      const sel: Record<string, 'presente' | 'ausente' | null> = {};
      const mot: Record<string, string> = {};

      (data || []).forEach((a: any) => {
        map[a.nino_id] = a;
        sel[a.nino_id] = a.presente ? 'presente' : 'ausente';
        mot[a.nino_id] = a.motivo_ausencia || '';
      });

      setExistentes(map);
      setSeleccion(sel);
      setSeleccionOriginal({ ...sel });
      setMotivos(mot);
      setSaved(false);
    } catch (error) {
      console.error('Error fetching asistencias:', error);
    }
  };

  const toggleNino = (ninoId: string) => {
    setSeleccion(prev => {
      const current = prev[ninoId];
      if (!current || current === 'ausente') return { ...prev, [ninoId]: 'presente' };
      return { ...prev, [ninoId]: 'ausente' };
    });
    setSaved(false);
  };

  const marcarTodos = (estado: 'presente' | 'ausente') => {
    const nuevo: Record<string, 'presente' | 'ausente' | null> = {};
    ninosFiltrados.forEach(n => { nuevo[n.id] = estado; });
    setSeleccion(prev => ({ ...prev, ...nuevo }));
    setSaved(false);
  };

  // Detectar si hay cambios respecto al estado guardado
  const haycambios = useMemo(() => {
    const claves = new Set([...Object.keys(seleccion), ...Object.keys(seleccionOriginal)]);
    for (const k of claves) {
      if (seleccion[k] !== seleccionOriginal[k]) return true;
    }
    return false;
  }, [seleccion, seleccionOriginal]);

  // Filtrar niños por zona seleccionada
  const ninosFiltrados = useMemo(() => {
    if (!zonaFiltro) return ninos;
    return ninos.filter(n => n.zona_id === zonaFiltro);
  }, [ninos, zonaFiltro]);

  const stats = useMemo(() => {
    const presentes = Object.values(seleccion).filter(v => v === 'presente').length;
    const ausentes = Object.values(seleccion).filter(v => v === 'ausente').length;
    const sinMarcar = ninosFiltrados.length - presentes - ausentes;
    return { presentes, ausentes, sinMarcar };
  }, [seleccion, ninosFiltrados]);

  const handleGuardar = async () => {
    const marcados = Object.entries(seleccion).filter(([_, v]) => v !== null);
    if (marcados.length === 0) return;

    setSaving(true);
    try {
      const registros = marcados.map(([ninoId, estado]) => ({
        nino_id: ninoId,
        fecha: fecha,
        presente: estado === 'presente',
        motivo_ausencia: estado === 'ausente' ? (motivos[ninoId] || null) : null,
        registrado_por: user!.id,
      }));

      const { error } = await supabase
        .from('asistencias')
        .upsert(registros, { onConflict: 'nino_id,fecha' });

      if (error) throw error;

      setSaved(true);
      await fetchExistentes();
    } catch (error: any) {
      console.error('Error guardando asistencia:', error);
    } finally {
      setSaving(false);
    }
  };

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
    <div className="min-h-screen pb-32">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand">
                📋 Asistencia
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {/* Date picker */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(242,201,76,0.08)] p-4 mb-4">
          <label className="text-sm font-medium mb-2 flex items-center gap-2 text-neutro-carbon font-outfit">
            <Calendar className="w-4 h-4" />
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-3 text-base border border-gray-200 rounded-xl font-outfit focus:ring-2 focus:ring-crecimiento-300 focus:border-crecimiento-400 transition-all"
          />
          {fecha !== new Date().toISOString().slice(0, 10) && (
            <p className="text-xs text-sol-600 mt-2 font-outfit flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Registrando asistencia de {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>

        {/* Filtro por zona (solo para coordinadores+) */}
        {puedeVerZonas && zonas.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(242,201,76,0.08)] p-4 mb-4">
            <label className="text-sm font-medium mb-2 flex items-center gap-2 text-neutro-carbon font-outfit">
              <Filter className="w-4 h-4" />
              Filtrar por zona
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setZonaFiltro('')}
                className={`px-3 py-1.5 rounded-xl text-sm font-outfit font-medium transition-all ${!zonaFiltro ? 'bg-crecimiento-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Todas
              </button>
              {zonas.map(z => (
                <button
                  key={z.id}
                  onClick={() => setZonaFiltro(z.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-outfit font-medium transition-all ${zonaFiltro === z.id ? 'bg-crecimiento-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {z.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => marcarTodos('presente')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-crecimiento-50 border border-crecimiento-200/60 text-crecimiento-700 rounded-2xl font-outfit font-semibold text-sm hover:bg-crecimiento-100 active:scale-95 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Todos presentes
          </button>
          <button
            type="button"
            onClick={() => marcarTodos('ausente')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-impulso-50 border border-impulso-200/60 text-impulso-700 rounded-2xl font-outfit font-semibold text-sm hover:bg-impulso-100 active:scale-95 transition-all"
          >
            <XCircle className="w-4 h-4" />
            Todos ausentes
          </button>
        </div>

        {/* Stats bar */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(242,201,76,0.08)] p-3 mb-4 flex items-center justify-between text-sm font-outfit">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-crecimiento-400"></span>
              <span className="font-semibold text-neutro-carbon">{stats.presentes}</span>
              <span className="text-neutro-piedra">presentes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-impulso-400"></span>
              <span className="font-semibold text-neutro-carbon">{stats.ausentes}</span>
              <span className="text-neutro-piedra">ausentes</span>
            </span>
          </div>
          {stats.sinMarcar > 0 && (
            <span className="text-neutro-piedra text-xs">{stats.sinMarcar} sin marcar</span>
          )}
        </div>

        {/* Niños list */}
        {ninosFiltrados.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 text-center">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-neutro-piedra font-outfit">
              {zonaFiltro ? 'No hay niños en esta zona.' : 'No tenés niños asignados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ninosFiltrados.map((nino) => {
              const estado = seleccion[nino.id] || null;
              const yaExistia = !!existentes[nino.id];

              return (
                <div
                  key={nino.id}
                  className={`bg-white/60 backdrop-blur-md rounded-2xl border transition-all ${
                    estado === 'presente'
                      ? 'border-crecimiento-300 bg-crecimiento-50/40'
                      : estado === 'ausente'
                        ? 'border-impulso-300 bg-impulso-50/40'
                        : 'border-white/60'
                  } shadow-[0_2px_8px_rgba(242,201,76,0.06)]`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => toggleNino(nino.id)}
                      className="flex-1 flex items-center gap-3 min-h-[48px] touch-manipulation text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        estado === 'presente'
                          ? 'bg-crecimiento-500 text-white'
                          : estado === 'ausente'
                            ? 'bg-impulso-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                      }`}>
                        {estado === 'presente' ? (
                          <Check className="w-5 h-5" />
                        ) : estado === 'ausente' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-lg">·</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutro-carbon font-quicksand truncate">
                          {nino.alias}
                        </p>
                        <p className="text-xs text-neutro-piedra font-outfit">
                          {nino.rango_etario && `${nino.rango_etario} años`}
                          {nino.zona_nombre && ` • ${nino.zona_nombre}`}
                          {yaExistia && (
                            <span className="ml-2 text-crecimiento-600 font-medium">✓ ya registrado</span>
                          )}
                        </p>
                      </div>
                    </button>

                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => { setSeleccion(p => ({ ...p, [nino.id]: 'presente' })); setSaved(false); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                          estado === 'presente'
                            ? 'bg-crecimiento-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-400 hover:bg-crecimiento-100 hover:text-crecimiento-600'
                        }`}
                        title="Presente"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSeleccion(p => ({ ...p, [nino.id]: 'ausente' })); setSaved(false); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                          estado === 'ausente'
                            ? 'bg-impulso-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-400 hover:bg-impulso-100 hover:text-impulso-600'
                        }`}
                        title="Ausente"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {estado === 'ausente' && (
                    <div className="px-4 pb-4 pt-0">
                      <input
                        type="text"
                        placeholder="Motivo de ausencia (opcional)"
                        value={motivos[nino.id] || ''}
                        onChange={(e) => { setMotivos(p => ({ ...p, [nino.id]: e.target.value })); setSaved(false); }}
                        className="w-full px-3 py-2 text-sm border border-impulso-200/60 rounded-xl font-outfit focus:ring-2 focus:ring-impulso-300 focus:border-impulso-400 transition-all bg-white/60"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fixed footer save button */}
      {ninosFiltrados.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-white/60 p-4 shadow-lg z-20">
          <div className="max-w-3xl mx-auto">
            {saved && !haycambios && (
              <div className="text-center text-sm text-crecimiento-700 font-medium mb-2 flex items-center justify-center gap-2 font-outfit">
                <CheckCircle className="w-4 h-4" />
                Asistencia guardada correctamente
              </div>
            )}
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving || !haycambios}
              className={`w-full px-6 py-4 min-h-[56px] rounded-2xl font-semibold active:scale-95 flex items-center justify-center gap-2 transition-all font-outfit text-lg ${
                haycambios
                  ? 'bg-gradient-to-r from-crecimiento-500 to-crecimiento-400 text-white shadow-glow-crecimiento'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                'Guardando...'
              ) : haycambios ? (
                <>
                  <Save className="w-5 h-5" />
                  Guardar asistencia ({stats.presentes + stats.ausentes}/{ninosFiltrados.length})
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Sin cambios pendientes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
