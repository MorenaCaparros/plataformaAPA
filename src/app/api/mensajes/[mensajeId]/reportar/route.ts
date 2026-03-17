import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mensajes/[mensajeId]/reportar
 *   Body: { motivo?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mensajeId: string }> }
) {
  const { mensajeId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { motivo } = body;

  // Verificar que el mensaje existe
  const { data: msg } = await supabase
    .from('mensajes')
    .select('id, conversacion_id')
    .eq('id', mensajeId)
    .maybeSingle();

  if (!msg) return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });

  // Verificar que el usuario tiene acceso a esa conversación
  const { data: partic } = await supabase
    .from('participantes_conversacion')
    .select('id')
    .eq('conversacion_id', msg.conversacion_id)
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!partic) return NextResponse.json({ error: 'Sin acceso a este mensaje' }, { status: 403 });

  const { error } = await supabase
    .from('reportes_mensaje')
    .upsert(
      { mensaje_id: mensajeId, reportado_por: user.id, motivo: motivo?.trim() || null },
      { onConflict: 'mensaje_id,reportado_por' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
