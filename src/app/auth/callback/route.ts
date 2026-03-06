import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Route handler puede setear cookies
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {
              // Ignorar errores de cookies en server components
            }
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

    // Redirigir al dashboard después del login exitoso con Google
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Sin código ni error — redirigir a login
  return NextResponse.redirect(new URL('/login', request.url));
}
