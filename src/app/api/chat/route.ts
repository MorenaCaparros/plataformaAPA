// API Route para chat con documentos + datos de niños/sesiones

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getModel } from '@/lib/ia/gemini';
import { generateEmbedding } from '@/lib/ia/rag';
import { PROMPT_CHAT_BIBLIOTECA, PROMPT_ANALISIS_SESION } from '@/lib/ia/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { pregunta, tipo = 'biblioteca', ninoId, sesionIds, tags: tagsFiltro } = await request.json();

    if (!pregunta) {
      return NextResponse.json({ error: 'Pregunta requerida' }, { status: 400 });
    }

    // Verificar rol del usuario
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const rolesConAccesoCompleto = ['psicopedagogia', 'coordinador', 'trabajadora_social', 'director', 'equipo_profesional'];

    // ============================================
    // MODO 1: Chat con biblioteca (RAG)
    // ============================================
    if (tipo === 'biblioteca') {
      // Detectar si pregunta sobre niños/informes
      const preguntaInforme = /\b(niños?|informes?|reportes?|chicos?|casos?)\b/i.test(pregunta);
      
      // Si pregunta sobre niños y tiene acceso completo, informarle del modo correcto
      if (preguntaInforme && rolesConAccesoCompleto.includes(perfil?.rol)) {
        const { data: ninos } = await supabase
          .from('ninos')
          .select('id, alias, rango_etario, nivel_alfabetizacion')
          .order('alias', { ascending: true });

        if (ninos && ninos.length > 0) {
          const listaNinos = ninos.map((n: any, i: number) => 
            `${i + 1}. ${n.alias} (${n.rango_etario}, nivel: ${n.nivel_alfabetizacion})`
          ).join('\n');

          return NextResponse.json({
            respuesta: `📊 Tenemos ${ninos.length} niño${ninos.length !== 1 ? 's' : ''} registrado${ninos.length !== 1 ? 's' : ''} en la plataforma:

${listaNinos}

💡 **Para generar informes individuales:**
1. Ir a **Dashboard → Niños**
2. Seleccionar un niño
3. Click en **"🧠 Análisis con IA"**
4. Ahí podrás generar informes detallados con análisis de sesiones + bibliografía

📚 **Este chat de biblioteca** está diseñado para consultar documentos psicopedagógicos (guías, papers, manuales). Para análisis de niños específicos, usá la sección de análisis individual que combina:
- Sesiones educativas del niño
- Bibliografía relevante
- Recomendaciones personalizadas

¿Te gustaría que te ayude con algo sobre los **documentos de la biblioteca** en lugar de eso?`,
            contexto: {
              totalNinos: ninos.length,
              sugerencia: 'Usar análisis individual por niño'
            }
          });
        }
      }

      // Primero: Obtener lista de documentos (con filtro por tags si viene)
      let docQuery = supabase
        .from('documentos')
        .select('id, titulo, autor, tipo, metadata, tags')
        .order('subido_at', { ascending: false });

      // Si hay filtro de tags activo: solo traer docs que contengan ALGUNO de esos tags
      // Esto reduce el contexto enviado a Gemini y ahorra tokens significativamente
      if (tagsFiltro && Array.isArray(tagsFiltro) && tagsFiltro.length > 0) {
        // El operador && en pgvector/postgres arrays = "contiene alguno de"
        docQuery = docQuery.overlaps('tags', tagsFiltro);
      }

      const { data: todosDocumentos, error: listError } = await docQuery;

      if (listError) {
        console.error('Error al listar documentos:', listError);
      }

      // Lista de documentos disponibles (ya filtrada por tags si aplica)
      const listaDocumentos = todosDocumentos && todosDocumentos.length > 0
        ? todosDocumentos.map((doc: any, i: number) => {
            const tagsStr = doc.tags && doc.tags.length > 0 ? ` [${doc.tags.join(', ')}]` : '';
            return `${i + 1}. "${doc.titulo}" - ${doc.autor} (${doc.tipo})${tagsStr}`;
          }).join('\n')
        : tagsFiltro?.length > 0
          ? `No hay documentos con los tags: ${tagsFiltro.join(', ')}`
          : 'No hay documentos en la biblioteca.';

      // Segundo: Búsqueda semántica — restringida a los docs del filtro si hay tags
      const queryEmbedding = await generateEmbedding(pregunta);

      // Si hay filtro de tags y tenemos IDs concretos, pasarlos al RPC para restringir la búsqueda
      const documentoIds = todosDocumentos?.map((d: any) => d.id) || [];

      let chunks = null;
      let searchError = null;

      if (documentoIds.length > 0) {
        // Búsqueda vectorial limitada a los docs filtrados
        const rpcResult = await supabase.rpc('match_documents', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.65,
          match_count: tagsFiltro?.length > 0 ? 6 : 8  // menos chunks si ya filtramos por tag
        });
        chunks = rpcResult.data;
        searchError = rpcResult.error;

        // Si hay filtro activo, descartar chunks de documentos no incluidos
        if (tagsFiltro?.length > 0 && chunks) {
          chunks = chunks.filter((c: any) =>
            documentoIds.includes(c.documento_id || c.documento?.id)
          );
        }
      }

      if (searchError) {
        console.error('Error en búsqueda vectorial:', searchError);
      }

      // Formatear fragmentos relevantes
      const fragmentosRelevantes = chunks && chunks.length > 0
        ? chunks.map((chunk: any, index: number) => `
--- Fragmento ${index + 1} ---
📄 Documento: ${chunk.documento.titulo}
✍️ Autor: ${chunk.documento.autor}

${chunk.texto}
`).join('\n')
        : '';

      // Construir prompt enriquecido
      const filtroTagsInfo = tagsFiltro?.length > 0
        ? `\n⚠️ NOTA: La búsqueda está FILTRADA por los tags: [${tagsFiltro.join(', ')}]. Solo considerá los documentos listados abajo.\n`
        : '';

      const promptEnriquecido = `${PROMPT_CHAT_BIBLIOTECA}
${filtroTagsInfo}
DOCUMENTOS DISPONIBLES EN LA BIBLIOTECA${tagsFiltro?.length > 0 ? ` (filtrados por tags: ${tagsFiltro.join(', ')})` : ''}:
${listaDocumentos}

${fragmentosRelevantes ? `FRAGMENTOS RELEVANTES PARA LA CONSULTA:\n${fragmentosRelevantes}` : 'No se encontraron fragmentos específicamente relevantes, pero podés consultar los documentos listados arriba.'}

PREGUNTA DEL USUARIO:
${pregunta}

INSTRUCCIONES:
- Si te preguntan qué documentos hay, lista los documentos disponibles arriba
- Si la pregunta es sobre un tema específico, usa los fragmentos relevantes para responder
- SIEMPRE cita las fuentes (título y autor) cuando uses información de documentos
- Si no hay información relevante, sugiere documentos que podrían ayudar
- Sé preciso y pedagógico en tus respuestas`;

      // Generar respuesta
      const result = await getModel().generateContent(promptEnriquecido);
      const respuesta = result.response.text();

      return NextResponse.json({
        respuesta,
        fuentes: chunks?.map((c: any) => ({
          titulo: c.documento.titulo,
          autor: c.documento.autor
        })) || [],
        totalDocumentos: todosDocumentos?.length || 0,
        filtradoPorTags: tagsFiltro?.length > 0 ? tagsFiltro : null
      });
    }

    // ============================================
    // MODO 2: Análisis de niño con RAG
    // ============================================
    if (tipo === 'analisis' && ninoId) {
      // Obtener datos del niño
      const { data: nino, error: ninoError } = await supabase
        .from('ninos')
        .select('*')
        .eq('id', ninoId)
        .single();

      if (ninoError) throw ninoError;

      // Obtener últimas sesiones
      const { data: sesiones, error: sesionesError } = await supabase
        .from('sesiones')
        .select('*')
        .eq('nino_id', ninoId)
        .order('fecha', { ascending: false })
        .limit(sesionIds?.length || 5);

      if (sesionesError) throw sesionesError;

      // Buscar información relevante en biblioteca
      const queryEmbedding = await generateEmbedding(pregunta);
      const { data: chunks } = await supabase
        .rpc('match_documents', {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.6,
          match_count: 3
        });

      // Formatear datos para el prompt
      const perfilNino = JSON.stringify({
        alias: nino.alias,
        edad: nino.rango_etario,
        nivel: nino.nivel_alfabetizacion,
        escolarizado: nino.escolarizado
      });

      const sesionesJson = JSON.stringify(
        sesiones?.map((s: any) => ({
          fecha: s.fecha,
          duracion: s.duracion_minutos,
          items: s.items,
          observaciones: s.observaciones_libres
        }))
      );

      const bibliografia = chunks && chunks.length > 0
        ? chunks.map((c: any) => `${c.documento.titulo} - ${c.texto}`).join('\n\n')
        : 'No hay bibliografía relevante disponible.';

      // Usar el prompt de análisis de sesión
      const prompt = PROMPT_ANALISIS_SESION
        .replace('{perfil_json}', perfilNino)
        .replace('{sesiones_json}', sesionesJson)
        .replace('{fragmentos_rag}', bibliografia)
        .replace('{pregunta_especifica}', pregunta);

      // Generar respuesta
      const result = await getModel().generateContent(prompt);
      const respuesta = result.response.text();

      return NextResponse.json({
        respuesta,
        contexto: {
          nino: nino.alias,
          sesiones: sesiones?.length || 0,
          fuentes: chunks?.map((c: any) => c.documento.titulo) || []
        }
      });
    }

    return NextResponse.json({ error: 'Tipo de consulta no válido' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error en chat API:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Mensajes de error más amigables
    let errorMessage = 'Error al procesar la consulta';
    
    if (error.message?.includes('overloaded')) {
      errorMessage = 'El servicio de IA está temporalmente saturado. Por favor intentá de nuevo en unos segundos.';
    } else if (error.message?.includes('API key')) {
      errorMessage = 'Error de configuración de la API. Contactá al administrador.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'Se alcanzó el límite de uso de la API. Intentá más tarde.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
