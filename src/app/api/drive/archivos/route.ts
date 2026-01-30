// API para listar archivos de Google Drive

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listDriveFiles, listDriveFolders } from '@/lib/google/drive';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener folderId de query params (opcional)
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || undefined;

    // Verificar que las credenciales estén configuradas
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return NextResponse.json({ 
        error: 'Google Drive no configurado',
        configured: false,
        archivos: [],
        carpetas: []
      }, { status: 200 }); // 200 para que la UI maneje el estado
    }

    // Listar archivos y carpetas
    const [archivos, carpetas] = await Promise.all([
      listDriveFiles(folderId),
      listDriveFolders(folderId)
    ]);

    return NextResponse.json({
      success: true,
      configured: true,
      archivos,
      carpetas,
      folderId: folderId || process.env.GOOGLE_DRIVE_FOLDER_ID
    });

  } catch (error: any) {
    console.error('Error en API Drive:', error);
    return NextResponse.json({ 
      error: error.message,
      configured: true, // Las credenciales están pero hay error
      archivos: [],
      carpetas: []
    }, { status: 500 });
  }
}
