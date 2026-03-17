import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mensajes/conversaciones/[id]/leer
 *   Marca la conversación como leída (actualiza ultimo_leido_at).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversacionId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { error } = await supabase
    .from('participantes_conversacion')
    .update({ ultimo_leido_at: new Date().toISOString() })
    .eq('conversacion_id', conversacionId)
    .eq('usuario_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
