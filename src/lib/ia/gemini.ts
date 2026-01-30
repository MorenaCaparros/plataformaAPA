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
    embeddingModel = getGenAI().getGenerativeModel({ 
      model: 'text-embedding-004'
    });
  }
  return embeddingModel;
}

// Exportar para compatibilidad con código existente
// NOTA: Usar getModel() y getEmbeddingModel() en su lugar
export { getGenAI as genAI };
