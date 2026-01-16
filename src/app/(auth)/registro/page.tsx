'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Rol = 'voluntario' | 'coordinador' | 'psicopedagogia' | 'trabajador_social' | 'director';

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState<Rol>('voluntario');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Crear usuario en Supabase Auth (el perfil se crea automáticamente con trigger)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            rol: rol, // Guardar rol en metadata del usuario
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Actualizar el rol si no es voluntario (default)
      if (rol !== 'voluntario') {
        const { error: updateError } = await supabase
          .from('perfiles')
          .update({ rol: rol })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error actualizando rol:', updateError);
        }
      }

      // Verificar si requiere confirmación de email
      if (authData.session) {
        // Email confirmado o confirmación desactivada → redirigir
        router.push('/dashboard');
        router.refresh();
      } else {
        // Requiere confirmación de email
        setError(
          '¡Cuenta creada! Por favor, confirmá tu email para iniciar sesión. Si no ves el email, revisá la carpeta de spam.'
        );
      }
    } catch (error: any) {
      setError(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Plataforma APA
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Crear nueva cuenta
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleRegister} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="rol"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Rol
              </label>
              <select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as Rol)}
                className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="voluntario">Voluntario Alfabetizador</option>
                <option value="coordinador">Coordinador</option>
                <option value="psicopedagogia">Psicopedagogo/a</option>
                <option value="trabajador_social">Trabajador/a Social</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 min-h-[48px] rounded-lg transition duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
            >
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tenés cuenta?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Iniciá sesión aquí
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          GlobalIA × ONG Adelante
        </div>
      </div>
    </div>
  );
}
