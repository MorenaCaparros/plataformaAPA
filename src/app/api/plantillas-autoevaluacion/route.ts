import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/api-auth';

/**
 * GET /api/plantillas-autoevaluacion
 * Lista todas las plantillas activas de autoevaluación
 * Acceso: Todos los usuarios autenticados
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);

    // Verificar autenticación (con Bearer token, el userId está en _authUserId)
    const userId = (supabase as any)._authUserId;
    if (!userId) {
      // Si no hay _authUserId, intentar con getUser() (cookies)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
    }

    console.log('✅ Usuario autenticado en GET plantillas:', userId || 'desde cookies');

    // Obtener área específica si se pasa como query param
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');

    let query = supabase
      .from('plantillas_autoevaluacion')
      .select('*')
      .eq('activo', true)
      .order('area', { ascending: true })
      .order('fecha_creacion', { ascending: false });

    if (area) {
      query = query.eq('area', area);
    }

    const { data: plantillas, error } = await query;

    if (error) {
      console.error('Error al obtener plantillas:', error);
      return NextResponse.json(
        { error: 'Error al obtener plantillas de autoevaluación' },
        { status: 500 }
      );
    }

    return NextResponse.json(plantillas, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/plantillas-autoevaluacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plantillas-autoevaluacion
 * Crea una nueva plantilla de autoevaluación
 * Acceso: director, psicopedagogia, coordinador
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

    // Verificar rol
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    if (!['director', 'psicopedagogia', 'coordinador'].includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo director, psicopedagogía o coordinador pueden crear plantillas' },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { titulo, area, descripcion, preguntas, puntaje_maximo } = body;

    // Validaciones
    if (!titulo || !area || !preguntas) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: titulo, area, preguntas' },
        { status: 400 }
      );
    }

    if (!['lenguaje', 'grafismo', 'lectura_escritura', 'matematicas'].includes(area)) {
      return NextResponse.json(
        { error: 'Área inválida. Debe ser: lenguaje, grafismo, lectura_escritura o matematicas' },
        { status: 400 }
      );
    }

    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      return NextResponse.json(
        { error: 'Preguntas debe ser un array no vacío' },
        { status: 400 }
      );
    }

    // Validar estructura de preguntas
    const tiposValidos = ['multiple_choice', 'texto_abierto', 'escala'];
    let requiereRevision = false;

    for (const pregunta of preguntas) {
      if (!pregunta.tipo || !pregunta.pregunta) {
        return NextResponse.json(
          { error: 'Cada pregunta debe tener tipo y pregunta' },
          { status: 400 }
        );
      }

      if (!tiposValidos.includes(pregunta.tipo)) {
        return NextResponse.json(
          { error: `Tipo de pregunta inválido: ${pregunta.tipo}. Tipos válidos: ${tiposValidos.join(', ')}` },
          { status: 400 }
        );
      }

      // Si hay preguntas de texto abierto, requiere revisión
      if (pregunta.tipo === 'texto_abierto') {
        requiereRevision = true;
      }

      // Validar estructura según tipo
      if (pregunta.tipo === 'multiple_choice') {
        if (!Array.isArray(pregunta.opciones) || !Array.isArray(pregunta.puntaje_por_opcion)) {
          return NextResponse.json(
            { error: 'Preguntas de tipo multiple_choice deben tener opciones y puntaje_por_opcion' },
            { status: 400 }
          );
        }
        if (pregunta.opciones.length !== pregunta.puntaje_por_opcion.length) {
          return NextResponse.json(
            { error: 'La cantidad de opciones debe coincidir con la cantidad de puntajes' },
            { status: 400 }
          );
        }
      }

      if (pregunta.tipo === 'escala') {
        if (!pregunta.escala_min || !pregunta.escala_max) {
          return NextResponse.json(
            { error: 'Preguntas de tipo escala deben tener escala_min y escala_max' },
            { status: 400 }
          );
        }
      }

      if (pregunta.tipo === 'texto_abierto') {
        if (!pregunta.min_caracteres) {
          return NextResponse.json(
            { error: 'Preguntas de tipo texto_abierto deben tener min_caracteres' },
            { status: 400 }
          );
        }
      }
    }

    // Insertar plantilla
    const { data: nuevaPlantilla, error: insertError } = await supabase
      .from('plantillas_autoevaluacion')
      .insert({
        titulo,
        area,
        descripcion: descripcion || null,
        preguntas,
        puntaje_maximo: puntaje_maximo || 10,
        requiere_revision: requiereRevision,
        creado_por: user.id,
        activo: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear plantilla:', insertError);
      return NextResponse.json(
        { error: 'Error al crear plantilla de autoevaluación' },
        { status: 500 }
      );
    }

    return NextResponse.json(nuevaPlantilla, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/plantillas-autoevaluacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
