import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/ninos/[ninoId] — Datos básicos del niño
// Voluntarios solo pueden ver niños que tienen asignados.
// Staff ve todo.
export async function GET(
  request: NextRequest,
  { params }: { params: { ninoId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const ninoId = params.ninoId;

    // Obtener rol del usuario
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rol = perfil?.rol;

    // Si es voluntario, verificar que tenga asignación activa con este niño
    if (rol === 'voluntario') {
      const { data: asignacion, error: asigError } = await supabaseAdmin
        .from('asignaciones')
        .select('id')
        .eq('voluntario_id', user.id)
        .eq('nino_id', ninoId)
        .eq('activa', true)
        .maybeSingle();

      if (asigError || !asignacion) {
        return NextResponse.json({ error: 'Sin acceso a este niño' }, { status: 403 });
      }
    } else if (!rol || !['psicopedagogia', 'director', 'admin', 'coordinador',
      'trabajadora_social', 'trabajador_social', 'equipo_profesional'].includes(rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    // Cargar datos del niño (sin datos sensibles para voluntarios)
    const selectFields = rol === 'voluntario'
      ? 'id, alias, legajo, rango_etario, fecha_nacimiento, nivel_alfabetizacion, escolarizado, grado_escolar, activo, zona_id, zonas(id, nombre), escuelas(id, nombre)'
      : '*, zonas(id, nombre), escuelas(id, nombre)';

    const { data: nino, error: ninoError } = await supabaseAdmin
      .from('ninos')
      .select(selectFields)
      .eq('id', ninoId)
      .single();

    if (ninoError || !nino) {
      return NextResponse.json({ error: 'Niño no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ nino });

  } catch (error: any) {
    console.error('Error en GET /api/ninos/[ninoId]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
