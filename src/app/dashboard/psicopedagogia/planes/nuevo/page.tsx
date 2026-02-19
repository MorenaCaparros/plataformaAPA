'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Nino {
  id: string;
  alias: string;
  rango_etario: string;
  fecha_nacimiento: string;
}

const AREAS = [
  { value: 'lenguaje_vocabulario', label: 'Lenguaje y Vocabulario' },
  { value: 'grafismo_motricidad', label: 'Grafismo y Motricidad' },
  { value: 'lectura_escritura', label: 'Lectura y Escritura' },
  { value: 'nociones_matematicas', label: 'Nociones Matemáticas' },
  { value: 'socioemocional', label: 'Socioemocional' },
  { value: 'general', label: 'General' },
];

const PRIORIDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

export default function NuevoPlanPage() {
  const { user, perfil } = useAuth();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNinos, setLoadingNinos] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nino_id: '',
    titulo: '',
    descripcion: '',
    area: 'general',
    prioridad: 'media',
    fecha_fin_estimada: '',
    objetivos: [''],
    actividades_sugeridas: '',
  });

  useEffect(() => {
    fetchNinos();
  }, []);

  async function fetchNinos() {
    try {
      setLoadingNinos(true);
      const { data, error } = await supabase
        .from('ninos')
        .select('id, alias, rango_etario, fecha_nacimiento')
        .order('alias', { ascending: true });
      if (error) throw error;
      setNinos(data || []);
    } catch (err) {
      console.error('Error al cargar niños:', err);
    } finally {
      setLoadingNinos(false);
    }
  }

  function addObjetivo() {
    setForm((f) => ({ ...f, objetivos: [...f.objetivos, ''] }));
  }

  function removeObjetivo(index: number) {
    setForm((f) => ({
      ...f,
      objetivos: f.objetivos.filter((_, i) => i !== index),
    }));
  }

  function updateObjetivo(index: number, value: string) {
    setForm((f) => ({
      ...f,
      objetivos: f.objetivos.map((o, i) => (i === index ? value : o)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.nino_id) {
      setError('Seleccioná un niño.');
      return;
    }
    if (!form.titulo.trim()) {
      setError('El título es obligatorio.');
      return;
    }

    try {
      setLoading(true);
      const objetivosFiltrados = form.objetivos.filter((o) => o.trim() !== '');

      const { data, error: insertError } = await supabase
        .from('planes_intervencion')
        .insert({
          nino_id: form.nino_id,
          creado_por: user!.id,
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim() || null,
          area: form.area,
          prioridad: form.prioridad,
          fecha_fin_estimada: form.fecha_fin_estimada || null,
          objetivos: objetivosFiltrados,
          actividades_sugeridas: form.actividades_sugeridas.trim() || null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/psicopedagogia/planes/${data.id}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error al crear plan:', err);
      setError(err.message || 'Error al crear el plan.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crecimiento-50 via-neutro-lienzo to-sol-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-12 text-center shadow-xl max-w-md">
          <CheckCircle2 className="w-16 h-16 text-crecimiento-500 mx-auto mb-4" />
          <h3 className="font-quicksand text-xl font-semibold text-gray-900 mb-2">
            ¡Plan creado exitosamente!
          </h3>
          <p className="font-outfit text-gray-500">
            Redirigiendo al detalle del plan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-crecimiento-50 via-neutro-lienzo to-sol-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/psicopedagogia/planes"
            className="p-2 rounded-xl hover:bg-white/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="bg-impulso-400 p-3 rounded-xl shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-quicksand text-3xl font-bold text-gray-900 dark:text-white">
              Nuevo Plan de Intervención
            </h1>
            <p className="font-outfit text-gray-600 dark:text-gray-400 mt-1">
              Definí objetivos y actividades para un niño
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Niño selector */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-lg">
            <h2 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-impulso-400" />
              Niño/a
            </h2>
            {loadingNinos ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando niños...
              </div>
            ) : (
              <select
                value={form.nino_id}
                onChange={(e) => setForm((f) => ({ ...f, nino_id: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 focus:border-transparent min-h-[44px]"
                required
              >
                <option value="">Seleccionar niño/a...</option>
                {ninos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.alias} — {n.rango_etario}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Título, Área, Prioridad */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-lg">
            <h2 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-4">
              Información del Plan
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-outfit text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej: Plan de refuerzo en lectoescritura"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 focus:border-transparent min-h-[44px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-outfit text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Área *
                  </label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 min-h-[44px]"
                  >
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-outfit text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 min-h-[44px]"
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-outfit text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha estimada de finalización
                </label>
                <input
                  type="date"
                  value={form.fecha_fin_estimada}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_fin_estimada: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-outfit text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción general del plan y contexto..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Objetivos */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-quicksand text-lg font-semibold text-neutro-carbon">
                Objetivos
              </h2>
              <button
                type="button"
                onClick={addObjetivo}
                className="inline-flex items-center gap-1 text-sm font-medium text-impulso-500 hover:text-impulso-600 transition-colors min-h-[44px] px-3"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            <div className="space-y-3">
              {form.objetivos.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-outfit text-sm text-gray-400 w-6 text-center flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => updateObjetivo(idx, e.target.value)}
                    placeholder="Describí un objetivo..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 focus:border-transparent min-h-[44px]"
                  />
                  {form.objetivos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjetivo(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actividades sugeridas */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-lg">
            <h2 className="font-quicksand text-lg font-semibold text-neutro-carbon mb-4">
              Actividades sugeridas para voluntarios
            </h2>
            <textarea
              value={form.actividades_sugeridas}
              onChange={(e) => setForm((f) => ({ ...f, actividades_sugeridas: e.target.value }))}
              placeholder="Describí actividades semanales sugeridas que los voluntarios pueden realizar con el niño/a..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 font-outfit text-sm focus:ring-2 focus:ring-impulso-400 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="font-outfit text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link
              href="/dashboard/psicopedagogia/planes"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold font-outfit transition-colors min-h-[44px]"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-impulso-400 hover:bg-impulso-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold font-outfit transition-colors min-h-[44px] shadow-lg shadow-impulso-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Crear Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
