'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  fuentes?: Array<{ titulo: string; autor: string }>;
  totalDocumentos?: number;
}

export default function ChatBibliotecaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de la Biblioteca Psicopedagógica. Podés preguntarme sobre los documentos disponibles y te responderé con referencias exactas. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Llamar al API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pregunta: input,
          tipo: 'biblioteca'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al procesar la pregunta');
      }

      const data = await response.json();

      // Agregar respuesta
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.respuesta,
        timestamp: new Date(),
        fuentes: data.fuentes || [],
        totalDocumentos: data.totalDocumentos
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Hubo un error al procesar tu pregunta. Por favor intentá de nuevo.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/dashboard/biblioteca" className="text-crecimiento-600 font-medium">
              ← Volver a Biblioteca
            </Link>
            <h1 className="text-lg font-bold text-gray-900">💬 Chat con Documentos</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-3xl rounded-lg px-3 sm:px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-crecimiento-500 text-white'
                    : 'bg-white shadow-sm border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-crecimiento-500 flex items-center justify-center text-white font-bold">
                        U
                      </div>
                    ) : (
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Mostrar fuentes si las hay */}
                    {message.role === 'assistant' && message.fuentes && message.fuentes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">📚 Fuentes consultadas:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {message.fuentes.map((fuente, idx) => (
                            <li key={idx}>• {fuente.titulo} - {fuente.autor}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mostrar total de documentos disponibles */}
                    {message.role === 'assistant' && message.totalDocumentos !== undefined && (
                      <p className="text-xs text-gray-500 mt-2">
                        💡 {message.totalDocumentos} documento{message.totalDocumentos !== 1 ? 's' : ''} disponible{message.totalDocumentos !== 1 ? 's' : ''} en la biblioteca
                      </p>
                    )}

                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-crecimiento-100' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Preguntas sugeridas */}
          {messages.length === 1 && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2 font-medium">💡 Preguntas sugeridas:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  '¿Qué documentos hay en la biblioteca?',
                  '¿Qué estrategias hay para trabajar la alfabetización?',
                  '¿Cómo identificar dificultades de aprendizaje?',
                  '¿Qué actividades recomiendan para niños de 8-10 años?'
                ].map((pregunta) => (
                  <button
                    key={pregunta}
                    onClick={() => setInput(pregunta)}
                    className="text-left px-3 py-2 text-xs sm:text-sm bg-sol-50 text-sol-700 rounded-lg hover:bg-sol-100 transition border border-sol-200"
                  >
                    {pregunta}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Preguntá sobre los documentos..."
              className="flex-1 px-3 sm:px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 sm:px-6 py-3 min-h-[48px] bg-crecimiento-500 text-white rounded-lg hover:bg-crecimiento-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-2 hidden sm:block">
            📚 El asistente conoce TODOS los documentos de la biblioteca y cita las fuentes
          </p>
        </div>
      </div>
    </div>
  );
}
