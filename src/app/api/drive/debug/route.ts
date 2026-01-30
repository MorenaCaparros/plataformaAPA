// API de debug para Google Drive - ELIMINAR DESPUÉS DE RESOLVER

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const debug: Record<string, any> = {};
  
  try {
    // 1. Verificar variables de entorno
    debug.env = {
      hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      privateKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.length,
      privateKeyStart: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.substring(0, 50),
      privateKeyEnd: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.slice(-50),
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    };

    // 2. Limpiar y preparar credenciales
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
    
    // Primero remover coma al final si existe
    privateKey = privateKey.trim();
    if (privateKey.endsWith(',')) {
      privateKey = privateKey.slice(0, -1);
      debug.cleanedTrailingComma = true;
    }
    
    // Remover comillas al inicio y final si existen
    if (privateKey.startsWith('"')) {
      privateKey = privateKey.slice(1);
      debug.cleanedStartQuote = true;
    }
    if (privateKey.endsWith('"')) {
      privateKey = privateKey.slice(0, -1);
      debug.cleanedEndQuote = true;
    }
    
    // Reemplazar \n literal por saltos de línea reales
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    };
    
    debug.credentials = {
      email: credentials.client_email,
      keyParsedLength: credentials.private_key?.length,
      keyStartsWith: credentials.private_key?.substring(0, 30),
      keyEndsWith: credentials.private_key?.slice(-30),
    };

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    debug.driveClientCreated = true;

    // 3. Intentar listar TODO en la carpeta raíz (sin filtros)
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Query sin filtros de mimeType
    const responseAll = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 100,
    });
    
    debug.allItems = responseAll.data.files?.map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder'
    }));
    debug.allItemsCount = responseAll.data.files?.length || 0;

    // 4. Query específica para carpetas
    const responseFolders = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });
    
    debug.foldersOnly = responseFolders.data.files;
    debug.foldersCount = responseFolders.data.files?.length || 0;

    // 5. Query específica para archivos (no carpetas)
    const responseFiles = await drive.files.list({
      q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });
    
    debug.filesOnly = responseFiles.data.files;
    debug.filesCount = responseFiles.data.files?.length || 0;

    // 6. Obtener info de la carpeta raíz
    try {
      const folderInfo = await drive.files.get({
        fileId: folderId!,
        fields: 'id, name, mimeType, shared, permissions',
      });
      debug.rootFolder = folderInfo.data;
    } catch (folderError: any) {
      if (folderError.code === 404) {
        debug.folderError = {
          message: 'La carpeta no existe o no está compartida con el Service Account',
          folderId: folderId,
          serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          solution: `Abre Google Drive, haz clic derecho en la carpeta, selecciona "Compartir" y agrega este email: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`,
        };
      } else {
        throw folderError;
      }
    }

    return NextResponse.json({
      success: debug.allItemsCount > 0 || !!debug.rootFolder,
      debug
    });

  } catch (error: any) {
    debug.error = {
      message: error.message,
      code: error.code,
      status: error.status,
      errors: error.errors,
    };
    
    return NextResponse.json({
      success: false,
      debug
    }, { status: 500 });
  }
}
