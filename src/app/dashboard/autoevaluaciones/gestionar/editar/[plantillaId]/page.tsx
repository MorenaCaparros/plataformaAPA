'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

type TipoPregunta = 'escala' | 'si_no' | 'texto_abierto';
type Area = 'lenguaje' | 'grafismo' | 'lectura_escritura' | 'matematicas';

interface Pregunta {
  id: string;
  texto: string;
  tipo: TipoPregunta;
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

  const rolesPermitidos = ['director', 'psicopedagogia', 'coordinador', 'trabajador_social', 'admin'];
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
          preguntas_db:preguntas_capacitacion(id, orden, pregunta, tipo_pregunta, puntaje)
        `)
        .eq('id', plantillaId)
        .single();

      if (error) throw error;

      if (data) {
        setTitulo(data.nombre);
        setArea(data.area);
        setDescripcion(data.descripcion || '');
        // Map preguntas from DB format
        const mappedPreguntas = (data.preguntas_db || [])
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((p: any) => ({
            id: p.id,
            texto: p.pregunta,
            tipo: p.tipo_pregunta === 'verdadero_falso' ? 'si_no' : p.tipo_pregunta === 'texto_libre' ? 'texto_abierto' : 'escala' as TipoPregunta,
          }));
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
    setPreguntas([...preguntas, { id: Date.now().toString(), texto: '', tipo: 'escala' }]);
  }

  function eliminarPregunta(id: string) {
    setPreguntas(preguntas.filter(p => p.id !== id));
  }

  function actualizarPregunta(id: string, campo: 'texto' | 'tipo', valor: string) {
    setPreguntas(preguntas.map(p => 
      p.id === id ? { ...p, [campo]: valor } : p
    ));
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

    setGuardando(true);

    try {
      // 1. Update capacitacion
      const { error: capError } = await supabase
        .from('capacitaciones')
        .update({
          nombre: titulo,
          area,
          descripcion
        })
        .eq('id', plantillaId);

      if (capError) throw capError;

      // 2. Delete old preguntas and recreate
      const { error: delError } = await supabase
        .from('preguntas_capacitacion')
        .delete()
        .eq('capacitacion_id', plantillaId);

      if (delError) throw delError;

      // 3. Insert updated preguntas
      for (let i = 0; i < preguntas.length; i++) {
        const p = preguntas[i];
        const tipoDB = p.tipo === 'si_no' ? 'verdadero_falso' : p.tipo === 'texto_abierto' ? 'texto_libre' : 'escala';
        
        const { error: pregError } = await supabase
          .from('preguntas_capacitacion')
          .insert({
            capacitacion_id: plantillaId,
            orden: i + 1,
            pregunta: p.texto,
            tipo_pregunta: tipoDB,
            respuesta_correcta: '',
            puntaje: 10,
          });

        if (pregError) {
          console.error(`Error al crear pregunta ${i}:`, pregError);
        }
      }

      alert('Plantilla actualizada correctamente');
      router.push('/dashboard/autoevaluaciones/gestionar');
    } catch (error) {
      console.error('Error al actualizar plantilla:', error);
      alert('Error al actualizar la plantilla');
    } finally {
      setGuardando(false);
    }
  }

  if (!tienePermiso) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crecimiento-50 via-white to-sol-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando plantilla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-crecimiento-50 via-white to-sol-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navbar */}
        <div className="sticky top-0 z-30 mb-6 sm:mb-8">
          <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/80 rounded-2xl transition-all duration-300 hover:shadow-md group"
              >
                <ArrowLeft className="w-6 h-6 text-neutral-700 group-hover:text-impulso-500 transition-colors" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800">
                  Editar Plantilla
                </h1>
                <p className="text-neutral-600 text-sm sm:text-base mt-1">
                  Modifica los campos que necesites
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Información General</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Título de la Autoevaluación
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent bg-white/80 transition-all"
                  placeholder="Ej: Autoevaluación de Lectura Inicial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Área
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as Area)}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent bg-white/80 transition-all"
                >
                  <option value="lenguaje">Lenguaje y Vocabulario</option>
                  <option value="grafismo">Grafismo y Motricidad Fina</option>
                  <option value="lectura_escritura">Lectura y Escritura</option>
                  <option value="matematicas">Nociones Matemáticas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent bg-white/80 transition-all resize-none"
                  rows={3}
                  placeholder="Describe brevemente el objetivo de esta autoevaluación..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Preguntas */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">Preguntas</h2>
              <button
                type="button"
                onClick={agregarPregunta}
                className="flex items-center gap-2 px-4 py-2 bg-crecimiento-400 text-white rounded-2xl hover:bg-crecimiento-500 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Agregar Pregunta</span>
              </button>
            </div>

            <div className="space-y-4">
              {preguntas.map((pregunta, index) => (
                <div key={pregunta.id} className="bg-white/80 rounded-2xl p-4 border border-neutral-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-crecimiento-100 flex items-center justify-center text-crecimiento-700 font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={pregunta.texto}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'texto', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent bg-white resize-none"
                        rows={2}
                        placeholder="Escribe la pregunta..."
                        required
                      />
                      
                      <select
                        value={pregunta.tipo}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'tipo', e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent bg-white text-sm"
                      >
                        <option value="escala">Escala 1-5 ⭐</option>
                        <option value="si_no">Sí / No</option>
                        <option value="texto_abierto">Texto abierto</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarPregunta(pregunta.id)}
                      className="flex-shrink-0 p-2 text-impulso-500 hover:bg-impulso-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {preguntas.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  No hay preguntas todavía. Haz clic en "Agregar Pregunta" para comenzar.
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-white/80 backdrop-blur-sm text-neutral-700 rounded-2xl hover:bg-white transition-all shadow-md hover:shadow-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
