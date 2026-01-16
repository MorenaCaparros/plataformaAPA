import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente admin con service role key
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

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que sea admin
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfil?.rol !== 'admin') {
      return NextResponse.json({ error: 'Requiere rol admin' }, { status: 403 });
    }

    // Si hay parámetro 'id', devolver solo ese usuario
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('id');

    if (usuarioId) {
      // Obtener un usuario específico
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(usuarioId);
      
      return NextResponse.json({ 
        usuario: {
          id: usuarioId,
          email: authData?.user?.email || 'Sin email'
        }
      });
    }

    // Obtener todos los perfiles con sus datos de auth.users
    const { data: perfiles, error: perfilesError } = await supabaseAdmin
      .from('perfiles')
      .select(`
        id,
        rol,
        zona_id,
        metadata,
        created_at,
        zonas (
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (perfilesError) throw perfilesError;

    // Para cada perfil, obtener el email de auth.users
    const usuariosConEmail = await Promise.all(
      (perfiles || []).map(async (perfil: any) => {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(perfil.id);
        
        return {
          id: perfil.id,
          email: authData?.user?.email || 'Sin email',
          rol: perfil.rol,
          zona_id: perfil.zona_id,
          zona_nombre: perfil.zonas?.nombre || 'Sin equipo',
          created_at: perfil.created_at,
          metadata: perfil.metadata || {}
        };
      })
    );

    return NextResponse.json({ usuarios: usuariosConEmail });

  } catch (error: any) {
    console.error('Error en /api/usuarios:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
