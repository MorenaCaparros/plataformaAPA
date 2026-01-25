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

// GET - Listar asignaciones
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
    const voluntarioId = searchParams.get('voluntario_id');
    const ninoId = searchParams.get('nino_id');
    const activo = searchParams.get('activo') !== 'false'; // Por defecto true

    // Obtener perfil del usuario
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    // Si es voluntario, solo puede ver sus propias asignaciones
    const esVoluntario = perfil?.rol === 'voluntario';
    const idConsulta = esVoluntario ? user.id : voluntarioId;

    // Construir query
    let query = supabaseAdmin
      .from('asignaciones_voluntarios')
      .select(`
        *,
        voluntario:perfiles!voluntario_id (
          id,
          rol,
          metadata
        ),
        nino:ninos (
          id,
          alias,
          rango_etario
        )
      `)
      .eq('activo', activo)
      .order('fecha_asignacion', { ascending: false });

    if (idConsulta) {
      query = query.eq('voluntario_id', idConsulta);
    }

    if (ninoId) {
      query = query.eq('nino_id', ninoId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      asignaciones: data || [],
      total: data?.length || 0
    });

  } catch (error: any) {
    console.error('Error en GET /api/asignaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener asignaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear asignación voluntario-niño
export async function POST(request: NextRequest) {
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
        { error: 'No tienes permisos para crear asignaciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { voluntario_id, nino_id, areas_foco, notas } = body;

    if (!voluntario_id || !nino_id) {
      return NextResponse.json(
        { error: 'voluntario_id y nino_id son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que no exista asignación activa
    const { data: existente } = await supabaseAdmin
      .from('asignaciones_voluntarios')
      .select('id')
      .eq('voluntario_id', voluntario_id)
      .eq('nino_id', nino_id)
      .eq('activo', true)
      .single();

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una asignación activa entre este voluntario y niño' },
        { status: 400 }
      );
    }

    // Calcular score de matching
    const { data: scoreData } = await supabaseAdmin
      .rpc('calcular_score_matching', {
        p_voluntario_id: voluntario_id,
        p_nino_id: nino_id
      });

    const score = scoreData || 0;

    // Crear asignación
    const { data, error } = await supabaseAdmin
      .from('asignaciones_voluntarios')
      .insert({
        voluntario_id,
        nino_id,
        score_matching: score,
        areas_foco,
        notas,
        asignado_por: user.id,
        activo: true
      })
      .select(`
        *,
        voluntario:perfiles!voluntario_id (
          id,
          metadata
        ),
        nino:ninos (
          id,
          alias,
          rango_etario
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      mensaje: 'Asignación creada exitosamente',
      asignacion: data
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/asignaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear asignación' },
      { status: 500 }
    );
  }
}

// PATCH - Finalizar o actualizar asignación
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
        { error: 'No tienes permisos para actualizar asignaciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, activo, notas, areas_foco } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de asignación requerido' }, { status: 400 });
    }

    const updates: any = {};

    if (activo !== undefined) {
      updates.activo = activo;
      if (!activo) {
        updates.fecha_finalizacion = new Date().toISOString();
      }
    }

    if (notas !== undefined) {
      updates.notas = notas;
    }

    if (areas_foco !== undefined) {
      updates.areas_foco = areas_foco;
    }

    // Actualizar
    const { data, error } = await supabaseAdmin
      .from('asignaciones_voluntarios')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        voluntario:perfiles!voluntario_id (
          id,
          metadata
        ),
        nino:ninos (
          id,
          alias
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      mensaje: 'Asignación actualizada exitosamente',
      asignacion: data
    });

  } catch (error: any) {
    console.error('Error en PATCH /api/asignaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar asignación' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar asignación
export async function DELETE(request: NextRequest) {
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

    if (perfil?.rol !== 'director') {
      return NextResponse.json(
        { error: 'Solo el director puede eliminar asignaciones' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de asignación requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('asignaciones_voluntarios')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ mensaje: 'Asignación eliminada exitosamente' });

  } catch (error: any) {
    console.error('Error en DELETE /api/asignaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar asignación' },
      { status: 500 }
    );
  }
}
