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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-blue-600 font-medium">
              ← Volver
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Biblioteca Psicopedagógica</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Acciones */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">
              {documentos.length} documento{documentos.length !== 1 ? 's' : ''} en la biblioteca
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard/biblioteca/chat"
              className="px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-center min-h-[48px] flex items-center justify-center active:scale-95"
            >
              💬 Chat con IA
            </Link>
            {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
              <Link
                href="/dashboard/biblioteca/subir"
                className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center min-h-[48px] flex items-center justify-center active:scale-95"
              >
                ➕ Subir Documento
              </Link>
            )}
          </div>
        </div>

        {/* Lista de documentos */}
        {documentos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">No hay documentos en la biblioteca todavía.</p>
            {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
              <Link
                href="/dashboard/biblioteca/subir"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ➕ Subir Primer Documento
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentos.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTipoColor(doc.tipo)}`}>
                    {getTipoLabel(doc.tipo)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {doc.titulo}
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Por: {doc.autor}
                </p>

                {doc.metadata?.descripcion && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                    {doc.metadata.descripcion}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>
                    {new Date(doc.subido_at).toLocaleDateString('es-AR')}
                  </span>
                  {doc.metadata?.palabras_aproximadas && (
                    <span>
                      ~{Math.round(doc.metadata.palabras_aproximadas / 1000)}k palabras
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/biblioteca/${doc.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Ver documento
                  </Link>
                  {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
                    <button
                      onClick={() => handleEliminar(doc.id, doc.titulo)}
                      disabled={eliminando === doc.id}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium disabled:opacity-50 active:scale-95"
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
