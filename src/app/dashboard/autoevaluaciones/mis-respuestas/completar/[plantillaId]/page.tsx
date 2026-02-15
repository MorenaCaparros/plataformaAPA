'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Star, Check, X } from 'lucide-react';

interface Pregunta {
  id: string;
  texto: string;
  tipo: 'escala_1_5' | 'si_no' | 'texto_abierto';
  categoria: string;
}

interface Plantilla {
  id: string;
  titulo: string;
  area: string;
  descripcion: string;
  preguntas: Pregunta[];
}

interface Respuesta {
  pregunta_id: string;
  respuesta: any;
}

interface RespuestaGuardada {
  id: string;
  respuestas: Respuesta[];
  completada: boolean;
}

export default function CompletarAutoevaluacionPage() {
  const params = useParams();
  const router = useRouter();
  const { perfil } = useAuth();
  
  const [plantilla, setPlantilla] = useState<Plantilla | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [respuestaExistente, setRespuestaExistente] = useState<RespuestaGuardada | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const plantillaId = params.plantillaId as string;

  useEffect(() => {
    if (plantillaId) {
      fetchData();
    }
  }, [plantillaId]);

  async function fetchData() {
    try {
      // Obtener capacitacion (replaces plantillas_autoevaluacion)
      const { data: capData, error: capError } = await supabase
        .from('capacitaciones')
        .select(`
          *,
          preguntas_db:preguntas_capacitacion(id, orden, pregunta, tipo_pregunta, puntaje)
        `)
        .eq('id', plantillaId)
        .single();

      if (capError) throw capError;
      
      // Map to plantilla shape
      const mappedPlantilla: Plantilla = {
        id: capData.id,
        titulo: capData.nombre,
        area: capData.area,
        descripcion: capData.descripcion || '',
        preguntas: (capData.preguntas_db || [])
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((p: any) => ({
            id: p.id,
            texto: p.pregunta,
            tipo: p.tipo_pregunta === 'verdadero_falso' ? 'si_no' : p.tipo_pregunta === 'texto_libre' ? 'texto_abierto' : 'escala_1_5' as any,
            categoria: '',
          })),
      };
      setPlantilla(mappedPlantilla);

      // Buscar respuesta existente (voluntarios_capacitaciones, not completed)
      const { data: volCapData, error: volCapError } = await supabase
        .from('voluntarios_capacitaciones')
        .select('*')
        .eq('capacitacion_id', plantillaId)
        .eq('estado', 'en_progreso')
        .order('created_at', { ascending: false })
        .limit(1);

      if (volCapError) throw volCapError;

      if (volCapData && volCapData.length > 0) {
        const volCap = volCapData[0];
        setRespuestaExistente({
          id: volCap.id,
          respuestas: [],
          completada: false,
        });
        
        // Load individual responses
        const { data: respuestasInd } = await supabase
          .from('respuestas_capacitaciones')
          .select('pregunta_id, respuesta')
          .eq('voluntario_capacitacion_id', volCap.id);

        if (respuestasInd) {
          const respuestasMap: Record<string, any> = {};
          respuestasInd.forEach((r: any) => {
            // Try to parse numeric values
            const val = parseFloat(r.respuesta);
            respuestasMap[r.pregunta_id] = isNaN(val) ? r.respuesta : val;
          });
          setRespuestas(respuestasMap);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar la autoevaluación');
      router.push('/dashboard/autoevaluaciones/mis-respuestas');
    } finally {
      setLoading(false);
    }
  }

  function handleRespuesta(preguntaId: string, valor: any) {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: valor
    }));
  }

  async function guardarBorrador() {
    if (!plantilla || !perfil) return;

    setGuardando(true);
    try {
      if (respuestaExistente) {
        // Delete old individual responses and recreate
        await supabase
          .from('respuestas_capacitaciones')
          .delete()
          .eq('voluntario_capacitacion_id', respuestaExistente.id);

        // Insert new responses
        for (const [preguntaId, respuesta] of Object.entries(respuestas)) {
          await supabase
            .from('respuestas_capacitaciones')
            .insert({
              voluntario_capacitacion_id: respuestaExistente.id,
              pregunta_id: preguntaId,
              respuesta: String(respuesta),
              es_correcta: null,
              puntaje_obtenido: 0,
            });
        }
      } else {
        // Create new voluntarios_capacitaciones record as 'en_progreso'
        const { data, error } = await supabase
          .from('voluntarios_capacitaciones')
          .insert({
            voluntario_id: perfil.id,
            capacitacion_id: plantilla.id,
            estado: 'en_progreso',
            fecha_inicio: new Date().toISOString(),
            intentos: 1,
          })
          .select()
          .single();

        if (error) throw error;
        setRespuestaExistente({ id: data.id, respuestas: [], completada: false });

        // Insert individual responses
        for (const [preguntaId, respuesta] of Object.entries(respuestas)) {
          await supabase
            .from('respuestas_capacitaciones')
            .insert({
              voluntario_capacitacion_id: data.id,
              pregunta_id: preguntaId,
              respuesta: String(respuesta),
              es_correcta: null,
              puntaje_obtenido: 0,
            });
        }
      }

      alert('✅ Progreso guardado correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el progreso');
    } finally {
      setGuardando(false);
    }
  }

  async function enviarRespuesta() {
    if (!plantilla || !perfil) return;

    // Validar que todas las preguntas estén respondidas
    const preguntasRespondidas = Object.keys(respuestas).length;
    if (preguntasRespondidas < plantilla.preguntas.length) {
      alert(`⚠️ Faltan responder ${plantilla.preguntas.length - preguntasRespondidas} preguntas`);
      return;
    }

    setEnviando(true);
    try {
      // Calculate automatic score for scale questions
      let puntajeTotal = 0;
      let preguntasConPuntaje = 0;

      plantilla.preguntas.forEach(pregunta => {
        if (pregunta.tipo === 'escala_1_5' && respuestas[pregunta.id]) {
          puntajeTotal += respuestas[pregunta.id];
          preguntasConPuntaje++;
        }
      });

      const puntajePromedio = preguntasConPuntaje > 0 
        ? puntajeTotal / preguntasConPuntaje 
        : null;

      if (respuestaExistente) {
        // Delete old individual responses and recreate
        await supabase
          .from('respuestas_capacitaciones')
          .delete()
          .eq('voluntario_capacitacion_id', respuestaExistente.id);

        // Insert final responses
        for (const [preguntaId, respuesta] of Object.entries(respuestas)) {
          await supabase
            .from('respuestas_capacitaciones')
            .insert({
              voluntario_capacitacion_id: respuestaExistente.id,
              pregunta_id: preguntaId,
              respuesta: String(respuesta),
              es_correcta: null,
              puntaje_obtenido: typeof respuesta === 'number' ? respuesta * 2 : 0,
            });
        }

        // Mark as completed
        const porcentaje = puntajePromedio ? Math.round(puntajePromedio * 20) : 0;
        const { error } = await supabase
          .from('voluntarios_capacitaciones')
          .update({
            estado: 'completada',
            fecha_completado: new Date().toISOString(),
            puntaje_final: puntajePromedio ? Math.round(puntajePromedio * 2) : 0,
            puntaje_maximo: 10,
            porcentaje,
          })
          .eq('id', respuestaExistente.id);

        if (error) throw error;
      } else {
        // Create new completed record
        const { data, error } = await supabase
          .from('voluntarios_capacitaciones')
          .insert({
            voluntario_id: perfil.id,
            capacitacion_id: plantilla.id,
            estado: 'completada',
            fecha_inicio: new Date().toISOString(),
            fecha_completado: new Date().toISOString(),
            puntaje_final: puntajePromedio ? Math.round(puntajePromedio * 2) : 0,
            puntaje_maximo: 10,
            porcentaje: puntajePromedio ? Math.round(puntajePromedio * 20) : 0,
            intentos: 1,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert individual responses
        for (const [preguntaId, respuesta] of Object.entries(respuestas)) {
          await supabase
            .from('respuestas_capacitaciones')
            .insert({
              voluntario_capacitacion_id: data.id,
              pregunta_id: preguntaId,
              respuesta: String(respuesta),
              es_correcta: null,
              puntaje_obtenido: typeof respuesta === 'number' ? respuesta * 2 : 0,
            });
        }
      }

      alert('🎉 ¡Autoevaluación completada con éxito!');
      router.push('/dashboard/autoevaluaciones/mis-respuestas');
    } catch (error) {
      console.error('Error al enviar:', error);
      alert('Error al enviar la autoevaluación');
    } finally {
      setEnviando(false);
    }
  }

  const areaLabels: Record<string, string> = {
    lenguaje: 'Lenguaje y Vocabulario',
    grafismo: 'Grafismo y Motricidad Fina',
    lectura_escritura: 'Lectura y Escritura',
    matematicas: 'Nociones Matemáticas'
  };

  const areaColors: Record<string, string> = {
    lenguaje: 'from-sol-400 to-sol-500',
    grafismo: 'from-green-400 to-green-500',
    lectura_escritura: 'from-impulso-300 to-impulso-400',
    matematicas: 'from-orange-400 to-orange-500'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-crecimiento-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando autoevaluación...</p>
        </div>
      </div>
    );
  }

  if (!plantilla) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <p className="text-neutro-carbon font-outfit text-lg mb-4">Autoevaluación no encontrada</p>
          <Link
            href="/dashboard/autoevaluaciones/mis-respuestas"
            className="text-crecimiento-500 hover:underline font-outfit"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const preguntasRespondidas = Object.keys(respuestas).length;
  const progresoPocentaje = (preguntasRespondidas / plantilla.preguntas.length) * 100;

  return (
    <div className="min-h-screen pb-24">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/autoevaluaciones/mis-respuestas"
            className="flex items-center text-neutro-piedra hover:text-neutro-carbon mb-6 font-outfit transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Link>

          <div className={`bg-gradient-to-r ${areaColors[plantilla.area] || 'from-neutro-carbon to-neutro-piedra'} text-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] mb-6`}>
            <h1 className="text-3xl md:text-4xl font-bold font-quicksand mb-2">
              {plantilla.titulo}
            </h1>
            <p className="text-white/90 font-outfit text-lg mb-4">
              {areaLabels[plantilla.area] || plantilla.area}
            </p>
            <p className="text-white/80 font-outfit">
              {plantilla.descripcion}
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(242,201,76,0.1)] p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-outfit text-neutro-piedra">
                Progreso
              </span>
              <span className="text-sm font-outfit font-semibold text-neutro-carbon">
                {preguntasRespondidas} / {plantilla.preguntas.length}
              </span>
            </div>
            <div className="w-full bg-neutro-nube rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progresoPocentaje}%` }}
              />
            </div>
          </div>
        </div>

        {/* Preguntas */}
        <div className="space-y-6">
          {plantilla.preguntas.map((pregunta, index) => {
            const respondida = respuestas[pregunta.id] !== undefined;

            return (
              <div
                key={pregunta.id}
                className={`bg-white/60 backdrop-blur-md rounded-3xl border ${
                  respondida ? 'border-crecimiento-200' : 'border-white/60'
                } shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 transition-all`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold font-quicksand ${
                    respondida 
                      ? 'bg-crecimiento-100 text-crecimiento-600' 
                      : 'bg-neutro-nube text-neutro-piedra'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-neutro-carbon font-outfit text-lg font-medium mb-1">
                      {pregunta.texto}
                    </p>
                    <span className="text-xs text-neutro-piedra font-outfit">
                      {pregunta.categoria}
                    </span>
                  </div>
                </div>

                {/* Tipo: Escala 1-5 */}
                {pregunta.tipo === 'escala_1_5' && (
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((valor) => (
                      <button
                        key={valor}
                        onClick={() => handleRespuesta(pregunta.id, valor)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                          respuestas[pregunta.id] === valor
                            ? 'bg-gradient-to-br from-amarillo-400 to-amarillo-500 text-white shadow-lg scale-110'
                            : 'bg-neutro-nube hover:bg-neutro-carbon/10 text-neutro-piedra'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${respuestas[pregunta.id] === valor ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Tipo: Sí/No */}
                {pregunta.tipo === 'si_no' && (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleRespuesta(pregunta.id, true)}
                      className={`px-8 py-4 min-h-[56px] rounded-2xl font-outfit font-semibold transition-all flex items-center gap-2 ${
                        respuestas[pregunta.id] === true
                          ? 'bg-gradient-to-r from-verde-400 to-verde-500 text-white shadow-lg scale-105'
                          : 'bg-neutro-nube hover:bg-neutro-carbon/10 text-neutro-piedra'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                      Sí
                    </button>
                    <button
                      onClick={() => handleRespuesta(pregunta.id, false)}
                      className={`px-8 py-4 min-h-[56px] rounded-2xl font-outfit font-semibold transition-all flex items-center gap-2 ${
                        respuestas[pregunta.id] === false
                          ? 'bg-gradient-to-r from-rojo-400 to-rojo-500 text-white shadow-lg scale-105'
                          : 'bg-neutro-nube hover:bg-neutro-carbon/10 text-neutro-piedra'
                      }`}
                    >
                      <X className="w-5 h-5" />
                      No
                    </button>
                  </div>
                )}

                {/* Tipo: Texto abierto */}
                {pregunta.tipo === 'texto_abierto' && (
                  <textarea
                    value={respuestas[pregunta.id] || ''}
                    onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                    placeholder="Escribí tu respuesta aquí..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutro-nube rounded-2xl focus:outline-none focus:ring-2 focus:ring-crecimiento-400 font-outfit resize-none"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Botones de acción fijos */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-white/60 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] p-4 z-10">
          <div className="container mx-auto max-w-4xl flex gap-4">
            <button
              onClick={guardarBorrador}
              disabled={guardando || preguntasRespondidas === 0}
              className={`flex-1 px-6 py-4 min-h-[56px] bg-white border-2 border-neutro-carbon text-neutro-carbon rounded-2xl hover:bg-neutro-nube transition-all font-outfit font-semibold flex items-center justify-center gap-2 ${
                (guardando || preguntasRespondidas === 0) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              <Save className="w-5 h-5" />
              {guardando ? 'Guardando...' : 'Guardar Progreso'}
            </button>

            <button
              onClick={enviarRespuesta}
              disabled={enviando || preguntasRespondidas < plantilla.preguntas.length}
              className={`flex-1 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.3)] transition-all font-outfit font-semibold flex items-center justify-center gap-2 ${
                (enviando || preguntasRespondidas < plantilla.preguntas.length) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              <Send className="w-5 h-5" />
              {enviando ? 'Enviando...' : 'Enviar Autoevaluación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
