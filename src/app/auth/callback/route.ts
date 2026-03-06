import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Si Google devolvió un error, redirigir a login con mensaje
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', errorDescription || 'Error al autenticar con Google');
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    // Crear la response de redirect PRIMERO para adjuntar cookies directamente
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Setear cookies directamente en la response de redirect
            redirectResponse.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            redirectResponse.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error intercambiando código OAuth:', exchangeError.message);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Error al verificar la sesión con Google');
      return NextResponse.redirect(loginUrl);
    }

    // Retornar la response que YA tiene las cookies de sesión adjuntas
    return redirectResponse;
  }

  // Sin código ni error — redirigir a login
  return NextResponse.redirect(new URL('/login', request.url));
}
