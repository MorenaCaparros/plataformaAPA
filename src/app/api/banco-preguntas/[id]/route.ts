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
 * PUT /api/banco-preguntas/[id]
 * Actualiza una pregunta del banco
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAuthenticatedClient(request);
    const perfil = await verificarPermiso(supabase);
    if (!perfil) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.pregunta !== undefined) updateData.pregunta = body.pregunta.trim();
    if (body.tipo_pregunta !== undefined) updateData.tipo_pregunta = body.tipo_pregunta;
    if (body.area !== undefined) updateData.area_especifica = body.area;
    if (body.puntaje !== undefined) updateData.puntaje = body.puntaje;
    // Toggle active: puntaje=0 means disabled
    if (body.activa !== undefined) {
      updateData.puntaje = body.activa ? (body.puntaje || 10) : 0;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    // Verify this question belongs to the bank (capacitacion_id IS NULL)
    const { data: existing } = await supabase
      .from('preguntas_capacitacion')
      .select('id, capacitacion_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
    }

    if (existing.capacitacion_id !== null) {
      return NextResponse.json(
        { error: 'Esta pregunta pertenece a una plantilla, no al banco' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('preguntas_capacitacion')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar pregunta:', error);
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      pregunta: data.pregunta,
      tipo_pregunta: data.tipo_pregunta,
      area: data.area_especifica,
      puntaje: data.puntaje,
      activa: data.puntaje > 0,
      orden: data.orden,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error('Error en PUT /api/banco-preguntas/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/banco-preguntas/[id]
 * Elimina una pregunta del banco
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createAuthenticatedClient(request);
    const perfil = await verificarPermiso(supabase);
    if (!perfil) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verify this question belongs to the bank
    const { data: existing } = await supabase
      .from('preguntas_capacitacion')
      .select('id, capacitacion_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
    }

    if (existing.capacitacion_id !== null) {
      return NextResponse.json(
        { error: 'Esta pregunta pertenece a una plantilla, no al banco' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('preguntas_capacitacion')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar pregunta:', error);
      return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/banco-preguntas/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
