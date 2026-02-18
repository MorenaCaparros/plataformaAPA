'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Loader2, BookOpen, Shuffle } from 'lucide-react';
import Link from 'next/link';

interface Plantilla {
  id: string;
  titulo: string;
  area: string;
  descripcion: string;
  preguntas: any[];
  activo: boolean;
  created_at: string;
}

function GestionarPlantillasContent() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { perfil } = useAuth();

  const plantillaId = searchParams.get('plantilla');

  // Verificar permisos
  const rolesPermitidos = ['director', 'psicopedagogia', 'coordinador', 'trabajador_social', 'admin', 'equipo_profesional'];
  const tienePermiso = perfil?.rol ? rolesPermitidos.includes(perfil.rol) : false;

  useEffect(() => {
    if (!tienePermiso && perfil) {
      router.push('/dashboard/autoevaluaciones');
      return;
    }
    fetchPlantillas();
  }, [perfil, tienePermiso]);

  async function fetchPlantillas() {
    try {
      console.log('🔍 Intentando cargar plantillas (capacitaciones)...');
      const { data, error } = await supabase
        .from('capacitaciones')
        .select(`
          *,
          preguntas:preguntas_capacitacion(id, orden, pregunta, tipo_pregunta, puntaje)
        `)
        .eq('tipo', 'autoevaluacion')
        .order('area');

      console.log('📊 Respuesta de Supabase:', { data, error });
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        alert(`Error al cargar plantillas: ${error.message}`);
        throw error;
      }
      
      // Map to old plantilla shape
      const mapped = (data || []).map((c: any) => ({
        id: c.id,
        titulo: c.nombre,
        area: c.area,
        descripcion: c.descripcion,
        activo: c.activa,
        preguntas: (c.preguntas || []).sort((a: any, b: any) => a.orden - b.orden),
        created_at: c.created_at,
      }));
      
      console.log('✅ Plantillas cargadas:', mapped.length);
      setPlantillas(mapped);
    } catch (error) {
      console.error('💥 Error al cargar plantillas:', error);
      alert('Error al cargar las plantillas. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(plantillaId: string, activo: boolean) {
    try {
      const { error } = await supabase
        .from('capacitaciones')
        .update({ activa: !activo })
        .eq('id', plantillaId);

      if (error) throw error;
      fetchPlantillas();
    } catch (error) {
      console.error('Error al actualizar plantilla:', error);
      alert('Error al actualizar la plantilla');
    }
  }

  async function eliminarPlantilla(plantillaId: string, titulo: string) {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('capacitaciones')
        .delete()
        .eq('id', plantillaId);

      if (error) throw error;
      fetchPlantillas();
      alert('Plantilla eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      alert('Error al eliminar la plantilla');
    }
  }

  const areaLabels: Record<string, string> = {
    lenguaje: 'Lenguaje y Vocabulario',
    grafismo: 'Grafismo y Motricidad Fina',
    lectura_escritura: 'Lectura y Escritura',
    matematicas: 'Nociones Matemáticas'
  };

  if (!tienePermiso && perfil) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-crecimiento-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar flotante */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard/autoevaluaciones" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand">
                Gestionar Plantillas
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Acciones principales */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Link
            href="/dashboard/autoevaluaciones/gestionar/banco-preguntas"
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-white/60 backdrop-blur-md border border-sol-200/40 rounded-2xl hover:shadow-[0_8px_24px_rgba(242,201,76,0.15)] transition-all active:scale-95"
          >
            <BookOpen className="w-5 h-5 text-sol-600" />
            <div className="text-left">
              <span className="font-outfit font-semibold text-neutro-carbon text-sm">Banco de Preguntas</span>
              <p className="text-xs text-neutro-piedra font-outfit">Gestionar el banco temático de preguntas</p>
            </div>
          </Link>

          <Link
            href="/dashboard/autoevaluaciones/gestionar/crear"
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-white/60 backdrop-blur-md border border-crecimiento-200/40 rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.15)] transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 text-crecimiento-600" />
            <div className="text-left">
              <span className="font-outfit font-semibold text-neutro-carbon text-sm">Crear Plantilla Manual</span>
              <p className="text-xs text-neutro-piedra font-outfit">Escribir preguntas manualmente</p>
            </div>
          </Link>

          <Link
            href="/dashboard/autoevaluaciones/gestionar/crear-desde-banco"
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all active:scale-95 shadow-[0_4px_16px_rgba(164,198,57,0.15)]"
          >
            <Shuffle className="w-5 h-5 text-white" />
            <div className="text-left">
              <span className="font-outfit font-semibold text-white text-sm">Crear desde Banco</span>
              <p className="text-xs text-white/80 font-outfit">Asignar preguntas aleatorias por área</p>
            </div>
          </Link>
        </div>

        {/* Lista de plantillas */}
        {plantillas.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 sm:p-12 text-center">
            <BookOpen className="w-12 h-12 text-neutro-piedra/40 mx-auto mb-4" />
            <p className="text-neutro-carbon font-outfit text-lg mb-2">No hay plantillas creadas todavía.</p>
            <p className="text-neutro-piedra font-outfit text-sm">
              Usá las opciones de arriba para crear tu primera plantilla de autoevaluación.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plantillas.map((plantilla) => (
              <div
                key={plantilla.id}
                className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 transition-all duration-300 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)]"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-block px-4 py-1.5 rounded-2xl text-sm font-semibold font-outfit border ${
                          plantilla.area === 'lenguaje' ? 'bg-impulso-50 text-impulso-700 border-impulso-200/30' :
                          plantilla.area === 'grafismo' ? 'bg-crecimiento-50 text-crecimiento-700 border-crecimiento-200/30' :
                          plantilla.area === 'lectura_escritura' ? 'bg-sol-50 text-sol-700 border-sol-200/30' :
                          plantilla.area === 'matematicas' ? 'bg-impulso-50 text-impulso-700 border-impulso-200/30' :
                          'bg-neutro-lienzo text-neutro-carbon border-neutro-piedra/30'
                        }`}
                      >
                        {areaLabels[plantilla.area] || plantilla.area}
                      </span>
                      <span className={`px-3 py-1 rounded-2xl text-xs font-semibold font-outfit ${
                        plantilla.activo 
                          ? 'bg-crecimiento-50 text-crecimiento-700' 
                          : 'bg-neutro-piedra/20 text-neutro-piedra'
                      }`}>
                        {plantilla.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-neutro-carbon font-quicksand mb-2">
                      {plantilla.titulo}
                    </h3>
                    <p className="text-sm text-neutro-piedra font-outfit mb-2">
                      {plantilla.descripcion}
                    </p>
                    <p className="text-xs text-neutro-piedra font-outfit">
                      {plantilla.preguntas?.length || 0} preguntas
                    </p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => toggleActivo(plantilla.id, plantilla.activo)}
                      className={`flex-1 sm:flex-none px-4 py-2.5 backdrop-blur-sm border rounded-2xl transition-all text-sm font-outfit font-medium active:scale-95 ${
                        plantilla.activo
                          ? 'bg-crecimiento-50 border-crecimiento-200/40 text-crecimiento-700 hover:shadow-[0_4px_16px_rgba(164,198,57,0.2)]'
                          : 'bg-white/80 border-white/60 text-neutro-piedra hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]'
                      }`}
                      title={plantilla.activo ? 'Desactivar plantilla' : 'Activar plantilla'}
                    >
                      {plantilla.activo ? (
                        <Eye className="w-4 h-4 mx-auto" />
                      ) : (
                        <EyeOff className="w-4 h-4 mx-auto" />
                      )}
                    </button>
                    <Link
                      href={`/dashboard/autoevaluaciones/gestionar/editar/${plantilla.id}`}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-sol-50 border border-sol-200/40 text-sol-700 rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.2)] transition-all text-sm font-outfit font-medium active:scale-95 flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => eliminarPlantilla(plantilla.id, plantilla.titulo)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-impulso-50 border border-impulso-200/40 text-impulso-700 rounded-2xl hover:shadow-[0_4px_16px_rgba(230,57,70,0.2)] transition-all text-sm font-outfit font-medium active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primario-azul mx-auto mb-4" />
        <p className="text-neutro-piedra">Cargando plantillas...</p>
      </div>
    </div>
  );
}

export default function GestionarPlantillasPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GestionarPlantillasContent />
    </Suspense>
  );
}
