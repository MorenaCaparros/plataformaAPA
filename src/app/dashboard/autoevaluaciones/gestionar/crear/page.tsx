'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

type TipoPregunta = 'escala' | 'si_no' | 'texto_abierto' | 'multiple_choice' | 'ordenar_palabras' | 'respuesta_imagen';

interface OpcionPregunta {
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
  puntaje: number;
  imagen_url: string;
  min_caracteres?: number;
}

export default function CrearPlantillaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [area, setArea] = useState('lenguaje');
  const [descripcion, setDescripcion] = useState('');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [saving, setSaving] = useState(false);

  const agregarPregunta = () => {
    const nuevaPregunta: Pregunta = {
      id: `pregunta-${Date.now()}`,
      texto: '',
      tipo: 'escala',
      respuesta_correcta: '',
      opciones: [],
      puntaje: 10,
      imagen_url: '',
    };
    setPreguntas([...preguntas, nuevaPregunta]);
  };

  const eliminarPregunta = (id: string) => {
    setPreguntas(preguntas.filter(p => p.id !== id));
  };

  const actualizarPregunta = (id: string, campo: keyof Pregunta, valor: any) => {
    setPreguntas(preguntas.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [campo]: valor };
      if (campo === 'tipo') {
        updated.respuesta_correcta = '';
        updated.imagen_url = '';
        if (valor === 'multiple_choice' || valor === 'respuesta_imagen') {
          updated.opciones = [{ texto_opcion: '', es_correcta: true, orden: 1 }, { texto_opcion: '', es_correcta: false, orden: 2 }];
        } else {
          updated.opciones = [];
        }
      }
      return updated;
    }));
  };

  const actualizarOpcion = (preguntaId: string, opcionIdx: number, campo: keyof OpcionPregunta, valor: any) => {
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
  };

  const agregarOpcion = (preguntaId: string) => {
    setPreguntas(preguntas.map(p => {
      if (p.id !== preguntaId) return p;
      return { ...p, opciones: [...p.opciones, { texto_opcion: '', es_correcta: false, orden: p.opciones.length + 1 }] };
    }));
  };

  const quitarOpcion = (preguntaId: string, opcionIdx: number) => {
    setPreguntas(preguntas.map(p => {
      if (p.id !== preguntaId || p.opciones.length <= 2) return p;
      const newOpciones = p.opciones.filter((_, i) => i !== opcionIdx).map((o, i) => ({ ...o, orden: i + 1 }));
      const correcta = newOpciones.find(o => o.es_correcta);
      return { ...p, opciones: newOpciones, respuesta_correcta: correcta?.texto_opcion || '' };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim() || !descripcion.trim() || preguntas.length === 0) {
      alert('Completá todos los campos y agregá al menos una pregunta');
      return;
    }

    if (preguntas.some(p => !p.texto.trim())) {
      alert('Todas las preguntas deben tener texto');
      return;
    }

    // Validate respuesta_correcta
    for (const p of preguntas) {
      if (p.tipo === 'multiple_choice' || p.tipo === 'respuesta_imagen') {
        if (p.opciones.length < 2) { alert(`Pregunta "${p.texto.substring(0, 30)}..." necesita al menos 2 opciones`); return; }
        if (!p.opciones.some(o => o.es_correcta)) { alert(`Pregunta "${p.texto.substring(0, 30)}..." necesita una opción correcta`); return; }
        if (p.opciones.some(o => !o.texto_opcion.trim())) { alert(`Todas las opciones deben tener texto`); return; }
      }
    }

    setSaving(true);

    try {
      // 1. Create capacitacion
      const { data: capacitacion, error: capError } = await supabase
        .from('capacitaciones')
        .insert({
          nombre: titulo,
          tipo: 'autoevaluacion',
          area,
          descripcion,
          es_obligatoria: true,
          puntaje_minimo_aprobacion: 70,
          activa: true
        })
        .select()
        .single();

      if (capError) throw capError;

      // 2. Create preguntas
      for (let i = 0; i < preguntas.length; i++) {
        const p = preguntas[i];
        const tipoDB = p.tipo === 'si_no' ? 'verdadero_falso' : p.tipo === 'texto_abierto' ? 'texto_libre' : p.tipo;
        
        const { data: preguntaDB, error: pregError } = await supabase
          .from('preguntas_capacitacion')
          .insert({
            capacitacion_id: capacitacion.id,
            orden: i + 1,
            pregunta: p.texto,
            tipo_pregunta: tipoDB,
            respuesta_correcta: p.respuesta_correcta || '',
            puntaje: p.puntaje || 10,
            imagen_url: p.imagen_url || null,
          })
          .select()
          .single();

        if (pregError) {
          console.error(`Error al crear pregunta ${i}:`, pregError);
          continue;
        }

        // Insert opciones for multiple_choice and respuesta_imagen
        if ((p.tipo === 'multiple_choice' || p.tipo === 'respuesta_imagen') && preguntaDB && p.opciones.length > 0) {
          const opInserts = p.opciones.map((op, idx) => ({
            pregunta_id: preguntaDB.id,
            orden: idx + 1,
            texto_opcion: op.texto_opcion.trim(),
            es_correcta: op.es_correcta,
          }));
          await supabase.from('opciones_pregunta').insert(opInserts);
        }
      }

      alert('Plantilla creada correctamente');
      router.push('/dashboard/autoevaluaciones/gestionar');
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      alert('Error al crear la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const renderRespuestaCorrectaInput = (pregunta: Pregunta) => {
    if (pregunta.tipo === 'texto_abierto') {
      return (
        <input
          type="text"
          value={pregunta.respuesta_correcta}
          onChange={(e) => actualizarPregunta(pregunta.id, 'respuesta_correcta', e.target.value)}
          placeholder="Respuesta esperada (opcional, revisión manual)"
          className="w-full px-3 py-2 bg-white border border-neutro-piedra/20 rounded-xl text-sm font-outfit focus:ring-2 focus:ring-sol-400"
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
                className="flex-1 px-3 py-1.5 bg-white border border-neutro-piedra/20 rounded-lg text-sm font-outfit focus:ring-2 focus:ring-sol-400"
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
    if (pregunta.tipo === 'ordenar_palabras') {
      return (
        <div className="space-y-2">
          <span className="text-xs text-neutro-piedra font-outfit">Orden correcto (separá con |):</span>
          <input
            type="text"
            value={pregunta.respuesta_correcta}
            onChange={(e) => actualizarPregunta(pregunta.id, 'respuesta_correcta', e.target.value)}
            placeholder="palabra1|palabra2|palabra3"
            className="w-full px-3 py-2 bg-white border border-neutro-piedra/20 rounded-xl text-sm font-outfit focus:ring-2 focus:ring-sol-400"
          />
          {pregunta.respuesta_correcta && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {pregunta.respuesta_correcta.split('|').map((w, i) => (
                <span key={i} className="px-2.5 py-1 bg-sol-100 text-sol-800 text-xs font-outfit rounded-lg border border-sol-200/40">
                  {i + 1}. {w.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (pregunta.tipo === 'respuesta_imagen') {
      return (
        <div className="space-y-3">
          <div>
            <span className="text-xs text-neutro-piedra font-outfit">URL de la imagen:</span>
            <input
              type="url"
              value={pregunta.imagen_url}
              onChange={(e) => actualizarPregunta(pregunta.id, 'imagen_url', e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full px-3 py-2 bg-white border border-neutro-piedra/20 rounded-xl text-sm font-outfit focus:ring-2 focus:ring-sol-400 mt-1"
            />
          </div>
          <div>
            <span className="text-xs text-neutro-piedra font-outfit">Opciones de respuesta (marcá la correcta):</span>
            {pregunta.opciones.map((op, opIdx) => (
              <div key={opIdx} className="flex items-center gap-2 mt-1.5">
                <button type="button" onClick={() => actualizarOpcion(pregunta.id, opIdx, 'es_correcta', true)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    op.es_correcta ? 'bg-crecimiento-400 border-crecimiento-500 text-white' : 'border-neutro-piedra/30'
                  }`}>
                  {op.es_correcta && <CheckCircle2 className="w-4 h-4" />}
                </button>
                <input type="text" value={op.texto_opcion}
                  onChange={(e) => actualizarOpcion(pregunta.id, opIdx, 'texto_opcion', e.target.value)}
                  placeholder={`Opción ${opIdx + 1}`}
                  className="flex-1 px-3 py-1.5 bg-white border border-neutro-piedra/20 rounded-lg text-sm font-outfit focus:ring-2 focus:ring-sol-400"
                />
                {pregunta.opciones.length > 2 && (
                  <button type="button" onClick={() => quitarOpcion(pregunta.id, opIdx)} className="p-1 text-impulso-500 hover:bg-impulso-50 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => agregarOpcion(pregunta.id)}
              className="text-xs text-crecimiento-600 font-outfit font-medium flex items-center gap-1 mt-2">
              <Plus className="w-3.5 h-3.5" /> Agregar opción
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

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
                Nueva Plantilla
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
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Autoevaluación de Lenguaje Básico"
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit min-h-[56px] placeholder:text-neutro-piedra/60"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">Área *</label>
                <select value={area} onChange={(e) => setArea(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit min-h-[56px]"
                  required>
                  <option value="lenguaje">Lenguaje y Vocabulario</option>
                  <option value="grafismo">Grafismo y Motricidad Fina</option>
                  <option value="lectura_escritura">Lectura y Escritura</option>
                  <option value="matematicas">Nociones Matemáticas</option>
                  <option value="mixta">Múltiples Áreas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">Descripción *</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el objetivo de esta autoevaluación..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit resize-none placeholder:text-neutro-piedra/60"
                  required />
              </div>
            </div>
          </div>

          {/* Preguntas */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutro-carbon font-quicksand">
                Preguntas ({preguntas.length})
              </h2>
              <button type="button" onClick={agregarPregunta}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold active:scale-95">
                <Plus className="w-5 h-5" />
                Agregar Pregunta
              </button>
            </div>

            {preguntas.length === 0 ? (
              <p className="text-center text-neutro-piedra font-outfit py-8">
                No hay preguntas todavía. Hacé clic en "Agregar Pregunta" para comenzar.
              </p>
            ) : (
              <div className="space-y-5">
                {preguntas.map((pregunta, index) => (
                  <div key={pregunta.id} className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-semibold text-neutro-carbon font-outfit">
                        Pregunta {index + 1}
                      </span>
                      <button type="button" onClick={() => eliminarPregunta(pregunta.id)} className="text-impulso-600 hover:text-impulso-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <textarea value={pregunta.texto}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'texto', e.target.value)}
                        placeholder="Escribe la pregunta..."
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-neutro-piedra/20 rounded-2xl focus:ring-2 focus:ring-sol-400 text-neutro-carbon font-outfit resize-none placeholder:text-neutro-piedra/60"
                        required />

                      <select value={pregunta.tipo}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'tipo', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-neutro-piedra/20 rounded-2xl focus:ring-2 focus:ring-sol-400 text-neutro-carbon font-outfit text-sm">
                        <option value="escala">Escala 1-5 ⭐</option>
                        <option value="si_no">Sí / No</option>
                        <option value="multiple_choice">Selección múltiple</option>
                        <option value="texto_abierto">Texto abierto</option>
                        <option value="ordenar_palabras">Ordenar palabras</option>
                        <option value="respuesta_imagen">Respuesta con imagen</option>
                      </select>

                      {/* Puntaje de la pregunta */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-neutro-piedra font-outfit whitespace-nowrap">Puntaje:</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={pregunta.puntaje}
                          onChange={(e) => actualizarPregunta(pregunta.id, 'puntaje', Math.max(1, parseInt(e.target.value) || 10))}
                          className="w-20 px-3 py-2 bg-white border border-neutro-piedra/20 rounded-xl text-sm font-outfit text-center font-bold focus:ring-2 focus:ring-sol-400"
                        />
                        <span className="text-xs text-neutro-piedra font-outfit">pts</span>
                      </div>

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

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/autoevaluaciones/gestionar"
              className="flex-1 px-6 py-4 min-h-[56px] bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-outfit font-semibold text-center active:scale-95">
              Cancelar
            </Link>
            <button type="submit" disabled={saving || preguntas.length === 0}
              className="flex-1 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
              {saving ? 'Guardando...' : 'Crear Plantilla'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
