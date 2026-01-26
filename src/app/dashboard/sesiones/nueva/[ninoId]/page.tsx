'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ITEMS_OBSERVACION, CATEGORIAS_LABELS, ESCALA_LIKERT, type Categoria } from '@/lib/constants/items-observacion';
import { ArrowLeft, Save, FileText, Check, AlertTriangle } from 'lucide-react';

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
}

export default function NuevaSesionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const ninoId = params.ninoId as string;
  
  const [nino, setNino] = useState<Nino | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategoria, setExpandedCategoria] = useState<Categoria | null>('atencion_concentracion');
  const [hasDraft, setHasDraft] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    duracion_minutos: 45,
    items: {},
    observaciones_libres: ''
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
            observaciones_libres: draft.observaciones_libres
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

  // Calcular progreso
  const totalItems = ITEMS_OBSERVACION.length;
  const completedItems = Object.keys(formData.items).length;
  const progreso = Math.round((completedItems / totalItems) * 100);

  // Agrupar items por categoría
  const itemsPorCategoria = ITEMS_OBSERVACION.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<Categoria, typeof ITEMS_OBSERVACION>);

  // Items completados por categoría
  const getCompletadosCategoria = (categoria: Categoria) => {
    const itemsCategoria = itemsPorCategoria[categoria];
    return itemsCategoria.filter(item => formData.items[item.id] !== undefined).length;
  };

  const handleItemChange = (itemId: string, valor: number) => {
    setFormData(prev => ({
      ...prev,
      items: { ...prev.items, [itemId]: valor }
    }));
  };

  const toggleCategoria = (categoria: Categoria) => {
    setExpandedCategoria(expandedCategoria === categoria ? null : categoria);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsFaltantes = ITEMS_OBSERVACION.filter(item => !formData.items[item.id]);
    if (itemsFaltantes.length > 0) {
      alert('Faltan ' + itemsFaltantes.length + ' items por completar');
      return;
    }

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
          fecha: new Date().toISOString(),
          duracion_minutos: formData.duracion_minutos,
          items: itemsArray,
          observaciones_libres: formData.observaciones_libres,
          created_offline: false,
          sincronizado_at: new Date().toISOString()
        });

      if (error) throw error;

      // Limpiar borrador después de guardar exitosamente
      localStorage.removeItem(`draft_sesion_${ninoId}`);
      
      alert('✅ Sesión registrada correctamente');
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
        observaciones_libres: ''
      });
      setHasDraft(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!nino) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header fijo */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => router.back()} className="text-blue-600 min-h-[44px] flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <h1 className="font-bold text-base sm:text-lg">Nueva Sesión</h1>
            <div className="w-16"></div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
            <div>
              <span className="font-bold">{nino.alias}</span> • {nino.rango_etario} • {nino.nivel_alfabetizacion}
            </div>
            {hasDraft && (
              <button
                onClick={clearDraft}
                className="text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1.5"
                title="Borrar borrador"
              >
                <Save className="w-4 h-4" />
                Borrador
              </button>
            )}
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Progreso</span>
              <span>{completedItems}/{totalItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: progreso + '%' }} />
            </div>
          </div>
        </div>
      </div>

      <form className="px-3 sm:px-4 py-4">
        {/* Duración */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Duración</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="5"
                max="180"
                step="5"
                value={formData.duracion_minutos}
                onChange={(e) => setFormData(prev => ({ ...prev, duracion_minutos: parseInt(e.target.value) || 45 }))}
                className="w-16 px-2 py-2 text-base text-center border rounded"
              />
              <span>min</span>
            </div>
          </div>
        </div>

        {/* Acordeón */}
        <div className="space-y-3">
          {(Object.keys(itemsPorCategoria) as Categoria[]).map(categoria => {
            const items = itemsPorCategoria[categoria];
            const completados = getCompletadosCategoria(categoria);
            const total = items.length;
            const isExpanded = expandedCategoria === categoria;
            const isComplete = completados === total;

            return (
              <div key={categoria} className="bg-white rounded-lg shadow overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategoria(categoria)}
                  className="w-full px-4 py-3 min-h-[48px] flex items-center justify-between hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex gap-3 flex-1">
                    <span>{CATEGORIAS_LABELS[categoria].split(' ')[0]}</span>
                    <div className="text-left flex-1">
                      <div className="text-sm font-bold">{CATEGORIAS_LABELS[categoria].replace(/^[^\s]+ /, '')}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`text-xs font-semibold ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                          {completados}/{total}
                        </div>
                        {isComplete && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                            COMPLETO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete && <Check className="w-5 h-5 text-green-600 font-bold" />}
                    <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-4 space-y-3 sm:space-y-4 border-t">
                    {items.map((item, i) => {
                      const isItemComplete = formData.items[item.id] !== undefined;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`${i > 0 ? 'pt-4 border-t' : 'pt-4'} ${isItemComplete ? 'bg-green-50 -mx-4 px-4 py-3 rounded-lg' : ''}`}
                        >
                          <div className="mb-3">
                            <div className="flex gap-2 mb-1">
                              {isItemComplete ? (
                                <Check className="w-5 h-5 text-green-600 font-bold flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              <label className={`text-sm font-medium flex-1 ${isItemComplete ? 'text-green-900' : ''}`}>
                                {item.texto}
                              </label>
                            </div>
                            {item.descripcion && <p className="text-xs text-gray-500 ml-7">{item.descripcion}</p>}
                          </div>
                        
                        <div className="grid grid-cols-5 gap-2">
                          {ESCALA_LIKERT.map(escala => (
                            <button
                              key={escala.valor}
                              type="button"
                              onClick={() => handleItemChange(item.id, escala.valor)}
                              className={`py-3 min-h-[48px] rounded-lg border-2 font-bold active:scale-95 text-sm sm:text-base ${
                                formData.items[item.id] === escala.valor
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {escala.valor}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-1 text-[10px] text-center text-gray-500">
                          <div>Muy bajo</div>
                          <div>Bajo</div>
                          <div>Medio</div>
                          <div>Alto</div>
                          <div>Muy alto</div>
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
        <div className="bg-white rounded-lg shadow p-4 mt-4">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Observaciones adicionales
          </label>
          <textarea
            value={formData.observaciones_libres}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones_libres: e.target.value }))}
            rows={4}
            className="w-full px-3 py-3 text-base border rounded-lg"
            placeholder="Situaciones relevantes..."
          />
        </div>
      </form>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          {progreso < 100 && (
            <div className="text-center text-sm text-amber-600 font-medium mb-3 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Faltan {totalItems - completedItems} ítems
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:flex-1 px-6 py-3 min-h-[48px] border-2 rounded-lg font-semibold active:scale-95 flex items-center justify-center"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || progreso < 100}
              className="w-full sm:flex-1 px-6 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg font-semibold active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Guardando...' : (
                <>
                  <Check className="w-5 h-5" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
