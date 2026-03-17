import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const version = body.version || '1.0';

    const { error } = await supabase
      .from('perfiles')
      .update({
        terminos_aceptados_at: new Date().toISOString(),
        terminos_version: version,
      })
      .eq('id', user.id);

    if (error) throw error;

    // Registrar en auditoría
    await supabase.from('audit_log').insert({
      usuario_id: user.id,
      accion: 'acepto_terminos',
      tabla: 'perfiles',
      registro_id: user.id,
      descripcion: `Usuario aceptó los Términos y Condiciones (v${version})`,
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('[terminos POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('terminos_aceptados_at, terminos_version')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      aceptado: !!perfil?.terminos_aceptados_at,
      aceptado_at: perfil?.terminos_aceptados_at || null,
      version: perfil?.terminos_version || null,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
