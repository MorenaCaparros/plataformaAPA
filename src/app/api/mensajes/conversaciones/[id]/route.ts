import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/**
 * GET /api/mensajes/conversaciones/[id]
 *   Devuelve los mensajes paginados de una conversación.
 *   ?before=<ISO> para paginación hacia atrás.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversacionId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Verificar que el usuario es participante
  const { data: partic } = await supabase
    .from('participantes_conversacion')
    .select('id')
    .eq('conversacion_id', conversacionId)
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!partic) return NextResponse.json({ error: 'Sin acceso a esta conversación' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const before = searchParams.get('before'); // ISO timestamp para paginación

  let query = supabase
    .from('mensajes')
    .select(`
      id, conversacion_id, contenido, tipo, editado_at, eliminado_at, created_at,
      emisor_id,
      perfiles ( id, nombre, apellido, avatar_url, rol )
    `)
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (before) query = query.lt('created_at', before);

  const { data: mensajes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ocultar contenido de mensajes eliminados + unificar nombre
  type PerfilRow = { id: string; nombre: string; apellido: string; avatar_url: string | null; rol: string };
  type MensajeRow = { id: string; conversacion_id: string; emisor_id: string; contenido: string; tipo: string; editado_at: string | null; eliminado_at: string | null; created_at: string; perfiles: PerfilRow | null };
  const procesados = (mensajes as MensajeRow[] || []).reverse().map(m => ({
    ...m,
    contenido: m.eliminado_at ? '🗑️ Mensaje eliminado' : m.contenido,
    perfiles: m.perfiles ? {
      id: m.perfiles.id,
      nombre_completo: [m.perfiles.nombre, m.perfiles.apellido].filter(Boolean).join(' '),
      avatar_url: m.perfiles.avatar_url,
      rol: m.perfiles.rol,
    } : null,
  }));

  return NextResponse.json({ mensajes: procesados, hayMas: (mensajes?.length || 0) === PAGE_SIZE });
}
