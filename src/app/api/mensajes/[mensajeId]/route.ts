import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/mensajes/[mensajeId]
 *   Edita el contenido de un mensaje propio (solo texto).
 *   Body: { contenido: string }
 *
 * DELETE /api/mensajes/[mensajeId]
 *   Soft-delete del mensaje (solo el emisor o admin/director).
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mensajeId: string }> }
) {
  const { mensajeId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { contenido } = await request.json();
  if (!contenido?.trim()) return NextResponse.json({ error: 'contenido requerido' }, { status: 400 });

  // Verificar que el mensaje es del usuario y es de tipo texto
  const { data: msg } = await supabase
    .from('mensajes')
    .select('emisor_id, tipo, eliminado_at')
    .eq('id', mensajeId)
    .maybeSingle();

  if (!msg) return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
  if (msg.eliminado_at) return NextResponse.json({ error: 'No se puede editar un mensaje eliminado' }, { status: 400 });
  if (msg.emisor_id !== user.id) return NextResponse.json({ error: 'Solo podés editar tus propios mensajes' }, { status: 403 });
  if (msg.tipo !== 'texto') return NextResponse.json({ error: 'Solo se pueden editar mensajes de texto' }, { status: 400 });

  const { data: updated, error } = await supabase
    .from('mensajes')
    .update({ contenido: contenido.trim(), editado_at: new Date().toISOString() })
    .eq('id', mensajeId)
    .select('id, contenido, editado_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mensaje: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ mensajeId: string }> }
) {
  const { mensajeId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  const { data: msg } = await supabase
    .from('mensajes')
    .select('emisor_id')
    .eq('id', mensajeId)
    .maybeSingle();

  if (!msg) return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });

  const esAdmin = ['director', 'admin'].includes(perfil?.rol || '');
  if (msg.emisor_id !== user.id && !esAdmin) {
    return NextResponse.json({ error: 'Sin permisos para eliminar este mensaje' }, { status: 403 });
  }

  const { error } = await supabase
    .from('mensajes')
    .update({ eliminado_at: new Date().toISOString() })
    .eq('id', mensajeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
