import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ROLES_ADMIN = ['director', 'admin'];

/**
 * GET  /api/admin/mensajes/palabras  — lista palabras prohibidas
 * POST /api/admin/mensajes/palabras  — agrega una nueva  Body: { palabra: string }
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (!perfil || !ROLES_ADMIN.includes(perfil.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { data, error } = await supabase
    .from('palabras_prohibidas')
    .select('id, palabra, created_at, creado_por')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ palabras: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (!perfil || !ROLES_ADMIN.includes(perfil.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { palabra } = await request.json();
  if (!palabra?.trim()) return NextResponse.json({ error: 'palabra requerida' }, { status: 400 });

  const { data, error } = await supabase
    .from('palabras_prohibidas')
    .insert({ palabra: palabra.trim().toLowerCase(), creado_por: user.id })
    .select('id, palabra, created_at')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Esa palabra ya existe' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ palabra: data }, { status: 201 });
}
