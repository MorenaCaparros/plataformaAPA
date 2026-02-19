'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Star, Check, X, Clock, Users, GripVertical, AlertTriangle, Trophy, CheckCircle, XCircle, FileText } from 'lucide-react';

interface OpcionPregunta {
  id: string;
  texto_opcion: string;
  es_correcta: boolean;
  orden: number;
}

interface Pregunta {
  id: string;
  texto: string;
  tipo: 'escala_1_5' | 'si_no' | 'texto_abierto' | 'multiple_choice' | 'ordenar_palabras' | 'respuesta_imagen';
  categoria: string;
  opciones: OpcionPregunta[];
  respuesta_correcta: string;
  puntaje: number;
  imagen_url: string;
  datos_extra: any;
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

interface ModalState {
  visible: boolean;
  tipo: 'exito' | 'error' | 'advertencia' | 'resultado';
  titulo: string;
  mensaje: string;
  // Resultado fields (for tipo === 'resultado')
  puntaje?: number;
  porcentaje?: number;
  correctas?: number;
  incorrectas?: number;
  manuales?: number;
  onClose?: () => void;
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

  // Special questions state
  const [maxNinos, setMaxNinos] = useState<number>(3);
  const [horasDisponibles, setHorasDisponibles] = useState<number>(4);

  // Modal state
  const [modal, setModal] = useState<ModalState>({ visible: false, tipo: 'exito', titulo: '', mensaje: '' });

  const plantillaId = params.plantillaId as string;

  useEffect(() => {
    if (plantillaId) {
      fetchData();
    }
  }, [plantillaId]);

