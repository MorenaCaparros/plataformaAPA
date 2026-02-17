import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase/api-auth';

const ROLES_PERMITIDOS = ['director', 'psicopedagogia', 'coordinador', 'trabajador_social', 'admin'];

async function verificarPermiso(supabase: any) {
  let userId = (supabase as any)._authUserId;
  if (!userId) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    userId = user.id;
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('id, rol')
    .eq('id', userId)
    .single();

  if (perfilError || !perfil || !ROLES_PERMITIDOS.includes(perfil.rol)) return null;
  return perfil;
}

/**
 * GET /api/banco-preguntas
 * Lista todas las preguntas del banco (capacitacion_id IS NULL)
 * Opcionalmente filtra por area_especifica
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);
    const perfil = await verificarPermiso(supabase);
    if (!perfil) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const activa = searchParams.get('activa'); // 'true' | 'false' | null (all)

    let query = supabase
      .from('preguntas_capacitacion')
      .select('*')
      .is('capacitacion_id', null)
      .order('area_especifica', { ascending: true })
      .order('orden', { ascending: true });

    if (area) {
      query = query.eq('area_especifica', area);
    }

    // Filter by activa using puntaje as flag: puntaje > 0 = activa, puntaje = 0 = inactiva
    // We use puntaje=0 as a "disabled" flag since the existing schema doesn't have an 'activa' column on preguntas
    if (activa === 'true') {
      query = query.gt('puntaje', 0);
    } else if (activa === 'false') {
      query = query.eq('puntaje', 0);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener banco de preguntas:', error);
      return NextResponse.json({ error: 'Error al obtener preguntas' }, { status: 500 });
    }

    // Map to cleaner shape
    const preguntas = (data || []).map((p: any) => ({
      id: p.id,
      pregunta: p.pregunta,
      tipo_pregunta: p.tipo_pregunta,
      area: p.area_especifica || 'sin_area',
      puntaje: p.puntaje,
      activa: p.puntaje > 0,
      orden: p.orden,
      created_at: p.created_at,
    }));

    return NextResponse.json(preguntas, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/banco-preguntas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/banco-preguntas
 * Crea una o varias preguntas en el banco (capacitacion_id = NULL)
 * Body: { preguntas: [{ pregunta, tipo_pregunta, area, puntaje? }] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedClient(request);
    const perfil = await verificarPermiso(supabase);
    if (!perfil) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { preguntas } = body;

    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array "preguntas" no vacío' },
        { status: 400 }
      );
    }

    // Validate each pregunta
    for (const p of preguntas) {
      if (!p.pregunta?.trim()) {
        return NextResponse.json({ error: 'Cada pregunta debe tener texto' }, { status: 400 });
      }
      if (!p.area?.trim()) {
        return NextResponse.json({ error: 'Cada pregunta debe tener un área' }, { status: 400 });
      }
    }

    // Get current max order per area to auto-assign orden
    const areas = [...new Set(preguntas.map((p: any) => p.area))];
    const ordenMaxPorArea: Record<string, number> = {};

    for (const a of areas) {
      const { data } = await supabase
        .from('preguntas_capacitacion')
        .select('orden')
        .is('capacitacion_id', null)
        .eq('area_especifica', a)
        .order('orden', { ascending: false })
        .limit(1);

      ordenMaxPorArea[a] = data && data.length > 0 ? data[0].orden : 0;
    }

    const inserts = preguntas.map((p: any, i: number) => {
      const area = p.area;
      ordenMaxPorArea[area] = (ordenMaxPorArea[area] || 0) + 1;
      return {
        capacitacion_id: null,
        orden: ordenMaxPorArea[area],
        pregunta: p.pregunta.trim(),
        tipo_pregunta: p.tipo_pregunta || 'escala',
        respuesta_correcta: p.respuesta_correcta || '',
        puntaje: p.puntaje ?? 10,
        area_especifica: area,
      };
    });

    const { data, error } = await supabase
      .from('preguntas_capacitacion')
      .insert(inserts)
      .select();

    if (error) {
      console.error('Error al crear preguntas:', error);
      return NextResponse.json({ error: 'Error al crear preguntas' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/banco-preguntas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
