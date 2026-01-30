// Configuración de Gemini AI

import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY no está configurada');
}

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Modelo para chat y generación de texto
// Gemini 2.5 Flash: Gratis, más rápido, con razonamiento híbrido y 1M tokens de contexto
export const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
});

// Modelo para embeddings (gratis)
export const embeddingModel = genAI.getGenerativeModel({ 
  model: 'text-embedding-004'
});

export { genAI };
