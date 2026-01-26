'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

interface Plantilla {
  id: string;
  titulo: string;
  area: string;
  descripcion: string;
  preguntas: any[];
}

interface RespuestaResumen {
  id: string;
  plantilla_id: string;
  puntaje_total: number | null;
  puntaje_automatico: number | null;
  fecha_completada: string;
}

export default function AutoevaluacionesPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [respuestas, setRespuestas] = useState<RespuestaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const router = useRouter();
  const { perfil } = useAuth();

  // Roles que pueden gestionar plantillas (no deben completar autoevaluaciones)
  const rolesAdministrativos = ['director', 'psicopedagogia', 'coordinador', 'trabajador_social'];
  const puedeGestionarPlantillas = perfil?.rol ? rolesAdministrativos.includes(perfil.rol) : false;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Solo cargar plantillas (siempre)
      const plantillasRes = await supabase
        .from('plantillas_autoevaluacion')
        .select('*')
        .eq('activo', true)
        .order('area');

      if (plantillasRes.error) throw plantillasRes.error;
      setPlantillas(plantillasRes.data || []);

      // Solo cargar respuestas si es voluntario (no roles administrativos)
      if (!puedeGestionarPlantillas) {
        const respuestasRes = await supabase
          .from('respuestas_autoevaluacion')
          .select('id, plantilla_id, puntaje_total, puntaje_automatico, fecha_completada')
          .order('fecha_completada', { ascending: false });

        if (respuestasRes.error) throw respuestasRes.error;
        setRespuestas(respuestasRes.data || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calcular estadísticas por plantilla
  const getPlantillaStats = (plantillaId: string) => {
    const respuestasPlantilla = respuestas.filter(r => r.plantilla_id === plantillaId);
    if (respuestasPlantilla.length === 0) return null;

    const ultimaRespuesta = respuestasPlantilla[0];
    const puntaje = ultimaRespuesta.puntaje_total || ultimaRespuesta.puntaje_automatico || 0;

    return {
      veces: respuestasPlantilla.length,
      ultimoPuntaje: puntaje,
      ultimaFecha: new Date(ultimaRespuesta.fecha_completada)
    };
  };

  const areaLabels: Record<string, string> = {
    lenguaje: 'Lenguaje y Vocabulario',
    grafismo: 'Grafismo y Motricidad Fina',
    lectura_escritura: 'Lectura y Escritura',
    matematicas: 'Nociones Matemáticas'
  };

  const areaColors: Record<string, string> = {
    lenguaje: 'bg-blue-100 text-blue-800',
    grafismo: 'bg-green-100 text-green-800',
    lectura_escritura: 'bg-purple-100 text-purple-800',
    matematicas: 'bg-orange-100 text-orange-800'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-crecimiento-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando autoevaluaciones...</p>
        </div>
      </div>
    );
  }

  if (selectedPlantilla) {
    return (
      <FormularioAutoevaluacion
        plantilla={selectedPlantilla}
        onBack={() => setSelectedPlantilla(null)}
        onSuccess={() => {
          setSelectedPlantilla(null);
          fetchData(); // Recargar datos
          router.push('/dashboard/autoevaluaciones/mis-respuestas');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-3xl md:text-4xl font-bold text-neutro-carbon font-quicksand">
              {puedeGestionarPlantillas ? 'Plantillas de Autoevaluación' : 'Mis Autoevaluaciones'}
            </h1>
            {puedeGestionarPlantillas && (
              <Link
                href="/dashboard/autoevaluaciones/gestionar"
                className="px-6 py-3 min-h-[48px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold shadow-[0_4px_16px_rgba(164,198,57,0.15)] active:scale-95 flex items-center gap-2"
              >
                Gestionar Plantillas
              </Link>
            )}
          </div>
          <p className="text-neutro-piedra font-outfit text-lg">
            {puedeGestionarPlantillas 
              ? 'Crea y gestiona las plantillas de autoevaluación para los voluntarios.'
              : 'Completá estas autoevaluaciones para que podamos conocer tus habilidades y asignarte niños según tus fortalezas.'}
          </p>
        </div>

        {/* Grid de plantillas */}
        {plantillas.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 text-center">
            <p className="text-sol-700 font-outfit">
              No hay autoevaluaciones disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {plantillas.map((plantilla) => {
              const stats = !puedeGestionarPlantillas ? getPlantillaStats(plantilla.id) : null;
              
              return (
                <div
                  key={plantilla.id}
                  className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 text-left transition-all duration-300 shadow-[0_4px_16px_rgba(164,198,57,0.1)] hover:shadow-[0_8px_32px_rgba(164,198,57,0.15)] hover:-translate-y-1"
                >
                  {/* Badge de área */}
                  <span
                    className={`inline-block px-4 py-2 rounded-2xl text-sm font-semibold mb-4 font-outfit border ${
                      plantilla.area === 'lenguaje' ? 'bg-impulso-50 text-impulso-700 border-impulso-200/30' :
                      plantilla.area === 'grafismo' ? 'bg-crecimiento-50 text-crecimiento-700 border-crecimiento-200/30' :
                      plantilla.area === 'lectura_escritura' ? 'bg-sol-50 text-sol-700 border-sol-200/30' :
                      plantilla.area === 'matematicas' ? 'bg-impulso-50 text-impulso-700 border-impulso-200/30' :
                      'bg-neutro-lienzo text-neutro-carbon border-neutro-piedra/30'
                    }`}
                  >
                    {areaLabels[plantilla.area] || plantilla.area}
                  </span>

                  {/* Título */}
                  <h3 className="text-xl font-bold text-neutro-carbon mb-3 font-quicksand">
                    {plantilla.titulo}
                  </h3>

                  {/* Descripción */}
                  <p className="text-sm text-neutro-piedra mb-4 line-clamp-2 font-outfit">
                    {plantilla.descripcion}
                  </p>

                  {/* Estadísticas si ya la completó (solo voluntarios) */}
                  {stats && !puedeGestionarPlantillas && (
                    <div className="bg-crecimiento-50/40 backdrop-blur-sm border border-crecimiento-200/30 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-crecimiento-700 font-medium font-outfit">
                          Ya completaste {stats.veces} {stats.veces === 1 ? 'vez' : 'veces'}
                        </span>
                        <span className="text-2xl font-bold text-crecimiento-800 font-quicksand">
                          {stats.ultimoPuntaje.toFixed(1)}/10
                        </span>
                      </div>
                      <p className="text-xs text-crecimiento-600 font-outfit">
                        Última vez: {stats.ultimaFecha.toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  )}

                  {/* Info de plantilla (para roles administrativos) */}
                  {puedeGestionarPlantillas && (
                    <div className="bg-sol-50/40 backdrop-blur-sm border border-sol-200/30 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-sol-700 font-medium font-outfit">
                          Plantilla creada
                        </span>
                        <span className="text-sm font-bold text-sol-800 font-outfit">
                          {plantilla.preguntas?.length || 0} preguntas
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Botón de acción */}
                  {puedeGestionarPlantillas ? (
                    <Link
                      href="/dashboard/autoevaluaciones/gestionar"
                      className="block w-full text-center px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon font-medium rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all text-sm font-outfit"
                    >
                      Ver plantillas →
                    </Link>
                  ) : (
                    <button
                      onClick={() => setSelectedPlantilla(plantilla)}
                      className="w-full flex items-center justify-between text-sm px-4 py-3 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold active:scale-95"
                    >
                      <span>{plantilla.preguntas?.length || 0} preguntas</span>
                      <span>
                        {stats ? 'Hacer nuevamente →' : 'Comenzar →'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Componente: Formulario de Autoevaluación
// ========================================

interface FormularioProps {
  plantilla: Plantilla;
  onBack: () => void;
  onSuccess: () => void;
}

function FormularioAutoevaluacion({ plantilla, onBack, onSuccess }: FormularioProps) {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRespuesta = (preguntaId: string, valor: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: valor
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que todas las preguntas estén respondidas
    const preguntasRequeridas = plantilla.preguntas.filter(
      (p) => p.tipo !== 'texto_abierto' || p.min_caracteres
    );

    for (const pregunta of preguntasRequeridas) {
      if (!respuestas[pregunta.id] || respuestas[pregunta.id].trim() === '') {
        setError('Por favor, respondé todas las preguntas obligatorias.');
        return;
      }

      // Validar texto abierto si tiene mínimo
      if (pregunta.tipo === 'texto_abierto' && pregunta.min_caracteres) {
        if (respuestas[pregunta.id].length < pregunta.min_caracteres) {
          setError(
            `La pregunta "${pregunta.pregunta}" requiere al menos ${pregunta.min_caracteres} caracteres.`
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/respuestas-autoevaluacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantilla_id: plantilla.id,
          respuestas: Object.entries(respuestas).map(([pregunta_id, respuesta]) => ({
            pregunta_id,
            respuesta
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar respuestas');
      }

      // Éxito
      onSuccess();
    } catch (err: any) {
      console.error('Error al enviar autoevaluación:', err);
      setError(err.message || 'Error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const areaLabels: Record<string, string> = {
    lenguaje: 'Lenguaje y Vocabulario',
    grafismo: 'Grafismo y Motricidad Fina',
    lectura_escritura: 'Lectura y Escritura',
    matematicas: 'Nociones Matemáticas'
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-3">
          {areaLabels[plantilla.area] || plantilla.area}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{plantilla.titulo}</h1>
        <p className="text-gray-600">{plantilla.descripcion}</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {plantilla.preguntas.map((pregunta, index) => (
          <div key={pregunta.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700 mb-2 block">
                {index + 1}. {pregunta.pregunta}
                {pregunta.tipo === 'texto_abierto' && pregunta.min_caracteres && (
                  <span className="text-xs text-gray-500 ml-2">
                    (mínimo {pregunta.min_caracteres} caracteres)
                  </span>
                )}
              </span>

              {/* Tipo: Escala */}
              {pregunta.tipo === 'escala' && (
                <div className="space-y-3">
                  <input
                    type="range"
                    min={pregunta.escala_min || 1}
                    max={pregunta.escala_max || 10}
                    value={respuestas[pregunta.id] || pregunta.escala_min || 1}
                    onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{pregunta.escala_min || 1}</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {respuestas[pregunta.id] || pregunta.escala_min || 1}
                    </span>
                    <span>{pregunta.escala_max || 10}</span>
                  </div>
                </div>
              )}

              {/* Tipo: Multiple Choice */}
              {pregunta.tipo === 'multiple_choice' && (
                <div className="space-y-2">
                  {pregunta.opciones.map((opcion: string, idx: number) => (
                    <label
                      key={idx}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        respuestas[pregunta.id] === opcion
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={pregunta.id}
                        value={opcion}
                        checked={respuestas[pregunta.id] === opcion}
                        onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Tipo: Texto Abierto */}
              {pregunta.tipo === 'texto_abierto' && (
                <div>
                  <textarea
                    value={respuestas[pregunta.id] || ''}
                    onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Escribí tu respuesta aquí..."
                  />
                  {pregunta.min_caracteres && (
                    <p className="text-xs text-gray-500 mt-1">
                      {respuestas[pregunta.id]?.length || 0} / {pregunta.min_caracteres} caracteres
                    </p>
                  )}
                </div>
              )}
            </label>
          </div>
        ))}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Enviar Autoevaluación'}
          </button>
        </div>
      </form>
    </div>
  );
}
