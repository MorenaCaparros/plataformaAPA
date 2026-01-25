import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Obtener sugerencias de voluntarios para un niño
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar rol (coordinador, psico, director)
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesPermitidos = ['director', 'coordinador', 'psicopedagogia'];
    if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver sugerencias de matching' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ninoId = searchParams.get('nino_id');
    const limite = parseInt(searchParams.get('limite') || '5');

    if (!ninoId) {
      return NextResponse.json(
        { error: 'nino_id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el niño existe
    const { data: nino, error: ninoError } = await supabaseAdmin
      .from('ninos')
      .select('alias, rango_etario')
      .eq('id', ninoId)
      .single();

    if (ninoError || !nino) {
      return NextResponse.json({ error: 'Niño no encontrado' }, { status: 404 });
    }

    // Llamar a la función de sugerencias
    const { data: sugerencias, error } = await supabaseAdmin
      .rpc('sugerir_voluntarios_para_nino', {
        p_nino_id: ninoId,
        p_limite: limite
      });

    if (error) throw error;

    return NextResponse.json({
      nino: {
        id: ninoId,
        alias: nino.alias,
        rango_etario: nino.rango_etario
      },
      sugerencias: sugerencias || [],
      total: sugerencias?.length || 0
    });

  } catch (error: any) {
    console.error('Error en GET /api/matching/sugerencias:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener sugerencias' },
      { status: 500 }
    );
  }
}
