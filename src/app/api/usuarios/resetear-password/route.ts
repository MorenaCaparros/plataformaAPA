import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

export async function POST(request: Request) {
  try {
    // Obtener token del header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar token con supabase admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea director (antes admin)
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfil?.rol !== 'director') {
      return NextResponse.json({ 
        error: 'No autorizado - requiere rol director' 
      }, { status: 403 });
    }

    const { email, nuevaPassword } = await request.json();

    if (!email || !nuevaPassword) {
      return NextResponse.json({ 
        error: 'Email y nueva contraseña son obligatorios' 
      }, { status: 400 });
    }

    if (nuevaPassword.length < 6) {
      return NextResponse.json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      }, { status: 400 });
    }

    // Buscar el usuario por email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const usuario = users.users.find(u => u.email === email);

    if (!usuario) {
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }

    // Actualizar la contraseña
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      usuario.id,
      { password: nuevaPassword }
    );

    if (updateError) {
      throw updateError;
    }

    // Actualizar el flag de password_temporal en el perfil
    await supabaseAdmin
      .from('perfiles')
      .update({
        metadata: {
          ...usuario.user_metadata,
          password_temporal: false
        }
      })
      .eq('id', usuario.id);

    return NextResponse.json({ 
      success: true,
      mensaje: `Contraseña actualizada correctamente para ${email}` 
    });

  } catch (error: any) {
    console.error('Error al resetear contraseña:', error);
    return NextResponse.json({ 
      error: error.message || 'Error al resetear contraseña' 
    }, { status: 500 });
  }
}

// Endpoint para resetear TODAS las contraseñas de prueba a "123456"
export async function PUT(request: Request) {
  try {
    // Obtener token del header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar token con supabase admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea director (antes admin)
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfil?.rol !== 'director') {
      return NextResponse.json({ 
        error: 'No autorizado - requiere rol director' 
      }, { status: 403 });
    }

    // Usuarios de prueba a resetear
    const emailsPrueba = [
      'volun1@gmail.com',
      'volun2@gmail.com',
      'volun3@gmail.com',
      'volun4@gmail.com',
      'volun5@gmail.com',
      'volun6@gmail.com',
      'coord1@gmail.com',
      'coord2@gmail.com',
      'coord3@gmail.com',
      'coord4@gmail.com',
      'psico1@gmail.com',
      'psico2@gmail.com',
      'admin1@gmail.com',
      'admin2@gmail.com',
      'admin3@gmail.com'
    ];

    const resultados = {
      exitosos: [] as string[],
      errores: [] as { email: string; error: string }[]
    };

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();

    for (const email of emailsPrueba) {
      try {
        const usuario = users.users.find(u => u.email === email);
        
        if (!usuario) {
          resultados.errores.push({ 
            email, 
            error: 'Usuario no encontrado' 
          });
          continue;
        }

        // Actualizar contraseña a "123456"
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          usuario.id,
          { password: '123456' }
        );

        if (updateError) throw updateError;

        // Actualizar perfil
        const { data: perfilData } = await supabaseAdmin
          .from('perfiles')
          .select('metadata')
          .eq('id', usuario.id)
          .single();

        await supabaseAdmin
          .from('perfiles')
          .update({
            metadata: {
              ...(perfilData?.metadata || {}),
              password_temporal: false
            }
          })
          .eq('id', usuario.id);

        resultados.exitosos.push(email);
      } catch (error: any) {
        resultados.errores.push({ 
          email, 
          error: error.message 
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      mensaje: `Procesados ${emailsPrueba.length} usuarios`,
      exitosos: resultados.exitosos.length,
      errores: resultados.errores.length,
      detalles: resultados
    });

  } catch (error: any) {
    console.error('Error al resetear contraseñas:', error);
    return NextResponse.json({ 
      error: error.message || 'Error al resetear contraseñas' 
    }, { status: 500 });
  }
}
