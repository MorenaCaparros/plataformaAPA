import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY!);

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que sea director
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!perfil || perfil.rol !== 'director') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { comentario, puntuaciones } = await request.json();

    if (!comentario || !puntuaciones) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Preparar prompt para Gemini
    const prompt = `Eres un asistente de gestión de recursos humanos para una ONG educativa.

Te voy a compartir un feedback de un director hacia un coordinador de equipo, junto con puntuaciones cuantitativas.

**Comentario del director:**
${comentario}

**Puntuaciones (escala 1-10):**
- Liderazgo: ${puntuaciones.liderazgo}/10
- Gestión de Equipo: ${puntuaciones.gestion}/10
- Comunicación: ${puntuaciones.comunicacion}/10
- Compromiso: ${puntuaciones.compromiso}/10
- Promedio: ${Math.round((puntuaciones.liderazgo + puntuaciones.gestion + puntuaciones.comunicacion + puntuaciones.compromiso) / 4)}/10

**Tu tarea:**
1. Analiza el feedback cualitativo y las puntuaciones
2. Identifica fortalezas y áreas de mejora
3. Sugiere 2-3 acciones concretas para potenciar el desempeño
4. Detecta si hay inconsistencias entre el comentario y las puntuaciones
5. Propone un mensaje de feedback constructivo para el coordinador

**Formato de respuesta:**
Resumen breve (2-3 párrafos) que integre análisis cuantitativo y cualitativo, con tono profesional pero cercano.`;

    // Llamar a Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analisis = response.text();

    return NextResponse.json({ analisis });

  } catch (error) {
    console.error('Error analizando feedback:', error);
    return NextResponse.json(
      { error: 'Error al analizar feedback' },
      { status: 500 }
    );
  }
}
