'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Target, Sparkles, Save, Loader2, User, Calendar } from 'lucide-react';

interface Nino {
  id: string;
  alias: string;
  fecha_nacimiento: string;
  nivel_alfabetizacion: string;
}

export default function NuevoPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generandoConIA, setGenerandoConIA] = useState(false);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [voluntarios, setVoluntarios] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nino_id: '',
    voluntario_asignado_id: '',
    titulo: '',
    descripcion: '',
    objetivo_general: '',
    objetivos_especificos: [] as string[],
    fecha_inicio: new Date().toISOString().split('T')[0],
    duracion_semanas: 4,
    actividades_sugeridas: [] as any[]
  });

  const [promptIA, setPromptIA] = useState('');

  useEffect(() => {
    fetchNinos();
    fetchVoluntarios();
  }, []);

  async function fetchNinos() {
    const { data } = await supabase
      .from('ninos')
      .select('id, alias, fecha_nacimiento, nivel_alfabetizacion')
      .order('alias');
    setNinos(data || []);
  }

  async function fetchVoluntarios() {
    const { data } = await supabase
      .from('perfiles')
      .select('id, metadata')
      .eq('rol', 'voluntario')
      .order('metadata->>nombre');
    setVoluntarios(data || []);
  }

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const ninoSeleccionado = ninos.find(n => n.id === formData.nino_id);
  const edad = ninoSeleccionado ? calcularEdad(ninoSeleccionado.fecha_nacimiento) : null;

  async function generarConIA() {
    if (!formData.nino_id || !promptIA.trim()) {
      alert('Selecciona un niño y describe qué necesitas trabajar');
      return;
    }

    try {
      setGenerandoConIA(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sesión expirada');
        return;
      }

      const response = await fetch('/api/ia/generar-plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nino_id: formData.nino_id,
          edad,
          nivel_alfabetizacion: ninoSeleccionado?.nivel_alfabetizacion,
          prompt: promptIA,
          duracion_semanas: formData.duracion_semanas
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al generar plan');
      }

      // Actualizar form con lo que sugirió la IA
      setFormData(prev => ({
        ...prev,
        titulo: result.titulo || prev.titulo,
        objetivo_general: result.objetivo_general || prev.objetivo_general,
        objetivos_especificos: result.objetivos_especificos || prev.objetivos_especificos,
        actividades_sugeridas: result.actividades || []
      }));

      alert('✅ Plan generado con IA! Revisa y edita si es necesario antes de guardar.');

    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setGenerandoConIA(false);
    }
  }

  async function guardarPlan() {
    if (!formData.nino_id || !formData.titulo || !formData.objetivo_general) {
      alert('Completa los campos obligatorios: Niño, Título y Objetivo General');
      return;
    }

    if (formData.actividades_sugeridas.length === 0) {
      alert('Genera al menos una actividad con IA o agrégala manualmente');
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sesión expirada');
        return;
      }

      // Calcular fecha_fin
      const fechaInicio = new Date(formData.fecha_inicio);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + (formData.duracion_semanas * 7));

      // Crear plan
      const { data: plan, error: planError } = await supabase
        .from('planes_intervencion')
        .insert({
          nino_id: formData.nino_id,
          psicopedagogo_id: session.user.id,
          voluntario_asignado_id: formData.voluntario_asignado_id || null,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          objetivo_general: formData.objetivo_general,
          objetivos_especificos: formData.objetivos_especificos,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: fechaFin.toISOString().split('T')[0],
          duracion_semanas: formData.duracion_semanas,
          activo: true
        })
        .select()
        .single();

      if (planError) throw planError;

      // Crear actividades
      if (formData.actividades_sugeridas.length > 0) {
        const actividadesData = formData.actividades_sugeridas.map((act, index) => ({
          plan_id: plan.id,
          semana: index + 1,
          titulo: act.titulo,
          descripcion: act.descripcion,
          duracion_minutos: act.duracion_minutos || 30,
          areas: act.areas || [],
          objetivos: act.objetivos || [],
          instrucciones: act.instrucciones,
          materiales: act.materiales || [],
          indicadores_exito: act.indicadores_exito || []
        }));

        const { error: actError } = await supabase
          .from('actividades_plan')
          .insert(actividadesData);

        if (actError) throw actError;
      }

      alert('✅ Plan guardado exitosamente!');
      router.push('/dashboard/psicopedagogia/planes');

    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nuevo Plan de Intervención
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Crea actividades semanales con ayuda de IA
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Selección de Niño */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            1. Seleccionar Niño
          </h2>
          
          <select
            value={formData.nino_id}
            onChange={(e) => setFormData({ ...formData, nino_id: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Selecciona un niño...</option>
            {ninos.map(nino => (
              <option key={nino.id} value={nino.id}>
                {nino.alias} ({calcularEdad(nino.fecha_nacimiento)} años) - {nino.nivel_alfabetizacion || 'Sin evaluar'}
              </option>
            ))}
          </select>

          {ninoSeleccionado && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Edad:</strong> {edad} años | 
                <strong className="ml-3">Nivel:</strong> {ninoSeleccionado.nivel_alfabetizacion || 'No especificado'}
              </p>
            </div>
          )}
        </div>

        {/* Generar con IA */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm p-6 border-2 border-purple-200 dark:border-purple-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            2. Generar Plan con IA
          </h2>

          <textarea
            value={promptIA}
            onChange={(e) => setPromptIA(e.target.value)}
            placeholder="Describe qué necesitas trabajar con este niño... 

Ejemplo: 'Necesito trabajar la lectoescritura básica, reconocimiento de vocales y consonantes. El niño tiene dificultad para mantener la atención más de 10 minutos.'"
            className="w-full px-4 py-3 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white min-h-[120px] mb-4"
            disabled={!formData.nino_id}
          />

          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Duración del plan (semanas):
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.duracion_semanas}
              onChange={(e) => setFormData({ ...formData, duracion_semanas: parseInt(e.target.value) })}
              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={generarConIA}
            disabled={!formData.nino_id || !promptIA.trim() || generandoConIA}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generandoConIA ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando con IA...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generar Plan con IA
              </>
            )}
          </button>
        </div>

        {/* Formulario del Plan */}
        {formData.actividades_sugeridas.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Revisar y Editar Plan
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título del Plan *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Plan de Lectoescritura Inicial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objetivo General *
                </label>
                <textarea
                  value={formData.objetivo_general}
                  onChange={(e) => setFormData({ ...formData, objetivo_general: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asignar Voluntario (opcional)
                </label>
                <select
                  value={formData.voluntario_asignado_id}
                  onChange={(e) => setFormData({ ...formData, voluntario_asignado_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sin asignar</option>
                  {voluntarios.map(vol => (
                    <option key={vol.id} value={vol.id}>
                      {vol.metadata?.nombre} {vol.metadata?.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Actividades Sugeridas */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Actividades Semanales ({formData.actividades_sugeridas.length})
                </h3>
                <div className="space-y-4">
                  {formData.actividades_sugeridas.map((actividad, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Semana {index + 1}: {actividad.titulo}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {actividad.descripcion}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Instrucciones:</strong> {actividad.instrucciones}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        {formData.actividades_sugeridas.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              onClick={guardarPlan}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Plan
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
