// Configuración de Gemini AI

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Inicialización lazy para evitar errores durante el build
let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;
let embeddingModel: GenerativeModel | null = null;

// Función para obtener la instancia de Gemini (lazy initialization)
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY no está configurada');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Función para obtener el modelo de chat (lazy initialization)
export function getModel(): GenerativeModel {
  if (!model) {
    model = getGenAI().getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
  }
  return model;
}

// Función para obtener el modelo de embeddings (lazy initialization)
export function getEmbeddingModel(): GenerativeModel {
  if (!embeddingModel) {
    // embedding-001: compatible con v1beta, 768 dims
    embeddingModel = getGenAI().getGenerativeModel({ model: 'embedding-001' });
  }
  return embeddingModel;
}

// Exportar para compatibilidad con código existente
// NOTA: Usar getModel() y getEmbeddingModel() en su lugar
export { getGenAI as genAI };

// ─── Rotación de API keys ──────────────────────────────────────────────────
// Soporta hasta 5 keys: GOOGLE_AI_API_KEY, GOOGLE_AI_API_KEY_2, ..., GOOGLE_AI_API_KEY_5
// Útil en tests multi-usuario para evitar rate limits del plan gratis (15 RPM por key)

function getApiKeys(): string[] {
  // Orden: KEY_2..KEY_5 primero, KEY_1 como último recurso
  return [
    process.env.GOOGLE_AI_API_KEY_2,
    process.env.GOOGLE_AI_API_KEY_3,
    process.env.GOOGLE_AI_API_KEY_4,
    process.env.GOOGLE_AI_API_KEY_5,
    process.env.GOOGLE_AI_API_KEY,   // fallback
  ].filter(Boolean) as string[];
}

/**
 * Genera texto con Gemini rotando keys automáticamente en caso de rate limit (429).
 * Ideal para rutas de API que pueden recibir llamadas simultáneas.
 */
export async function callGeminiWithKeyRotation(prompt: string): Promise<string> {
  const keys = getApiKeys();

  if (keys.length === 0) {
    throw new Error('GOOGLE_AI_API_KEY no está configurada');
  }

  let ultimoError: any;
  for (const key of keys) {
    try {
      const ai = new GoogleGenerativeAI(key);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      ultimoError = err;
      // 429 = rate limit → rotar a la siguiente key
      const status = err?.status || err?.httpErrorCode;
      if (status === 429 || err?.message?.includes('429')) {
        continue;
      }
      // Otro error → propagar directamente
      throw err;
    }
  }

  throw new Error(
    'Límite de consultas alcanzado en todas las API keys. Intentá en un momento.'
  );
}

/**
 * Genera embedding vectorial para búsqueda semántica (siempre usa la key primaria).
 * Gemini text-embedding-004 → 768 dimensiones.
 */
export async function generarEmbedding(texto: string): Promise<number[]> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY no está configurada');

  const ai = new GoogleGenerativeAI(key);
  // embedding-001 es compatible con v1beta (768 dims, igual que text-embedding-004)
  const model = ai.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent(texto);
  return result.embedding.values;
}
