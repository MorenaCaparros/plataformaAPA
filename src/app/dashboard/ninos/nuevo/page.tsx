'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function NuevoNinoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    alias: '',
    rango_etario: '8-10',
    nivel_alfabetizacion: 'Pre-silábico',
    escolarizado: true,
    observaciones_iniciales: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Crear el niño
      const { data: nino, error: ninoError } = await supabase
        .from('ninos')
        .insert({
          alias: formData.alias,
          rango_etario: formData.rango_etario,
          nivel_alfabetizacion: formData.nivel_alfabetizacion,
          escolarizado: formData.escolarizado,
          metadata: formData.observaciones_iniciales ? {
            observaciones_iniciales: formData.observaciones_iniciales,
            creado_por: user?.id
          } : { creado_por: user?.id }
        })
        .select()
        .single();

      if (ninoError) throw ninoError;

      // 2. Auto-asignar al voluntario
      const { error: asignacionError } = await supabase
        .from('nino_voluntarios')
        .insert({
          nino_id: nino.id,
          voluntario_id: user?.id,
          activo: true
        });

      if (asignacionError) throw asignacionError;

      alert('✅ Niño registrado exitosamente');
      router.push('/dashboard/ninos');
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al registrar niño: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar flotante */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard/ninos" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <span className="text-lg">←</span>
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand">
                Registrar Niño
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alias */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
                Alias / Nombre operativo *
              </label>
              <input
                type="text"
                required
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] placeholder:text-neutro-piedra/60 transition-all"
                placeholder="Ej: Juan, María, Luisito..."
              />
              <p className="mt-2 text-xs text-neutro-piedra font-outfit">
                No uses el nombre completo por privacidad
              </p>
            </div>

            {/* Rango Etario */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
                Rango de edad *
              </label>
              <select
                value={formData.rango_etario}
                onChange={(e) => setFormData({ ...formData, rango_etario: e.target.value })}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] transition-all"
              >
                <option value="5-7">5 a 7 años</option>
                <option value="8-10">8 a 10 años</option>
                <option value="11-13">11 a 13 años</option>
                <option value="14+">14 años o más</option>
              </select>
            </div>

            {/* Nivel de Alfabetización */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
                Nivel de alfabetización *
              </label>
              <select
                value={formData.nivel_alfabetizacion}
                onChange={(e) => setFormData({ ...formData, nivel_alfabetizacion: e.target.value })}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] transition-all"
              >
                <option value="Pre-silábico">Pre-silábico (no reconoce letras)</option>
                <option value="Silábico">Silábico (reconoce algunas letras)</option>
                <option value="Silábico-alfabético">Silábico-alfabético (empieza a leer)</option>
                <option value="Alfabético">Alfabético (lee palabras simples)</option>
                <option value="Alfabetizado">Alfabetizado (lee fluidamente)</option>
              </select>
            </div>

            {/* Escolarizado */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-3">
                ¿Asiste a la escuela? *
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="escolarizado"
                    checked={formData.escolarizado === true}
                    onChange={() => setFormData({ ...formData, escolarizado: true })}
                    className="w-5 h-5 text-crecimiento-500 focus:ring-crecimiento-400"
                  />
                  <span className="text-neutro-carbon font-outfit">Sí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="escolarizado"
                    checked={formData.escolarizado === false}
                    onChange={() => setFormData({ ...formData, escolarizado: false })}
                    className="w-5 h-5 text-crecimiento-500 focus:ring-crecimiento-400"
                  />
                  <span className="text-neutro-carbon font-outfit">No</span>
                </label>
              </div>
            </div>

            {/* Observaciones iniciales */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
                Observaciones iniciales (opcional)
              </label>
              <textarea
                value={formData.observaciones_iniciales}
                onChange={(e) => setFormData({ ...formData, observaciones_iniciales: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] placeholder:text-neutro-piedra/60 transition-all resize-none"
                placeholder="Contexto, situación familiar, motivo de ingreso, etc."
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:flex-1 px-6 py-4 min-h-[56px] bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] font-medium font-outfit active:scale-95 transition-all flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] font-semibold font-outfit disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center shadow-[0_4px_16px_rgba(164,198,57,0.15)]"
              >
                {loading ? 'Guardando...' : '✓ Registrar Niño'}
              </button>
            </div>
          </form>
        </div>

        {/* Info adicional */}
        <div className="mt-6 bg-sol-50/60 backdrop-blur-sm border border-sol-200/40 rounded-3xl p-6 shadow-[0_4px_16px_rgba(242,201,76,0.08)]">
          <h3 className="font-semibold text-sol-800 mb-3 font-quicksand flex items-center gap-2">
            <span className="text-xl">ℹ️</span> Importante
          </h3>
          <ul className="text-sm text-sol-700 space-y-2 font-outfit">
            <li>• Los datos sensibles (nombre completo, fecha de nacimiento) los cargará psicopedagogía</li>
            <li>• El niño quedará automáticamente asignado a vos</li>
            <li>• Podés empezar a registrar sesiones inmediatamente</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