  async function fetchData() {
    try {
      // Load current profile values for special questions
      if (perfil?.id) {
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('max_ninos_asignados, horas_disponibles')
          .eq('id', perfil.id)
          .single();
        
        if (perfilData) {
          if (perfilData.max_ninos_asignados != null) setMaxNinos(Math.min(perfilData.max_ninos_asignados, 3));
          if (perfilData.horas_disponibles != null) setHorasDisponibles(perfilData.horas_disponibles);
        }
      }

      // Obtener capacitacion (replaces plantillas_autoevaluacion)
      const { data: capData, error: capError } = await supabase
        .from('capacitaciones')
        .select(`
          *,
          preguntas_db:preguntas_capacitacion(
            id, orden, pregunta, tipo_pregunta, puntaje, respuesta_correcta, imagen_url, datos_extra, area_especifica,
            opciones:opciones_pregunta(id, orden, texto_opcion, es_correcta)
          )
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
          .map((p: any) => {
            let tipo: Pregunta['tipo'] = 'escala_1_5';
            if (p.tipo_pregunta === 'verdadero_falso') tipo = 'si_no';
            else if (p.tipo_pregunta === 'texto_libre') tipo = 'texto_abierto';
            else if (p.tipo_pregunta === 'multiple_choice') tipo = 'multiple_choice';
            else if (p.tipo_pregunta === 'ordenar_palabras') tipo = 'ordenar_palabras';
            else if (p.tipo_pregunta === 'respuesta_imagen') tipo = 'respuesta_imagen';
            return {
              id: p.id,
              texto: p.pregunta,
              tipo,
              categoria: p.area_especifica || '',
              opciones: (p.opciones || []).sort((a: any, b: any) => a.orden - b.orden),
              respuesta_correcta: p.respuesta_correcta || '',
              puntaje: p.puntaje || 10,
              imagen_url: p.imagen_url || '',
              datos_extra: p.datos_extra || null,
            };
          }),
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
      setModal({
        visible: true,
        tipo: 'error',
        titulo: 'Error al cargar',
        mensaje: 'No se pudo cargar la autoevaluación. Intenta nuevamente.',
        onClose: () => router.push('/dashboard/autoevaluaciones/mis-respuestas'),
      });
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

      setModal({
        visible: true,
        tipo: 'exito',
        titulo: 'Progreso guardado',
        mensaje: 'Tu progreso ha sido guardado correctamente. Puedes continuar más tarde.',
      });
    } catch (error) {
      console.error('Error al guardar:', error);
      setModal({
        visible: true,
        tipo: 'error',
        titulo: 'Error al guardar',
        mensaje: 'No se pudo guardar el progreso. Intenta nuevamente.',
      });
    } finally {
      setGuardando(false);
    }
  }

  async function enviarRespuesta() {
    if (!plantilla || !perfil) return;

    // Validar que todas las preguntas estén respondidas
    const preguntasRespondidas = Object.keys(respuestas).length;
    if (preguntasRespondidas < plantilla.preguntas.length) {
      setModal({
        visible: true,
        tipo: 'advertencia',
        titulo: 'Preguntas sin responder',
        mensaje: `Faltan responder ${plantilla.preguntas.length - preguntasRespondidas} pregunta(s) antes de enviar.`,
      });
      return;
    }

    setEnviando(true);
    try {
      // ── Corrección automática: comparar cada respuesta con la correcta ──
      let puntajeObtenidoTotal = 0;
      let puntajeMaximoTotal = 0;

      const resultadosPorPregunta: {
        preguntaId: string;
        respuesta: string;
        esCorrecta: boolean | null;
        puntajeObtenido: number;
        puntajeMaximo: number;
      }[] = [];

      plantilla.preguntas.forEach((pregunta) => {
        const respuestaVoluntario = respuestas[pregunta.id];
        const puntajeMax = pregunta.puntaje || 10;
        let esCorrecta: boolean | null = null;
        let puntajeObtenido = 0;

        switch (pregunta.tipo) {
          case 'escala_1_5': {
            // Escala: comparar con respuesta_correcta. Si coincide → puntaje completo
            const valor = typeof respuestaVoluntario === 'number' ? respuestaVoluntario : parseInt(String(respuestaVoluntario));
            const valorCorrecto = parseInt(pregunta.respuesta_correcta);
            if (!isNaN(valor)) {
              if (!isNaN(valorCorrecto)) {
                // Si hay respuesta correcta definida, comparar directamente
                esCorrecta = valor === valorCorrecto;
                puntajeObtenido = esCorrecta ? puntajeMax : 0;
              } else {
                // Sin respuesta correcta definida: puntaje proporcional
                puntajeObtenido = Math.round((valor / 5) * puntajeMax);
                esCorrecta = valor >= 4;
              }
            }
            break;
          }
          case 'si_no': {
            // Comparar con respuesta_correcta (puede ser "true"/"false"/"si"/"no")
            const respCorrecta = pregunta.respuesta_correcta.toLowerCase().trim();
            const respVol = String(respuestaVoluntario).toLowerCase().trim();
            const correctaEsTrue = ['true', 'si', 'sí', 'verdadero', '1'].includes(respCorrecta);
            const voluntarioEsTrue = ['true', 'si', 'sí', 'verdadero', '1'].includes(respVol);
            esCorrecta = correctaEsTrue === voluntarioEsTrue;
            puntajeObtenido = esCorrecta ? puntajeMax : 0;
            break;
          }
          case 'multiple_choice': {
            // Comparar texto de opción elegida con la opción correcta
            const respVol = String(respuestaVoluntario).trim().toLowerCase();
            // Buscar la opción correcta
            const opcionCorrecta = pregunta.opciones.find(o => o.es_correcta);
            if (opcionCorrecta) {
              esCorrecta = respVol === opcionCorrecta.texto_opcion.trim().toLowerCase();
            } else {
              // Fallback: comparar con respuesta_correcta del campo
              esCorrecta = respVol === pregunta.respuesta_correcta.trim().toLowerCase();
            }
            puntajeObtenido = esCorrecta ? puntajeMax : 0;
            break;
          }
          case 'texto_abierto': {
            // Texto libre: no se puede corregir automáticamente, asignar puntaje parcial
            esCorrecta = null; // Requiere revisión manual
            puntajeObtenido = 0; // Se asigna manualmente después
            break;
          }
          case 'ordenar_palabras': {
            // Comparar orden: respuesta_correcta es "palabra1|palabra2|palabra3"
            const ordenCorrecto = pregunta.respuesta_correcta.split('|').map(w => w.trim().toLowerCase());
            const respVol = String(respuestaVoluntario).split('|').map(w => w.trim().toLowerCase());
            esCorrecta = JSON.stringify(ordenCorrecto) === JSON.stringify(respVol);
            puntajeObtenido = esCorrecta ? puntajeMax : 0;
            break;
          }
          case 'respuesta_imagen': {
            // Same as multiple_choice: compare selected option with correct
            const respVolImg = String(respuestaVoluntario).trim().toLowerCase();
            const opcionCorrectaImg = pregunta.opciones.find(o => o.es_correcta);
            if (opcionCorrectaImg) {
              esCorrecta = respVolImg === opcionCorrectaImg.texto_opcion.trim().toLowerCase();
            } else {
              esCorrecta = respVolImg === pregunta.respuesta_correcta.trim().toLowerCase();
            }
            puntajeObtenido = esCorrecta ? puntajeMax : 0;
            break;
          }
        }

        puntajeObtenidoTotal += puntajeObtenido;
        puntajeMaximoTotal += puntajeMax;

        resultadosPorPregunta.push({
          preguntaId: pregunta.id,
          respuesta: String(respuestaVoluntario),
          esCorrecta,
          puntajeObtenido,
          puntajeMaximo: puntajeMax,
        });
      });

      // Calcular porcentaje (0-100) y puntaje final (0-10)
      const porcentaje = puntajeMaximoTotal > 0
        ? Math.round((puntajeObtenidoTotal / puntajeMaximoTotal) * 100)
        : 0;
      const puntajeFinal = puntajeMaximoTotal > 0
        ? Math.round((puntajeObtenidoTotal / puntajeMaximoTotal) * 10)
        : 0;

      // Determinar si tiene preguntas de texto sin corregir
      const tienePreguntasManuales = resultadosPorPregunta.some(r => r.esCorrecta === null);

      if (respuestaExistente) {
        // Delete old individual responses and recreate
        await supabase
          .from('respuestas_capacitaciones')
          .delete()
          .eq('voluntario_capacitacion_id', respuestaExistente.id);

        // Insert corrected responses
        for (const resultado of resultadosPorPregunta) {
          await supabase
            .from('respuestas_capacitaciones')
            .insert({
              voluntario_capacitacion_id: respuestaExistente.id,
              pregunta_id: resultado.preguntaId,
              respuesta: resultado.respuesta,
              es_correcta: resultado.esCorrecta,
              puntaje_obtenido: resultado.puntajeObtenido,
            });
        }

        // Mark as completed
        const { error } = await supabase
          .from('voluntarios_capacitaciones')
          .update({
            estado: tienePreguntasManuales ? 'completada' : 'completada',
            fecha_completado: new Date().toISOString(),
            puntaje_final: puntajeFinal,
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
            puntaje_final: puntajeFinal,
            puntaje_maximo: 10,
            porcentaje,
            intentos: 1,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert corrected responses
        for (const resultado of resultadosPorPregunta) {
          await supabase
            .from('respuestas_capacitaciones')
            .insert({
              voluntario_capacitacion_id: data.id,
              pregunta_id: resultado.preguntaId,
              respuesta: resultado.respuesta,
              es_correcta: resultado.esCorrecta,
              puntaje_obtenido: resultado.puntajeObtenido,
            });
        }
      }

      // Save special questions to perfiles table
      await supabase
        .from('perfiles')
        .update({
          max_ninos_asignados: maxNinos,
          horas_disponibles: horasDisponibles,
        })
        .eq('id', perfil.id);

      // Show result to volunteer
      const correctas = resultadosPorPregunta.filter(r => r.esCorrecta === true).length;
      const incorrectas = resultadosPorPregunta.filter(r => r.esCorrecta === false).length;
      const manuales = resultadosPorPregunta.filter(r => r.esCorrecta === null).length;

      setModal({
        visible: true,
        tipo: 'resultado',
        titulo: '¡Autoevaluación completada!',
        mensaje: '',
        puntaje: puntajeFinal,
        porcentaje,
        correctas,
        incorrectas,
        manuales,
        onClose: () => router.push('/dashboard/autoevaluaciones/mis-respuestas'),
      });
    } catch (error) {
      console.error('Error al enviar:', error);
      setModal({
        visible: true,
        tipo: 'error',
        titulo: 'Error al enviar',
        mensaje: 'No se pudo enviar la autoevaluación. Intenta nuevamente.',
      });
    } finally {
      setEnviando(false);
    }
  }

  const areaLabels: Record<string, string> = {
    lenguaje: 'Lenguaje y Vocabulario',
    grafismo: 'Grafismo y Motricidad Fina',
    lectura_escritura: 'Lectura y Escritura',
    matematicas: 'Nociones Matemáticas',
    mixta: 'Múltiples Áreas',
  };

  const areaColors: Record<string, string> = {
    lenguaje: 'from-sol-400 to-sol-500',
    grafismo: 'from-green-400 to-green-500',
    lectura_escritura: 'from-impulso-300 to-impulso-400',
    matematicas: 'from-orange-400 to-orange-500',
    mixta: 'from-impulso-400 via-sol-400 to-crecimiento-500',
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
  // Only count actual scored questions in progress (max_ninos and horas don't affect the 10-point score)
  const totalPreguntas = plantilla.preguntas.length;
  const totalRespondidas = preguntasRespondidas;
  const progresoPocentaje = totalPreguntas > 0 ? (totalRespondidas / totalPreguntas) * 100 : 0;

  // Derive real areas from questions (instead of hardcoding all 4)
  const areasReales = Array.from(
    new Set(plantilla.preguntas.map(p => p.categoria).filter(Boolean))
  );
  const esMixta = areasReales.length > 1;

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

          <div className={`bg-gradient-to-r ${esMixta ? 'from-impulso-400 via-sol-400 to-crecimiento-500' : (areaColors[plantilla.area] || 'from-sol-400 to-crecimiento-500')} text-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] mb-6`}>
            <h1 className="text-3xl md:text-4xl font-bold font-quicksand mb-2">
              {plantilla.titulo}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {areasReales.length > 0 ? (
                areasReales.map((areaKey) => (
                  <span key={areaKey} className="inline-block px-3 py-1 rounded-full bg-white/20 text-white/95 text-sm font-outfit font-medium">
                    {areaLabels[areaKey] || areaKey}
                  </span>
                ))
              ) : (
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white/95 text-sm font-outfit font-medium">
                  {areaLabels[plantilla.area] || plantilla.area}
                </span>
              )}
            </div>
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
                {totalRespondidas} / {totalPreguntas}
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
                      {areaLabels[pregunta.categoria] || pregunta.categoria}
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

                {/* Tipo: Selección múltiple */}
                {pregunta.tipo === 'multiple_choice' && pregunta.opciones && (
                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => (
                      <button
                        key={opcion.id}
                        type="button"
                        onClick={() => handleRespuesta(pregunta.id, opcion.texto_opcion)}
                        className={`w-full text-left px-5 py-4 min-h-[52px] rounded-2xl font-outfit transition-all flex items-center gap-3 ${
                          respuestas[pregunta.id] === opcion.texto_opcion
                            ? 'bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white shadow-lg'
                            : 'bg-neutro-nube hover:bg-neutro-carbon/10 text-neutro-carbon'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          respuestas[pregunta.id] === opcion.texto_opcion
                            ? 'border-white bg-white/20'
                            : 'border-neutro-piedra/40'
                        }`}>
                          {respuestas[pregunta.id] === opcion.texto_opcion && (
                            <div className="w-3 h-3 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="font-medium">{opcion.texto_opcion}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tipo: Ordenar palabras */}
                {pregunta.tipo === 'ordenar_palabras' && (() => {
                  const palabrasCorrectas = pregunta.datos_extra?.palabras || pregunta.respuesta_correcta?.split('|') || [];
                  // Shuffle for display (deterministic based on pregunta.id if not answered yet)
                  const currentOrder: string[] = respuestas[pregunta.id]
                    ? String(respuestas[pregunta.id]).split('|')
                    : [...palabrasCorrectas].sort(() => 0.5 - Math.random());

                  // Initialize if not set
                  if (!respuestas[pregunta.id] && currentOrder.length > 0) {
                    // Don't auto-set here, let user interact
                  }

                  const moveWord = (fromIdx: number, toIdx: number) => {
                    const newOrder = [...currentOrder];
                    const [moved] = newOrder.splice(fromIdx, 1);
                    newOrder.splice(toIdx, 0, moved);
                    handleRespuesta(pregunta.id, newOrder.join('|'));
                  };

                  return (
                    <div className="space-y-3">
                      <p className="text-xs text-neutro-piedra font-outfit text-center">
                        Tocá las flechas para ordenar las palabras correctamente
                      </p>
                      <div className="space-y-2">
                        {currentOrder.map((palabra, wIdx) => (
                          <div key={wIdx} className="flex items-center gap-2 bg-white/80 rounded-xl p-3 border border-white/60">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sol-100 text-sol-700 flex items-center justify-center text-sm font-bold font-quicksand">
                              {wIdx + 1}
                            </span>
                            <span className="flex-1 font-outfit font-medium text-neutro-carbon">
                              {palabra}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => wIdx > 0 && moveWord(wIdx, wIdx - 1)}
                                disabled={wIdx === 0}
                                className="p-1 rounded hover:bg-sol-100 text-neutro-piedra disabled:opacity-30 transition-all"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => wIdx < currentOrder.length - 1 && moveWord(wIdx, wIdx + 1)}
                                disabled={wIdx === currentOrder.length - 1}
                                className="p-1 rounded hover:bg-sol-100 text-neutro-piedra disabled:opacity-30 transition-all"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!respuestas[pregunta.id] && (
                        <button
                          type="button"
                          onClick={() => {
                            const shuffled = [...palabrasCorrectas].sort(() => 0.5 - Math.random());
                            handleRespuesta(pregunta.id, shuffled.join('|'));
                          }}
                          className="w-full py-3 bg-sol-100 hover:bg-sol-200 text-sol-700 rounded-xl font-outfit font-medium text-sm transition-all"
                        >
                          🔀 Empezar a ordenar
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Tipo: Respuesta con imagen */}
                {pregunta.tipo === 'respuesta_imagen' && (
                  <div className="space-y-4">
                    {pregunta.imagen_url && (
                      <div className="flex justify-center">
                        <div className="rounded-2xl overflow-hidden border-2 border-white/60 shadow-md max-w-md">
                          <img
                            src={pregunta.imagen_url}
                            alt="Imagen de la pregunta"
                            className="w-full max-h-64 object-contain bg-white"
                            onError={(e) => { (e.target as HTMLImageElement).alt = 'Error al cargar imagen'; }}
                          />
                        </div>
                      </div>
                    )}
                    {pregunta.opciones && (
                      <div className="space-y-2">
                        {pregunta.opciones.map((opcion) => (
                          <button
                            key={opcion.id}
                            type="button"
                            onClick={() => handleRespuesta(pregunta.id, opcion.texto_opcion)}
                            className={`w-full text-left px-5 py-4 min-h-[52px] rounded-2xl font-outfit transition-all flex items-center gap-3 ${
                              respuestas[pregunta.id] === opcion.texto_opcion
                                ? 'bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white shadow-lg'
                                : 'bg-neutro-nube hover:bg-neutro-carbon/10 text-neutro-carbon'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              respuestas[pregunta.id] === opcion.texto_opcion
                                ? 'border-white bg-white/20'
                                : 'border-neutro-piedra/40'
                            }`}>
                              {respuestas[pregunta.id] === opcion.texto_opcion && (
                                <div className="w-3 h-3 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="font-medium">{opcion.texto_opcion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preguntas Especiales — Max niños y horas disponibles */}
        <div className="space-y-6 mt-6">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-impulso-200/40 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-impulso-100 text-impulso-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-neutro-carbon font-outfit text-lg font-medium">
                  ¿Cuántos niños podés acompañar como máximo?
                </p>
                <p className="text-xs text-neutro-piedra font-outfit">
                  Seleccioná entre 1 y 3 niños
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setMaxNinos(valor)}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold font-quicksand transition-all ${
                    maxNinos === valor
                      ? 'bg-gradient-to-br from-impulso-400 to-impulso-500 text-white shadow-lg scale-110'
                      : 'bg-neutro-nube hover:bg-neutro-carbon/10 text-neutro-piedra'
                  }`}
                >
                  {valor}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-crecimiento-200/40 shadow-[0_8px_32px_rgba(164,198,57,0.1)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-crecimiento-100 text-crecimiento-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-neutro-carbon font-outfit text-lg font-medium">
                  ¿Cuántas horas semanales podés dedicar?
                </p>
                <p className="text-xs text-neutro-piedra font-outfit">
                  Indicá tus horas disponibles por semana
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setHorasDisponibles(Math.max(1, horasDisponibles - 1))}
                className="w-12 h-12 rounded-xl bg-neutro-nube hover:bg-neutro-piedra/20 text-neutro-carbon font-bold transition-all flex items-center justify-center text-xl"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-4xl font-bold text-crecimiento-600 font-quicksand">
                  {horasDisponibles}
                </span>
                <p className="text-xs text-neutro-piedra font-outfit mt-1">
                  {horasDisponibles === 1 ? 'hora' : 'horas'} / semana
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHorasDisponibles(Math.min(40, horasDisponibles + 1))}
                className="w-12 h-12 rounded-xl bg-neutro-nube hover:bg-neutro-piedra/20 text-neutro-carbon font-bold transition-all flex items-center justify-center text-xl"
              >
                +
              </button>
            </div>
          </div>
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

