import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 400 días — igual que middleware.ts y client.ts
const SESSION_MAX_AGE = 60 * 60 * 24 * 400;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // maxAge al final para que nuestro valor gane sobre el corto de Supabase
            cookieStore.set({ name, value, ...options, maxAge: SESSION_MAX_AGE });
          } catch (error) {
            // Server Component no puede setear cookies — ignorar
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // maxAge: 0 es obligatorio para que el browser expire la cookie
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
            // Server Component no puede remover cookies — ignorar
          }
        },
      },
    }
  );
}
