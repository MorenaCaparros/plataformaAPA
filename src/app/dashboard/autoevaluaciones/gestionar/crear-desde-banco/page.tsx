'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Shuffle, Save, BookOpen, RefreshCw, Eye, Trash2 } from 'lucide-react';

type Area = 'lenguaje' | 'grafismo' | 'lectura_escritura' | 'matematicas';

interface PreguntaBanco {
  id: string;
  pregunta: string;
  tipo_pregunta: string;
  area: string;
  puntaje: number;
  orden: number;
  respuesta_correcta: string;
  imagen_url: string;
  datos_extra: any;
}

interface ConfigArea {
  area: Area;
  label: string;
  disponibles: number;
  cantidad: number;
  color: string;
  bg: string;
}

const AREAS_CONFIG: { value: Area; label: string; color: string; bg: string; gradient: string }[] = [
  { value: 'lenguaje', label: 'Lenguaje y Vocabulario', color: 'text-impulso-700', bg: 'bg-impulso-50 border-impulso-200/30', gradient: 'from-impulso-400 to-impulso-500' },
  { value: 'grafismo', label: 'Grafismo y Motricidad Fina', color: 'text-crecimiento-700', bg: 'bg-crecimiento-50 border-crecimiento-200/30', gradient: 'from-crecimiento-400 to-crecimiento-500' },
  { value: 'lectura_escritura', label: 'Lectura y Escritura', color: 'text-sol-700', bg: 'bg-sol-50 border-sol-200/30', gradient: 'from-sol-400 to-sol-500' },
  { value: 'matematicas', label: 'Nociones Matemáticas', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200/30', gradient: 'from-orange-400 to-orange-500' },
];

export default function CrearDesdeBancoPage() {
  const router = useRouter();
  const { perfil } = useAuth();

  const [bancoPreguntas, setBancoPreguntas] = useState<PreguntaBanco[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Config de la plantilla
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Cantidad por área (loaded from config or defaults)
  const [cantidadPorArea, setCantidadPorArea] = useState<Record<Area, number>>({
    lenguaje: 5,
    grafismo: 5,
    lectura_escritura: 5,
    matematicas: 5,
  });
  const [configCargada, setConfigCargada] = useState(false);

  // Preview de preguntas seleccionadas
  const [preguntasSeleccionadas, setPreguntasSeleccionadas] = useState<PreguntaBanco[]>([]);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  // Ref to store opciones from banco for copying
  const opcionesBancoRef = useRef<Record<string, any[]>>({});

  const rolesPermitidos = ['director', 'psicopedagogia', 'coordinador', 'trabajador_social', 'admin', 'equipo_profesional'];
  const tienePermiso = perfil?.rol ? rolesPermitidos.includes(perfil.rol) : false;

  useEffect(() => {
    if (!tienePermiso && perfil) {
      router.push('/dashboard/autoevaluaciones');
      return;
    }
    if (perfil) {
      fetchBanco();
      fetchConfigDefault();
    }
  }, [perfil, tienePermiso]);

  const fetchConfigDefault = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('configuracion_sistema')
        .select('valor')
        .eq('clave', 'autoevaluacion_preguntas_por_area')
        .single();

      if (data?.valor) {
        const defaultQty = parseInt(data.valor) || 5;
        if (!configCargada) {
          setCantidadPorArea({
            lenguaje: defaultQty,
            grafismo: defaultQty,
            lectura_escritura: defaultQty,
            matematicas: defaultQty,
          });
          setConfigCargada(true);
        }
      }
    } catch (e) {
      // Use default 5 if config table doesn't exist yet
    }
  }, [configCargada]);

  const fetchBanco = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('preguntas_capacitacion')
        .select('*, opciones:opciones_pregunta(id, orden, texto_opcion, es_correcta)')
        .is('capacitacion_id', null)
        .gt('puntaje', 0) // Only active questions
        .order('area_especifica')
        .order('orden');

      if (error) throw error;

      const mapped: PreguntaBanco[] = (data || []).map((p: any) => ({
        id: p.id,
        pregunta: p.pregunta,
        tipo_pregunta: p.tipo_pregunta,
        area: p.area_especifica || 'lenguaje',
        puntaje: p.puntaje,
        orden: p.orden,
        respuesta_correcta: p.respuesta_correcta || '',
        imagen_url: p.imagen_url || '',
        datos_extra: p.datos_extra || null,
      }));

      // Store raw opciones indexed by pregunta id for later copy
      const opcionesMap: Record<string, any[]> = {};
      (data || []).forEach((p: any) => {
        if (p.opciones && p.opciones.length > 0) {
          opcionesMap[p.id] = p.opciones;
        }
      });
      opcionesBancoRef.current = opcionesMap;

      setBancoPreguntas(mapped);
    } catch (error) {
      console.error('Error al cargar banco:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Contar disponibles por área
  const disponiblesPorArea = AREAS_CONFIG.map((a) => ({
    ...a,
    disponibles: bancoPreguntas.filter((p) => p.area === a.value).length,
  }));

  // Selección aleatoria
  const generarSeleccionAleatoria = () => {
    const seleccionadas: PreguntaBanco[] = [];

    for (const area of AREAS_CONFIG) {
      const preguntasArea = bancoPreguntas.filter((p) => p.area === area.value);
      const cantidad = Math.min(cantidadPorArea[area.value], preguntasArea.length);

      // Fisher-Yates shuffle
      const shuffled = [...preguntasArea];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      seleccionadas.push(...shuffled.slice(0, cantidad));
    }

    setPreguntasSeleccionadas(seleccionadas);
    setMostrarPreview(true);
  };

  const quitarPreguntaSeleccionada = (id: string) => {
    setPreguntasSeleccionadas((prev) => prev.filter((p) => p.id !== id));
  };

  const totalSeleccionadas = preguntasSeleccionadas.length;
  const totalConfigured = Object.values(cantidadPorArea).reduce((s, n) => s + n, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      alert('Ingresá un título para la plantilla');
      return;
    }

    if (preguntasSeleccionadas.length === 0) {
      alert('Primero generá la selección aleatoria de preguntas');
      return;
    }

    setGuardando(true);

    try {
      // 1. Determine the area for the capacitacion.
      // If all questions are from one area, use that. Otherwise, use 'mixta'.
      const areasCounts: Record<string, number> = {};
      preguntasSeleccionadas.forEach((p) => {
        areasCounts[p.area] = (areasCounts[p.area] || 0) + 1;
      });
      const areasUnicas = Object.keys(areasCounts);
      const areaPrincipal = areasUnicas.length === 1 ? areasUnicas[0] : 'mixta';

      // 2. Create capacitacion
      const { data: capacitacion, error: capError } = await supabase
        .from('capacitaciones')
        .insert({
          nombre: titulo,
          tipo: 'autoevaluacion',
          area: areaPrincipal,
          descripcion: descripcion || `Autoevaluación generada desde el banco de preguntas (${totalSeleccionadas} preguntas)`,
          es_obligatoria: true,
          puntaje_minimo_aprobacion: 70,
          activa: true,
        })
        .select()
        .single();

      if (capError) throw capError;

      // 3. Create preguntas linked to this capacitacion (copies from bank)
      for (let i = 0; i < preguntasSeleccionadas.length; i++) {
        const p = preguntasSeleccionadas[i];
        const { data: preguntaDB, error: pregError } = await supabase
          .from('preguntas_capacitacion')
          .insert({
            capacitacion_id: capacitacion.id,
            orden: i + 1,
            pregunta: p.pregunta,
            tipo_pregunta: p.tipo_pregunta,
            respuesta_correcta: p.respuesta_correcta || '',
            puntaje: p.puntaje,
            area_especifica: p.area,
            imagen_url: p.imagen_url || null,
            datos_extra: p.datos_extra || null,
          })
          .select()
          .single();

        if (pregError) {
          console.error(`Error al crear pregunta ${i}:`, pregError);
          continue;
        }

        // Copy opciones from banco if this question has them
        const opcionesSrc = opcionesBancoRef.current[p.id];
        if (preguntaDB && opcionesSrc && opcionesSrc.length > 0) {
          const opInserts = opcionesSrc.map((op: any) => ({
            pregunta_id: preguntaDB.id,
            orden: op.orden,
            texto_opcion: op.texto_opcion,
            es_correcta: op.es_correcta,
          }));
          await supabase.from('opciones_pregunta').insert(opInserts);
        }
      }

      alert('✅ Plantilla creada correctamente con preguntas del banco');
      router.push('/dashboard/autoevaluaciones/gestionar');
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      alert('Error al crear la plantilla');
    } finally {
      setGuardando(false);
    }
  };

  if (!tienePermiso && perfil) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando banco de preguntas...</p>
        </div>
      </div>
    );
  }

  if (bancoPreguntas.length === 0) {
    return (
      <div className="min-h-screen">
        <nav className="sticky top-0 z-30 mb-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
            <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
              <div className="flex justify-between items-center">
                <Link href="/dashboard/autoevaluaciones/gestionar" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                  <ArrowLeft className="w-5 h-5" />
                  Volver
                </Link>
                <h1 className="text-xl font-bold text-neutro-carbon font-quicksand">Crear desde Banco</h1>
                <div className="w-16"></div>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 text-center">
            <BookOpen className="w-12 h-12 text-neutro-piedra/40 mx-auto mb-4" />
            <p className="text-neutro-carbon font-outfit text-lg mb-2">El banco de preguntas está vacío</p>
            <p className="text-neutro-piedra font-outfit text-sm mb-6">
              Primero cargá preguntas en el banco para poder generar plantillas aleatorias.
            </p>
            <Link
              href="/dashboard/autoevaluaciones/gestionar/banco-preguntas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl hover:shadow-lg transition-all font-outfit font-semibold active:scale-95"
            >
              <BookOpen className="w-5 h-5" />
              Ir al Banco de Preguntas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard/autoevaluaciones/gestionar" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <ArrowLeft className="w-5 h-5" />
                Volver
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-crecimiento-500" />
                Crear desde Banco
              </h1>
              <div className="w-16"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info básica */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-neutro-carbon font-quicksand mb-6">Información de la Plantilla</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">Título *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Autoevaluación Inicial - Febrero 2026"
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit min-h-[56px] placeholder:text-neutro-piedra/60"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Opcional: describe el objetivo de esta autoevaluación..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit resize-none placeholder:text-neutro-piedra/60"
                />
              </div>
            </div>
          </div>

          {/* Configuración por área */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-neutro-carbon font-quicksand mb-2">
              Cantidad de Preguntas por Área
            </h2>
            <p className="text-sm text-neutro-piedra font-outfit mb-6">
              Definí cuántas preguntas aleatorias querés incluir de cada área temática.
            </p>

            <div className="space-y-4">
              {disponiblesPorArea.map((a) => (
                <div
                  key={a.value}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/80 rounded-2xl p-4 border border-white/60"
                >
                  <div className="flex-1">
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold font-outfit border ${a.bg} ${a.color}`}>
                      {a.label}
                    </span>
                    <p className="text-xs text-neutro-piedra font-outfit mt-1">
                      {a.disponibles} pregunta{a.disponibles !== 1 ? 's' : ''} disponible{a.disponibles !== 1 ? 's' : ''} en el banco
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCantidadPorArea((prev) => ({
                          ...prev,
                          [a.value]: Math.max(0, prev[a.value] - 1),
                        }))
                      }
                      className="w-10 h-10 rounded-xl bg-neutro-nube hover:bg-neutro-piedra/20 text-neutro-carbon font-bold transition-all flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={a.disponibles}
                      value={cantidadPorArea[a.value]}
                      onChange={(e) => {
                        const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), a.disponibles);
                        setCantidadPorArea((prev) => ({ ...prev, [a.value]: val }));
                      }}
                      className="w-16 text-center px-2 py-2 bg-white border border-neutro-piedra/20 rounded-xl text-neutro-carbon font-outfit font-bold focus:ring-2 focus:ring-sol-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCantidadPorArea((prev) => ({
                          ...prev,
                          [a.value]: Math.min(a.disponibles, prev[a.value] + 1),
                        }))
                      }
                      className="w-10 h-10 rounded-xl bg-neutro-nube hover:bg-neutro-piedra/20 text-neutro-carbon font-bold transition-all flex items-center justify-center"
                    >
                      +
                    </button>
                    {cantidadPorArea[a.value] > a.disponibles && (
                      <span className="text-xs text-impulso-600 font-outfit">
                        Máx: {a.disponibles}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total y botón generar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-crecimiento-50/40 rounded-2xl p-4 border border-crecimiento-200/30">
              <div>
                <span className="text-sm font-outfit text-crecimiento-700 font-medium">
                  Total configurado: <strong className="text-lg">{totalConfigured}</strong> preguntas
                </span>
              </div>
              <button
                type="button"
                onClick={generarSeleccionAleatoria}
                disabled={totalConfigured === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold active:scale-95 disabled:opacity-50"
              >
                <Shuffle className="w-5 h-5" />
                {preguntasSeleccionadas.length > 0 ? 'Regenerar Selección' : 'Generar Selección Aleatoria'}
              </button>
            </div>
          </div>

          {/* Preview de preguntas seleccionadas */}
          {mostrarPreview && preguntasSeleccionadas.length > 0 && (
            <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutro-carbon font-quicksand flex items-center gap-2">
                  <Eye className="w-5 h-5 text-sol-500" />
                  Preview: {totalSeleccionadas} preguntas seleccionadas
                </h2>
                <button
                  type="button"
                  onClick={generarSeleccionAleatoria}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/80 border border-white/60 text-neutro-carbon rounded-xl hover:shadow-md transition-all font-outfit text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerar
                </button>
              </div>

              {AREAS_CONFIG.map((area) => {
                const preguntasArea = preguntasSeleccionadas.filter((p) => p.area === area.value);
                if (preguntasArea.length === 0) return null;

                return (
                  <div key={area.value} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold font-outfit border ${area.bg} ${area.color}`}>
                        {area.label}
                      </span>
                      <span className="text-xs text-neutro-piedra font-outfit">
                        {preguntasArea.length} pregunta{preguntasArea.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {preguntasArea.map((p, i) => {
                        const tipoLabel: Record<string, string> = {
                          escala: 'Escala 1-5',
                          verdadero_falso: 'Sí / No',
                          multiple_choice: 'Selección múltiple',
                          texto_libre: 'Texto abierto',
                          ordenar_palabras: 'Ordenar palabras',
                          respuesta_imagen: 'Resp. con imagen',
                        };
                        return (
                        <div key={p.id} className="flex items-start gap-2 bg-white/80 rounded-xl p-3 border border-white/60 group">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutro-nube flex items-center justify-center text-neutro-piedra text-xs font-bold">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutro-carbon font-outfit leading-relaxed">
                              {p.pregunta}
                            </p>
                            <span className="text-[10px] text-neutro-piedra font-outfit px-1.5 py-0.5 rounded bg-neutro-carbon/5 mt-1 inline-block">
                              {tipoLabel[p.tipo_pregunta] || p.tipo_pregunta}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => quitarPreguntaSeleccionada(p.id)}
                            className="flex-shrink-0 p-1 text-impulso-500 opacity-0 group-hover:opacity-100 hover:bg-impulso-50 rounded-lg transition-all"
                            title="Quitar pregunta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/autoevaluaciones/gestionar"
              className="flex-1 px-6 py-4 min-h-[56px] bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-outfit font-semibold text-center active:scale-95 flex items-center justify-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando || preguntasSeleccionadas.length === 0 || !titulo.trim()}
              className="flex-1 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {guardando ? 'Creando...' : `Crear Plantilla (${totalSeleccionadas} preguntas)`}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