        {/* ── Modal de notificación ─────────────────────────────── */}
        {modal.visible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.15)] w-full max-w-md p-8 animate-in fade-in zoom-in-95 border border-white/60">
              {/* ─ Resultado modal ─ */}
              {modal.tipo === 'resultado' ? (
                <div className="text-center space-y-5">
                  {/* Icon */}
                  <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                    (modal.porcentaje ?? 0) >= 70
                      ? 'bg-gradient-to-br from-crecimiento-400 to-crecimiento-500'
                      : 'bg-gradient-to-br from-amarillo-400 to-orange-400'
                  }`}>
                    <Trophy className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-neutro-carbon font-quicksand">
                    {modal.titulo}
                  </h3>

                  {/* Puntaje circle */}
                  <div className="relative mx-auto w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={(modal.porcentaje ?? 0) >= 70 ? '#a4c639' : '#f59e0b'}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${((modal.porcentaje ?? 0) / 100) * 327} 327`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-neutro-carbon font-quicksand">{modal.puntaje}/10</span>
                      <span className="text-sm text-neutro-piedra font-outfit">{modal.porcentaje}%</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-crecimiento-50 border border-crecimiento-200">
                      <CheckCircle className="w-5 h-5 text-crecimiento-500" />
                      <span className="text-sm font-outfit font-semibold text-crecimiento-700">{modal.correctas} correcta{modal.correctas !== 1 ? 's' : ''}</span>
                    </div>
                    {(modal.incorrectas ?? 0) > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 border border-red-200">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-outfit font-semibold text-red-700">{modal.incorrectas} incorrecta{modal.incorrectas !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {(modal.manuales ?? 0) > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200">
                        <FileText className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-outfit font-semibold text-amber-700">{modal.manuales} revisión manual</span>
                      </div>
                    )}
                  </div>

                  {/* Warning if low score */}
                  {(modal.porcentaje ?? 0) < 70 && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 font-outfit">
                        Tu puntaje es menor al 70%. Es posible que necesites completar capacitaciones adicionales.
                      </p>
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    onClick={() => {
                      setModal(m => ({ ...m, visible: false }));
                      if (modal.onClose) modal.onClose();
                    }}
                    className="w-full px-6 py-4 min-h-[52px] rounded-2xl bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white font-outfit font-semibold hover:shadow-[0_8px_24px_rgba(164,198,57,0.3)] transition-all active:scale-95"
                  >
                    Ver mis respuestas
                  </button>
                </div>
              ) : (
                /* ─ Generic modals (exito, error, advertencia) ─ */
                <div className="text-center space-y-5">
                  {/* Icon */}
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                    modal.tipo === 'exito'
                      ? 'bg-gradient-to-br from-crecimiento-400 to-crecimiento-500'
                      : modal.tipo === 'error'
                        ? 'bg-gradient-to-br from-red-400 to-red-500'
                        : 'bg-gradient-to-br from-amarillo-400 to-orange-400'
                  }`}>
                    {modal.tipo === 'exito' && <Check className="w-8 h-8 text-white" />}
                    {modal.tipo === 'error' && <X className="w-8 h-8 text-white" />}
                    {modal.tipo === 'advertencia' && <AlertTriangle className="w-8 h-8 text-white" />}
                  </div>

                  <h3 className="text-xl font-bold text-neutro-carbon font-quicksand">
                    {modal.titulo}
                  </h3>
                  <p className="text-neutro-piedra font-outfit leading-relaxed">
                    {modal.mensaje}
                  </p>

                  <button
                    onClick={() => {
                      setModal(m => ({ ...m, visible: false }));
                      if (modal.onClose) modal.onClose();
                    }}
                    className={`w-full px-6 py-3.5 min-h-[48px] rounded-2xl font-outfit font-semibold transition-all active:scale-95 ${
                      modal.tipo === 'exito'
                        ? 'bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white hover:shadow-[0_8px_24px_rgba(164,198,57,0.3)]'
                        : modal.tipo === 'error'
                          ? 'bg-gradient-to-r from-red-400 to-red-500 text-white hover:shadow-[0_8px_24px_rgba(239,68,68,0.3)]'
                          : 'bg-gradient-to-r from-amarillo-400 to-amarillo-500 text-white hover:shadow-[0_8px_24px_rgba(242,201,76,0.3)]'
                    }`}
                  >
                    Entendido
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
