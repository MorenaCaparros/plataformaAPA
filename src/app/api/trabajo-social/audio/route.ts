import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST - Subir audio de entrevista
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar rol
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    if (!perfil || !['trabajo_social', 'admin', 'director'].includes(perfil.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const ninoId = formData.get('nino_id') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo de audio' },
        { status: 400 }
      );
    }

    if (!ninoId) {
      return NextResponse.json(
        { error: 'ID del niño es requerido' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `entrevista_${ninoId}_${timestamp}.webm`;
    const filePath = `entrevistas/${ninoId}/${fileName}`;

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audios-entrevistas')
      .upload(filePath, audioFile, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error al subir audio:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir el archivo de audio' },
        { status: 500 }
      );
    }

    // Obtener URL pública (con firma temporal de 1 año)
    const { data: urlData } = supabase.storage
      .from('audios-entrevistas')
      .createSignedUrl(filePath, 31536000); // 1 año en segundos

    if (!urlData) {
      return NextResponse.json(
        { error: 'Error al generar URL del audio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      audio_url: urlData.signedUrl,
      path: filePath,
      message: 'Audio subido exitosamente',
    });
  } catch (error) {
    console.error('Error en POST /api/trabajo-social/audio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar audio
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Path del archivo es requerido' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase.storage
      .from('audios-entrevistas')
      .remove([filePath]);

    if (deleteError) {
      console.error('Error al eliminar audio:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Audio eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en DELETE /api/trabajo-social/audio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
