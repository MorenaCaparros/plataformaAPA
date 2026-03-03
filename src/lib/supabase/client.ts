import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient de @supabase/ssr gestiona las cookies automáticamente.
// La persistencia de sesión está asegurada por:
// 1. window.location.href (redirect completo) luego de signInWithPassword en el login
// 2. El middleware que refresca el access token con el refresh token en cada request
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
