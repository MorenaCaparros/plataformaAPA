import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Listar evaluaciones (now from entrevistas table, tipo='inicial')
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );
    const { searchParams } = new URL(request.url);
    const ninoId = searchParams.get('nino_id');

    let query = supabase
      .from('entrevistas')
      .select(`
        *,
        nino:ninos!entrevistas_nino_id_fkey(
          id,
          alias,
          fecha_nacimiento,
          rango_etario
        ),
        entrevistador:perfiles!entrevistas_entrevistador_id_fkey(
          id,
          nombre,
          apellido
        )
      `)
      .eq('tipo', 'inicial')
      .order('fecha', { ascending: false });

    if (ninoId) {
      query = query.eq('nino_id', ninoId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener evaluaciones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map entrevistas to evaluaciones-like shape for frontend compatibility
    const evaluaciones = (data || []).map((e: any) => ({
      id: e.id,
      nino_id: e.nino_id,
      fecha_evaluacion: e.fecha,
      observaciones_generales: e.observaciones,
      conclusiones: e.conclusiones,
      acciones_sugeridas: e.acciones_sugeridas,
      nino: e.nino,
      psicopedagoga: e.entrevistador,
    }));

    return NextResponse.json({ evaluaciones });
  } catch (error) {
    console.error('Error en GET /api/psicopedagogia/evaluaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva evaluación (inserts into entrevistas with tipo='inicial')
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );
    
    // Verificar autenticación y rol
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el usuario tiene rol de psicopedagogía
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    if (!perfil || !['psicopedagogia', 'admin', 'director'].includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo psicopedagogía puede crear evaluaciones.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nino_id,
      // Lenguaje y Vocabulario
      comprension_ordenes,
      identificacion_objetos,
      formacion_oraciones,
      pronunciacion,
      notas_lenguaje,
      // Grafismo y Motricidad Fina
      agarre_lapiz,
      tipo_trazo,
      representacion_figuras,
      notas_grafismo,
      // Lectura y Escritura
      reconocimiento_vocales,
      reconocimiento_consonantes,
      identificacion_silabas,
      lectura_palabras,
      lectura_textos,
      escritura_nombre,
      escritura_palabras,
      escritura_oraciones,
      comprension_lectora,
      notas_lectoescritura,
      // Nociones Matemáticas
      conteo,
      reconocimiento_numeros,
      suma_basica,
      resta_basica,
      razonamiento_logico,
      notas_matematicas,
      // Conclusiones
      dificultades_identificadas,
      fortalezas,
      nivel_alfabetizacion,
      observaciones_generales,
      recomendaciones,
    } = body;

    // Validaciones básicas
    if (!nino_id) {
      return NextResponse.json(
        { error: 'El ID del niño es requerido' },
        { status: 400 }
      );
    }

    // Build structured observaciones with all scoring data
    const evaluacionData = {
      lenguaje: {
        comprension_ordenes,
        identificacion_objetos,
        formacion_oraciones,
        pronunciacion,
        notas: notas_lenguaje,
      },
      grafismo: {
        agarre_lapiz,
        tipo_trazo,
        representacion_figuras,
        notas: notas_grafismo,
      },
      lectoescritura: {
        reconocimiento_vocales,
        reconocimiento_consonantes,
        identificacion_silabas,
        lectura_palabras,
        lectura_textos,
        escritura_nombre,
        escritura_palabras,
        escritura_oraciones,
        comprension_lectora,
        notas: notas_lectoescritura,
      },
      matematicas: {
        conteo,
        reconocimiento_numeros,
        suma_basica,
        resta_basica,
        razonamiento_logico,
        notas: notas_matematicas,
      },
    };

    // Build conclusiones text
    const dificultadesArr = Array.isArray(dificultades_identificadas)
      ? dificultades_identificadas
      : (dificultades_identificadas || '').split('\n').filter((d: string) => d.trim());
    const fortalezasArr = Array.isArray(fortalezas)
      ? fortalezas
      : (fortalezas || '').split('\n').filter((f: string) => f.trim());

    const conclusionesText = [
      `Nivel de alfabetización: ${nivel_alfabetizacion || 'No especificado'}`,
      '',
      'Dificultades identificadas:',
      ...dificultadesArr.map((d: string) => `- ${d}`),
      '',
      'Fortalezas:',
      ...fortalezasArr.map((f: string) => `- ${f}`),
    ].join('\n');

    // Build observaciones: structured scoring + general notes
    const observacionesText = [
      `Datos de evaluación: ${JSON.stringify(evaluacionData)}`,
      '',
      observaciones_generales || '',
    ].join('\n').trim();

    // Insert into entrevistas with tipo='inicial'
    const { data: entrevista, error: insertError } = await supabase
      .from('entrevistas')
      .insert({
        nino_id,
        entrevistador_id: session.user.id,
        tipo: 'inicial',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: observacionesText,
        conclusiones: conclusionesText,
        acciones_sugeridas: recomendaciones || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear evaluación:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update nivel_alfabetizacion on ninos table if provided
    if (nivel_alfabetizacion) {
      await supabase
        .from('ninos')
        .update({ nivel_alfabetizacion })
        .eq('id', nino_id);
    }

    return NextResponse.json({
      success: true,
      evaluacion: entrevista,
      message: 'Evaluación creada exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/psicopedagogia/evaluaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
