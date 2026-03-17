import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/mensajes/conversaciones
 *   Devuelve las conversaciones del usuario actual con último mensaje y no-leídos.
 *
 * POST /api/mensajes/conversaciones
 *   Crea un DM (tipo:'directo', otro_usuario_id) o un grupo (tipo:'grupo', nombre, participantes:[]).
 *   Para DMs devuelve la conversación existente si ya existe.
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // IDs de conversaciones en las que participa el usuario
  const { data: partics } = await supabase
    .from('participantes_conversacion')
    .select('conversacion_id, ultimo_leido_at')
    .eq('usuario_id', user.id);

  if (!partics || partics.length === 0) return NextResponse.json({ conversaciones: [] });

  const ids = (partics as Array<{conversacion_id: string; ultimo_leido_at: string | null}>).map(p => p.conversacion_id);
  const leido: Record<string, string> = {};
  (partics as Array<{conversacion_id: string; ultimo_leido_at: string | null}>).forEach(p => { leido[p.conversacion_id] = p.ultimo_leido_at || '1970-01-01'; });

  // Conversaciones con todos sus participantes
  const { data: convs, error: convsErr } = await supabase
    .from('conversaciones')
    .select(`
      id, tipo, nombre, descripcion, imagen_url, updated_at,
      participantes_conversacion (
        usuario_id, es_admin,
        perfiles ( id, nombre, apellido, avatar_url, rol )
      )
    `)
    .in('id', ids)
    .order('updated_at', { ascending: false });

  if (convsErr) return NextResponse.json({ error: convsErr.message }, { status: 500 });

  // Último mensaje de cada conversación
  const { data: ultimosMsgs } = await supabase
    .from('mensajes')
    .select('conversacion_id, contenido, tipo, emisor_id, created_at')
    .in('conversacion_id', ids)
    .is('eliminado_at', null)
    .order('created_at', { ascending: false });

  // Indexar último mensaje por conversacion_id
  const ultimo: Record<string, { contenido: string; tipo: string; created_at: string; emisor_id: string }> = {};
  (ultimosMsgs as Array<{conversacion_id: string; contenido: string; tipo: string; emisor_id: string; created_at: string}>)?.forEach(m => {
    if (!ultimo[m.conversacion_id]) ultimo[m.conversacion_id] = m;
  });

  // Contar no-leídos por conversación
  const noLeidosPorConv: Record<string, number> = {};
  await Promise.all((ids as string[]).map(async (cId: string) => {
    const ultimoLeidoAt = leido[cId] || '1970-01-01';
    const { count } = await supabase
      .from('mensajes')
      .select('id', { count: 'exact', head: true })
      .eq('conversacion_id', cId)
      .neq('emisor_id', user.id)
      .is('eliminado_at', null)
      .gt('created_at', ultimoLeidoAt);
    noLeidosPorConv[cId] = count || 0;
  }));

  // Mapear para simplificar la respuesta
  type ConvRow = { id: string; tipo: string; nombre: string | null; descripcion: string | null; imagen_url: string | null; updated_at: string; participantes_conversacion: unknown[] };
  const conversaciones = (convs as ConvRow[] || []).map(c => {
    const participantesBrutos = (c.participantes_conversacion as unknown as Array<{
      usuario_id: string; es_admin: boolean;
      perfiles: { id: string; nombre: string; apellido: string; avatar_url: string | null; rol: string } | null;
    }>);

    const otros = participantesBrutos
      .filter(p => p.usuario_id !== user.id)
      .map(p => p.perfiles);

    const nombreMostrado = c.tipo === 'directo'
      ? [otros[0]?.nombre, otros[0]?.apellido].filter(Boolean).join(' ') || 'Usuario desconocido'
      : (c.nombre || 'Grupo sin nombre');

    return {
      id: c.id,
      tipo: c.tipo,
      nombre: nombreMostrado,
      descripcion: c.descripcion,
      imagen_url: c.imagen_url,
      updated_at: c.updated_at,
      participantes: participantesBrutos.map(p => ({
        usuario_id: p.usuario_id,
        es_admin: p.es_admin,
        nombre: [p.perfiles?.nombre, p.perfiles?.apellido].filter(Boolean).join(' ') || '',
        avatar_url: p.perfiles?.avatar_url || null,
        rol: p.perfiles?.rol || '',
      })),
      ultimo_mensaje: ultimo[c.id] || null,
      no_leidos: noLeidosPorConv[c.id] || 0,
    };
  });

  return NextResponse.json({ conversaciones });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json();
  const { tipo, otro_usuario_id, nombre, descripcion, participantes } = body;

  if (!tipo || !['directo', 'grupo'].includes(tipo)) {
    return NextResponse.json({ error: 'tipo debe ser "directo" o "grupo"' }, { status: 400 });
  }

  // ── DM ────────────────────────────────────────────────────────
  if (tipo === 'directo') {
    if (!otro_usuario_id) return NextResponse.json({ error: 'otro_usuario_id requerido' }, { status: 400 });
    if (otro_usuario_id === user.id) return NextResponse.json({ error: 'No podés enviarte un DM a vos mismo' }, { status: 400 });

    // Buscar si ya existe un DM entre estos dos usuarios
    const { data: misPartics } = await supabase
      .from('participantes_conversacion')
      .select('conversacion_id')
      .eq('usuario_id', user.id);

    const { data: otrosPartics } = await supabase
      .from('participantes_conversacion')
      .select('conversacion_id')
      .eq('usuario_id', otro_usuario_id);

    const misCids = new Set((misPartics as Array<{conversacion_id: string}>)?.map(p => p.conversacion_id) || []);
    const otrolCids = new Set((otrosPartics as Array<{conversacion_id: string}>)?.map(p => p.conversacion_id) || []);
    const shared = [...misCids].filter(id => otrolCids.has(id));

    if (shared.length > 0) {
      // Verificar que sea tipo 'directo'
      const { data: exst } = await supabase
        .from('conversaciones')
        .select('id')
        .in('id', shared)
        .eq('tipo', 'directo')
        .limit(1)
        .maybeSingle();
      if (exst) return NextResponse.json({ conversacion_id: exst.id, existente: true });
    }

    // Crear nueva conversación DM
    const { data: conv, error: convErr } = await supabase
      .from('conversaciones')
      .insert({ tipo: 'directo', creado_por: user.id })
      .select('id')
      .single();
    if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

    await supabase.from('participantes_conversacion').insert([
      { conversacion_id: conv.id, usuario_id: user.id, es_admin: false },
      { conversacion_id: conv.id, usuario_id: otro_usuario_id, es_admin: false },
    ]);

    return NextResponse.json({ conversacion_id: conv.id, existente: false }, { status: 201 });
  }

  // ── Grupo ─────────────────────────────────────────────────────
  if (!nombre?.trim()) return NextResponse.json({ error: 'nombre requerido para grupos' }, { status: 400 });
  if (!Array.isArray(participantes) || participantes.length === 0) {
    return NextResponse.json({ error: 'participantes[] requerido para grupos' }, { status: 400 });
  }

  const { data: conv, error: convErr } = await supabase
    .from('conversaciones')
    .insert({ tipo: 'grupo', nombre: nombre.trim(), descripcion: descripcion?.trim() || null, creado_por: user.id })
    .select('id')
    .single();
  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

  const todos = [user.id, ...participantes.filter((id: string) => id !== user.id)];
  const registros = todos.map((uid: string) => ({
    conversacion_id: conv.id,
    usuario_id: uid,
    es_admin: uid === user.id,
  }));
  await supabase.from('participantes_conversacion').insert(registros);

  return NextResponse.json({ conversacion_id: conv.id }, { status: 201 });
}
