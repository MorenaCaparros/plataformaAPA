import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ROLES_ADMIN = ['director', 'admin'];

/**
 * DELETE /api/admin/mensajes/palabras/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (!perfil || !ROLES_ADMIN.includes(perfil.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { error } = await supabase.from('palabras_prohibidas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
