'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

type TipoPregunta = 'escala' | 'si_no' | 'texto_abierto' | 'multiple_choice';
type Area = 'lenguaje' | 'grafismo' | 'lectura_escritura' | 'matematicas';

interface OpcionPregunta {
  id?: string;
  texto_opcion: string;
  es_correcta: boolean;
  orden: number;
}

interface Pregunta {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  respuesta_correcta: string;
  opciones: OpcionPregunta[];
}

export default function EditarPlantillaPage() {
  const router = useRouter();
  const params = useParams();
  const { perfil } = useAuth();
  const plantillaId = params?.plantillaId as string;

  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState<Area>('lenguaje');
  const [descripcion, setDescripcion] = useState('');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [guardando, setGuardando] = useState(false);

  const rolesPermitidos = ['director', 'psicopedagogia', 'coordinador', 'trabajador_social', 'admin', 'equipo_profesional'];
  const tienePermiso = perfil && rolesPermitidos.includes(perfil.rol);

  useEffect(() => {
    if (!tienePermiso) {
      router.push('/dashboard/autoevaluaciones');
      return;
    }
    fetchPlantilla();
  }, [perfil, tienePermiso, plantillaId]);

  async function fetchPlantilla() {
    try {
      const { data, error } = await supabase
        .from('capacitaciones')
        .select(`
          *,
          preguntas_db:preguntas_capacitacion(
            id, orden, pregunta, tipo_pregunta, puntaje, respuesta_correcta,
            opciones:opciones_pregunta(id, orden, texto_opcion, es_correcta)
          )
        `)
        .eq('id', plantillaId)
        .single();

      if (error) throw error;

      if (data) {
        setTitulo(data.nombre);
        setArea(data.area);
        setDescripcion(data.descripcion || '');
        const mappedPreguntas = (data.preguntas_db || [])
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((p: any) => {
            let tipo: TipoPregunta = 'escala';
            if (p.tipo_pregunta === 'verdadero_falso') tipo = 'si_no';
            else if (p.tipo_pregunta === 'texto_libre') tipo = 'texto_abierto';
            else if (p.tipo_pregunta === 'multiple_choice') tipo = 'multiple_choice';
            else if (p.tipo_pregunta === 'escala') tipo = 'escala';
            return {
              id: p.id,
              texto: p.pregunta,
              tipo,
              respuesta_correcta: p.respuesta_correcta || '',
              opciones: (p.opciones || []).sort((a: any, b: any) => a.orden - b.orden),
            };
          });
        setPreguntas(mappedPreguntas);
      }
    } catch (error) {
      console.error('Error al cargar plantilla:', error);
      alert('Error al cargar la plantilla');
      router.push('/dashboard/autoevaluaciones/gestionar');
    } finally {
      setLoading(false);
    }
  }

  function agregarPregunta() {
    setPreguntas([...preguntas, { id: Date.now().toString(), texto: '', tipo: 'escala', respuesta_correcta: '', opciones: [] }]);
  }

  function eliminarPregunta(id: string) {
    setPreguntas(preguntas.filter(p => p.id !== id));
  }

  function actualizarPregunta(id: string, campo: keyof Pregunta, valor: any) {
    setPreguntas(preguntas.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [campo]: valor };
      if (campo === 'tipo') {
        updated.respuesta_correcta = '';
        updated.opciones = valor === 'multiple_choice'
          ? [{ texto_opcion: '', es_correcta: true, orden: 1 }, { texto_opcion: '', es_correcta: false, orden: 2 }]
          : [];
      }
      return updated;
    }));
  }

  function actualizarOpcion(preguntaId: string, opcionIdx: number, campo: keyof OpcionPregunta, valor: any) {
    setPreguntas(preguntas.map(p => {
      if (p.id !== preguntaId) return p;
      const newOpciones = p.opciones.map((op, oi) => {
        if (oi !== opcionIdx) {
          if (campo === 'es_correcta' && valor === true) return { ...op, es_correcta: false };
          return op;
        }
        return { ...op, [campo]: valor };
      });
      const correcta = newOpciones.find(o => o.es_correcta);
      return { ...p, opciones: newOpciones, respuesta_correcta: correcta?.texto_opcion || '' };
    }));
  }

  function agregarOpcion(preguntaId: string) {
    setPreguntas(preguntas.map(p => {
      if (p.id !== preguntaId) return p;
      return { ...p, opciones: [...p.opciones, { texto_opcion: '', es_correcta: false, orden: p.opciones.length + 1 }] };
    }));
  }

  function quitarOpcion(preguntaId: string, opcionIdx: number) {
    setPreguntas(preguntas.map(p => {
      if (p.id !== preguntaId || p.opciones.length <= 2) return p;
      const newOps = p.opciones.filter((_, i) => i !== opcionIdx).map((o, i) => ({ ...o, orden: i + 1 }));
      const correcta = newOps.find(o => o.es_correcta);
      return { ...p, opciones: newOps, respuesta_correcta: correcta?.texto_opcion || '' };
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim() || !descripcion.trim()) {
      alert('El título y la descripción son obligatorios');
      return;
    }

    if (preguntas.length === 0) {
      alert('Debes agregar al menos una pregunta');
      return;
    }

    if (preguntas.some(p => !p.texto.trim())) {
      alert('Todas las preguntas deben tener texto');
      return;
    }

    for (const p of preguntas) {
      if (p.tipo === 'multiple_choice') {
        if (p.opciones.length < 2) { alert(`Pregunta "${p.texto.substring(0, 30)}..." necesita al menos 2 opciones`); return; }
        if (!p.opciones.some(o => o.es_correcta)) { alert(`Pregunta "${p.texto.substring(0, 30)}..." necesita una opción correcta`); return; }
        if (p.opciones.some(o => !o.texto_opcion.trim())) { alert('Todas las opciones deben tener texto'); return; }
      }
    }

    setGuardando(true);

    try {
      // 1. Update capacitacion
      const { error: capError } = await supabase
        .from('capacitaciones')
        .update({ nombre: titulo, area, descripcion })
        .eq('id', plantillaId);

      if (capError) throw capError;

      // 2. Delete old opciones for old preguntas first
      const { data: oldPreguntas } = await supabase
        .from('preguntas_capacitacion')
        .select('id')
        .eq('capacitacion_id', plantillaId);

      if (oldPreguntas) {
        for (const op of oldPreguntas) {
          await supabase.from('opciones_pregunta').delete().eq('pregunta_id', op.id);
        }
      }

      // 3. Delete old preguntas
      await supabase.from('preguntas_capacitacion').delete().eq('capacitacion_id', plantillaId);

      // 4. Insert updated preguntas with respuesta_correcta + opciones
      for (let i = 0; i < preguntas.length; i++) {
        const p = preguntas[i];
        const tipoDB = p.tipo === 'si_no' ? 'verdadero_falso' : p.tipo === 'texto_abierto' ? 'texto_libre' : p.tipo;

        const { data: preguntaDB, error: pregError } = await supabase
          .from('preguntas_capacitacion')
          .insert({
            capacitacion_id: plantillaId,
            orden: i + 1,
            pregunta: p.texto,
            tipo_pregunta: tipoDB,
            respuesta_correcta: p.respuesta_correcta || '',
            puntaje: 10,
          })
          .select()
          .single();

        if (pregError) {
          console.error(`Error al crear pregunta ${i}:`, pregError);
          continue;
        }

        if (p.tipo === 'multiple_choice' && preguntaDB && p.opciones.length > 0) {
          const opInserts = p.opciones.map((op, idx) => ({
            pregunta_id: preguntaDB.id,
            orden: idx + 1,
            texto_opcion: op.texto_opcion.trim(),
            es_correcta: op.es_correcta,
          }));
          await supabase.from('opciones_pregunta').insert(opInserts);
        }
      }

      alert('✅ Plantilla actualizada correctamente');
      router.push('/dashboard/autoevaluaciones/gestionar');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  }

  const renderRespuestaCorrectaInput = (pregunta: Pregunta) => {
    if (pregunta.tipo === 'texto_abierto') {
      return (
        <input
          type="text"
          value={pregunta.respuesta_correcta}
          onChange={(e) => actualizarPregunta(pregunta.id, 'respuesta_correcta', e.target.value)}
          placeholder="Respuesta esperada (opcional, revisión manual)"
          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-outfit focus:ring-2 focus:ring-sol-400"
        />
      );
    }
    if (pregunta.tipo === 'si_no') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutro-piedra font-outfit">Respuesta correcta:</span>
          {['true', 'false'].map(v => (
            <button key={v} type="button" onClick={() => actualizarPregunta(pregunta.id, 'respuesta_correcta', v)}
              className={`px-4 py-1.5 rounded-xl text-sm font-outfit font-medium transition-all ${
                pregunta.respuesta_correcta === v
                  ? v === 'true' ? 'bg-crecimiento-400 text-white' : 'bg-impulso-400 text-white'
                  : 'bg-neutro-nube text-neutro-piedra'
              }`}>
              {v === 'true' ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      );
    }
    if (pregunta.tipo === 'escala') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutro-piedra font-outfit">Correcta (1-5):</span>
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} type="button" onClick={() => actualizarPregunta(pregunta.id, 'respuesta_correcta', String(v))}
              className={`w-9 h-9 rounded-lg text-sm font-bold font-outfit transition-all ${
                pregunta.respuesta_correcta === String(v) ? 'bg-sol-400 text-white' : 'bg-neutro-nube text-neutro-piedra'
              }`}>
              {v}
            </button>
          ))}
        </div>
      );
    }
    if (pregunta.tipo === 'multiple_choice') {
      return (
        <div className="space-y-2">
          <span className="text-xs text-neutro-piedra font-outfit">Opciones (marcá la correcta):</span>
          {pregunta.opciones.map((op, opIdx) => (
            <div key={opIdx} className="flex items-center gap-2">
              <button type="button" onClick={() => actualizarOpcion(pregunta.id, opIdx, 'es_correcta', true)}
                className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                  op.es_correcta ? 'bg-crecimiento-400 border-crecimiento-500 text-white' : 'border-neutro-piedra/30'
                }`}>
                {op.es_correcta && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <input type="text" value={op.texto_opcion}
                onChange={(e) => actualizarOpcion(pregunta.id, opIdx, 'texto_opcion', e.target.value)}
                placeholder={`Opción ${opIdx + 1}`}
                className="flex-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm font-outfit focus:ring-2 focus:ring-sol-400"
              />
              {pregunta.opciones.length > 2 && (
                <button type="button" onClick={() => quitarOpcion(pregunta.id, opIdx)} className="p-1 text-impulso-500 hover:bg-impulso-50 rounded-lg">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => agregarOpcion(pregunta.id)}
            className="text-xs text-crecimiento-600 font-outfit font-medium flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar opción
          </button>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-crecimiento-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando plantilla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar flotante */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard/autoevaluaciones/gestionar" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <ArrowLeft className="w-5 h-5" />
                Volver
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand">
                Editar Plantilla
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
                  placeholder="Ej: Autoevaluación de Lenguaje Básico"
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit min-h-[56px] placeholder:text-neutro-piedra/60"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">Área *</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as Area)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit min-h-[56px]"
                >
                  <option value="lenguaje">Lenguaje y Vocabulario</option>
                  <option value="grafismo">Grafismo y Motricidad Fina</option>
                  <option value="lectura_escritura">Lectura y Escritura</option>
                  <option value="matematicas">Nociones Matemáticas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">Descripción *</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit resize-none placeholder:text-neutro-piedra/60"
                  rows={3}
                  placeholder="Describe brevemente el objetivo de esta autoevaluación..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Preguntas */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutro-carbon font-quicksand">
                Preguntas ({preguntas.length})
              </h2>
              <button
                type="button"
                onClick={agregarPregunta}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Agregar Pregunta</span>
              </button>
            </div>

            {preguntas.length === 0 ? (
              <p className="text-center text-neutro-piedra font-outfit py-8">
                No hay preguntas todavía. Hacé clic en &quot;Agregar Pregunta&quot; para comenzar.
              </p>
            ) : (
              <div className="space-y-5">
                {preguntas.map((pregunta, index) => (
                  <div key={pregunta.id} className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-crecimiento-100 flex items-center justify-center text-crecimiento-700 font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-sm font-semibold text-neutro-carbon font-outfit">
                          Pregunta {index + 1}
                        </span>
                      </div>
                      <button type="button" onClick={() => eliminarPregunta(pregunta.id)} className="text-impulso-600 hover:text-impulso-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <textarea
                        value={pregunta.texto}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'texto', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-neutro-piedra/20 rounded-2xl focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent text-neutro-carbon font-outfit resize-none placeholder:text-neutro-piedra/60"
                        rows={2}
                        placeholder="Escribe la pregunta..."
                        required
                      />

                      <select
                        value={pregunta.tipo}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'tipo', e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white border border-neutro-piedra/20 rounded-2xl focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent text-neutro-carbon font-outfit text-sm"
                      >
                        <option value="escala">Escala 1-5 ⭐</option>
                        <option value="si_no">Sí / No</option>
                        <option value="multiple_choice">Selección múltiple</option>
                        <option value="texto_abierto">Texto abierto</option>
                      </select>

                      {/* Respuesta correcta */}
                      <div className="bg-crecimiento-50/30 rounded-xl p-3 border border-crecimiento-200/20">
                        {renderRespuestaCorrectaInput(pregunta)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/autoevaluaciones/gestionar"
              className="flex-1 px-6 py-4 min-h-[56px] bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-outfit font-semibold text-center active:scale-95 flex items-center justify-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-outfit font-semibold active:scale-95 flex items-center justify-center gap-2"
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
