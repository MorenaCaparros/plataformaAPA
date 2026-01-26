'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error login:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background animado */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-neutro-lienzo" />
        
        {/* Blob 1 - Amarillo */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sol-400/30 rounded-full blur-3xl animate-blob" />
        
        {/* Blob 2 - Verde */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-crecimiento-400/25 rounded-full blur-3xl animate-blob animation-delay-2000" />
        
        {/* Blob 3 - Centro */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sol-400/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo y Header */}
        <div className="text-center space-y-4">
          {/* Logo placeholder - reemplazar con imagen real */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-sol-400 to-crecimiento-400 shadow-glow-sol mb-4">
            <span className="text-white font-quicksand font-bold text-4xl">A</span>
          </div>
          
          <h1 className="font-quicksand text-4xl md:text-5xl font-bold text-neutro-carbon">
            Plataforma APA
          </h1>
          <p className="text-base text-neutro-piedra">
            Sistema de seguimiento educativo
          </p>
          <p className="text-sm text-neutro-piedra font-medium">
            GlobalIA × ONG Adelante
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white/60 backdrop-blur-lg rounded-3xl border border-sol-400/20 shadow-glow-sol p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-impulso-50 border border-impulso-200 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-impulso-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutro-carbon"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                className="w-full bg-white/60 backdrop-blur-lg border border-neutro-piedra/20 rounded-2xl px-4 py-3 text-neutro-carbon placeholder:text-neutro-piedra/50 focus:border-crecimiento-400 focus:ring-4 focus:ring-crecimiento-400/10 focus:outline-none transition-all duration-200"
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutro-carbon"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white/60 backdrop-blur-lg border border-neutro-piedra/20 rounded-2xl px-4 py-3 text-neutro-carbon placeholder:text-neutro-piedra/50 focus:border-crecimiento-400 focus:ring-4 focus:ring-crecimiento-400/10 focus:outline-none transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white font-medium px-6 py-3 rounded-2xl shadow-glow-crecimiento hover:shadow-glow-crecimiento-lg hover:translate-y-[-1px] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[48px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-4 text-center">
            <Link
              href="/recuperar-contrasena"
              className="block text-sm text-crecimiento-600 hover:text-crecimiento-700 font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutro-piedra/20" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/60 backdrop-blur-lg px-3 py-1 rounded-full text-neutro-piedra">
                  ¿No tenés cuenta?
                </span>
              </div>
            </div>

            <Link
              href="/registro"
              className="block w-full bg-white/60 backdrop-blur-lg border border-crecimiento-400/30 text-crecimiento-700 font-medium px-6 py-3 rounded-2xl hover:bg-crecimiento-50/80 transition-all duration-200 min-h-[48px] flex items-center justify-center"
            >
              Registrate aquí
            </Link>
          </div>
        </div>

        {/* Badge de desarrollo */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sol-400/20 text-sol-700 text-xs font-medium border border-sol-400/30">
            <span className="w-2 h-2 bg-crecimiento-400 rounded-full animate-pulse" />
            Sistema en desarrollo
          </span>
        </div>
      </div>
    </div>
  );
}
