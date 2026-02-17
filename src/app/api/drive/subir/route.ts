import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDriveUploadClient } from '@/lib/google/drive-auth';
import { Readable } from 'stream';

// Evitar cacheo estático en el upload
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar Autenticación con Supabase (Seguridad)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener datos del formulario
    const formData = await req.formData();
    const archivo = formData.get('file') as File;
    const carpetaId = formData.get('folderId') as string;
    const nombreArchivo = formData.get('fileName') as string;

    if (!archivo) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    // 3. Crear cliente Drive autenticado (OAuth2 o Service Account)
    const drive = createDriveUploadClient();

    // 4. Convertir el archivo File a un Stream leíble para Google
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // 5. Subir el archivo
    const response = await drive.files.create({
      requestBody: {
        name: nombreArchivo || archivo.name,
        parents: carpetaId ? [carpetaId] : [],
      },
      media: {
        mimeType: archivo.type,
        body: stream,
      },
      fields: 'id, webViewLink, thumbnailLink',
      supportsAllDrives: true,
    });

    // 6. Responder con éxito
    return NextResponse.json({ 
      success: true,
      fileId: response.data.id,
      url: response.data.webViewLink 
    });

  } catch (error: any) {
    console.error('Error subiendo a Drive:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}