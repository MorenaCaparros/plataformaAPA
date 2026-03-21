'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Textarea con botón de dictado por voz (Web Speech API).
 * Si el navegador no soporta la API, el botón no se muestra.
 * Al grabar, el texto transcripto se AÑADE al contenido existente.
 */
export default function VoiceTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  required = false,
  disabled = false,
}: VoiceTextareaProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript)
        .join(' ');
      onChange(value ? `${value} ${transcript}` : transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [value, onChange]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        className={`w-full border border-gray-300 rounded-md p-2 text-sm resize-none transition-all ${
          isRecording ? 'border-red-400 ring-2 ring-red-200 pr-10' : 'pr-10'
        } ${className}`}
        placeholder={placeholder}
        required={required}
      />
      {isSupported && !disabled && (
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? 'Detener grabación' : 'Dictar por voz'}
          className={`absolute bottom-2 right-2 p-1.5 rounded-md transition-all touch-manipulation ${
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-md'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
          }`}
        >
          {isRecording ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
