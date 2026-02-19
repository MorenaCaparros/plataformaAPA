'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Brain,
  BookOpen,
  User,
  Sparkles,
  Send,
  History,
  ChevronDown,
  ChevronRight,
  Tag,
  X,
  Clock,
  MessageSquare,
  Lightbulb,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// ─── Tipos ─────────────────────────────────────────────────────────────────
type Modo = 'biblioteca' | 'analisis_nino' | 'tema_libre';

interface Nino {
  id: string;
  alias: string;
  rango_etario: string;
  nivel_alfabetizacion: string;
}

interface Tag {
  label: string;
}

interface Mensaje {
  id: string;
  rol: 'usuario' | 'asistente';
  contenido: string;
  modo: Modo;
  fuentes?: { titulo: string; autor: string }[];
  tagsUsados?: string[];
  timestamp: Date;
}

interface EntradaHistorial {
  id: string;
  modo: string;
  pregunta: string;
  respuesta: string;
  created_at: string;
  ninos?: { alias: string; rango_etario: string } | null;
  tags_usados?: string[] | null;
  fuentes?: { titulo: string; autor: string }[] | null;
}

// ─── Constantes ────────────────────────────────────────────────────────────
interface ModoConfig { id: Modo; label: string; iconName: 'BookOpen' | 'User' | 'Sparkles'; desc: string; color: string }

const MODOS: ModoConfig[] = [
  {
    id: 'biblioteca',
    label: 'Consultar Biblioteca',
    iconName: 'BookOpen',
    desc: 'Buscá en documentos psicopedagógicos',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'analisis_nino',
    label: 'Analizar Niño',
    iconName: 'User',
    desc: 'Análisis basado en sesiones + bibliografía',
    color: 'from-crecimiento-500 to-crecimiento-600',
  },
  {
    id: 'tema_libre',
    label: 'Consulta Libre',
    iconName: 'Sparkles',
    desc: 'Pregunta sobre cualquier tema pedagógico',
    color: 'from-sol-400 to-sol-500',
  },
];

function ModoIcon({ name, className }: { name: ModoConfig['iconName']; className?: string }) {
  if (name === 'BookOpen') return <BookOpen className={className} />;
  if (name === 'User') return <User className={className} />;
  return <Sparkles className={className} />;
}

const SUGERENCIAS: Record<Modo, string[]> = {
  biblioteca: [
    '¿Qué documentos hay sobre dislexia?',
    'Estrategias para niños con dificultades de atención',
    'Métodos de evaluación de lectura',
    '¿Qué dice la bibliografía sobre alfabetización inicial?',
  ],
  analisis_nino: [
    '¿Cómo evolucionó su nivel de lectura?',
    '¿Qué patrones de frustración se observan?',
    'Generá un informe psicopedagógico completo',
    '¿En qué áreas muestra más fortalezas?',
    'Qué estrategias recomiendas para mejorar su atención',
  ],
  tema_libre: [
    '¿Qué es la conciencia fonológica?',
    'Diferencias entre dislexia y retraso lector',
    'Estrategias para trabajar comprensión lectora',
    'Cómo motivar a niños con experiencias escolares negativas',
  ],
};

