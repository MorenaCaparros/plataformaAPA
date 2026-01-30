'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

interface DriveFolder {
  id: string;
  name: string;
}

export default function BibliotecaDrivePage() {
  const { perfil } = useAuth();
  const [archivos, setArchivos] = useState<DriveFile[]>([]);
  const [carpetas, setCarpetas] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  useEffect(() => {
    fetchArchivos();
  }, [currentFolderId]);

  const fetchArchivos = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = currentFolderId 
        ? `/api/drive/archivos?folderId=${currentFolderId}`
        : '/api/drive/archivos';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error && !data.configured) {
        setConfigured(false);
        setArchivos([]);
        setCarpetas([]);
      } else if (data.error) {
        setError(data.error);
      } else {
        setArchivos(data.archivos || []);
        setCarpetas(data.carpetas || []);
        setConfigured(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: DriveFolder) => {
    // Guardar la carpeta actual en el historial con su nombre
    const currentName = folderHistory.length > 0 
      ? folderHistory[folderHistory.length - 1]?.name 
      : 'Biblioteca';
    
    setFolderHistory([...folderHistory, { 
      id: currentFolderId || 'root', 
      name: currentFolderId ? currentName : 'Biblioteca' 
    }]);
    setCurrentFolderId(folder.id);
    // Guardar el nombre de la carpeta actual para el breadcrumb
    setCurrentFolderName(folder.name);
  };

  const [currentFolderName, setCurrentFolderName] = useState<string>('Biblioteca');

  const navigateBack = () => {
    if (folderHistory.length > 0) {
      const prev = folderHistory[folderHistory.length - 1];
      setFolderHistory(folderHistory.slice(0, -1));
      setCurrentFolderId(prev.id === 'root' ? null : prev.id);
      setCurrentFolderName(prev.name);
    }
  };

  const navigateToRoot = () => {
    setFolderHistory([]);
    setCurrentFolderId(null);
    setCurrentFolderName('Biblioteca');
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎬';
    if (mimeType.includes('audio')) return '🎵';
    return '📎';
  };

  const formatFileSize = (bytes?: string): string => {
    if (!bytes) return '-';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getEmbedUrl = (fileId: string, mimeType: string): string => {
    if (mimeType.includes('google-apps.document')) {
      return `https://docs.google.com/document/d/${fileId}/preview`;
    }
    if (mimeType.includes('google-apps.spreadsheet')) {
      return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
    }
    if (mimeType.includes('google-apps.presentation')) {
      return `https://docs.google.com/presentation/d/${fileId}/preview`;
    }
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  // Modal de visualización
  const FileViewerModal = () => {
    if (!selectedFile) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
          {/* Header del modal */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-sol-50 to-crecimiento-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFileIcon(selectedFile.mimeType)}</span>
              <div>
                <h3 className="font-bold text-neutro-carbon font-quicksand line-clamp-1">
                  {selectedFile.name}
                </h3>
                <p className="text-sm text-neutro-piedra font-outfit">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedFile.webViewLink && (
                <a
                  href={selectedFile.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-sol-100 text-sol-700 rounded-xl hover:bg-sol-200 transition-colors font-outfit font-medium text-sm"
                >
                  Abrir en Drive ↗
                </a>
              )}
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 hover:bg-neutro-lienzo rounded-xl transition-colors text-neutro-piedra hover:text-neutro-carbon"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Contenido - iframe para preview */}
          <div className="flex-1 bg-neutro-lienzo">
            <iframe
              src={getEmbedUrl(selectedFile.id, selectedFile.mimeType)}
              className="w-full h-full border-0"
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-8 shadow-[0_8px_32px_rgba(242,201,76,0.15)] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sol-200 border-t-sol-400 mx-auto mb-4"></div>
          <p className="text-neutro-piedra font-outfit">Conectando con Google Drive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Modal de visualización */}
      <FileViewerModal />

      {/* Navbar flotante */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/dashboard/biblioteca" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]">
                <span className="text-lg">←</span>
                <span className="hidden sm:inline">Biblioteca</span>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-neutro-carbon font-quicksand flex items-center gap-2">
                <span>📁</span> Google Drive
              </h1>
              <div className="w-16 sm:w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Estado no configurado */}
        {!configured && (
          <div className="bg-sol-50/60 backdrop-blur-md rounded-3xl border border-sol-200/30 p-8 text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sol-400/20 to-crecimiento-400/20 flex items-center justify-center">
              <span className="text-4xl">⚙️</span>
            </div>
            <h2 className="text-xl font-bold text-neutro-carbon mb-4 font-quicksand">
              Google Drive no configurado
            </h2>
            <p className="text-neutro-piedra font-outfit mb-4 max-w-md mx-auto">
              Para ver archivos de Google Drive, es necesario configurar las credenciales del servicio.
            </p>
            {(perfil?.rol === 'director' || perfil?.rol === 'psicopedagogia') && (
              <div className="bg-white/80 rounded-2xl p-4 text-left max-w-lg mx-auto">
                <p className="text-sm font-medium text-neutro-carbon mb-2">Variables de entorno requeridas:</p>
                <code className="text-xs text-neutro-piedra block bg-neutro-lienzo p-3 rounded-xl">
                  GOOGLE_SERVICE_ACCOUNT_EMAIL=...<br/>
                  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...<br/>
                  GOOGLE_DRIVE_FOLDER_ID=...
                </code>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && configured && (
          <div className="bg-impulso-50/60 backdrop-blur-md rounded-3xl border border-impulso-200/30 p-6 mb-6">
            <p className="text-impulso-700 font-outfit">❌ Error: {error}</p>
            <button 
              onClick={fetchArchivos}
              className="mt-3 px-4 py-2 bg-impulso-100 text-impulso-700 rounded-xl hover:bg-impulso-200 transition-colors font-outfit font-medium text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Breadcrumb y navegación */}
        {configured && (
          <div className="mb-6 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={navigateToRoot}
                className={`px-3 py-1.5 rounded-xl font-outfit text-sm transition-all ${
                  !currentFolderId 
                    ? 'bg-sol-400 text-white font-medium' 
                    : 'hover:bg-sol-100 text-neutro-piedra hover:text-neutro-carbon'
                }`}
              >
                🏠 Biblioteca
              </button>
              
              {folderHistory.map((item, index) => (
                <span key={item.id} className="flex items-center gap-2">
                  <span className="text-neutro-piedra">/</span>
                  <button
                    onClick={() => {
                      // Navegar a esta carpeta en el historial
                      const newHistory = folderHistory.slice(0, index);
                      setFolderHistory(newHistory);
                      setCurrentFolderId(item.id === 'root' ? null : item.id);
                      setCurrentFolderName(item.name);
                    }}
                    className="px-3 py-1.5 rounded-xl font-outfit text-sm hover:bg-sol-100 text-neutro-piedra hover:text-neutro-carbon transition-all"
                  >
                    {item.name}
                  </button>
                </span>
              ))}
              
              {currentFolderId && (
                <span className="flex items-center gap-2">
                  <span className="text-neutro-piedra">/</span>
                  <span className="px-3 py-1.5 bg-sol-400 text-white rounded-xl font-outfit text-sm font-medium">
                    📁 {currentFolderName}
                  </span>
                </span>
              )}
            </div>
            
            {folderHistory.length > 0 && (
              <button
                onClick={navigateBack}
                className="mt-3 flex items-center gap-2 text-sm text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit"
              >
                ← Volver a la carpeta anterior
              </button>
            )}
          </div>
        )}

        {/* Carpetas */}
        {configured && carpetas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-neutro-carbon mb-4 font-quicksand">📁 Carpetas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {carpetas.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 p-4 hover:shadow-[0_8px_24px_rgba(242,201,76,0.15)] transition-all text-left group"
                >
                  <div className="text-3xl mb-2">📁</div>
                  <p className="font-medium text-neutro-carbon line-clamp-2 text-sm font-outfit group-hover:text-sol-600">
                    {folder.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Archivos */}
        {configured && archivos.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-neutro-carbon mb-4 font-quicksand">📄 Archivos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivos.map((file) => (
                <div
                  key={file.id}
                  className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 transition-all duration-300 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl flex-shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutro-carbon line-clamp-2 font-quicksand mb-1">
                        {file.name}
                      </h3>
                      <p className="text-sm text-neutro-piedra font-outfit">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  {file.modifiedTime && (
                    <p className="text-xs text-neutro-piedra mb-4 font-outfit">
                      Modificado: {new Date(file.modifiedTime).toLocaleDateString('es-AR')}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="flex-1 text-center bg-gradient-to-r from-sol-400 to-sol-500 text-white py-3 px-4 rounded-2xl hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all text-sm font-medium font-outfit min-h-[48px] flex items-center justify-center"
                    >
                      👁️ Ver archivo
                    </button>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-md transition-all text-sm font-medium min-h-[48px] flex items-center justify-center"
                        title="Abrir en Drive"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sin archivos */}
        {configured && !error && archivos.length === 0 && carpetas.length === 0 && (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sol-400/20 to-crecimiento-400/20 flex items-center justify-center">
                <span className="text-4xl">📂</span>
              </div>
              <p className="text-neutro-carbon font-outfit text-lg mb-2">
                Esta carpeta está vacía
              </p>
              <p className="text-neutro-piedra font-outfit text-sm">
                Agregá archivos a tu carpeta de Google Drive para verlos aquí.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
