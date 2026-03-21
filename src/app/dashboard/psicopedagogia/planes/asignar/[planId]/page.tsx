'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  Users,
  Search,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Plantilla {
  id: string;
  titulo: string;
  descripcion: string | null;
  area: string;
  prioridad: string;
  duracion_semanas: number | null;
  objetivos: string[];
  actividades_sugeridas: string[] | null;
  observaciones: string | null;
}

interface Nino {
  id: string;
  alias: string;
  rango_etario: string;
  nivel_alfabetizacion: string | null;
}

const AREA_LABELS: Record<string, string> = {
  lenguaje_vocabulario: 'Lenguaje y Vocabulario',
  grafismo_motricidad: 'Grafismo y Motricidad',
  lectura_escritura: 'Lectura y Escritura',
  nociones_matematicas: 'Nociones Matemáticas',
  socioemocional: 'Socioemocional',
  general: 'General',
};

export default function AsignarPlantillaPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { user, perfil } = useAuth();

  const [plantilla, setPlantilla] = useState<Plantilla | null>(null);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedNinos, setSelectedNinos] = useState<Set<string>>(new Set());
  const [duracionSemanas, setDuracionSemanas] = useState<number>(4);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setLoadingData(true);
      try {
        const [plantillaRes, ninosRes] = await Promise.all([
          supabase
            .from('planes_intervencion')
            .select('id, titulo, descripcion, area, prioridad, duracion_semanas, objetivos, actividades_sugeridas, observaciones')
            .eq('id', planId)
            .eq('es_plantilla', true)
            .single(),
          supabase
            .from('ninos')
            .select('id, alias, rango_etario, nivel_alfabetizacion')
            .order('alias'),
        ]);

        if (plantillaRes.error) throw plantillaRes.error;
        if (ninosRes.error) throw ninosRes.error;

        setPlantilla(plantillaRes.data);
        setDuracionSemanas(plantillaRes.data?.duracion_semanas ?? 4);
        setNinos(ninosRes.data || []);
      } catch (err: any) {
        setError('No se pudo cargar la información. Verificá que la plantilla exista.');
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [planId, user]);

  function toggleNino(id: string) {
    setSelectedNinos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedNinos.size === filteredNinos.length && filteredNinos.length > 0) {
      setSelectedNinos(new Set());
    } else {
      setSelectedNinos(new Set(filteredNinos.map((n) => n.id)));
    }
  }

  const filteredNinos = ninos.filter(
    (n) =>
      search === '' ||
      n.alias.toLowerCase().includes(search.toLowerCase()) ||
      n.rango_etario.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit() {
    if (!plantilla || selectedNinos.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const insertRows = Array.from(selectedNinos).map((ninoId) => ({
        nino_id: ninoId,
        titulo: plantilla.titulo,
        descripcion: plantilla.descripcion,
        area: plantilla.area,
        prioridad: plantilla.prioridad,
        estado: 'activo',
        fecha_inicio: hoy,
        duracion_semanas: duracionSemanas,
        objetivos: plantilla.objetivos,
        actividades_sugeridas: plantilla.actividades_sugeridas,
        observaciones: plantilla.observaciones,
        es_plantilla: false,
        plantilla_origen_id: plantilla.id,
        creado_por: perfil?.id ?? null,
      }));

      const { error: insertError } = await supabase
        .from('planes_intervencion')
        .insert(insertRows);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.push('/dashboard/psicopedagogia/planes?tab=planes'), 1800);
    } catch (err: any) {
      setError('Ocurrió un error al asignar la plantilla. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sol-50 via-neutro-lienzo to-crecimiento-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-impulso-400" />
      </div>
    );
  }

  if (error && !plantilla) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sol-50 via-neutro-lienzo to-crecimiento-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="bg-white/80 rounded-3xl p-8 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="font-outfit text-gray-700 mb-4">{error}</p>
          <Link
            href="/dashboard/psicopedagogia/planes?tab=plantillas"
            className="inline-flex items-center gap-2 text-impulso-500 font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a plantillas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sol-50 via-neutro-lienzo to-crecimiento-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/psicopedagogia/planes?tab=plantillas"
            className="p-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="bg-impulso-400 p-3 rounded-xl shadow-lg">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-quicksand text-2xl font-bold text-gray-900 dark:text-white">
              Asignar plantilla
            </h1>
            <p className="font-outfit text-sm text-gray-500 dark:text-gray-400">
              Elegí los niños/as para asignar este plan
            </p>
          </div>
        </div>

        {/* Plantilla info card */}
        {plantilla && (
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-5 mb-6 shadow-md">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-quicksand text-lg font-bold text-neutro-carbon">
                  {plantilla.titulo}
                </h2>
                {plantilla.descripcion && (
                  <p className="font-outfit text-sm text-gray-500 mt-1 line-clamp-2">
                    {plantilla.descripcion}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-impulso-50 text-impulso-700">
                  {AREA_LABELS[plantilla.area] || plantilla.area}
                </span>
              </div>
            </div>
            {plantilla.objetivos?.length > 0 && (
              <ul className="mt-3 space-y-1">
                {plantilla.objetivos.slice(0, 3).map((obj, i) => (
                  <li key={i} className="font-outfit text-xs text-gray-500 flex items-start gap-1">
                    <span className="text-impulso-400 mt-0.5">•</span>
                    <span className="line-clamp-1">{obj}</span>
                  </li>
                ))}
                {plantilla.objetivos.length > 3 && (
                  <li className="font-outfit text-xs text-gray-400">
                    +{plantilla.objetivos.length - 3} objetivos más
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Duración */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-5 mb-6 shadow-md">
          <label className="block font-outfit text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Clock className="w-4 h-4 inline mr-1.5 text-impulso-400" />
            Duración estimada (semanas)
          </label>
          <input
            type="number"
            min={1}
            max={52}
            value={duracionSemanas}
            onChange={(e) => setDuracionSemanas(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 min-h-[44px]"
          />
          <p className="font-outfit text-xs text-gray-400 mt-1">
            El tiempo corre desde hoy para cada niño/a asignado/a.
          </p>
        </div>

        {/* Children selector */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-5 mb-6 shadow-md">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-quicksand text-base font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-impulso-400" />
              Seleccionar niños/as
              {selectedNinos.size > 0 && (
                <span className="bg-impulso-400 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {selectedNinos.size}
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={toggleAll}
              className="font-outfit text-xs text-impulso-500 hover:underline"
            >
              {selectedNinos.size === filteredNinos.length && filteredNinos.length > 0
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar niño/a..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-outfit focus:ring-2 focus:ring-impulso-400 min-h-[44px]"
            />
          </div>

          {filteredNinos.length === 0 ? (
            <p className="font-outfit text-sm text-gray-400 text-center py-8">
              {ninos.length === 0 ? 'No hay niños registrados.' : 'Sin resultados para esta búsqueda.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredNinos.map((nino) => {
                const selected = selectedNinos.has(nino.id);
                return (
                  <button
                    key={nino.id}
                    type="button"
                    onClick={() => toggleNino(nino.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all min-h-[52px] ${
                      selected
                        ? 'border-impulso-300 bg-impulso-50 dark:bg-impulso-900/20'
                        : 'border-gray-100 bg-white/60 hover:bg-gray-50'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="w-5 h-5 text-impulso-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-outfit text-sm font-medium text-gray-800 truncate">
                        {nino.alias}
                      </p>
                      <p className="font-outfit text-xs text-gray-400">
                        {nino.rango_etario}
                        {nino.nivel_alfabetizacion && ` · ${nino.nivel_alfabetizacion}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Errors */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-outfit text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-crecimiento-50 border border-crecimiento-200 rounded-xl p-4 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-crecimiento-600 flex-shrink-0" />
            <p className="font-outfit text-sm text-crecimiento-700">
              ¡Plan asignado a {selectedNinos.size} niño{selectedNinos.size !== 1 ? 's' : ''}! Redirigiendo...
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/dashboard/psicopedagogia/planes?tab=plantillas"
            className="flex-1 text-center py-3 rounded-xl border border-gray-200 bg-white/60 font-semibold font-outfit text-gray-600 hover:bg-white/80 transition-colors min-h-[48px] flex items-center justify-center"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedNinos.size === 0 || success}
            className="flex-1 py-3 rounded-xl bg-impulso-400 hover:bg-impulso-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold font-outfit transition-colors min-h-[48px] flex items-center justify-center gap-2 shadow-lg shadow-impulso-500/20"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Asignando...</>
            ) : (
              <><Users className="w-4 h-4" /> Asignar a {selectedNinos.size || '—'} niño{selectedNinos.size !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
