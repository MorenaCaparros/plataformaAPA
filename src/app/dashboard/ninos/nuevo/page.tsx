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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/dashboard/ninos" className="text-blue-600 font-medium text-sm sm:text-base min-h-[44px] flex items-center">
              ← Volver
            </Link>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Registrar Niño</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alias */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alias / Nombre operativo *
              </label>
              <input
                type="text"
                required
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan, María, Luisito..."
              />
              <p className="mt-1 text-xs text-gray-500">
                No uses el nombre completo por privacidad
              </p>
            </div>

            {/* Rango Etario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de edad *
              </label>
              <select
                value={formData.rango_etario}
                onChange={(e) => setFormData({ ...formData, rango_etario: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="5-7">5 a 7 años</option>
                <option value="8-10">8 a 10 años</option>
                <option value="11-13">11 a 13 años</option>
                <option value="14+">14 años o más</option>
              </select>
            </div>

            {/* Nivel de Alfabetización */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de alfabetización *
              </label>
              <select
                value={formData.nivel_alfabetizacion}
                onChange={(e) => setFormData({ ...formData, nivel_alfabetizacion: e.target.value })}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Asiste a la escuela? *
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="escolarizado"
                    checked={formData.escolarizado === true}
                    onChange={() => setFormData({ ...formData, escolarizado: true })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Sí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="escolarizado"
                    checked={formData.escolarizado === false}
                    onChange={() => setFormData({ ...formData, escolarizado: false })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
            </div>

            {/* Observaciones iniciales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones iniciales (opcional)
              </label>
              <textarea
                value={formData.observaciones_iniciales}
                onChange={(e) => setFormData({ ...formData, observaciones_iniciales: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Contexto, situación familiar, motivo de ingreso, etc."
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:flex-1 px-6 py-3 min-h-[48px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium active:scale-95 flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 px-6 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
              >
                {loading ? 'Guardando...' : '✓ Registrar Niño'}
              </button>
            </div>
          </form>
        </div>

        {/* Info adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ Importante</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los datos sensibles (nombre completo, fecha de nacimiento) los cargará psicopedagogía</li>
            <li>• El niño quedará automáticamente asignado a vos</li>
            <li>• Podés empezar a registrar sesiones inmediatamente</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
