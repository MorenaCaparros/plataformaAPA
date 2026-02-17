'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  ITEMS_OBSERVACION,
  CATEGORIAS_LABELS,
  ESCALA_LIKERT,
  VALOR_NO_COMPLETADO,
  LABEL_NO_COMPLETADO,
  calcularPromedioItems,
  contarItemsCompletados,
  type Categoria
} from '@/lib/constants/items-observacion';
import { ArrowLeft, Save, FileText, Check, AlertTriangle, Timer, X, Calendar } from 'lucide-react';

interface Nino {
  id: string;
  alias: string;
  rango_etario: string;
  nivel_alfabetizacion: string;
}

interface FormData {
  duracion_minutos: number;
  items: Record<string, number>;
  observaciones_libres: string;
  fecha: string; // YYYY-MM-DD, default today
}

// ─── Session Chronometer Hook ──────────────────────────────────
// Persists timer per niño. If the user navigates away, the timer keeps
// counting (based on wall-clock diff). Accumulated paused time is also
// stored so pauses survive page reloads.
//
// localStorage keys (scoped by ninoId):
//   sesion_timer_{ninoId}_start   – epoch ms when the timer started
//   sesion_timer_{ninoId}_paused  – total ms spent paused so far
//   sesion_timer_{ninoId}_pauseAt – epoch ms when current pause began (only while paused)
//   sesion_timer_active           – the ninoId of the currently active session (global)

function useChronometer(ninoId: string) {
  const keyStart = `sesion_timer_${ninoId}_start`;
  const keyPaused = `sesion_timer_${ninoId}_paused`;
  const keyPauseAt = `sesion_timer_${ninoId}_pauseAt`;
  const keyActive = 'sesion_timer_active';

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedMsRef = useRef<number>(0);

  // Calculate elapsed seconds accounting for paused time
  const calcElapsed = useCallback(() => {
    const now = Date.now();
    let totalPaused = pausedMsRef.current;
    // If currently paused, add the ongoing pause duration
    const pauseAt = localStorage.getItem(keyPauseAt);
    if (pauseAt) {
      totalPaused += now - parseInt(pauseAt, 10);
    }
    return Math.max(0, Math.floor((now - startTimeRef.current - totalPaused) / 1000));
  }, [keyPauseAt]);

  // Init: restore or create timer
  useEffect(() => {
    const savedStart = localStorage.getItem(keyStart);
    const savedPaused = localStorage.getItem(keyPaused);
    const savedPauseAt = localStorage.getItem(keyPauseAt);

    if (savedStart) {
      startTimeRef.current = parseInt(savedStart, 10);
      pausedMsRef.current = savedPaused ? parseInt(savedPaused, 10) : 0;

      if (savedPauseAt) {
        // Was paused when user left — stay paused
        setIsRunning(false);
      } else {
        setIsRunning(true);
      }
    } else {
      // Brand new session timer
      startTimeRef.current = Date.now();
      pausedMsRef.current = 0;
      localStorage.setItem(keyStart, String(startTimeRef.current));
      localStorage.setItem(keyPaused, '0');
      setIsRunning(true);
    }

    // Mark this niño as the active session
    localStorage.setItem(keyActive, ninoId);

    setSeconds(calcElapsed());

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ninoId, keyStart, keyPaused, keyPauseAt, keyActive, calcElapsed]);

  // Tick interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(calcElapsed());
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, calcElapsed]);

  const toggle = useCallback(() => {
    setIsRunning(prev => {
      if (prev) {
        // Running → Pause: record pause start
        localStorage.setItem(keyPauseAt, String(Date.now()));
      } else {
        // Paused → Resume: accumulate paused duration, clear pauseAt
        const pauseAt = localStorage.getItem(keyPauseAt);
        if (pauseAt) {
          const pausedDelta = Date.now() - parseInt(pauseAt, 10);
          pausedMsRef.current += pausedDelta;
          localStorage.setItem(keyPaused, String(pausedMsRef.current));
          localStorage.removeItem(keyPauseAt);
        }
      }
      return !prev;
    });
  }, [keyPauseAt, keyPaused]);

  const reset = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedMsRef.current = 0;
    localStorage.setItem(keyStart, String(startTimeRef.current));
    localStorage.setItem(keyPaused, '0');
    localStorage.removeItem(keyPauseAt);
    localStorage.setItem(keyActive, ninoId);
    setSeconds(0);
    setIsRunning(true);
  }, [keyStart, keyPaused, keyPauseAt, keyActive, ninoId]);

  const stop = useCallback(() => {
    setIsRunning(false);
    // Clean up all timer keys for this niño
    localStorage.removeItem(keyStart);
    localStorage.removeItem(keyPaused);
    localStorage.removeItem(keyPauseAt);
    // Clear active session marker
    const active = localStorage.getItem(keyActive);
    if (active === ninoId) {
      localStorage.removeItem(keyActive);
    }
  }, [keyStart, keyPaused, keyPauseAt, keyActive, ninoId]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return { seconds, isRunning, formatTime, toggle, reset, stop };
}

