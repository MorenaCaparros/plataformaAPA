import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ⚠️ ENDPOINT TEMPORAL DE DEBUG - BORRAR EN PRODUCCIÓN
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ 
      error: 'No hay sesión activa',
      message: 'Asegurate de estar logueado en /dashboard' 
    }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    token: session.access_token,
    user: {
      email: session.user.email,
      id: session.user.id
    },
    expires_at: session.expires_at,
    message: '✅ Copiá el token y usalo en tus pruebas de API'
  });
}
