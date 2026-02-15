import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/api-auth';

/**
 * GET /api/respuestas-autoevaluacion
 * Lista respuestas de autoevaluación
 * (Migrated from respuestas_autoevaluacion → voluntarios_capacitaciones + respuestas_capacitaciones)
 * - Voluntarios ven solo las suyas
 * - Psico/Coordinador/Director ven todas las que necesitan revisión
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);

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

    // Obtener perfil del usuario
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
      .from('voluntarios_capacitaciones')
      .select(`
        *,
        capacitacion:capacitaciones(id, nombre, descripcion, area, tipo)
      `)
      .order('fecha_completado', { ascending: false });

    // Only fetch autoevaluacion type
    // We'll filter after join since we can't easily filter on the related table in supabase-js

    if (perfil.rol === 'voluntario') {
      query = query.eq('voluntario_id', perfil.id);
    } else if (['psicopedagogia', 'coordinador', 'director'].includes(perfil.rol)) {
      if (estado) {
        // Map old estados to new ones
        const estadoMap: Record<string, string> = {
          'en_revision': 'completada',
          'completada': 'aprobada',
          'evaluada': 'aprobada',
        };
        query = query.eq('estado', estadoMap[estado] || estado);
      }
    } else {
      return NextResponse.json(
        { error: 'Rol no autorizado' },
        { status: 403 }
      );
    }

    const { data: registros, error } = await query;

    if (error) {
      console.error('Error al obtener respuestas:', error);
      return NextResponse.json(
        { error: 'Error al obtener respuestas de autoevaluación' },
        { status: 500 }
      );
    }

    // Filter only autoevaluacion type and map to old shape
    const respuestas = (registros || [])
      .filter((r: any) => r.capacitacion?.tipo === 'autoevaluacion')
      .map((r: any) => ({
        id: r.id,
        plantilla_id: r.capacitacion_id,
        voluntario_id: r.voluntario_id,
        puntaje_automatico: r.puntaje_final,
        puntaje_total: r.puntaje_final,
        puntaje_manual: null,
        estado: mapEstadoToOld(r.estado),
        fecha_completada: r.fecha_completado || r.created_at,
        plantilla: r.capacitacion ? {
          titulo: r.capacitacion.nombre,
          area: r.capacitacion.area,
        } : null,
      }));

    return NextResponse.json(respuestas, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/respuestas-autoevaluacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function mapEstadoToOld(estado: string): string {
  const mapping: Record<string, string> = {
    'pendiente': 'completada',
    'en_progreso': 'completada',
    'completada': 'en_revision',
    'aprobada': 'evaluada',
    'reprobada': 'evaluada',
  };
  return mapping[estado] || estado;
}

/**
 * POST /api/respuestas-autoevaluacion
 * Crea una respuesta de autoevaluación (voluntario completa la evaluación)
 * (Migrated to voluntarios_capacitaciones + respuestas_capacitaciones)
 * Acceso: voluntario
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);

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

    // Verificar que sea voluntario
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

    // Get capacitacion + preguntas
    const { data: capacitacion, error: capError } = await supabase
      .from('capacitaciones')
      .select(`
        *,
        preguntas:preguntas_capacitacion(id, pregunta, tipo_pregunta, respuesta_correcta, puntaje)
      `)
      .eq('id', plantilla_id)
      .eq('activa', true)
      .single();

    if (capError || !capacitacion) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada o no está activa' },
        { status: 404 }
      );
    }

    // 1. Create or get voluntarios_capacitaciones record
    const { data: volCap, error: volCapError } = await supabase
      .from('voluntarios_capacitaciones')
      .insert({
        voluntario_id: perfil.id,
        capacitacion_id: plantilla_id,
        estado: 'completada',
        fecha_inicio: new Date().toISOString(),
        fecha_completado: new Date().toISOString(),
        intentos: 1,
      })
      .select()
      .single();

    if (volCapError) {
      console.error('Error al crear registro de capacitación:', volCapError);
      return NextResponse.json(
        { error: 'Error al guardar respuesta de autoevaluación' },
        { status: 500 }
      );
    }

    // 2. Insert individual responses
    let puntajeTotal = 0;
    let puntajeMaximo = 0;

    for (const respuesta of respuestas) {
      const pregunta = capacitacion.preguntas?.find((p: any) => p.id === respuesta.pregunta_id);
      
      if (!pregunta) continue;

      const esCorrecta = checkRespuestaCorrecta(pregunta, respuesta.respuesta);
      const puntajeObtenido = esCorrecta ? (pregunta.puntaje || 10) : 0;
      
      puntajeTotal += puntajeObtenido;
      puntajeMaximo += (pregunta.puntaje || 10);

      await supabase
        .from('respuestas_capacitaciones')
        .insert({
          voluntario_capacitacion_id: volCap.id,
          pregunta_id: pregunta.id,
          respuesta: String(respuesta.respuesta),
          es_correcta: esCorrecta,
          puntaje_obtenido: puntajeObtenido,
        });
    }

    // 3. Update puntaje in voluntarios_capacitaciones
    const porcentaje = puntajeMaximo > 0 ? Math.round((puntajeTotal / puntajeMaximo) * 100) : 0;
    const aprobada = porcentaje >= (capacitacion.puntaje_minimo_aprobacion || 70);

    const { error: updateError } = await supabase
      .from('voluntarios_capacitaciones')
      .update({
        puntaje_final: puntajeTotal,
        puntaje_maximo: puntajeMaximo,
        porcentaje,
        estado: aprobada ? 'aprobada' : 'reprobada',
      })
      .eq('id', volCap.id);

    if (updateError) {
      console.error('Error al actualizar puntaje:', updateError);
    }

    // Map to old response shape
    const respuestaFormateada = {
      id: volCap.id,
      plantilla_id,
      voluntario_id: perfil.id,
      puntaje_automatico: porcentaje / 10, // normalize to 0-10
      puntaje_total: porcentaje / 10,
      estado: aprobada ? 'evaluada' : 'completada',
      fecha_completada: volCap.fecha_completado,
    };

    return NextResponse.json(respuestaFormateada, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/respuestas-autoevaluacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function checkRespuestaCorrecta(pregunta: any, respuesta: any): boolean {
  if (pregunta.tipo_pregunta === 'verdadero_falso') {
    return String(respuesta).toLowerCase() === String(pregunta.respuesta_correcta).toLowerCase();
  }
  if (pregunta.tipo_pregunta === 'multiple_choice') {
    return String(respuesta) === String(pregunta.respuesta_correcta);
  }
  if (pregunta.tipo_pregunta === 'escala' || pregunta.tipo_pregunta === 'numero') {
    // For scales, any answer above half the puntaje is "correct"
    const val = parseFloat(respuesta);
    return !isNaN(val) && val >= 3;
  }
  // texto_libre - needs manual review, mark as not auto-correct
  return false;
}
