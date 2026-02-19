'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Documento {
  id: string;
  titulo: string;
  autor: string;
  tipo: string;
  tags: string[];
  metadata: any;
  subido_at: string;
}

// Paleta de colores para tags (por índice de la primera letra)
const TAG_COLORS = [
  'bg-sol-100 text-sol-800 border-sol-200',
  'bg-crecimiento-100 text-crecimiento-800 border-crecimiento-200',
  'bg-impulso-100 text-impulso-800 border-impulso-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
];

function tagColor(tag: string) {
  const idx = tag.charCodeAt(0) % TAG_COLORS.length;
  return TAG_COLORS[idx];
}

export default function BibliotecaPage() {
  const { user, perfil } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [tagActivo, setTagActivo] = useState<string | null>(null);

  // Editor de tags inline
  const [editandoTags, setEditandoTags] = useState<string | null>(null); // docId
  const [tagInput, setTagInput] = useState('');
  const [guardandoTags, setGuardandoTags] = useState(false);
  const [autoTaggingId, setAutoTaggingId] = useState<string | null>(null);

  const puedeEditar = perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director' || perfil?.rol === 'equipo_profesional';

  useEffect(() => { fetchDocumentos(); }, []);

  const fetchDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('id, titulo, autor, tipo, tags, metadata, subido_at')
        .order('subido_at', { ascending: false });
      if (error) throw error;
      setDocumentos((data || []).map((d: any) => ({ ...d, tags: d.tags || [] })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Todos los tags únicos del corpus
  const todosLosTagsUnicos = [...new Set(
    documentos.flatMap((d) => d.tags || [])
  )].sort();

  // Documentos filtrados
  const documentosFiltrados = documentos.filter((doc) => {
    const matchBusqueda = !busqueda || 
      doc.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      doc.autor.toLowerCase().includes(busqueda.toLowerCase()) ||
      (doc.tags || []).some((t) => t.toLowerCase().includes(busqueda.toLowerCase()));
    const matchTag = !tagActivo || (doc.tags || []).includes(tagActivo);
    return matchBusqueda && matchTag;
  });

  const handleEliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Seguro que querés eliminar "${titulo}"?\n\nEsta acción no se puede deshacer.`)) return;
    setEliminando(id);
    try {
      const response = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar documento');
      setDocumentos(documentos.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el documento');
    } finally {
      setEliminando(null);
    }
  };

  const iniciarEditarTags = (doc: Documento) => {
    setEditandoTags(doc.id);
    setTagInput((doc.tags || []).join(', '));
  };

  const guardarTags = async (docId: string) => {
    setGuardandoTags(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 1);

      const res = await fetch(`/api/documentos/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error('Error al guardar tags');
      const { tags: savedTags } = await res.json();
      setDocumentos((prev) =>
        prev.map((d) => d.id === docId ? { ...d, tags: savedTags } : d)
      );
      setEditandoTags(null);
    } catch (e) {
      alert('Error al guardar los tags');
    } finally {
      setGuardandoTags(false);
    }
  };

  const autoTagear = async (docId: string) => {
    setAutoTaggingId(docId);
    try {
      const res = await fetch('/api/documentos/autotag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentoId: docId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al auto-tagear');
      }
      const { tags } = await res.json();
      setDocumentos((prev) =>
        prev.map((d) => d.id === docId ? { ...d, tags } : d)
      );
      // Si estaba editando, actualizar el input también
      if (editandoTags === docId) setTagInput(tags.join(', '));
    } catch (e: any) {
      alert('Error al generar tags: ' + e.message);
    } finally {
      setAutoTaggingId(null);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = { 'guia': '📘 Guía', 'paper': '📄 Paper', 'manual': '📚 Manual' };
    return labels[tipo] || tipo;
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
      {/* Navbar */}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="bg-sol-50/40 backdrop-blur-sm border border-sol-200/30 rounded-2xl px-4 py-2">
            <p className="text-neutro-carbon font-outfit font-semibold">
              {documentosFiltrados.length}
              {(busqueda || tagActivo) && documentosFiltrados.length !== documentos.length
                ? ` / ${documentos.length}` : ''} documento{documentos.length !== 1 ? 's' : ''}
              {tagActivo ? <span className="ml-2 text-sm text-crecimiento-700">• tag: <b>{tagActivo}</b></span> : null}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/dashboard/biblioteca/drive"
              className="px-6 py-4 bg-gradient-to-r from-crecimiento-500 to-crecimiento-600 text-white rounded-2xl hover:shadow-glow-crecimiento-lg transition-all font-outfit font-semibold text-center min-h-[56px] flex items-center justify-center active:scale-95 shadow-glow-crecimiento">
              <span className="mr-2">📁</span> Google Drive
            </Link>
            <Link href="/dashboard/biblioteca/chat"
              className="px-6 py-4 bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all font-outfit font-semibold text-center min-h-[56px] flex items-center justify-center active:scale-95 shadow-[0_4px_16px_rgba(242,201,76,0.15)]">
              <span className="mr-2">💬</span> Chat con IA
            </Link>
            {(perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
              <Link href="/dashboard/biblioteca/subir"
                className="px-6 py-4 bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold text-center min-h-[56px] flex items-center justify-center active:scale-95 shadow-[0_4px_16px_rgba(164,198,57,0.15)]">
                <span className="text-xl mr-2">➕</span> Subir
              </Link>
            )}
          </div>
        </div>

        {/* Barra de búsqueda + filtro por tag */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 p-4 mb-6 space-y-3 shadow-[0_4px_16px_rgba(242,201,76,0.08)]">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔍 Buscar por título, autor o tag..."
            className="w-full px-4 py-3 rounded-xl border border-neutro-piedra/20 bg-white/80 font-outfit text-neutro-carbon focus:outline-none focus:ring-2 focus:ring-sol-300 text-sm"
          />
          {todosLosTagsUnicos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-neutro-piedra font-outfit self-center">Filtrar por tag:</span>
              <button
                onClick={() => setTagActivo(null)}
                className={`px-3 py-1 rounded-full text-xs font-semibold font-outfit border transition-all ${!tagActivo ? 'bg-neutro-carbon text-white border-neutro-carbon' : 'bg-white text-neutro-carbon border-neutro-piedra/30 hover:border-neutro-carbon'}`}
              >
                Todos
              </button>
              {todosLosTagsUnicos.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagActivo(tagActivo === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold font-outfit border transition-all ${tagActivo === tag ? 'ring-2 ring-offset-1 ring-neutro-carbon ' + tagColor(tag) : tagColor(tag) + ' hover:opacity-80'}`}
                >
                  🏷️ {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de documentos */}
        {documentosFiltrados.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sol-400/20 to-crecimiento-400/20 flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
              <p className="text-neutro-carbon font-outfit text-lg mb-2">
                {busqueda || tagActivo ? 'Sin resultados para ese filtro.' : 'No hay documentos en la biblioteca todavía.'}
              </p>
              {(busqueda || tagActivo) && (
                <button onClick={() => { setBusqueda(''); setTagActivo(null); }}
                  className="text-sm text-crecimiento-600 underline font-outfit mt-1">
                  Limpiar filtros
                </button>
              )}
              {!busqueda && !tagActivo && (perfil?.rol === 'psicopedagogia' || perfil?.rol === 'director') && (
                <Link href="/dashboard/biblioteca/subir"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] transition-all font-outfit font-semibold shadow-[0_4px_16px_rgba(164,198,57,0.15)] active:scale-95 mt-4">
                  <span className="text-xl">➕</span> Subir Primer Documento
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentosFiltrados.map((doc) => (
              <div key={doc.id} className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 transition-all duration-300 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] hover:-translate-y-1 flex flex-col">
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
                <p className="text-sm text-neutro-piedra mb-3 font-outfit">
                  Por: <span className="font-semibold">{doc.autor}</span>
                </p>
                {doc.metadata?.descripcion && (
                  <p className="text-sm text-neutro-piedra mb-3 line-clamp-2 font-outfit">
                    {doc.metadata.descripcion}
                  </p>
                )}

                {/* Tags section */}
                <div className="mb-4 flex-1">
                  {editandoTags === doc.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="lectura, fonemas, escritura..."
                        className="w-full px-3 py-2 text-sm border border-neutro-piedra/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-sol-300 font-outfit"
                        onKeyDown={(e) => { if (e.key === 'Enter') guardarTags(doc.id); if (e.key === 'Escape') setEditandoTags(null); }}
                        autoFocus
                      />
                      {/* Preview de tags mientras se escribe */}
                      {tagInput && (
                        <div className="flex flex-wrap gap-1">
                          {tagInput.split(',').map((t) => t.trim()).filter((t) => t.length > 1).map((t, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tagColor(t)}`}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => guardarTags(doc.id)}
                          disabled={guardandoTags}
                          className="flex-1 py-1.5 bg-crecimiento-500 text-white rounded-xl text-xs font-semibold font-outfit hover:bg-crecimiento-600 disabled:opacity-50"
                        >
                          {guardandoTags ? '...' : '✓ Guardar'}
                        </button>
                        <button
                          onClick={() => autoTagear(doc.id)}
                          disabled={autoTaggingId === doc.id}
                          className="flex-1 py-1.5 bg-sol-100 text-sol-800 rounded-xl text-xs font-semibold font-outfit hover:bg-sol-200 disabled:opacity-50 border border-sol-200"
                          title="Generar tags automáticamente con IA"
                        >
                          {autoTaggingId === doc.id ? '✨ ...' : '✨ Auto-IA'}
                        </button>
                        <button
                          onClick={() => setEditandoTags(null)}
                          className="px-3 py-1.5 bg-white border border-neutro-piedra/30 text-neutro-piedra rounded-xl text-xs font-outfit hover:bg-gray-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {(doc.tags || []).length > 0 ? (
                        <>
                          {doc.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setTagActivo(tagActivo === tag ? null : tag)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all hover:opacity-80 ${tagColor(tag)} ${tagActivo === tag ? 'ring-2 ring-offset-1 ring-neutro-carbon' : ''}`}
                              title={`Filtrar por: ${tag}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </>
                      ) : (
                        <span className="text-xs text-neutro-piedra/60 font-outfit italic">sin tags</span>
                      )}
                      {puedeEditar && (
                        <button
                          onClick={() => iniciarEditarTags(doc)}
                          className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-neutro-piedra/30 text-neutro-piedra hover:border-sol-400 hover:text-sol-700 transition-all font-outfit"
                          title="Editar tags"
                        >
                          {(doc.tags || []).length === 0 ? '+ tags' : '✏️'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-neutro-piedra mb-4 font-outfit">
                  <span>{new Date(doc.subido_at).toLocaleDateString('es-AR')}</span>
                  {doc.metadata?.palabras_aproximadas && (
                    <span>~{Math.round(doc.metadata.palabras_aproximadas / 1000)}k palabras</span>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link href={`/dashboard/biblioteca/${doc.id}`}
                    className="flex-1 text-center bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon py-3 px-4 rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] transition-all text-sm font-medium font-outfit min-h-[48px] flex items-center justify-center">
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
