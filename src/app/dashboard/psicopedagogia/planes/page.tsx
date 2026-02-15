'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Calendar, User, Target, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// NOTE: planes_intervencion table was dropped in the 31-table migration.
// This page is preserved as a placeholder until a new intervention plans system is built.
// Historically, plans lived in `planes_intervencion` + `actividades_plan`.
// In the new schema, the closest related data is `historico_deficits` and `entrevistas`.

export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sol-50 via-neutro-lienzo to-crecimiento-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-impulso-400 p-3 rounded-xl shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Planes de Intervención
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestión de objetivos y actividades semanales
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Aviso de módulo en reconstrucción */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Módulo en reconstrucción
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-lg mx-auto">
            El sistema de planes de intervención está siendo migrado a la nueva estructura de base de datos. 
            Mientras tanto, podés registrar observaciones y seguimiento a través de las entrevistas y el histórico de déficits.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/psicopedagogia/evaluaciones"
              className="inline-flex items-center gap-2 bg-impulso-400 hover:bg-impulso-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <FileText className="w-5 h-5" />
              Ver Evaluaciones
            </Link>
            <Link
              href="/dashboard/ninos"
              className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <User className="w-5 h-5" />
              Ver Niños
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