// Helper: check if there's an active session timer for ANY niño
function getActiveSessionInfo(): { ninoId: string; elapsedMinutes: number } | null {
  if (typeof window === 'undefined') return null;
  const activeNinoId = localStorage.getItem('sesion_timer_active');
  if (!activeNinoId) return null;

  const start = localStorage.getItem(`sesion_timer_${activeNinoId}_start`);
  if (!start) return null;

  const paused = parseInt(localStorage.getItem(`sesion_timer_${activeNinoId}_paused`) || '0', 10);
  const pauseAt = localStorage.getItem(`sesion_timer_${activeNinoId}_pauseAt`);
  let totalPaused = paused;
  if (pauseAt) totalPaused += Date.now() - parseInt(pauseAt, 10);

  const elapsed = Math.max(0, Date.now() - parseInt(start, 10) - totalPaused);
  return { ninoId: activeNinoId, elapsedMinutes: Math.round(elapsed / 60000) };
}

export { getActiveSessionInfo };

export default function NuevaSesionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const ninoId = params.ninoId as string;
  const chrono = useChronometer(ninoId);
  
  const [nino, setNino] = useState<Nino | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategoria, setExpandedCategoria] = useState<Categoria | null>('atencion_concentracion');
  const [hasDraft, setHasDraft] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    duracion_minutos: 45,
    items: {},
    observaciones_libres: '',
    fecha: new Date().toISOString().slice(0, 10)
  });

  // Cargar borrador guardado al iniciar
  useEffect(() => {
    if (ninoId) {
      const saved = localStorage.getItem(`draft_sesion_${ninoId}`);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setFormData({
            duracion_minutos: draft.duracion_minutos,
            items: draft.items,
            observaciones_libres: draft.observaciones_libres,
            fecha: draft.fecha || new Date().toISOString().slice(0, 10)
          });
          setHasDraft(true);
        } catch (e) {
          console.error('Error cargando borrador');
        }
      }
    }
    fetchNino();
  }, [ninoId]);

  // Guardar borrador automáticamente
  useEffect(() => {
    if (ninoId && Object.keys(formData.items).length > 0) {
      const draft = {
        ...formData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`draft_sesion_${ninoId}`, JSON.stringify(draft));
      setHasDraft(true);
    }
  }, [formData, ninoId]);

  const fetchNino = async () => {
    try {
      const { data, error } = await supabase
        .from('ninos')
        .select('id, alias, rango_etario, nivel_alfabetizacion')
        .eq('id', ninoId)
        .single();

      if (error) throw error;
      setNino(data);
    } catch (error) {
      console.error('Error fetching niño:', error);
      alert('No se pudo cargar la información del niño');
      router.push('/dashboard/ninos');
    } finally {
      setLoading(false);
    }
  };

  // Calcular progreso — items con valor (1-5) OR marked as N/C (0) both count as "touched"
  const totalItems = ITEMS_OBSERVACION.length;
  const touchedItems = Object.keys(formData.items).length;
  const progreso = Math.round((touchedItems / totalItems) * 100);

  // Count how many are N/C
  const ncCount = Object.values(formData.items).filter(v => v === VALOR_NO_COMPLETADO).length;

  // Agrupar items por categoría
  const itemsPorCategoria = ITEMS_OBSERVACION.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<Categoria, typeof ITEMS_OBSERVACION>);

  // Items completados por categoría (touched = rated OR marked N/C)
  const getTocadosCategoria = (categoria: Categoria) => {
    const itemsCategoria = itemsPorCategoria[categoria];
    return itemsCategoria.filter(item => formData.items[item.id] !== undefined).length;
  };

  const handleItemChange = (itemId: string, valor: number) => {
    setFormData(prev => ({
      ...prev,
      items: { ...prev.items, [itemId]: valor }
    }));
  };

  const handleMarkNC = (itemId: string) => {
    setFormData(prev => {
      const currentVal = prev.items[itemId];
      // Toggle: if already N/C, remove the entry so volunteer can re-rate
      if (currentVal === VALOR_NO_COMPLETADO) {
        const { [itemId]: _, ...rest } = prev.items;
        return { ...prev, items: rest };
      }
      return {
        ...prev,
        items: { ...prev.items, [itemId]: VALOR_NO_COMPLETADO }
      };
    });
  };

  const toggleCategoria = (categoria: Categoria) => {
    setExpandedCategoria(expandedCategoria === categoria ? null : categoria);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // All items must be touched (either rated 1-5 or marked N/C)
    const itemsFaltantes = ITEMS_OBSERVACION.filter(item => formData.items[item.id] === undefined);
    if (itemsFaltantes.length > 0) {
      alert('Faltan ' + itemsFaltantes.length + ' ítems por completar o marcar como N/C');
      return;
    }

    // Stop the chronometer
    chrono.stop();
    const duracionReal = Math.max(1, Math.round(chrono.seconds / 60));

    setSubmitting(true);

    try {
      const itemsArray = ITEMS_OBSERVACION.map(item => ({
        id: item.id,
        categoria: item.categoria,
        texto: item.texto,
        valor: formData.items[item.id]
      }));

      const { error } = await supabase
        .from('sesiones')
        .insert({
          nino_id: ninoId,
          voluntario_id: user?.id,
          fecha: formData.fecha === new Date().toISOString().slice(0, 10)
            ? new Date().toISOString()
            : new Date(formData.fecha + 'T12:00:00').toISOString(),
          duracion_minutos: duracionReal,
          items: itemsArray,
          observaciones_libres: formData.observaciones_libres,
          created_offline: false,
          sincronizado_at: new Date().toISOString()
        });

      if (error) throw error;

      // Limpiar borrador después de guardar exitosamente (timer ya se limpió en chrono.stop())
      localStorage.removeItem(`draft_sesion_${ninoId}`);
      
      alert('✅ Sesión registrada correctamente (' + duracionReal + ' min)');
      router.push('/dashboard/ninos');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al guardar. El borrador se guardó localmente.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearDraft = () => {
    if (confirm('¿Eliminar el borrador guardado? Perderás todo el progreso.')) {
      localStorage.removeItem(`draft_sesion_${ninoId}`);
      setFormData({
        duracion_minutos: 45,
        items: {},
        observaciones_libres: '',
        fecha: new Date().toISOString().slice(0, 10)
      });
      setHasDraft(false);
      chrono.reset();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutro-lienzo flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-crecimiento-400 mx-auto"></div>
          <p className="mt-4 text-neutro-piedra font-outfit">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!nino) return null;

  return (
    <div className="min-h-screen bg-neutro-lienzo pb-24">
      {/* Header fijo */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-white/60 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => router.back()} className="text-crecimiento-600 hover:text-crecimiento-700 min-h-[44px] flex items-center gap-2 font-outfit font-medium">
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <h1 className="font-bold text-base sm:text-lg font-quicksand text-neutro-carbon">Nueva Sesión</h1>
            <div className="w-16"></div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-neutro-piedra mb-3 font-outfit">
            <div>
              <span className="font-bold text-neutro-carbon">{nino.alias}</span> • {nino.rango_etario} • {nino.nivel_alfabetizacion}
            </div>
            <div className="flex items-center gap-3">
              {hasDraft && (
                <button
                  onClick={clearDraft}
                  className="text-sol-600 hover:text-sol-800 font-medium flex items-center gap-1.5"
                  title="Borrar borrador"
                >
                  <Save className="w-4 h-4" />
                  Borrador
                </button>
              )}
            </div>
          </div>

          {/* Chronometer + Progress */}
          <div className="flex items-center gap-3 mb-1">
            {/* Chronometer */}
            <button
              type="button"
              onClick={chrono.toggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-bold font-quicksand transition-all ${
                chrono.isRunning
                  ? 'bg-crecimiento-50 text-crecimiento-700 border border-crecimiento-200/60'
                  : 'bg-sol-50 text-sol-700 border border-sol-200/60'
              }`}
              title={chrono.isRunning ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
            >
              <Timer className="w-4 h-4" />
              <span className="tabular-nums">{chrono.formatTime(chrono.seconds)}</span>
              {!chrono.isRunning && <span className="text-[10px] font-medium ml-1 opacity-70">PAUSA</span>}
            </button>

            {/* Progress */}
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1 font-outfit">
                <span className="text-neutro-piedra">Progreso</span>
                <span className="text-neutro-carbon font-semibold">
                  {touchedItems}/{totalItems}
                  {ncCount > 0 && <span className="text-neutro-piedra font-normal ml-1">({ncCount} N/C)</span>}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-sol-400 to-crecimiento-400 h-2 rounded-full transition-all shadow-[0_0_6px_rgba(164,198,57,0.3)]" style={{ width: progreso + '%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <form className="px-3 sm:px-4 py-4">
        {/* Timer alert for long sessions */}
        {chrono.seconds >= 5400 && (
          <div className="bg-impulso-50 border border-impulso-200/60 rounded-2xl p-3 mb-4 flex items-center gap-2 text-impulso-700 text-sm font-outfit">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>La sesión lleva más de 1h30m. Recordá guardar tu progreso.</span>
          </div>
        )}

        {/* Date picker — defaults to today */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(242,201,76,0.08)] p-4 mb-4">
          <label className="text-sm font-medium mb-2 flex items-center gap-2 text-neutro-carbon font-outfit">
            <Calendar className="w-4 h-4" />
            Fecha de la sesión
          </label>
          <input
            type="date"
            value={formData.fecha}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
            className="w-full px-3 py-3 text-base border border-gray-200 rounded-xl font-outfit focus:ring-2 focus:ring-crecimiento-300 focus:border-crecimiento-400 transition-all"
          />
          {formData.fecha !== new Date().toISOString().slice(0, 10) && (
            <p className="text-xs text-sol-600 mt-2 font-outfit flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Registrando sesión de otro día ({new Date(formData.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })})
            </p>
          )}
        </div>

        {/* Acordeón */}
        <div className="space-y-3">
          {(Object.keys(itemsPorCategoria) as Categoria[]).map(categoria => {
            const items = itemsPorCategoria[categoria];
            const tocados = getTocadosCategoria(categoria);
            const total = items.length;
            const isExpanded = expandedCategoria === categoria;
            const isComplete = tocados === total;

            return (
              <div key={categoria} className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(242,201,76,0.08)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategoria(categoria)}
                  className="w-full px-4 py-3 min-h-[48px] flex items-center justify-between hover:bg-white/40 active:bg-white/60 transition-colors"
                >
                  <div className="flex gap-3 flex-1">
                    <span>{CATEGORIAS_LABELS[categoria].split(' ')[0]}</span>
                    <div className="text-left flex-1">
                      <div className="text-sm font-bold font-quicksand text-neutro-carbon">{CATEGORIAS_LABELS[categoria].replace(/^[^\s]+ /, '')}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`text-xs font-semibold font-outfit ${isComplete ? 'text-crecimiento-600' : 'text-neutro-piedra'}`}>
                          {tocados}/{total}
                        </div>
                        {isComplete && (
                          <span className="text-[10px] bg-crecimiento-50 text-crecimiento-700 px-2 py-0.5 rounded-full font-bold border border-crecimiento-200/40">
                            COMPLETO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete && <Check className="w-5 h-5 text-crecimiento-600 font-bold" />}
                    <span className={`transition-transform text-neutro-piedra ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-4 space-y-3 sm:space-y-4 border-t border-white/60">
                    {items.map((item, i) => {
                      const itemValue = formData.items[item.id];
                      const isItemTouched = itemValue !== undefined;
                      const isNC = itemValue === VALOR_NO_COMPLETADO;
                      const isRated = isItemTouched && !isNC;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`${i > 0 ? 'pt-4 border-t border-white/40' : 'pt-4'} ${
                            isNC
                              ? 'bg-gray-50/80 -mx-4 px-4 py-3 rounded-xl'
                              : isRated
                                ? 'bg-crecimiento-50/50 -mx-4 px-4 py-3 rounded-xl'
                                : ''
                          }`}
                        >
                          <div className="mb-3">
                            <div className="flex gap-2 mb-1">
                              {isNC ? (
                                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                  <X className="w-3 h-3 text-white" />
                                </div>
                              ) : isRated ? (
                                <Check className="w-5 h-5 text-crecimiento-600 font-bold flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              <label className={`text-sm font-medium font-outfit flex-1 ${
                                isNC ? 'text-gray-400 line-through' : isRated ? 'text-crecimiento-900' : 'text-neutro-carbon'
                              }`}>
                                {item.texto}
                              </label>
                            </div>
                            {item.descripcion && <p className="text-xs text-neutro-piedra ml-7 font-outfit">{item.descripcion}</p>}
                          </div>
                        
                          {/* Likert scale buttons + N/C button */}
                          <div className="flex gap-2">
                            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 flex-1">
                              {ESCALA_LIKERT.map(escala => (
                                <button
                                  key={escala.valor}
                                  type="button"
                                  onClick={() => handleItemChange(item.id, escala.valor)}
                                  disabled={isNC}
                                  className={`py-3 min-h-[48px] rounded-xl border-2 font-bold active:scale-95 text-sm sm:text-base transition-all font-quicksand ${
                                    isNC
                                      ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                                      : itemValue === escala.valor
                                        ? 'border-crecimiento-500 bg-crecimiento-500 text-white shadow-glow-crecimiento'
                                        : 'border-gray-300 hover:border-crecimiento-400 text-neutro-carbon'
                                  }`}
                                >
                                  {escala.valor}
                                </button>
                              ))}
                            </div>
                            {/* N/C button */}
                            <button
                              type="button"
                              onClick={() => handleMarkNC(item.id)}
                              title={isNC ? 'Desmarcar N/C' : 'Marcar como No Completó'}
                              className={`py-3 min-h-[48px] min-w-[48px] rounded-xl border-2 font-bold active:scale-95 text-xs transition-all font-outfit ${
                                isNC
                                  ? 'border-gray-400 bg-gray-400 text-white'
                                  : 'border-gray-300 hover:border-gray-400 text-neutro-piedra hover:bg-gray-50'
                              }`}
                            >
                              {LABEL_NO_COMPLETADO}
                            </button>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 flex-1 text-[10px] text-center text-neutro-piedra font-outfit">
                              <div>Muy bajo</div>
                              <div>Bajo</div>
                              <div>Medio</div>
                              <div>Alto</div>
                              <div>Muy alto</div>
                            </div>
                            <div className="min-w-[48px]"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Observaciones */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(242,201,76,0.08)] p-4 mt-4">
          <label className="text-sm font-medium mb-2 flex items-center gap-2 text-neutro-carbon font-outfit">
            <FileText className="w-4 h-4" />
            Observaciones adicionales
          </label>
          <textarea
            value={formData.observaciones_libres}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones_libres: e.target.value }))}
            rows={4}
            className="w-full px-3 py-3 text-base border border-gray-200 rounded-xl font-outfit focus:ring-2 focus:ring-crecimiento-300 focus:border-crecimiento-400 transition-all"
            placeholder="Situaciones relevantes..."
          />
        </div>
      </form>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-white/60 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          {progreso < 100 && (
            <div className="text-center text-sm text-sol-700 font-medium mb-3 flex items-center justify-center gap-2 font-outfit">
              <AlertTriangle className="w-4 h-4" />
              Faltan {totalItems - touchedItems} ítems por completar o marcar N/C
            </div>
          )}
          {progreso >= 100 && ncCount > 0 && (
            <div className="text-center text-xs text-neutro-piedra mb-2 font-outfit">
              {ncCount} ítem{ncCount > 1 ? 'es' : ''} marcado{ncCount > 1 ? 's' : ''} como N/C — no afectan el promedio
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:flex-1 px-6 py-3 min-h-[48px] border-2 border-gray-300 rounded-xl font-semibold active:scale-95 flex items-center justify-center text-neutro-carbon font-outfit hover:bg-gray-50 transition-all"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || progreso < 100}
              className="w-full sm:flex-1 px-6 py-3 min-h-[48px] bg-gradient-to-r from-crecimiento-500 to-crecimiento-400 text-white rounded-xl font-semibold active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-glow-crecimiento transition-all font-outfit"
            >
              {submitting ? 'Guardando...' : (
                <>
                  <Check className="w-5 h-5" />
                  Guardar ({Math.max(1, Math.round(chrono.seconds / 60))} min)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
