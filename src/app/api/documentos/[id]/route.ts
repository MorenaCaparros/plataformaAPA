// API Route para eliminar documentos

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que sea psicopedagogia o admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!perfil || !['psicopedagogia', 'director'].includes(perfil.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Await params en Next.js 14+
    const { id: documentoId } = await params;

    // Primero eliminar los chunks (por la FK)
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('documento_id', documentoId);

    if (chunksError) {
      console.error('Error eliminando chunks:', chunksError);
      throw new Error('Error al eliminar chunks del documento');
    }

    // Luego eliminar el documento
    const { error: docError } = await supabase
      .from('documentos')
      .delete()
      .eq('id', documentoId);

    if (docError) {
      console.error('Error eliminando documento:', docError);
      throw new Error('Error al eliminar documento');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en DELETE documento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar documento' },
      { status: 500 }
    );
  }
}
