// API Route para procesar documentos (server-side)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processDocument, chunkText, cleanText, extractMetadata } from '@/lib/ia/document-processor';
import { saveChunkWithEmbedding } from '@/lib/ia/rag';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File;
    let titulo = formData.get('titulo') as string;
    let autor = formData.get('autor') as string;
    const tipo = formData.get('tipo') as string;
    const descripcion = formData.get('descripcion') as string;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    // Leer archivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Procesar y extraer texto
    const textoCompleto = await processDocument(buffer, file.name);
    const textoLimpio = cleanText(textoCompleto);

    // Si no hay título/autor, usar valores por defecto simples
    if (!titulo) {
      titulo = file.name.replace(/\.[^/.]+$/, ''); // Nombre del archivo sin extensión
      console.log('📄 Usando nombre de archivo como título:', titulo);
    }
    if (!autor) {
      autor = 'Autor no especificado';
      console.log('👤 Usando autor por defecto');
    }

    console.log('✅ Metadata:', { titulo, autor });

    // Crear registro del documento
    const { data: documento, error: docError } = await supabase
      .from('documentos')
      .insert({
        titulo,
        autor,
        tipo,
        contenido: textoLimpio,
        metadata: {
          descripcion: descripcion || null,
          nombre_archivo: file.name,
          tamano_bytes: file.size,
          palabras_aproximadas: textoLimpio.split(/\s+/).length
        },
        subido_por: user.id
      })
      .select()
      .single();

    if (docError) throw docError;

    // Dividir en chunks
    const chunks = chunkText(textoLimpio, 800, 150);

    // Generar embeddings y guardar chunks
    for (let i = 0; i < chunks.length; i++) {
      await saveChunkWithEmbedding(
        supabase, // Pasar el cliente autenticado
        documento.id,
        chunks[i].texto,
        i,
        chunks[i].metadata
      );
    }

    console.log('✅ Documento procesado exitosamente:', {
      id: documento.id,
      titulo: documento.titulo,
      autor: documento.autor,
      chunks: chunks.length
    });

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        titulo: documento.titulo,
        autor: documento.autor,
        chunks_procesados: chunks.length
      }
    });
  } catch (error: any) {
    console.error('=== ERROR en procesar endpoint ===');
    console.error('Tipo de error:', error?.constructor?.name);
    console.error('Mensaje:', error?.message);
    console.error('Stack:', error?.stack);
    
    // Siempre devolver JSON
    return new NextResponse(
      JSON.stringify({ 
        error: error?.message || 'Error al procesar documento',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
