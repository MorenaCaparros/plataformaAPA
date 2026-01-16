import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Listar entrevistas
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const ninoId = searchParams.get('nino_id');

    let query = supabase
      .from('entrevistas_familiares')
      .select(`
        *,
        nino:ninos!entrevistas_familiares_nino_id_fkey(
          id,
          nombre,
          apellido,
          rango_etario
        ),
        trabajadora_social:perfiles!entrevistas_familiares_trabajadora_social_id_fkey(
          id,
          nombre_completo
        )
      `)
      .order('fecha_entrevista', { ascending: false });

    if (ninoId) {
      query = query.eq('nino_id', ninoId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener entrevistas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entrevistas: data });
  } catch (error) {
    console.error('Error en GET /api/trabajo-social/entrevistas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva entrevista
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación y rol
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el usuario tiene rol de trabajo social
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    if (!perfil || !['trabajo_social', 'admin', 'director'].includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo trabajo social puede crear entrevistas.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nino_id,
      tipo_entrevista,
      lugar_entrevista,
      personas_presentes,
      // Embarazo
      alimentacion_embarazo,
      controles_prenatales,
      complicaciones_embarazo,
      // Alimentación
      alimentacion_actual,
      comidas_diarias,
      calidad_alimentacion,
      notas_alimentacion,
      // Escolaridad
      asiste_escuela,
      nombre_escuela,
      grado_actual,
      asistencia_regular,
      dificultades_escolares,
      // Vivienda
      tipo_vivienda,
      vivienda_propia,
      ambientes,
      agua,
      luz,
      gas,
      cloacas,
      condiciones_vivienda,
      observaciones_vivienda,
      // Económico
      trabajo_padre,
      trabajo_madre,
      ingresos_aproximados,
      recibe_ayuda_social,
      tipo_ayuda,
      observaciones_economicas,
      // Salud
      obra_social,
      cual_obra_social,
      controles_salud_regulares,
      medicacion_actual,
      diagnosticos_previos,
      // Contexto familiar
      composicion_familiar_descripcion,
      adultos_responsables,
      hermanos,
      otros_convivientes,
      relacion_padres,
      relacion_hermanos,
      red_apoyo_familiar,
      participacion_comunitaria,
      // Observaciones
      observaciones_trabajadora_social,
      situacion_riesgo,
      tipo_riesgo,
      derivaciones_sugeridas,
      prioridad_atencion,
      proxima_visita,
      acciones_pendientes,
      // Audio
      audio_url,
      created_offline,
    } = body;

    // Validaciones
    if (!nino_id) {
      return NextResponse.json(
        { error: 'El ID del niño es requerido' },
        { status: 400 }
      );
    }

    // Construir objeto de composición familiar
    const composicion_familiar = {
      adultos_responsables: adultos_responsables || 0,
      hermanos: hermanos || 0,
      otros_convivientes: otros_convivientes || 0,
      descripcion: composicion_familiar_descripcion || '',
    };

    // Construir objeto de vivienda
    const vivienda = {
      tipo: tipo_vivienda || 'casa',
      propia: vivienda_propia || false,
      ambientes: ambientes || 1,
      servicios_basicos: {
        agua: agua !== undefined ? agua : true,
        luz: luz !== undefined ? luz : true,
        gas: gas !== undefined ? gas : false,
        cloacas: cloacas !== undefined ? cloacas : false,
      },
      condiciones: condiciones_vivienda || 'regulares',
      observaciones: observaciones_vivienda || '',
    };

    // Construir objeto de situación económica
    const situacion_economica = {
      trabajo_padre: trabajo_padre || '',
      trabajo_madre: trabajo_madre || '',
      ingresos_aproximados: ingresos_aproximados || 'bajos',
      recibe_ayuda_social: recibe_ayuda_social || false,
      tipo_ayuda: tipo_ayuda ? tipo_ayuda.split(',').map((a: string) => a.trim()) : [],
      observaciones: observaciones_economicas || '',
    };

    // Insertar entrevista
    const { data: entrevista, error: insertError } = await supabase
      .from('entrevistas_familiares')
      .insert({
        nino_id,
        trabajadora_social_id: session.user.id,
        fecha_entrevista: new Date().toISOString(),
        tipo_entrevista: tipo_entrevista || 'inicial',
        lugar_entrevista,
        personas_presentes: personas_presentes || [],
        // Embarazo
        alimentacion_embarazo,
        controles_prenatales: controles_prenatales !== undefined ? controles_prenatales : true,
        complicaciones_embarazo,
        // Alimentación
        alimentacion_actual,
        comidas_diarias: comidas_diarias || 3,
        calidad_alimentacion: calidad_alimentacion || 'regular',
        notas_alimentacion,
        // Escolaridad
        asiste_escuela: asiste_escuela !== undefined ? asiste_escuela : true,
        nombre_escuela,
        grado_actual,
        asistencia_regular: asistencia_regular !== undefined ? asistencia_regular : true,
        dificultades_escolares,
        // Contexto familiar
        composicion_familiar,
        vivienda,
        situacion_economica,
        // Salud
        obra_social: obra_social || false,
        cual_obra_social,
        controles_salud_regulares: controles_salud_regulares || false,
        medicacion_actual,
        diagnosticos_previos: diagnosticos_previos
          ? diagnosticos_previos.split(',').map((d: string) => d.trim())
          : [],
        // Dinámicas familiares
        relacion_padres,
        relacion_hermanos,
        red_apoyo_familiar,
        participacion_comunitaria,
        // Observaciones
        observaciones_trabajadora_social,
        situacion_riesgo: situacion_riesgo || false,
        tipo_riesgo: tipo_riesgo ? tipo_riesgo.split(',').map((r: string) => r.trim()) : [],
        derivaciones_sugeridas: derivaciones_sugeridas
          ? derivaciones_sugeridas.split(',').map((d: string) => d.trim())
          : [],
        prioridad_atencion: prioridad_atencion || 'media',
        // Seguimiento
        proxima_visita: proxima_visita || null,
        acciones_pendientes: acciones_pendientes
          ? acciones_pendientes.split('\n').filter((a: string) => a.trim())
          : [],
        // Audio
        audio_entrevista_url: audio_url || null,
        // Offline
        created_offline: created_offline || false,
        sincronizado_at: created_offline ? null : new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear entrevista:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Si hay situación de riesgo alta o crítica, crear alerta automática
    if (situacion_riesgo && ['alta', 'urgente'].includes(prioridad_atencion)) {
      await supabase.from('alertas_sociales').insert({
        nino_id,
        trabajadora_social_id: session.user.id,
        tipo_alerta: 'situacion_riesgo',
        gravedad: prioridad_atencion === 'urgente' ? 'critica' : 'alta',
        descripcion: `Situación de riesgo detectada en entrevista familiar: ${tipo_riesgo}`,
        estado: 'activa',
        fecha_alerta: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      entrevista,
      message: 'Entrevista creada exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/trabajo-social/entrevistas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
