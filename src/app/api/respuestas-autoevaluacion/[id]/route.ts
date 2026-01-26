import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/api-auth';

/**
 * PATCH /api/respuestas-autoevaluacion/[id]
 * Evalúa una respuesta de autoevaluación (asignar puntaje manual a preguntas abiertas)
 * Acceso: psicopedagogia, coordinador, director
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar rol (usar userId)
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

    if (!['director', 'psicopedagogia', 'coordinador'].includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo director, psicopedagogía o coordinador pueden evaluar' },
        { status: 403 }
      );
    }

    const respuestaId = params.id;

    // Obtener datos del body
    const body = await request.json();
    const { puntaje_manual, comentarios_evaluador } = body;

    // Validaciones
    if (puntaje_manual === undefined || puntaje_manual === null) {
      return NextResponse.json(
        { error: 'Debe proporcionar puntaje_manual' },
        { status: 400 }
      );
    }

    if (puntaje_manual < 0 || puntaje_manual > 10) {
      return NextResponse.json(
        { error: 'Puntaje manual debe estar entre 0 y 10' },
        { status: 400 }
      );
    }

    // Obtener la respuesta actual
    const { data: respuestaActual, error: respuestaError } = await supabase
      .from('respuestas_autoevaluacion')
      .select('*, plantilla:plantillas_autoevaluacion(*)')
      .eq('id', respuestaId)
      .single();

    if (respuestaError || !respuestaActual) {
      return NextResponse.json(
        { error: 'Respuesta de autoevaluación no encontrada' },
        { status: 404 }
      );
    }

    if (respuestaActual.estado === 'evaluada') {
      return NextResponse.json(
        { error: 'Esta respuesta ya fue evaluada' },
        { status: 400 }
      );
    }

    // Calcular puntaje total
    // Si la plantilla no requiere revisión, puntaje_manual = 0
    const puntajeAutomatico = respuestaActual.puntaje_automatico || 0;
    
    // Para plantillas mixtas: promediamos automático + manual
    // Para plantillas solo automáticas: solo usamos automático
    const plantilla = respuestaActual.plantilla;
    const cantidadPreguntasAbiertas = plantilla.preguntas.filter(
      (p: any) => p.tipo === 'texto_abierto'
    ).length;
    const cantidadPreguntasAutomaticas = plantilla.preguntas.filter(
      (p: any) => p.tipo !== 'texto_abierto'
    ).length;

    let puntajeTotal;
    if (cantidadPreguntasAbiertas === 0) {
      // Solo preguntas automáticas
      puntajeTotal = puntajeAutomatico;
    } else if (cantidadPreguntasAutomaticas === 0) {
      // Solo preguntas abiertas
      puntajeTotal = puntaje_manual;
    } else {
      // Mixtas: promedio ponderado
      const pesoAutomatico = cantidadPreguntasAutomaticas / plantilla.preguntas.length;
      const pesoManual = cantidadPreguntasAbiertas / plantilla.preguntas.length;
      puntajeTotal = (puntajeAutomatico * pesoAutomatico) + (puntaje_manual * pesoManual);
    }

    // Actualizar respuesta
    const { data: respuestaActualizada, error: updateError } = await supabase
      .from('respuestas_autoevaluacion')
      .update({
        puntaje_manual,
        puntaje_total: puntajeTotal,
        estado: 'evaluada',
        evaluado_por: user.id,
        fecha_evaluacion: new Date().toISOString(),
        comentarios_evaluador: comentarios_evaluador || null
      })
      .eq('id', respuestaId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al actualizar respuesta:', updateError);
      return NextResponse.json(
        { error: 'Error al evaluar respuesta de autoevaluación' },
        { status: 500 }
      );
    }

    // El trigger actualizar_estrellas_autoevaluacion se ejecutará automáticamente

    return NextResponse.json(respuestaActualizada, { status: 200 });
  } catch (error) {
    console.error('Error en PATCH /api/respuestas-autoevaluacion/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/respuestas-autoevaluacion/[id]
 * Obtiene una respuesta específica con todos sus detalles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const respuestaId = params.id;

    // Obtener respuesta con todos los detalles
    const { data: respuesta, error } = await supabase
      .from('respuestas_autoevaluacion')
      .select(`
        *,
        plantilla:plantillas_autoevaluacion(*),
        voluntario:perfiles!respuestas_autoevaluacion_voluntario_id_fkey(id, nombre_completo),
        evaluador:perfiles!respuestas_autoevaluacion_evaluado_por_fkey(nombre_completo)
      `)
      .eq('id', respuestaId)
      .single();

    if (error || !respuesta) {
      return NextResponse.json(
        { error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: voluntarios solo ven las suyas
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfil?.rol === 'voluntario' && respuesta.voluntario_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json(respuesta, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/respuestas-autoevaluacion/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
