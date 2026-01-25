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

// GET - Ver capacitaciones del voluntario
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
    const estado = searchParams.get('estado'); // pendiente, en_curso, completada

    // Verificar permisos (solo el voluntario o roles superiores)
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesSuperiores = ['director', 'coordinador', 'psicopedagogia'];
    const puedeVer = voluntarioId === user.id || rolesSuperiores.includes(perfil?.rol || '');

    if (!puedeVer) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver estas capacitaciones' },
        { status: 403 }
      );
    }

    // Obtener capacitaciones del voluntario con JOIN
    let query = supabaseAdmin
      .from('voluntarios_capacitaciones')
      .select(`
        *,
        capacitacion:capacitaciones (
          titulo,
          descripcion,
          area,
          tipo,
          puntaje_otorgado,
          duracion_estimada,
          contenido
        )
      `)
      .eq('voluntario_id', voluntarioId)
      .order('fecha_asignacion', { ascending: false });

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Agrupar por estado para estadísticas
    const estadisticas = {
      pendientes: data?.filter(c => c.estado === 'pendiente').length || 0,
      en_curso: data?.filter(c => c.estado === 'en_curso').length || 0,
      completadas: data?.filter(c => c.estado === 'completada').length || 0,
      no_aprobadas: data?.filter(c => c.estado === 'no_aprobada').length || 0,
      total: data?.length || 0
    };

    return NextResponse.json({
      capacitaciones: data,
      estadisticas
    });

  } catch (error: any) {
    console.error('Error en GET /api/voluntarios/capacitaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener capacitaciones' },
      { status: 500 }
    );
  }
}

// POST - Asignar capacitación a voluntario
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

    // Verificar rol (solo admin/TS/coordinador/psico)
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesPermitidos = ['director', 'trabajador_social', 'coordinador', 'psicopedagogia'];
    if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para asignar capacitaciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { voluntario_id, capacitacion_id, notas } = body;

    if (!voluntario_id || !capacitacion_id) {
      return NextResponse.json(
        { error: 'voluntario_id y capacitacion_id son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el voluntario existe y es voluntario
    const { data: voluntario } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', voluntario_id)
      .single();

    if (!voluntario || voluntario.rol !== 'voluntario') {
      return NextResponse.json(
        { error: 'El usuario especificado no es un voluntario' },
        { status: 400 }
      );
    }

    // Asignar capacitación
    const { data, error } = await supabaseAdmin
      .from('voluntarios_capacitaciones')
      .insert({
        voluntario_id,
        capacitacion_id,
        estado: 'pendiente',
        notas,
        evaluador_id: user.id
      })
      .select(`
        *,
        capacitacion:capacitaciones (titulo, area, tipo)
      `)
      .single();

    if (error) {
      // Si ya existe la asignación
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Esta capacitación ya está asignada al voluntario' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      mensaje: 'Capacitación asignada exitosamente',
      asignacion: data
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/voluntarios/capacitaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al asignar capacitación' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de capacitación (voluntario completa, inicia, etc.)
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

    const body = await request.json();
    const {
      id, // ID de voluntarios_capacitaciones
      estado,
      puntaje_obtenido,
      respuestas,
      notas
    } = body;

    if (!id || !estado) {
      return NextResponse.json(
        { error: 'id y estado son requeridos' },
        { status: 400 }
      );
    }

    const estadosValidos = ['pendiente', 'en_curso', 'completada', 'no_aprobada'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Debe ser: ${estadosValidos.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el voluntario o tiene permisos
    const { data: asignacion } = await supabaseAdmin
      .from('voluntarios_capacitaciones')
      .select('voluntario_id')
      .eq('id', id)
      .single();

    if (!asignacion) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    }

    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesSuperiores = ['director', 'coordinador', 'psicopedagogia'];
    const puedeActualizar = asignacion.voluntario_id === user.id || rolesSuperiores.includes(perfil?.rol || '');

    if (!puedeActualizar) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar esta capacitación' },
        { status: 403 }
      );
    }

    // Preparar update
    const updates: any = { estado };

    if (estado === 'en_curso' && !asignacion.fecha_inicio) {
      updates.fecha_inicio = new Date().toISOString();
    }

    if (estado === 'completada') {
      updates.fecha_completada = new Date().toISOString();
      if (puntaje_obtenido !== undefined) {
        if (puntaje_obtenido < 0 || puntaje_obtenido > 5) {
          return NextResponse.json(
            { error: 'Puntaje debe estar entre 0 y 5' },
            { status: 400 }
          );
        }
        updates.puntaje_obtenido = puntaje_obtenido;
      }
    }

    if (respuestas) {
      updates.respuestas = respuestas;
    }

    if (notas) {
      updates.notas = notas;
    }

    // Actualizar
    const { data, error } = await supabaseAdmin
      .from('voluntarios_capacitaciones')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        capacitacion:capacitaciones (titulo, area, puntaje_otorgado)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      mensaje: 'Capacitación actualizada exitosamente',
      asignacion: data
    });

  } catch (error: any) {
    console.error('Error en PATCH /api/voluntarios/capacitaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar capacitación' },
      { status: 500 }
    );
  }
}
