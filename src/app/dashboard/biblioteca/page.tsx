'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Documento {
  id: string;
  titulo: string;
  autor: string;
  tipo: string;
  metadata: any;
  subido_at: string;
}

export default function BibliotecaPage() {
  const { user, perfil } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentos();
  }, []);

  const handleEliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Seguro que querés eliminar "${titulo}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setEliminando(id);
    try {
      const response = await fetch(`/api/documentos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar documento');
      }

      // Actualizar lista
      setDocumentos(documentos.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el documento');
    } finally {
      setEliminando(null);
    }
  };

  const fetchDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('subido_at', { ascending: false });

      if (error) throw error;
      setDocumentos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'guia': '📘 Guía',
      'paper': '📄 Paper',
      'manual': '📚 Manual'
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'guia': 'bg-blue-100 text-blue-800',
      'paper': 'bg-purple-100 text-purple-800',
      'manual': 'bg-green-100 text-green-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-sol-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Cargando biblioteca...</p>
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
              <Link href="/dashboard" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <span className="text-lg">←</span>
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-neutro-carbon font-quicksand">
                Biblioteca Psicopedagógica
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="bg-sol-50/40 backdrop-blur-sm border border-sol-200/30 rounded-2xl px-4 py-2">
            <p className="text-neutro-carbon font-outfit font-semibold">
              {documentos.length} documento{documentos.length !== 1 ? 's' : ''} en la biblioteca
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard/biblioteca/chat"
              className="px-6 py-4 bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all font-outfit font-semibold text-center min-h-[56px] flex items-center justify-center active:scale-95 shadow-[0_4px_16px_rgba(242,201,76,0.15)]"
            >
              <span className="mr-2">💬</span> Chat con IA
            </Link>
            {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
              <Link
                href="/dashboard/biblioteca/subir"
                className="px-6 py-4 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold text-center min-h-[56px] flex items-center justify-center active:scale-95 shadow-[0_4px_16px_rgba(164,198,57,0.15)]"
              >
                <span className="text-xl mr-2">➕</span> Subir Documento
              </Link>
            )}
          </div>
        </div>

        {/* Lista de documentos */}
        {documentos.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sol-400/20 to-crecimiento-400/20 flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
              <p className="text-neutro-carbon font-outfit text-lg mb-6">No hay documentos en la biblioteca todavía.</p>
              {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
                <Link
                  href="/dashboard/biblioteca/subir"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold shadow-[0_4px_16px_rgba(164,198,57,0.15)] active:scale-95"
                >
                  <span className="text-xl">➕</span> Subir Primer Documento
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentos.map((doc) => (
              <div key={doc.id} className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 transition-all duration-300 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1.5 rounded-2xl text-sm font-semibold font-outfit border ${
                    doc.tipo === 'guia' ? 'bg-sol-50 text-sol-700 border-sol-200/30' :
                    doc.tipo === 'paper' ? 'bg-impulso-50 text-impulso-700 border-impulso-200/30' :
                    doc.tipo === 'manual' ? 'bg-crecimiento-50 text-crecimiento-700 border-crecimiento-200/30' :
                    'bg-neutro-lienzo text-neutro-carbon border-neutro-piedra/30'
                  }`}>
                    {getTipoLabel(doc.tipo)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutro-carbon mb-3 line-clamp-2 font-quicksand">
                  {doc.titulo}
                </h3>

                <p className="text-sm text-neutro-piedra mb-4 font-outfit">
                  Por: <span className="font-semibold">{doc.autor}</span>
                </p>

                {doc.metadata?.descripcion && (
                  <p className="text-sm text-neutro-piedra mb-4 line-clamp-3 font-outfit">
                    {doc.metadata.descripcion}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-neutro-piedra mb-5 font-outfit">
                  <span>
                    {new Date(doc.subido_at).toLocaleDateString('es-AR')}
                  </span>
                  {doc.metadata?.palabras_aproximadas && (
                    <span>
                      ~{Math.round(doc.metadata.palabras_aproximadas / 1000)}k palabras
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/biblioteca/${doc.id}`}
                    className="flex-1 text-center bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon py-3 px-4 rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all text-sm font-medium font-outfit min-h-[48px] flex items-center justify-center"
                  >
                    Ver documento
                  </Link>
                  {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
                    <button
                      onClick={() => handleEliminar(doc.id, doc.titulo)}
                      disabled={eliminando === doc.id}
                      className="px-4 py-3 bg-impulso-50 border border-impulso-200/30 text-impulso-700 rounded-2xl hover:bg-impulso-100 transition-all text-sm font-medium disabled:opacity-50 active:scale-95 min-h-[48px]"
                      title="Eliminar documento"
                    >
                      {eliminando === doc.id ? '...' : '🗑️'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
