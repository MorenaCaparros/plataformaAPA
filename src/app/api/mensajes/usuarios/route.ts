import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mensajes/usuarios?q=texto
 *   Búsqueda ligera de usuarios para iniciar DMs o crear grupos.
 *   Devuelve id, nombre_completo (nombre + apellido), avatar_url, rol.
 *   Cualquier usuario autenticado puede buscar.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  let query = supabase
    .from('perfiles')
    .select('id, nombre, apellido, avatar_url, rol')
    .eq('activo', true)
    .neq('id', user.id)
    .order('nombre');

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`);
  }

  const { data, error } = await query.limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const usuarios = (data || []).map((p: { id: string; nombre: string | null; apellido: string | null; avatar_url: string | null; rol: string | null }) => ({
    id: p.id,
    nombre_completo: [p.nombre, p.apellido].filter(Boolean).join(' ') || 'Sin nombre',
    avatar_url: p.avatar_url,
    rol: p.rol,
  }));

  return NextResponse.json({ usuarios });
}
