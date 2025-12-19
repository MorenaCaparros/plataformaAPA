'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CATEGORIAS_LABELS, type Categoria } from '@/lib/constants/items-observacion';

interface SesionDetalle {
  id: string;
  fecha: string;
  duracion_minutos: number;
  observaciones_libres: string;
  items: Array<{
    id: string;
    categoria: Categoria;
    texto: string;
    valor: number;
  }>;
  ninos: {
    alias: string;
    rango_etario: string;
    nivel_alfabetizacion: string;
  };
}

export default function SesionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const sesionId = params.sesionId as string;
  
  const [sesion, setSesion] = useState<SesionDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSesion();
  }, [sesionId]);

  const fetchSesion = async () => {
    try {
      const { data, error } = await supabase
        .from('sesiones')
        .select(`
          id,
          fecha,
          duracion_minutos,
          observaciones_libres,
          items,
          ninos (
            alias,
            rango_etario,
            nivel_alfabetizacion
          )
        `)
        .eq('id', sesionId)
        .single();

      if (error) throw error;
      setSesion(data);
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo cargar la sesión');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const itemsPorCategoria = sesion?.items.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<Categoria, typeof sesion.items>) || {};

  const calcularPromedio = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + item.valor, 0);
    return (sum / items.length).toFixed(1);
  };

  const getColorByValue = (valor: number) => {
    if (valor <= 2) return 'text-red-600 bg-red-50';
    if (valor === 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sesion) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-blue-600 font-medium"
          >
            ← Volver al historial
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Info de la sesión */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{sesion.ninos.alias}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <span>📅 {formatFecha(sesion.fecha)}</span>
            <span>⏱️ {sesion.duracion_minutos} minutos</span>
            <span>📊 {sesion.ninos.rango_etario} años</span>
            <span>📖 {sesion.ninos.nivel_alfabetizacion}</span>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-700 mb-2">Promedio general de la sesión</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${(parseFloat(calcularPromedio(sesion.items)) / 5) * 100}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {calcularPromedio(sesion.items)}/5
              </span>
            </div>
          </div>
        </div>

        {/* Resultados por categoría */}
        <div className="space-y-4">
          {(Object.keys(itemsPorCategoria) as Categoria[]).map(categoria => {
            const items = itemsPorCategoria[categoria];
            const promedio = calcularPromedio(items);

            return (
              <div key={categoria} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {CATEGORIAS_LABELS[categoria]}
                  </h2>
                  <span className="text-xl font-bold text-gray-900">{promedio}/5</span>
                </div>

                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`px-3 py-1 rounded-lg font-bold ${getColorByValue(item.valor)}`}>
                        {item.valor}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Observaciones */}
        {sesion.observaciones_libres && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">📝 Observaciones adicionales</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{sesion.observaciones_libres}</p>
          </div>
        )}
      </div>
    </div>
  );
}
