import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/api-auth';

/**
 * GET /api/respuestas-autoevaluacion
 * Lista respuestas de autoevaluación
 * - Voluntarios ven solo las suyas
 * - Psico/Coordinador/Director ven todas las que necesitan revisión
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);

    // Verificar autenticación (con Bearer token, el userId está en _authUserId)
    let userId = (supabase as any)._authUserId;
    let user = null;
    
    if (!userId) {
      // Si no hay _authUserId, intentar con getUser() (cookies)
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !cookieUser) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      user = cookieUser;
      userId = user.id;
    }

    // Obtener perfil del usuario usando userId
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, rol')
      .eq('id', userId)
      .single();

    if (perfilError || !perfil) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');

    let query = supabase
      .from('respuestas_autoevaluacion')
      .select(`
        *,
        plantilla:plantillas_autoevaluacion(titulo, area)
      `)
      .order('fecha_completada', { ascending: false });

    if (perfil.rol === 'voluntario') {
      // Voluntarios solo ven sus propias respuestas
      query = query.eq('voluntario_id', perfil.id);
    } else if (['psicopedagogia', 'coordinador', 'director'].includes(perfil.rol)) {
      // Estos roles pueden filtrar por estado
      if (estado) {
        query = query.eq('estado', estado);
      }
    } else {
      return NextResponse.json(
        { error: 'Rol no autorizado' },
        { status: 403 }
      );
    }

    const { data: respuestas, error } = await query;

    if (error) {
      console.error('Error al obtener respuestas:', error);
      return NextResponse.json(
        { error: 'Error al obtener respuestas de autoevaluación' },
        { status: 500 }
      );
    }

    return NextResponse.json(respuestas, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/respuestas-autoevaluacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/respuestas-autoevaluacion
 * Crea una respuesta de autoevaluación (voluntario completa la evaluación)
 * Acceso: voluntario
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);

    // Verificar autenticación
    let userId = (supabase as any)._authUserId;
    let user = null;
    
    if (!userId) {
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !cookieUser) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
      user = cookieUser;
      userId = user.id;
    }

    // Verificar que sea voluntario (usar userId que ya tenemos)
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, rol')
      .eq('id', userId)
      .single();

    if (perfilError || !perfil) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    if (perfil.rol !== 'voluntario') {
      return NextResponse.json(
        { error: 'Solo voluntarios pueden completar autoevaluaciones' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { plantilla_id, respuestas } = body;

    // Validaciones
    if (!plantilla_id || !respuestas) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: plantilla_id, respuestas' },
        { status: 400 }
      );
    }

    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return NextResponse.json(
        { error: 'Respuestas debe ser un array no vacío' },
        { status: 400 }
      );
    }

    // Obtener la plantilla
    const { data: plantilla, error: plantillaError } = await supabase
      .from('plantillas_autoevaluacion')
      .select('*')
      .eq('id', plantilla_id)
      .eq('activo', true)
      .single();

    if (plantillaError || !plantilla) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada o no está activa' },
        { status: 404 }
      );
    }

    // Validar que todas las preguntas estén respondidas
    const preguntasIds = plantilla.preguntas.map((p: any) => p.id);
    const respuestasIds = respuestas.map((r: any) => r.pregunta_id);

    if (preguntasIds.length !== respuestasIds.length) {
      return NextResponse.json(
        { error: 'Debe responder todas las preguntas' },
        { status: 400 }
      );
    }

    for (const preguntaId of preguntasIds) {
      if (!respuestasIds.includes(preguntaId)) {
        return NextResponse.json(
          { error: `Falta responder la pregunta ${preguntaId}` },
          { status: 400 }
        );
      }
    }

    // Calcular puntaje automático
    let puntajeAutomatico = 0;
    let requiereRevision = false;

    for (const respuesta of respuestas) {
      const pregunta = plantilla.preguntas.find((p: any) => p.id === respuesta.pregunta_id);
      
      if (!pregunta) continue;

      if (pregunta.tipo === 'multiple_choice') {
        // Obtener puntaje de la opción seleccionada
        const indiceOpcion = pregunta.opciones.indexOf(respuesta.respuesta);
        if (indiceOpcion !== -1) {
          puntajeAutomatico += pregunta.puntaje_por_opcion[indiceOpcion] || 0;
        }
      } else if (pregunta.tipo === 'escala') {
        // El puntaje es el valor seleccionado en la escala
        puntajeAutomatico += parseFloat(respuesta.respuesta) || 0;
      } else if (pregunta.tipo === 'texto_abierto') {
        // Validar longitud mínima
        if (respuesta.respuesta.length < pregunta.min_caracteres) {
          return NextResponse.json(
            { error: `La respuesta a "${pregunta.pregunta}" debe tener al menos ${pregunta.min_caracteres} caracteres` },
            { status: 400 }
          );
        }
        requiereRevision = true;
      }
    }

    // Normalizar puntaje automático a escala 1-10
    const cantidadPreguntasAutomaticas = plantilla.preguntas.filter(
      (p: any) => p.tipo !== 'texto_abierto'
    ).length;

    let puntajeAutomaticoNormalizado = 0;
    if (cantidadPreguntasAutomaticas > 0) {
      const puntajeMaximoAutomatico = plantilla.preguntas
        .filter((p: any) => p.tipo !== 'texto_abierto')
        .reduce((sum: number, p: any) => {
          if (p.tipo === 'multiple_choice') {
            return sum + Math.max(...p.puntaje_por_opcion);
          } else if (p.tipo === 'escala') {
            return sum + (p.puntaje_maximo || p.escala_max);
          }
          return sum;
        }, 0);

      puntajeAutomaticoNormalizado = (puntajeAutomatico / puntajeMaximoAutomatico) * 10;
    }

    // Determinar estado inicial
    const estadoInicial = requiereRevision ? 'en_revision' : 'completada';
    const puntajeTotal = requiereRevision ? null : puntajeAutomaticoNormalizado;

    // Insertar respuesta
    const { data: nuevaRespuesta, error: insertError } = await supabase
      .from('respuestas_autoevaluacion')
      .insert({
        voluntario_id: perfil.id,
        plantilla_id,
        respuestas,
        puntaje_automatico: puntajeAutomaticoNormalizado,
        puntaje_manual: null,
        puntaje_total: puntajeTotal,
        estado: estadoInicial,
        fecha_completada: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al guardar respuesta:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar respuesta de autoevaluación' },
        { status: 500 }
      );
    }

    // Si no requiere revisión, actualizar estrellas inmediatamente
    // El trigger se encargará automáticamente cuando estado = 'evaluada'
    if (!requiereRevision) {
      const { error: updateError } = await supabase
        .from('respuestas_autoevaluacion')
        .update({ estado: 'evaluada', fecha_evaluacion: new Date().toISOString() })
        .eq('id', nuevaRespuesta.id);

      if (updateError) {
        console.error('Error al marcar como evaluada:', updateError);
      }
    }

    return NextResponse.json(nuevaRespuesta, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/respuestas-autoevaluacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