// Color basado en la inicial del tag (mismo sistema que la biblioteca)
const TAG_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800',
  'bg-teal-100 text-teal-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
];
function tagColor(tag: string) {
  const idx = tag.charCodeAt(0) % TAG_COLORS.length;
  return TAG_COLORS[idx];
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function ModuloIAPage() {
  const { user, perfil } = useAuth();

  // Estado principal
  const [modo, setModo] = useState<Modo>('biblioteca');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);

  // Niños
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [ninoSeleccionado, setNinoSeleccionado] = useState<Nino | null>(null);
  const [busquedaNino, setBusquedaNino] = useState('');
  const [mostrarDropdownNino, setMostrarDropdownNino] = useState(false);

  // Tags (solo en modo biblioteca)
  const [todosLosTags, setTodosLosTags] = useState<string[]>([]);
  const [tagsSeleccionados, setTagsSeleccionados] = useState<string[]>([]);

  // Historial
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [totalHistorial, setTotalHistorial] = useState(0);

  // Sugerencias vinculación
  const [sugerenciasVinculacion, setSugerenciasVinculacion] = useState<string[]>([]);

  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Efectos ──────────────────────────────────────────────────────────────
  useEffect(() => {
    cargarNinos();
    cargarTags();
    cargarHistorial();
  }, []);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Al cambiar de modo, limpiar estado contextual
  useEffect(() => {
    setTagsSeleccionados([]);
    setNinoSeleccionado(null);
    setSugerenciasVinculacion([]);
  }, [modo]);

  // ── Carga de datos ───────────────────────────────────────────────────────
  const cargarNinos = async () => {
    const { data } = await supabase
      .from('ninos')
      .select('id, alias, rango_etario, nivel_alfabetizacion')
      .order('alias', { ascending: true });
    setNinos(data || []);
  };

  const cargarTags = async () => {
    const { data } = await supabase
      .from('documentos')
      .select('tags');
    if (data) {
      const todos = [...new Set(
        data.flatMap((d: any) => d.tags || []).filter(Boolean)
      )].sort() as string[];
      setTodosLosTags(todos);
    }
  };

  const cargarHistorial = async (offset = 0) => {
    setCargandoHistorial(true);
    try {
      const res = await fetch(`/api/ia/historial?limite=10&offset=${offset}`);
      if (!res.ok) return;
      const json = await res.json();
      if (offset === 0) {
        setHistorial(json.historial || []);
      } else {
        setHistorial(prev => [...prev, ...(json.historial || [])]);
      }
      setTotalHistorial(json.total || 0);
    } catch (e) {
      console.error('Error cargando historial:', e);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // ── Guardar en historial ─────────────────────────────────────────────────
  const guardarEnHistorial = useCallback(async (
    pregunta: string,
    respuesta: string,
    fuentes: { titulo: string; autor: string }[],
    tagsUsados: string[]
  ) => {
    try {
      await fetch('/api/ia/historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo,
          nino_id: ninoSeleccionado?.id || null,
          pregunta,
          respuesta,
          fuentes,
          tags_usados: tagsUsados.length > 0 ? tagsUsados : null,
        }),
      });
      // Refrescar historial silenciosamente
      cargarHistorial(0);
    } catch (e) {
      console.error('Error guardando en historial:', e);
    }
  }, [modo, ninoSeleccionado]);

  // ── Enviar consulta ──────────────────────────────────────────────────────
  const enviarConsulta = async (preguntaTexto?: string) => {
    const texto = preguntaTexto || input.trim();
    if (!texto || cargando) return;

    if (modo === 'analisis_nino' && !ninoSeleccionado) {
      alert('Seleccioná un niño para el análisis');
      return;
    }

    const msgUsuario: Mensaje = {
      id: Date.now().toString(),
      rol: 'usuario',
      contenido: texto,
      modo,
      timestamp: new Date(),
    };
    setMensajes(prev => [...prev, msgUsuario]);
    setInput('');
    setCargando(true);

    try {
      // Determinar parámetros según modo
      const body: Record<string, any> = {
        pregunta: texto,
        tipo: modo === 'analisis_nino' ? 'analisis' : 'biblioteca',
      };
      if (modo === 'analisis_nino' && ninoSeleccionado) {
        body.ninoId = ninoSeleccionado.id;
      }
      if (modo === 'biblioteca' && tagsSeleccionados.length > 0) {
        body.tags = tagsSeleccionados;
      }
      if (modo === 'tema_libre') {
        // Consulta libre = biblioteca sin restricciones de tag
        body.tipo = 'biblioteca';
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error en la consulta');

      const respuestaTexto: string = data.respuesta || '';
      const fuentes = data.fuentes || [];
      const tagsUsados: string[] = data.filtradoPorTags || [];

      const msgAsistente: Mensaje = {
        id: (Date.now() + 1).toString(),
        rol: 'asistente',
        contenido: respuestaTexto,
        modo,
        fuentes,
        tagsUsados,
        timestamp: new Date(),
      };
      setMensajes(prev => [...prev, msgAsistente]);

      // Guardar en historial
      guardarEnHistorial(texto, respuestaTexto, fuentes, tagsUsados);

      // Sugerencias de vinculación (solo en análisis de niño)
      if (modo === 'analisis_nino' && ninoSeleccionado) {
        detectarVinculaciones(respuestaTexto, ninoSeleccionado);
      }
    } catch (error: any) {
      setMensajes(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        rol: 'asistente',
        contenido: `❌ ${error.message || 'Error al procesar la consulta'}`,
        modo,
        timestamp: new Date(),
      }]);
    } finally {
      setCargando(false);
    }
  };

  // ── Sugerencias de vinculación ───────────────────────────────────────────
  const detectarVinculaciones = async (respuesta: string, nino: Nino) => {
    // Busca en la respuesta palabras clave que puedan indicar similitud con otros niños
    const palabrasClave = ['similar', 'patrón', 'dificultad', 'nivel', 'atención', 'lectura'];
    const mencionaPatrones = palabrasClave.some(p => respuesta.toLowerCase().includes(p));

    if (!mencionaPatrones) return;

    // Busca otros niños con el mismo nivel de alfabetización
    const { data: ninosSimilares } = await supabase
      .from('ninos')
      .select('id, alias, rango_etario, nivel_alfabetizacion')
      .eq('nivel_alfabetizacion', nino.nivel_alfabetizacion)
      .neq('id', nino.id)
      .limit(3);

    if (ninosSimilares && ninosSimilares.length > 0) {
      const sugs = ninosSimilares.map(
        (n: any) => `${n.alias} (${n.rango_etario}, ${n.nivel_alfabetizacion})`
      );
      setSugerenciasVinculacion(sugs);
    }
  };

  // ── Cargar consulta del historial ────────────────────────────────────────
  const cargarDesdeHistorial = (entrada: EntradaHistorial) => {
    const modoEntrada = entrada.modo as Modo;
    setModo(modoEntrada);

    // Si tiene niño asociado, buscarlo
    if (entrada.ninos && modoEntrada === 'analisis_nino') {
      const ninoEncontrado = ninos.find(n =>
        n.alias === (entrada.ninos as any).alias
      );
      if (ninoEncontrado) setNinoSeleccionado(ninoEncontrado);
    }

    // Restaurar tags
    if (entrada.tags_usados && entrada.tags_usados.length > 0) {
      setTagsSeleccionados(entrada.tags_usados);
    }

    // Agregar mensajes de esta consulta
    const msgs: Mensaje[] = [
      {
        id: `hist-user-${entrada.id}`,
        rol: 'usuario',
        contenido: entrada.pregunta,
        modo: modoEntrada,
        timestamp: new Date(entrada.created_at),
      },
      {
        id: `hist-asst-${entrada.id}`,
        rol: 'asistente',
        contenido: entrada.respuesta,
        modo: modoEntrada,
        fuentes: (entrada.fuentes as any) || [],
        tagsUsados: entrada.tags_usados || [],
        timestamp: new Date(entrada.created_at),
      },
    ];
    setMensajes(msgs);
    setMostrarHistorial(false);
  };

  // ── Helpers de UI ────────────────────────────────────────────────────────
  const toggleTag = (tag: string) => {
    setTagsSeleccionados(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const ninosFiltrados = ninos.filter(n =>
    n.alias.toLowerCase().includes(busquedaNino.toLowerCase())
  );

  const modoActual = MODOS.find(m => m.id === modo)!;

  const limpiarChat = () => {
    setMensajes([]);
    setSugerenciasVinculacion([]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-crecimiento-500 flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Módulo IA</h1>
                <p className="text-xs text-gray-500">Análisis y consultas psicopedagógicas</p>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-2">
              {mensajes.length > 0 && (
                <button
                  onClick={limpiarChat}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Nueva consulta</span>
                </button>
              )}
              <button
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  mostrarHistorial
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Historial</span>
                {totalHistorial > 0 && (
                  <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalHistorial > 99 ? '99+' : totalHistorial}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-6xl mx-auto w-full">

        {/* ── PANEL LATERAL: HISTORIAL ─────────────────────────────────────── */}
        {mostrarHistorial && (
          <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-500" />
                  Historial de consultas
                </h2>
                <button
                  onClick={() => setMostrarHistorial(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {cargandoHistorial ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-20" />
                  ))}
                </div>
              ) : historial.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay consultas anteriores</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historial.map(entrada => (
                    <button
                      key={entrada.id}
                      onClick={() => cargarDesdeHistorial(entrada)}
                      className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                    >
                      {/* Badge de modo */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {entrada.modo === 'biblioteca' && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            📚 Biblioteca
                          </span>
                        )}
                        {entrada.modo === 'analisis_nino' && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            👤 {entrada.ninos?.alias || 'Análisis'}
                          </span>
                        )}
                        {entrada.modo === 'tema_libre' && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                            ✨ Libre
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entrada.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 font-medium line-clamp-2 group-hover:text-purple-800">
                        {entrada.pregunta}
                      </p>

                      {entrada.tags_usados && entrada.tags_usados.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {entrada.tags_usados.slice(0, 3).map(tag => (
                            <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full ${tagColor(tag)}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}

                  {historial.length < totalHistorial && (
                    <button
                      onClick={() => cargarHistorial(historial.length)}
                      className="w-full py-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Cargar más ({totalHistorial - historial.length} restantes)
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── ÁREA PRINCIPAL ───────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── CONTROLES SUPERIORES ──────────────────────────────────────── */}
          <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">

            {/* Selector de modo */}
            <div className="flex gap-2 flex-wrap">            {MODOS.map(m => {
                const activo = modo === m.id;
                return (
                <button
                    key={m.id}
                    onClick={() => setModo(m.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activo
                        ? `bg-gradient-to-r ${m.color} text-white shadow-md`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ModoIcon name={m.iconName} className="w-4 h-4" />
                    <span className="hidden sm:inline">{m.label}</span>
                    <span className="sm:hidden">{m.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Descripción del modo */}
            <p className="text-xs text-gray-500">{modoActual.desc}</p>

            {/* Selector de niño (solo modo analisis_nino) */}
            {modo === 'analisis_nino' && (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={ninoSeleccionado ? ninoSeleccionado.alias : busquedaNino}
                      onChange={e => {
                        setBusquedaNino(e.target.value);
                        setNinoSeleccionado(null);
                        setMostrarDropdownNino(true);
                      }}
                      onFocus={() => setMostrarDropdownNino(true)}
                      placeholder="Buscar niño..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-crecimiento-400 focus:border-transparent"
                    />
                    {ninoSeleccionado && (
                      <button
                        onClick={() => {
                          setNinoSeleccionado(null);
                          setBusquedaNino('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                  {ninoSeleccionado && (
                    <Link
                      href={`/dashboard/ninos/${ninoSeleccionado.id}`}
                      className="flex items-center gap-1 px-3 py-2 text-xs text-crecimiento-600 hover:text-crecimiento-800 border border-crecimiento-200 rounded-lg hover:bg-crecimiento-50 transition-colors"
                    >
                      Ver perfil <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Dropdown de niños */}
                {mostrarDropdownNino && !ninoSeleccionado && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {ninosFiltrados.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">Sin resultados</div>
                    ) : (
                      ninosFiltrados.map(n => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setNinoSeleccionado(n);
                            setBusquedaNino('');
                            setMostrarDropdownNino(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-crecimiento-50 text-left transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-crecimiento-100 flex items-center justify-center text-crecimiento-700 font-bold text-xs flex-shrink-0">
                            {n.alias[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{n.alias}</p>
                            <p className="text-xs text-gray-500">{n.rango_etario} · {n.nivel_alfabetizacion}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Info niño seleccionado */}
                {ninoSeleccionado && (
                  <div className="mt-2 px-3 py-2 bg-crecimiento-50 border border-crecimiento-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-crecimiento-600 flex-shrink-0" />
                    <span className="text-sm text-crecimiento-800">
                      <strong>{ninoSeleccionado.alias}</strong> · {ninoSeleccionado.rango_etario} · {ninoSeleccionado.nivel_alfabetizacion}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Filtro por tags (solo modo biblioteca) */}
            {modo === 'biblioteca' && todosLosTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Filtrar por tema:</span>
                  {tagsSeleccionados.length > 0 && (
                    <button
                      onClick={() => setTagsSeleccionados([])}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todosLosTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        tagsSeleccionados.includes(tag)
                          ? `${tagColor(tag)} border-transparent shadow-sm scale-105`
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {tagsSeleccionados.includes(tag) && '✓ '}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ÁREA DE MENSAJES ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Estado vacío / sugerencias */}
            {mensajes.length === 0 && (
              <div className="max-w-2xl mx-auto">
                {/* Intro card */}
                <div className={`bg-gradient-to-br ${modoActual.color} rounded-2xl p-5 text-white mb-6 shadow-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <ModoIcon name={modoActual.iconName} className="w-7 h-7" />
                    <h2 className="text-xl font-bold">{modoActual.label}</h2>
                  </div>
                  <p className="text-white/80 text-sm">{modoActual.desc}</p>
                  {modo === 'analisis_nino' && !ninoSeleccionado && (
                    <p className="mt-2 text-white/90 text-sm font-medium">
                      ↑ Primero seleccioná un niño arriba
                    </p>
                  )}
                  {modo === 'biblioteca' && tagsSeleccionados.length > 0 && (
                    <p className="mt-2 text-white/90 text-sm">
                      ⚡ Filtrando por: {tagsSeleccionados.join(', ')}
                    </p>
                  )}
                </div>

                {/* Preguntas sugeridas */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-sol-500" />
                    Preguntas frecuentes
                  </h3>
                  <div className="space-y-2">
                    {SUGERENCIAS[modo].map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => enviarConsulta(sug)}
                        disabled={modo === 'analisis_nino' && !ninoSeleccionado}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mensajes del chat */}
            {mensajes.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'} max-w-4xl mx-auto w-full`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.rol === 'usuario'
                      ? 'bg-gradient-to-br from-crecimiento-500 to-crecimiento-600 text-white shadow-md'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  {/* Badge de modo en mensajes del asistente */}
                  {msg.rol === 'asistente' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 to-crecimiento-500 flex items-center justify-center">
                        <Brain className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">Asistente IA</span>
                      {msg.tagsUsados && msg.tagsUsados.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          ⚡ {msg.tagsUsados.join(', ')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Contenido */}
                  {msg.rol === 'usuario' ? (
                    <p className="whitespace-pre-wrap text-sm">{msg.contenido}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-headings:font-bold prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-gray-900">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.contenido}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Fuentes */}
                  {msg.fuentes && msg.fuentes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Fuentes consultadas:
                      </p>
                      <div className="space-y-1">
                        {msg.fuentes.map((f, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            📄 <strong>{f.titulo}</strong>{f.autor ? ` — ${f.autor}` : ''}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-xs mt-2 ${msg.rol === 'usuario' ? 'text-crecimiento-100' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Indicador de carga */}
            {cargando && (
              <div className="flex justify-start max-w-4xl mx-auto w-full">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 to-crecimiento-500 flex items-center justify-center animate-pulse">
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Analizando...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sugerencias de vinculación */}
            {sugerenciasVinculacion.length > 0 && !cargando && (
              <div className="max-w-4xl mx-auto w-full">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        💡 Niños con perfil similar:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sugerenciasVinculacion.map((sug, i) => {
                          const ninoMatch = ninos.find(n => sug.startsWith(n.alias));
                          return ninoMatch ? (
                            <button
                              key={i}
                              onClick={() => {
                                setNinoSeleccionado(ninoMatch);
                                setModo('analisis_nino');
                                limpiarChat();
                              }}
                              className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full hover:bg-amber-200 transition-colors"
                            >
                              {sug} →
                            </button>
                          ) : (
                            <span key={i} className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                              {sug}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={mensajesEndRef} />
          </div>

          {/* ── INPUT ─────────────────────────────────────────────────────── */}
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            {/* Info de contexto activo */}
            {(ninoSeleccionado || tagsSeleccionados.length > 0) && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {ninoSeleccionado && (
                  <span className="text-xs bg-crecimiento-50 text-crecimiento-700 border border-crecimiento-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ninoSeleccionado.alias}
                  </span>
                )}
                {tagsSeleccionados.map(tag => (
                  <span key={tag} className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${tagColor(tag)}`}>
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button onClick={() => toggleTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                enviarConsulta();
              }}
              className="flex gap-2 items-end"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarConsulta();
                  }
                }}
                placeholder={
                  modo === 'analisis_nino' && !ninoSeleccionado
                    ? 'Primero seleccioná un niño arriba...'
                    : modo === 'biblioteca' && tagsSeleccionados.length > 0
                      ? `Consultá sobre: ${tagsSeleccionados.join(', ')}...`
                      : 'Escribí tu consulta... (Enter para enviar)'
                }
                rows={2}
                className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                disabled={cargando || (modo === 'analisis_nino' && !ninoSeleccionado)}
              />
              <button
                type="submit"
                disabled={cargando || !input.trim() || (modo === 'analisis_nino' && !ninoSeleccionado)}
                className="p-3 bg-gradient-to-br from-purple-500 to-crecimiento-500 text-white rounded-xl hover:from-purple-600 hover:to-crecimiento-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-95 flex-shrink-0"
              >
                {cargando ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>

            <p className="text-xs text-gray-400 mt-1.5 hidden sm:block">
              💡 Shift+Enter para nueva línea · Enter para enviar · Todas las consultas se guardan en el historial
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
