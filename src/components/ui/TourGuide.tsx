'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

export interface TourStep {
  /** selector CSS del elemento a destacar, o null para un tooltip flotante centrado */
  target?: string;
  title: string;
  description: string;
}

interface Props {
  /** Identificador único de la página, usado para guardar estado en localStorage */
  tourId: string;
  steps: TourStep[];
  /** Si true, el tour se inicia automáticamente la primera vez que el usuario visita la página */
  autoStart?: boolean;
}

export default function TourGuide({ tourId, steps, autoStart = true }: Props) {
  const storageKey = `apa-tour-${tourId}`;
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (autoStart && localStorage.getItem(storageKey) !== 'done') {
      // Pequeño delay para que la página termine de renderizar
      const t = setTimeout(() => setActive(true), 600);
      return () => clearTimeout(t);
    }
  }, [autoStart, storageKey]);

  const updateRect = useCallback(() => {
    const target = steps[step]?.target;
    if (!target) { setRect(null); return; }
    const el = document.querySelector(target);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [step, steps]);

  useEffect(() => {
    if (!active) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [active, updateRect]);

  const finish = () => {
    setActive(false);
    localStorage.setItem(storageKey, 'done');
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const restart = () => {
    setStep(0);
    setActive(true);
  };

  if (!mounted) return null;

  const currentStep = steps[step];
  const PADDING = 12; // espacio alrededor del elemento destacado

  // Posición del tooltip: aparece debajo del elemento destacado, o centrado si no hay target
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 9999,
  };
  if (rect) {
    const top = rect.bottom + PADDING + window.scrollY;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - 160, 16),
      window.innerWidth - 336
    );
    tooltipStyle = {
      position: 'fixed',
      top: top > window.innerHeight - 200 ? rect.top - 160 : rect.bottom + PADDING,
      left,
      zIndex: 9999,
      width: 320,
    };
  }

  return (
    <>
      {/* Botón flotante "?" para reiniciar el tour */}
      <button
        onClick={restart}
        aria-label="Iniciar tour de ayuda"
        className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-white/90 border border-neutro-piedra/20 shadow-md flex items-center justify-center text-neutro-piedra hover:text-crecimiento-600 hover:border-crecimiento-300 transition-all active:scale-95 md:bottom-6"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {active && createPortal(
        <>
          {/* Overlay semitransparente */}
          <div
            className="fixed inset-0 bg-black/40 z-[9990]"
            onClick={finish}
          />

          {/* Highlight del elemento */}
          {rect && (
            <div
              className="fixed z-[9995] rounded-2xl ring-4 ring-crecimiento-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-none transition-all duration-300"
              style={{
                top: rect.top - PADDING,
                left: rect.left - PADDING,
                width: rect.width + PADDING * 2,
                height: rect.height + PADDING * 2,
              }}
            />
          )}

          {/* Tooltip del paso */}
          <div style={tooltipStyle} className="bg-white rounded-2xl shadow-xl border border-white/80 p-5 w-80 z-[9999]">
            {/* Progreso */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-crecimiento-500' : 'w-2 bg-gray-200'}`}
                  />
                ))}
              </div>
              <button
                onClick={finish}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar tour"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <h3 className="font-quicksand font-bold text-neutro-carbon text-base mb-1.5">
              {currentStep.title}
            </h3>
            <p className="font-outfit text-neutro-piedra text-sm leading-relaxed mb-4">
              {currentStep.description}
            </p>

            {/* Navegación */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={prev}
                disabled={step === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-outfit disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
                Anterior
              </button>
              <span className="font-outfit text-xs text-gray-400">
                {step + 1} / {steps.length}
              </span>
              <button
                onClick={next}
                className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-crecimiento-500 text-white text-xs font-outfit font-medium hover:bg-crecimiento-600 transition-colors active:scale-95"
              >
                {step === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                {step < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
