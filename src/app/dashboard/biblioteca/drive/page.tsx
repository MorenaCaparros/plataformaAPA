'use client';

import { useEffect, useState, useRef } from 'react';
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

const ROLES_PUEDEN_SUBIR = ['director', 'psicopedagogia', 'equipo_profesional'];

export default function BibliotecaDrivePage() {
  const { perfil } = useAuth();
  const [archivos, setArchivos] = useState<DriveFile[]>([]);
  const [carpetas, setCarpetas] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);
  const [currentFolderName, setCurrentFolderName] = useState<string>('Biblioteca');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchArchivos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // El servidor ya filtra carpetas por rol
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
    setFolderHistory(prev => [...prev, {
      id: currentFolderId || 'root',
      name: currentFolderName,
    }]);
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
  };

  const navigateBack = () => {
    if (folderHistory.length > 0) {
      const prev = folderHistory[folderHistory.length - 1];
      setFolderHistory(h => h.slice(0, -1));
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
    if (!bytes) return '';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Proxy autenticado — resuelve archivos inaccesibles
  const getProxyUrl = (fileId: string) => `/api/drive/proxy/${fileId}`;
  const getDownloadUrl = (fileId: string) => `/api/drive/proxy/${fileId}?download=1`;

  // Búsqueda en tiempo real (solo nombre de archivo)
  const archivosFiltrados = busqueda.trim()
    ? archivos.filter(f => f.name.toLowerCase().includes(busqueda.toLowerCase()))
    : archivos;

  const carpetasFiltradas = busqueda.trim()
    ? carpetas.filter(c => c.name.toLowerCase().includes(busqueda.toLowerCase()))
    : carpetas;

  // ─── Upload a Drive ───────────────────────────────────────────────────────
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadingDrive(true);
    setUploadProgress('📤 Subiendo archivo a Drive...');

    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('fileName', uploadFile.name);
      if (currentFolderId) fd.append('folderId', currentFolderId);
      // Metadatos adicionales como descripción y tags en el nombre de archivo o appProperties
      fd.append('description', uploadDescription);
      fd.append('tags', uploadTags);

      const res = await fetch('/api/drive/subir', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al subir');
      }

      setUploadProgress('✅ ¡Archivo subido correctamente!');
      setTimeout(() => {
        setShowUpload(false);
        setUploadFile(null);
        setUploadDescription('');
        setUploadTags('');
        setUploadProgress('');
        setUploadingDrive(false);
        fetchArchivos(); // Refrescar lista
      }, 1200);
    } catch (err: any) {
      setUploadProgress(`❌ Error: ${err.message}`);
      setUploadingDrive(false);
    }
  };

  // ─── Modal de visualización ───────────────────────────────────────────────
  const FileViewerModal = () => {
    if (!selectedFile) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-sol-50 to-crecimiento-50">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{getFileIcon(selectedFile.mimeType)}</span>
              <div className="min-w-0">
                <h3 className="font-bold text-neutro-carbon font-quicksand line-clamp-1">{selectedFile.name}</h3>
                <p className="text-sm text-neutro-piedra font-outfit">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={getDownloadUrl(selectedFile.id)}
                download={selectedFile.name}
                className="px-4 py-2 bg-crecimiento-100 text-crecimiento-700 rounded-xl hover:bg-crecimiento-200 transition-colors font-outfit font-medium text-sm"
              >
                ⬇️ Descargar
              </a>
              {selectedFile.webViewLink && (
                <a
                  href={selectedFile.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-sol-100 text-sol-700 rounded-xl hover:bg-sol-200 transition-colors font-outfit font-medium text-sm hidden sm:block"
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
          {/* Proxy autenticado — funciona con Service Account */}
          <div className="flex-1 bg-neutro-lienzo overflow-hidden">
            <iframe
              src={getProxyUrl(selectedFile.id)}
              className="w-full h-full border-0"
              title={selectedFile.name}
            />
          </div>
        </div>
      </div>
    );
  };

  // ─── Modal de upload ──────────────────────────────────────────────────────
  const UploadModal = () => {
    if (!showUpload) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="font-bold text-neutro-carbon font-quicksand text-lg">📤 Subir archivo a Drive</h3>
            <button onClick={() => { setShowUpload(false); setUploadFile(null); setUploadProgress(''); }}
              className="p-2 hover:bg-neutro-lienzo rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
            {/* Archivo */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon mb-1.5 font-outfit">
                Archivo *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutro-piedra/30 rounded-2xl p-6 text-center cursor-pointer hover:border-sol-400 hover:bg-sol-50/30 transition-all"
              >
                {uploadFile ? (
                  <div>
                    <p className="font-medium text-neutro-carbon font-outfit">{uploadFile.name}</p>
                    <p className="text-sm text-neutro-piedra mt-1">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl mb-2">📂</p>
                    <p className="text-sm text-neutro-piedra font-outfit">Hacé click para seleccionar un archivo</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" className="hidden"
                onChange={e => setUploadFile(e.target.files?.[0] || null)} />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon mb-1.5 font-outfit">
                Descripción <span className="text-neutro-piedra font-normal">(opcional)</span>
              </label>
              <textarea
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                rows={2}
                placeholder="Breve descripción del contenido del archivo..."
                className="w-full px-4 py-3 border border-neutro-piedra/20 rounded-2xl font-outfit text-sm focus:ring-2 focus:ring-sol-300 focus:border-sol-400 outline-none resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-neutro-carbon mb-1.5 font-outfit">
                Palabras clave / Tags <span className="text-neutro-piedra font-normal">(opcional, separadas por coma)</span>
              </label>
              <input
                type="text"
                value={uploadTags}
                onChange={e => setUploadTags(e.target.value)}
                placeholder="ej: lectoescritura, intervención, lenguaje"
                className="w-full px-4 py-3 border border-neutro-piedra/20 rounded-2xl font-outfit text-sm focus:ring-2 focus:ring-sol-300 focus:border-sol-400 outline-none"
              />
              {uploadTags && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {uploadTags.split(',').filter(t => t.trim()).map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-sol-100 text-sol-700 rounded-xl text-xs font-outfit">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {currentFolderId && (
              <p className="text-xs text-neutro-piedra font-outfit bg-neutro-lienzo rounded-xl px-3 py-2">
                📁 Se subirá a la carpeta: <strong>{currentFolderName}</strong>
              </p>
            )}

            {uploadProgress && (
              <p className={`text-sm font-outfit px-3 py-2 rounded-xl ${
                uploadProgress.startsWith('❌') ? 'bg-impulso-50 text-impulso-700' :
                uploadProgress.startsWith('✅') ? 'bg-crecimiento-50 text-crecimiento-700' :
                'bg-sol-50 text-sol-700'
              }`}>
                {uploadProgress}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowUpload(false); setUploadFile(null); setUploadProgress(''); }}
                disabled={uploadingDrive}
                className="flex-1 px-4 py-3 border border-neutro-piedra/20 text-neutro-carbon rounded-2xl font-outfit font-medium text-sm hover:bg-neutro-lienzo transition-colors disabled:opacity-50 min-h-[48px]">
                Cancelar
              </button>
              <button type="submit" disabled={uploadingDrive || !uploadFile}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl font-outfit font-semibold text-sm hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]">
                {uploadingDrive ? '⏳ Subiendo...' : '📤 Subir archivo'}
              </button>
            </div>
          </form>
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
      <FileViewerModal />
      <UploadModal />

      {/* Navbar flotante */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center gap-4">
              <Link href="/dashboard/biblioteca" className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px] flex-shrink-0">
                <span className="text-lg">←</span>
                <span className="hidden sm:inline">Biblioteca</span>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-neutro-carbon font-quicksand flex items-center gap-2">
                <span>📁</span> Google Drive
              </h1>
              {perfil && ROLES_PUEDEN_SUBIR.includes(perfil.rol) ? (
                <button
                  onClick={() => setShowUpload(true)}
                  className="px-4 py-2 bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl font-outfit font-semibold text-sm hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all min-h-[44px] flex-shrink-0"
                >
                  <span className="hidden sm:inline">📤 Subir archivo</span>
                  <span className="sm:hidden">📤</span>
                </button>
              ) : (
                <div className="w-16 sm:w-28" />
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">

        {/* Estado no configurado */}
        {!configured && (
          <div className="bg-sol-50/60 backdrop-blur-md rounded-3xl border border-sol-200/30 p-8 text-center">
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
                  GOOGLE_SERVICE_ACCOUNT_EMAIL=...<br />
                  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...<br />
                  GOOGLE_DRIVE_FOLDER_ID=...
                </code>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && configured && (
          <div className="bg-impulso-50/60 backdrop-blur-md rounded-3xl border border-impulso-200/30 p-6">
            <p className="text-impulso-700 font-outfit">❌ {error}</p>
            <button onClick={fetchArchivos}
              className="mt-3 px-4 py-2 bg-impulso-100 text-impulso-700 rounded-xl hover:bg-impulso-200 transition-colors font-outfit font-medium text-sm">
              Reintentar
            </button>
          </div>
        )}

        {configured && (
          <>
            {/* Buscador + breadcrumb */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-4 space-y-3">
              {/* Búsqueda */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutro-piedra">🔍</span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar archivos y carpetas..."
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-neutro-piedra/20 rounded-xl font-outfit text-sm focus:ring-2 focus:ring-sol-300 focus:border-sol-400 outline-none"
                />
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={navigateToRoot}
                  className={`px-3 py-1.5 rounded-xl font-outfit text-sm transition-all ${
                    !currentFolderId ? 'bg-sol-400 text-white font-medium' : 'hover:bg-sol-100 text-neutro-piedra hover:text-neutro-carbon'
                  }`}>
                  🏠 Biblioteca
                </button>

                {folderHistory.map((item, index) => (
                  <span key={item.id} className="flex items-center gap-2">
                    <span className="text-neutro-piedra">/</span>
                    <button
                      onClick={() => {
                        const newHistory = folderHistory.slice(0, index);
                        setFolderHistory(newHistory);
                        setCurrentFolderId(item.id === 'root' ? null : item.id);
                        setCurrentFolderName(item.name);
                      }}
                      className="px-3 py-1.5 rounded-xl font-outfit text-sm hover:bg-sol-100 text-neutro-piedra hover:text-neutro-carbon transition-all">
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
                <button onClick={navigateBack}
                  className="flex items-center gap-2 text-sm text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit">
                  ← Volver
                </button>
              )}
            </div>

            {/* Carpetas */}
            {carpetasFiltradas.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-neutro-carbon mb-4 font-quicksand">📁 Carpetas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {carpetasFiltradas.map((folder) => (
                    <button key={folder.id} onClick={() => navigateToFolder(folder)}
                      className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 p-4 hover:shadow-[0_8px_24px_rgba(242,201,76,0.15)] transition-all text-left group min-h-[80px]">
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
            {archivosFiltrados.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-neutro-carbon font-quicksand">
                    📄 Archivos
                    {busqueda && <span className="text-sm font-normal text-neutro-piedra ml-2">({archivosFiltrados.length} resultado{archivosFiltrados.length !== 1 ? 's' : ''})</span>}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivosFiltrados.map((file) => (
                    <div key={file.id}
                      className="group bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 p-6 transition-all duration-300 shadow-[0_4px_16px_rgba(242,201,76,0.1)] hover:shadow-[0_8px_32px_rgba(242,201,76,0.15)] hover:-translate-y-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-4xl flex-shrink-0">{getFileIcon(file.mimeType)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-neutro-carbon line-clamp-2 font-quicksand mb-1">{file.name}</h3>
                          {file.size && (
                            <p className="text-sm text-neutro-piedra font-outfit">{formatFileSize(file.size)}</p>
                          )}
                        </div>
                      </div>

                      {file.modifiedTime && (
                        <p className="text-xs text-neutro-piedra mb-4 font-outfit">
                          Modificado: {new Date(file.modifiedTime).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedFile(file)}
                          className="flex-1 text-center bg-gradient-to-r from-sol-400 to-sol-500 text-white py-3 px-4 rounded-2xl hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all text-sm font-medium font-outfit min-h-[48px] flex items-center justify-center gap-2">
                          👁️ <span>Ver</span>
                        </button>
                        <a
                          href={getDownloadUrl(file.id)}
                          download={file.name}
                          className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-md transition-all text-sm font-medium min-h-[48px] flex items-center justify-center"
                          title="Descargar">
                          ⬇️
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sin contenido */}
            {!error && archivosFiltrados.length === 0 && carpetasFiltradas.length === 0 && (
              <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sol-400/20 to-crecimiento-400/20 flex items-center justify-center">
                    <span className="text-4xl">📂</span>
                  </div>
                  {busqueda ? (
                    <>
                      <p className="text-neutro-carbon font-outfit text-lg mb-2">Sin resultados para "{busqueda}"</p>
                      <button onClick={() => setBusqueda('')} className="text-sm text-sol-600 hover:underline font-outfit">
                        Limpiar búsqueda
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-neutro-carbon font-outfit text-lg mb-2">Esta carpeta está vacía</p>
                      {perfil && ROLES_PUEDEN_SUBIR.includes(perfil.rol) && (
                        <button onClick={() => setShowUpload(true)}
                          className="mt-4 px-6 py-3 bg-gradient-to-r from-sol-400 to-sol-500 text-white rounded-2xl font-outfit font-semibold text-sm hover:shadow-[0_8px_24px_rgba(242,201,76,0.25)] transition-all">
                          📤 Subir primer archivo
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
