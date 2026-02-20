// Integración con Google Drive para la Biblioteca

import { google } from 'googleapis';

// Tipos de archivos soportados
export const SUPPORTED_MIME_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  googleDoc: 'application/vnd.google-apps.document',
  googleSheet: 'application/vnd.google-apps.spreadsheet',
  googleSlide: 'application/vnd.google-apps.presentation',
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  parents?: string[];
  description?: string;
  appProperties?: {
    descripcion?: string;
    tags?: string;
    rango_etario?: string;
    [key: string]: string | undefined;
  };
}

export interface DriveFolder {
  id: string;
  name: string;
}

/**
 * Crea cliente de Google Drive con Service Account
 * Requiere que la carpeta de Drive esté compartida con el email del service account
 */
export function createDriveClient() {
  // Limpiar la private key de posibles caracteres extra (comillas, comas)
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  
  // Primero remover coma al final si existe (error común de copiar JSON)
  privateKey = privateKey.trim();
  if (privateKey.endsWith(',')) {
    privateKey = privateKey.slice(0, -1);
  }
  
  // Remover comillas al inicio y final si existen
  if (privateKey.startsWith('"')) {
    privateKey = privateKey.slice(1);
  }
  if (privateKey.endsWith('"')) {
    privateKey = privateKey.slice(0, -1);
  }
  
  // Reemplazar \n literal por saltos de línea reales
  privateKey = privateKey.replace(/\\n/g, '\n');
  
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: privateKey,
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Credenciales de Google Service Account no configuradas');
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Lista archivos de una carpeta de Google Drive (excluye carpetas)
 */
export async function listDriveFiles(folderId?: string): Promise<DriveFile[]> {
  const drive = createDriveClient();
  
  // Si no hay folderId, usar el de la variable de entorno
  const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  if (!targetFolderId) {
    throw new Error('No se especificó carpeta de Google Drive');
  }

  try {
    // Excluir carpetas del listado de archivos
    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents, description, appProperties)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
    });

    return (response.data.files || []) as DriveFile[];
  } catch (error: any) {
    console.error('Error listando archivos de Drive:', error.message);
    throw new Error(`Error al acceder a Google Drive: ${error.message}`);
  }
}

/**
 * Obtiene información de un archivo específico
 */
export async function getDriveFile(fileId: string): Promise<DriveFile> {
  const drive = createDriveClient();

  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, description, appProperties',
    });

    return response.data as DriveFile;
  } catch (error: any) {
    console.error('Error obteniendo archivo de Drive:', error.message);
    throw new Error(`Error al obtener archivo: ${error.message}`);
  }
}

/**
 * Obtiene el contenido de un archivo para preview (solo archivos pequeños)
 */
export async function getDriveFileContent(fileId: string): Promise<Buffer> {
  const drive = createDriveClient();

  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
  } catch (error: any) {
    console.error('Error descargando archivo de Drive:', error.message);
    throw new Error(`Error al descargar archivo: ${error.message}`);
  }
}

/**
 * Lista carpetas dentro de una carpeta de Drive
 */
export async function listDriveFolders(parentFolderId?: string): Promise<DriveFolder[]> {
  const drive = createDriveClient();
  
  const targetFolderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  if (!targetFolderId) {
    throw new Error('No se especificó carpeta de Google Drive');
  }

  try {
    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      orderBy: 'name',
    });

    return (response.data.files || []) as DriveFolder[];
  } catch (error: any) {
    console.error('Error listando carpetas de Drive:', error.message);
    throw new Error(`Error al listar carpetas: ${error.message}`);
  }
}

/**
 * Genera URL de embed para visualizar archivos de Google
 */
export function getEmbedUrl(fileId: string, mimeType: string): string {
  // Google Docs, Sheets, Slides tienen URLs de preview específicas
  if (mimeType.includes('google-apps.document')) {
    return `https://docs.google.com/document/d/${fileId}/preview`;
  }
  if (mimeType.includes('google-apps.spreadsheet')) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
  }
  if (mimeType.includes('google-apps.presentation')) {
    return `https://docs.google.com/presentation/d/${fileId}/preview`;
  }
  // PDFs y otros archivos
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Obtiene el ícono apropiado según el tipo de archivo
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('folder')) return '📁';
  return '📎';
}

/**
 * Formatea el tamaño del archivo
 */
export function formatFileSize(bytes?: string): string {
  if (!bytes) return '-';
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
