import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Listar evaluaciones
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const ninoId = searchParams.get('nino_id');

    let query = supabase
      .from('evaluaciones_iniciales')
      .select(`
        *,
        nino:ninos!evaluaciones_iniciales_nino_id_fkey(
          id,
          nombre,
          apellido,
          fecha_nacimiento,
          rango_etario
        ),
        psicopedagoga:perfiles!evaluaciones_iniciales_psicopedagoga_id_fkey(
          id,
          nombre_completo
        )
      `)
      .order('fecha_evaluacion', { ascending: false });

    if (ninoId) {
      query = query.eq('nino_id', ninoId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener evaluaciones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ evaluaciones: data });
  } catch (error) {
    console.error('Error en GET /api/psicopedagogia/evaluaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva evaluación
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

    // Insertar evaluación
    const { data: evaluacion, error: insertError } = await supabase
      .from('evaluaciones_iniciales')
      .insert({
        nino_id,
        psicopedagoga_id: session.user.id,
        fecha_evaluacion: new Date().toISOString(),
        // Lenguaje
        comprension_ordenes,
        identificacion_objetos,
        formacion_oraciones,
        pronunciacion,
        notas_lenguaje,
        // Grafismo
        agarre_lapiz,
        tipo_trazo,
        representacion_figuras,
        notas_grafismo,
        // Lectoescritura
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
        // Matemáticas
        conteo,
        reconocimiento_numeros,
        suma_basica,
        resta_basica,
        razonamiento_logico,
        notas_matematicas,
        // Conclusiones
        dificultades_identificadas: Array.isArray(dificultades_identificadas)
          ? dificultades_identificadas
          : dificultades_identificadas.split('\n').filter((d: string) => d.trim()),
        fortalezas: Array.isArray(fortalezas)
          ? fortalezas
          : fortalezas.split('\n').filter((f: string) => f.trim()),
        nivel_alfabetizacion,
        observaciones_generales,
        recomendaciones,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear evaluación:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      evaluacion,
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
