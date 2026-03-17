import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ROLES_ADMIN = ['director', 'admin'];

/**
 * GET  /api/admin/mensajes/reportes  — lista reportes pendientes
 * PATCH /api/admin/mensajes/reportes  — resolver un reporte  Body: { id: uuid, accion: 'resolver' | 'eliminar_mensaje' }
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (!perfil || !ROLES_ADMIN.includes(perfil.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { data, error } = await supabase
    .from('reportes_mensaje')
    .select(`
      id, motivo, resuelto, created_at,
      reportado_por, resuelto_por, resuelto_at,
      mensajes (
        id, contenido, tipo, emisor_id, created_at, eliminado_at,
        conversacion_id,
        perfiles ( nombre, apellido )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Agregar nombre del reportador y del emisor como nombre_completo para el frontend
  const reportes = await Promise.all((data || []).map(async (r: Record<string, unknown>) => {
    const { data: reportador } = await supabase.from('perfiles').select('nombre, apellido').eq('id', r.reportado_por).single();
    return {
      ...r,
      reportador_nombre: [reportador?.nombre, reportador?.apellido].filter(Boolean).join(' ') || 'Desconocido',
    };
  }));

  return NextResponse.json({ reportes });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
  if (!perfil || !ROLES_ADMIN.includes(perfil.rol)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { id, accion } = await request.json();
  if (!id || !accion) return NextResponse.json({ error: 'id y accion requeridos' }, { status: 400 });

  if (accion === 'resolver') {
    await supabase
      .from('reportes_mensaje')
      .update({ resuelto: true, resuelto_por: user.id, resuelto_at: new Date().toISOString() })
      .eq('id', id);
  } else if (accion === 'eliminar_mensaje') {
    // Obtener el mensaje_id del reporte
    const { data: rep } = await supabase
      .from('reportes_mensaje')
      .select('mensaje_id')
      .eq('id', id)
      .single();
    if (rep) {
      await supabase
        .from('mensajes')
        .update({ eliminado_at: new Date().toISOString() })
        .eq('id', rep.mensaje_id);
    }
    await supabase
      .from('reportes_mensaje')
      .update({ resuelto: true, resuelto_por: user.id, resuelto_at: new Date().toISOString() })
      .eq('id', id);
  } else {
    return NextResponse.json({ error: 'accion inválida' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
