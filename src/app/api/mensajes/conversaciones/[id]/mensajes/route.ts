import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const TIPOS_VALIDOS = ['texto', 'sticker'];

/**
 * POST /api/mensajes/conversaciones/[id]/mensajes
 *   Envía un mensaje a la conversación.
 *   Body: { contenido: string, tipo?: 'texto' | 'sticker' }
 *
 *   Aplica filtro de palabras prohibidas (reemplaza con ***)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversacionId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json();
  let { contenido, tipo = 'texto' } = body;

  if (!contenido?.trim()) return NextResponse.json({ error: 'contenido requerido' }, { status: 400 });
  if (!TIPOS_VALIDOS.includes(tipo)) return NextResponse.json({ error: 'tipo inválido' }, { status: 400 });

  // Verificar que el usuario es participante
  const { data: partic } = await supabase
    .from('participantes_conversacion')
    .select('id')
    .eq('conversacion_id', conversacionId)
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!partic) return NextResponse.json({ error: 'Sin acceso a esta conversación' }, { status: 403 });

  // ── Filtro de palabras prohibidas (solo para mensajes de texto) ──
  if (tipo === 'texto') {
    const { data: palabras } = await supabase
      .from('palabras_prohibidas')
      .select('palabra');

    if (palabras && palabras.length > 0) {
      for (const { palabra } of palabras) {
        const re = new RegExp(palabra, 'gi');
        contenido = contenido.replace(re, '***');
      }
    }
  }

  // Insertar mensaje
  const { data: msg, error: msgErr } = await supabase
    .from('mensajes')
    .insert({
      conversacion_id: conversacionId,
      emisor_id: user.id,
      contenido: contenido.trim(),
      tipo,
    })
    .select(`
      id, conversacion_id, contenido, tipo, emisor_id, editado_at, eliminado_at, created_at,
      perfiles ( id, nombre, apellido, avatar_url, rol )
    `)
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  // Transformar perfiles {nombre, apellido} → {nombre_completo} para el frontend
  const perfilRaw = msg.perfiles as { id: string; nombre: string; apellido: string; avatar_url: string | null; rol: string } | null;
  const mensaje = {
    ...msg,
    perfiles: perfilRaw ? {
      id: perfilRaw.id,
      nombre_completo: [perfilRaw.nombre, perfilRaw.apellido].filter(Boolean).join(' '),
      avatar_url: perfilRaw.avatar_url,
      rol: perfilRaw.rol,
    } : null,
  };

  // Actualizar updated_at de la conversación para que aparezca primero en la lista
  await supabase
    .from('conversaciones')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversacionId);

  return NextResponse.json({ mensaje }, { status: 201 });
}
