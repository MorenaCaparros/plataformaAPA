'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Pregunta {
  id: string;
  texto: string;
  tipo: 'escala' | 'si_no' | 'texto_abierto';
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
      tipo: 'escala'
    };
    setPreguntas([...preguntas, nuevaPregunta]);
  };

  const eliminarPregunta = (id: string) => {
    setPreguntas(preguntas.filter(p => p.id !== id));
  };

  const actualizarPregunta = (id: string, campo: keyof Pregunta, valor: any) => {
    setPreguntas(preguntas.map(p => 
      p.id === id ? { ...p, [campo]: valor } : p
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim() || !descripcion.trim() || preguntas.length === 0) {
      alert('Completá todos los campos y agregá al menos una pregunta');
      return;
    }

    // Validar que todas las preguntas tengan texto
    if (preguntas.some(p => !p.texto.trim())) {
      alert('Todas las preguntas deben tener texto');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('plantillas_autoevaluacion')
        .insert({
          titulo,
          area,
          descripcion,
          preguntas: preguntas.map(({ id, ...rest }) => rest), // Remover ID temporal
          activo: true
        });

      if (error) throw error;

      alert('Plantilla creada correctamente');
      router.push('/dashboard/autoevaluaciones/gestionar');
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      alert('Error al crear la plantilla');
    } finally {
      setSaving(false);
    }
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
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
                  Título *
                </label>
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
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
                  Área *
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit min-h-[56px]"
                  required
                >
                  <option value="lenguaje">Lenguaje y Vocabulario</option>
                  <option value="grafismo">Grafismo y Motricidad Fina</option>
                  <option value="lectura_escritura">Lectura y Escritura</option>
                  <option value="matematicas">Nociones Matemáticas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutro-carbon font-outfit mb-2">
                  Descripción *
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el objetivo de esta autoevaluación..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit resize-none placeholder:text-neutro-piedra/60"
                  required
                />
              </div>
            </div>
          </div>

          {/* Preguntas */}
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutro-carbon font-quicksand">
                Preguntas ({preguntas.length})
              </h2>
              <button
                type="button"
                onClick={agregarPregunta}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold active:scale-95"
              >
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
                      <button
                        type="button"
                        onClick={() => eliminarPregunta(pregunta.id)}
                        className="text-impulso-600 hover:text-impulso-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <textarea
                        value={pregunta.texto}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'texto', e.target.value)}
                        placeholder="Escribe la pregunta..."
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-neutro-piedra/20 rounded-2xl focus:ring-2 focus:ring-sol-400 text-neutro-carbon font-outfit resize-none placeholder:text-neutro-piedra/60"
                        required
                      />

                      <select
                        value={pregunta.tipo}
                        onChange={(e) => actualizarPregunta(pregunta.id, 'tipo', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-neutro-piedra/20 rounded-2xl focus:ring-2 focus:ring-sol-400 text-neutro-carbon font-outfit text-sm"
                      >
                        <option value="escala">Escala 1-10</option>
                        <option value="si_no">Sí/No</option>
                        <option value="texto_abierto">Texto abierto</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/autoevaluaciones/gestionar"
              className="flex-1 px-6 py-4 min-h-[56px] bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all font-outfit font-semibold text-center active:scale-95"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || preguntas.length === 0}
              className="flex-1 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? 'Guardando...' : 'Crear Plantilla'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
