import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ROLES_PERMITIDOS = ['director', 'admin', 'psicopedagogia', 'equipo_profesional'];
const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!perfil || !ROLES_PERMITIDOS.includes(perfil.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get('page') || '1', 10);
    const accion   = searchParams.get('accion') || '';
    const tabla    = searchParams.get('tabla') || '';
    const usuarioId = searchParams.get('usuario_id') || '';
    const desde    = searchParams.get('desde') || '';
    const hasta    = searchParams.get('hasta') || '';
    const busqueda = searchParams.get('q') || '';

    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (accion)    query = query.eq('accion', accion);
    if (tabla)     query = query.eq('tabla', tabla);
    if (usuarioId) query = query.eq('usuario_id', usuarioId);
    if (desde)     query = query.gte('created_at', desde);
    if (hasta)     query = query.lte('created_at', hasta);
    if (busqueda)  query = query.ilike('descripcion', `%${busqueda}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((count || 0) / PAGE_SIZE),
    });

  } catch (error: any) {
    console.error('[auditoria GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { accion, tabla, registro_id, descripcion, datos_previos, datos_nuevos } = body;

    if (!accion || !descripcion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Obtener datos del perfil para enriquecer el log
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .single();

    const usuario_nombre = perfil
      ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || user.email
      : user.email;

    const ip_address = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') || null;

    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        usuario_id:    user.id,
        usuario_nombre,
        usuario_rol:   perfil?.rol || null,
        accion,
        tabla:         tabla || null,
        registro_id:   registro_id || null,
        descripcion,
        datos_previos: datos_previos || null,
        datos_nuevos:  datos_nuevos || null,
        ip_address,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, log: data });

  } catch (error: any) {
    console.error('[auditoria POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
