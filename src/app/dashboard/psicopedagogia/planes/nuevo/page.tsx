'use client';

import { useRouter } from 'next/navigation';
import { Target, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// NOTE: planes_intervencion + actividades_plan tables were dropped in the 31-table migration.
// This page is preserved as a placeholder until a new intervention plans system is built.

export default function NuevoPlanPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-crecimiento-50 via-neutro-lienzo to-sol-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-impulso-400 p-3 rounded-xl shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nuevo Plan de Intervención
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Crea actividades semanales con ayuda de IA
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Aviso de módulo en reconstrucción */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Funcionalidad no disponible temporalmente
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
            La creación de planes de intervención está siendo migrada a la nueva estructura de base de datos.
            Mientras tanto, podés usar las evaluaciones (entrevistas) y el histórico de déficits para registrar seguimiento.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
