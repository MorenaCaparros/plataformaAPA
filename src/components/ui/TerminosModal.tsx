'use client';

import { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface TerminosModalProps {
  onAceptar: () => void;
}

export default function TerminosModal({ onAceptar }: TerminosModalProps) {
  const [aceptando, setAceptando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAceptar = async () => {
    setAceptando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/terminos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: '1.0' }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al guardar');
      }
      onAceptar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error. Intentá de nuevo.');
      setAceptando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutro-carbon/50 backdrop-blur-sm p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-neutro-lienzo flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-crecimiento-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="w-6 h-6 text-crecimiento-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutro-carbon font-quicksand">
                Términos y Condiciones de Uso
              </h2>
              <p className="text-sm text-neutro-piedra font-outfit">
                Plataforma APA · Versión 1.0
              </p>
            </div>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5 text-neutro-carbon font-outfit text-sm leading-relaxed">
          <p>
            Antes de utilizar la plataforma APA, leé detenidamente los siguientes términos y condiciones.
            Al aceptarlos, confirmás que los entendiste y te comprometés a cumplirlos.
          </p>

          <section>
            <h3 className="font-semibold text-base mb-1.5 font-quicksand text-crecimiento-700">
              1. Confidencialidad de los datos
            </h3>
            <p>
              Toda la información registrada en esta plataforma —incluyendo datos de niños, sesiones
              educativas y observaciones— es <strong>estrictamente confidencial</strong>. No está
              permitido compartir, exportar ni reproducir esta información fuera de los canales
              autorizados por la organización.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1.5 font-quicksand text-crecimiento-700">
              2. Protección de datos de menores
            </h3>
            <p>
              Los datos de los niños son información sensible y están protegidos por normativas de
              protección de la infancia. El acceso a los mismos está limitado a personas autorizadas
              y con el único fin de mejorar el acompañamiento educativo.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1.5 font-quicksand text-crecimiento-700">
              3. Uso apropiado de la cuenta
            </h3>
            <p>
              Tu cuenta es personal e intransferible. Sos responsable de mantener la
              confidencialidad de tus credenciales y de todas las acciones realizadas con tu cuenta.
              Reportá de inmediato cualquier uso no autorizado.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1.5 font-quicksand text-crecimiento-700">
              4. Registro de actividad
            </h3>
            <p>
              La plataforma registra un log de auditoría de las acciones realizadas (creación,
              edición y eliminación de registros) para garantizar la trazabilidad y seguridad de
              los datos. Este registro puede ser revisado por el equipo directivo.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1.5 font-quicksand text-crecimiento-700">
              5. Uso del módulo de IA
            </h3>
            <p>
              Las funciones de inteligencia artificial de esta plataforma son herramientas de apoyo
              y no reemplazan el criterio profesional. Los informes y sugerencias generadas por IA
              <strong> no constituyen diagnósticos clínicos</strong> y deben interpretarse en
              contexto por personas calificadas.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1.5 font-quicksand text-crecimiento-700">
              6. Consecuencias del incumplimiento
            </h3>
            <p>
              El incumplimiento de estos términos puede resultar en la suspensión del acceso a la
              plataforma y, en casos graves, en acciones legales conforme a la normativa vigente
              de protección de datos.
            </p>
          </section>

          <p className="text-xs text-neutro-piedra/70 pt-2 border-t border-neutro-lienzo">
            Última actualización: enero 2026. Para consultas sobre estos términos, contactá al equipo
            directivo de la ONG Adelante.
          </p>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-neutro-lienzo flex-shrink-0 space-y-3">
          {error && (
            <p className="text-sm text-impulso-600 bg-impulso-50 rounded-xl px-4 py-2.5 font-outfit">
              {error}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <p className="text-xs text-neutro-piedra/70 font-outfit flex-1 text-center sm:text-left">
              Debés aceptar para continuar usando la plataforma.
            </p>
            <button
              onClick={handleAceptar}
              disabled={aceptando}
              className="w-full sm:w-auto px-6 py-3 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-2xl font-semibold font-outfit text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
            >
              {aceptando ? 'Guardando...' : '✓ Acepto los Términos y Condiciones'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
