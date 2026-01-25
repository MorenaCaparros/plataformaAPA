import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Ver estrellas y habilidades del voluntario
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const voluntarioId = searchParams.get('voluntario_id') || user.id;

    // Verificar permisos
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesSuperiores = ['director', 'coordinador', 'psicopedagogia'];
    const puedeVer = voluntarioId === user.id || rolesSuperiores.includes(perfil?.rol || '');

    if (!puedeVer) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver estas habilidades' },
        { status: 403 }
      );
    }

    // Obtener habilidades
    const { data: habilidades, error } = await supabaseAdmin
      .from('voluntarios_habilidades')
      .select('*')
      .eq('voluntario_id', voluntarioId)
      .order('area');

    if (error) throw error;

    // Si no tiene habilidades, inicializar con 0 en todas las áreas
    if (!habilidades || habilidades.length === 0) {
      const areasBase = ['lenguaje', 'grafismo', 'lectura_escritura', 'matematicas'];
      const habilidadesIniciales = areasBase.map(area => ({
        area,
        estrellas: 0,
        capacitaciones_completadas: 0,
        sesiones_realizadas: 0
      }));

      return NextResponse.json({
        habilidades: habilidadesIniciales,
        promedio: 0,
        total_capacitaciones: 0,
        total_sesiones: 0
      });
    }

    // Calcular estadísticas
    const promedio = habilidades.reduce((sum, h) => sum + Number(h.estrellas), 0) / habilidades.length;
    const totalCapacitaciones = habilidades.reduce((sum, h) => sum + h.capacitaciones_completadas, 0);
    const totalSesiones = habilidades.reduce((sum, h) => sum + h.sesiones_realizadas, 0);

    return NextResponse.json({
      habilidades,
      promedio: Math.round(promedio * 10) / 10,
      total_capacitaciones: totalCapacitaciones,
      total_sesiones: totalSesiones
    });

  } catch (error: any) {
    console.error('Error en GET /api/voluntarios/habilidades:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener habilidades' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar habilidades manualmente (solo coordinador/psico)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar rol
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesPermitidos = ['director', 'coordinador', 'psicopedagogia'];
    if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar habilidades manualmente' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { voluntario_id, area, estrellas, notas } = body;

    if (!voluntario_id || !area || estrellas === undefined) {
      return NextResponse.json(
        { error: 'voluntario_id, area y estrellas son requeridos' },
        { status: 400 }
      );
    }

    if (estrellas < 0 || estrellas > 5) {
      return NextResponse.json(
        { error: 'Estrellas deben estar entre 0 y 5' },
        { status: 400 }
      );
    }

    const areasValidas = ['lenguaje', 'grafismo', 'lectura_escritura', 'matematicas'];
    if (!areasValidas.includes(area)) {
      return NextResponse.json(
        { error: `Área inválida. Debe ser: ${areasValidas.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert habilidad
    const { data, error } = await supabaseAdmin
      .from('voluntarios_habilidades')
      .upsert({
        voluntario_id,
        area,
        estrellas,
        notas,
        ultima_actualizacion: new Date().toISOString()
      }, {
        onConflict: 'voluntario_id,area'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      mensaje: 'Habilidad actualizada exitosamente',
      habilidad: data
    });

  } catch (error: any) {
    console.error('Error en PATCH /api/voluntarios/habilidades:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar habilidad' },
      { status: 500 }
    );
  }
}
