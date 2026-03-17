'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  Search, Plus, Users, MessageCircle, Send, Smile, ArrowLeft,
  MoreVertical, Pencil, Trash2, Flag, X, ChevronDown,
  UserPlus, MessageSquare,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────
interface Participante {
  usuario_id: string;
  nombre: string;
  avatar_url: string | null;
  rol: string;
  es_admin: boolean;
}

interface ConversacionItem {
  id: string;
  tipo: 'directo' | 'grupo';
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  updated_at: string;
  participantes: Participante[];
  ultimo_mensaje: { contenido: string; tipo: string; created_at: string; emisor_id: string } | null;
  no_leidos: number;
}

interface Mensaje {
  id: string;
  conversacion_id: string;
  emisor_id: string;
  contenido: string;
  tipo: 'texto' | 'sticker' | 'sistema';
  editado_at: string | null;
  eliminado_at: string | null;
  created_at: string;
  perfiles: { id: string; nombre_completo: string; avatar_url: string | null; rol: string } | null;
}

interface UsuarioBusqueda {
  id: string;
  nombre_completo: string;
  avatar_url: string | null;
  rol: string;
}

// ─── Stickers ─────────────────────────────────────────────────
const STICKERS = [
  '👍','❤️','👏','🎉','🔥','✅','🙏','💪','📚','✏️',
  '⭐','🤔','😂','😍','😎','👋','🥳','😢','😮','🌟',
  '🐣','🦋','💡','🎯','🤝','💬','🌈','☀️','🍀','💫',
];

// ─── Helpers ──────────────────────────────────────────────────
function initiales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatFechaConvItem(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return formatHora(iso);
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function AvatarPlaceholder({ nombre, size = 'md' }: { nombre: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-crecimiento-400 to-crecimiento-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initiales(nombre)}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────
export default function MensajesPage() {
  const { user, perfil } = useAuth();

  // Conversations & messages
  const [convs, setConvs] = useState<ConversacionItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Input
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarStickers, setMostrarStickers] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState('');

  // Context menu
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null);

  // Search conversations
  const [busquedaConvs, setBusquedaConvs] = useState('');

  // New DM modal
  const [modalDM, setModalDM] = useState(false);
  const [usuariosBusqueda, setUsuariosBusqueda] = useState<UsuarioBusqueda[]>([]);
  const [busquedaUser, setBusquedaUser] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New group modal
  const [modalGrupo, setModalGrupo] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descGrupo, setDescGrupo] = useState('');
  const [seleccionados, setSeleccionados] = useState<UsuarioBusqueda[]>([]);

  // Mobile: show list or chat
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'chat'>('lista');

  const inputRef = useRef<HTMLInputElement>(null);
  const inputEditRef = useRef<HTMLInputElement>(null);
  const msgContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const activeConv = convs.find(c => c.id === activeId) || null;

  // ── Cargar conversaciones ──────────────────────────────────
  const fetchConvs = useCallback(async () => {
    setLoadingConvs(true);
    const res = await fetch('/api/mensajes/conversaciones');
    const data = await res.json();
    setConvs(data.conversaciones || []);
    setLoadingConvs(false);
  }, []);

  useEffect(() => { if (user) fetchConvs(); }, [user, fetchConvs]);

  // ── Cargar mensajes de conversación activa ─────────────────
  const fetchMensajes = useCallback(async (convId: string, before?: string) => {
    setLoadingMsgs(true);
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    const res = await fetch(`/api/mensajes/conversaciones/${convId}?${params}`);
    const data = await res.json();
    if (before) {
      setMensajes(prev => [...(data.mensajes || []), ...prev]);
    } else {
      setMensajes(data.mensajes || []);
    }
    setHayMas(data.hayMas || false);
    setLoadingMsgs(false);
    // Marcar como leído
    fetch(`/api/mensajes/conversaciones/${convId}/leer`, { method: 'POST' });
    // Actualizar badge de no-leídos localmente
    setConvs(prev => prev.map(c => c.id === convId ? { ...c, no_leidos: 0 } : c));
  }, []);

  // ── Activar conversación ───────────────────────────────────
  const activarConv = useCallback((id: string) => {
    setActiveId(id);
    setMensajes([]);
    setVistaMovil('chat');
    fetchMensajes(id);

    // Unsubscribe de canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Suscribir a mensajes en tiempo real
    const channel = supabase
      .channel(`mensajes-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `conversacion_id=eq.${id}` },
        (payload: { new: Mensaje }) => {
          const nuevo = payload.new as Mensaje;
          // Si el emisor soy yo, ya se agregó optimistamente — evitar duplicado
          if (nuevo.emisor_id === user?.id) return;
          setMensajes(prev => [...prev, nuevo]);
          // Marcar como leído si estoy en la conversación
          fetch(`/api/mensajes/conversaciones/${id}/leer`, { method: 'POST' });
        }
      )
      .subscribe();
    channelRef.current = channel;
  }, [supabase, user?.id, fetchMensajes]);

  // Scroll al fondo cuando hay mensajes nuevos
  useEffect(() => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Cleanup realtime al desmontar
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [supabase]);

  // ── Enviar mensaje ─────────────────────────────────────────
  const enviarMensaje = async (contenido: string, tipo: 'texto' | 'sticker' = 'texto') => {
    if (!activeId || !contenido.trim() || enviando) return;
    setEnviando(true);
    setTexto('');
    setMostrarStickers(false);

    // Optimistic update
    const optimista: Mensaje = {
      id: `tmp-${Date.now()}`,
      conversacion_id: activeId,
      emisor_id: user!.id,
      contenido,
      tipo,
      editado_at: null,
      eliminado_at: null,
      created_at: new Date().toISOString(),
      perfiles: { id: user!.id, nombre_completo: [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || '', avatar_url: null, rol: perfil?.rol || '' },
    };
    setMensajes(prev => [...prev, optimista]);

    const res = await fetch(`/api/mensajes/conversaciones/${activeId}/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido, tipo }),
    });
    const data = await res.json();

    if (res.ok) {
      // Reemplazar optimista con real
      setMensajes(prev => prev.map(m => m.id === optimista.id ? data.mensaje : m));
      // Actualizar último mensaje en la lista
      setConvs(prev => prev.map(c => c.id === activeId ? {
        ...c,
        ultimo_mensaje: { contenido, tipo, created_at: data.mensaje.created_at, emisor_id: user!.id },
        updated_at: data.mensaje.created_at,
      } : c).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
    } else {
      setMensajes(prev => prev.filter(m => m.id !== optimista.id));
    }
    setEnviando(false);
  };

  // ── Editar mensaje ─────────────────────────────────────────
  const guardarEdicion = async () => {
    if (!editandoId || !textoEditado.trim()) return;
    const res = await fetch(`/api/mensajes/${editandoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: textoEditado }),
    });
    const data = await res.json();
    if (res.ok) {
      setMensajes(prev => prev.map(m => m.id === editandoId ? { ...m, contenido: data.mensaje.contenido, editado_at: data.mensaje.editado_at } : m));
    }
    setEditandoId(null);
    setTextoEditado('');
  };

  // ── Eliminar mensaje ───────────────────────────────────────
  const eliminarMensaje = async (id: string) => {
    await fetch(`/api/mensajes/${id}`, { method: 'DELETE' });
    setMensajes(prev => prev.map(m => m.id === id ? { ...m, eliminado_at: new Date().toISOString(), contenido: '🗑️ Mensaje eliminado' } : m));
    setMenuMsgId(null);
  };

  // ── Reportar mensaje ───────────────────────────────────────
  const reportarMensaje = async (id: string) => {
    await fetch(`/api/mensajes/${id}/reportar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: 'Reportado por el usuario' }),
    });
    setMenuMsgId(null);
    alert('Mensaje reportado. El equipo directivo lo revisará.');
  };

  // ── Buscar usuarios ────────────────────────────────────────
  const buscarUsuarios = useCallback(async (q: string) => {
    if (!q.trim()) { setUsuariosBusqueda([]); return; }
    setLoadingUsers(true);
    const res = await fetch(`/api/mensajes/usuarios?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const lista: UsuarioBusqueda[] = (data.usuarios || []).slice(0, 10);
    setUsuariosBusqueda(lista);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarUsuarios(busquedaUser), 300);
    return () => clearTimeout(t);
  }, [busquedaUser, buscarUsuarios]);

  // ── Crear DM ───────────────────────────────────────────────
  const crearDM = async (otroId: string) => {
    const res = await fetch('/api/mensajes/conversaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'directo', otro_usuario_id: otroId }),
    });
    const data = await res.json();
    setModalDM(false);
    setBusquedaUser('');
    setUsuariosBusqueda([]);
    await fetchConvs();
    activarConv(data.conversacion_id);
  };

  // ── Crear grupo ────────────────────────────────────────────
  const crearGrupo = async () => {
    if (!nombreGrupo.trim() || seleccionados.length === 0) return;
    const res = await fetch('/api/mensajes/conversaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'grupo',
        nombre: nombreGrupo,
        descripcion: descGrupo || undefined,
        participantes: seleccionados.map(u => u.id),
      }),
    });
    const data = await res.json();
    setModalGrupo(false);
    setNombreGrupo(''); setDescGrupo(''); setSeleccionados([]); setBusquedaUser(''); setUsuariosBusqueda([]);
    await fetchConvs();
    activarConv(data.conversacion_id);
  };

  // ── Filtrar conversaciones ─────────────────────────────────
  const convsFiltradas = convs.filter(c =>
    !busquedaConvs || c.nombre.toLowerCase().includes(busquedaConvs.toLowerCase())
  );

  // ─────────────────────────────── RENDER ──────────────────────

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 overflow-hidden rounded-3xl border border-white/60 shadow-xl bg-white/70 backdrop-blur-xl">

      {/* ═══ Panel izquierdo: lista de conversaciones ═══════════ */}
      <div className={`${vistaMovil === 'chat' ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-white/60`}>
        {/* Header */}
        <div className="p-4 border-b border-white/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-neutro-carbon font-quicksand">💬 Mensajes</h1>
            <div className="flex gap-2">
              <button
                onClick={() => { setModalDM(true); setBusquedaUser(''); setUsuariosBusqueda([]); }}
                className="p-2 hover:bg-crecimiento-50 rounded-xl transition-colors text-neutro-piedra hover:text-crecimiento-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Nuevo mensaje directo"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setModalGrupo(true); setBusquedaUser(''); setUsuariosBusqueda([]); setSeleccionados([]); setNombreGrupo(''); setDescGrupo(''); }}
                className="p-2 hover:bg-crecimiento-50 rounded-xl transition-colors text-neutro-piedra hover:text-crecimiento-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Nuevo grupo"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutro-piedra/50" />
            <input
              type="text"
              value={busquedaConvs}
              onChange={e => setBusquedaConvs(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full pl-9 pr-3 py-2.5 bg-neutro-lienzo/50 rounded-xl text-sm text-neutro-carbon placeholder-neutro-piedra/50 font-outfit focus:outline-none focus:ring-1 focus:ring-crecimiento-300 min-h-[44px]"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crecimiento-500" />
            </div>
          ) : convsFiltradas.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-12 h-12 text-neutro-piedra/30 mx-auto mb-3" />
              <p className="text-neutro-piedra text-sm font-outfit">
                {busquedaConvs ? 'Sin resultados' : 'Sin conversaciones aún'}
              </p>
              {!busquedaConvs && (
                <p className="text-xs text-neutro-piedra/60 font-outfit mt-1">
                  Creá un mensaje directo o un grupo para empezar
                </p>
              )}
            </div>
          ) : (
            convsFiltradas.map(conv => (
              <button
                key={conv.id}
                onClick={() => activarConv(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors min-h-[72px] border-b border-white/30 ${
                  activeId === conv.id
                    ? 'bg-crecimiento-50 border-l-4 border-l-crecimiento-500'
                    : 'hover:bg-neutro-lienzo/40'
                }`}
              >
                <div className="relative flex-shrink-0">
                  {conv.tipo === 'grupo' ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sol-300 to-sol-500 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <AvatarPlaceholder nombre={conv.nombre} />
                  )}
                  {conv.no_leidos > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-impulso-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.no_leidos > 9 ? '9+' : conv.no_leidos}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-sm font-medium truncate font-outfit ${conv.no_leidos > 0 ? 'text-neutro-carbon font-semibold' : 'text-neutro-carbon'}`}>
                      {conv.nombre}
                    </p>
                    {conv.ultimo_mensaje && (
                      <span className="text-[10px] text-neutro-piedra/60 font-outfit flex-shrink-0">
                        {formatFechaConvItem(conv.ultimo_mensaje.created_at)}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate font-outfit mt-0.5 ${conv.no_leidos > 0 ? 'text-neutro-carbon/80 font-medium' : 'text-neutro-piedra/70'}`}>
                    {conv.ultimo_mensaje
                      ? conv.ultimo_mensaje.tipo === 'sticker'
                        ? `${conv.ultimo_mensaje.contenido} Sticker`
                        : conv.ultimo_mensaje.contenido
                      : 'Sin mensajes aún'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ═══ Panel derecho: chat ════════════════════════════════ */}
      <div className={`${vistaMovil === 'lista' ? 'hidden' : 'flex'} lg:flex flex-col flex-1 min-w-0`}>
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="w-16 h-16 text-neutro-piedra/25 mb-4" />
            <h2 className="text-xl font-semibold text-neutro-carbon/60 font-quicksand">Seleccioná una conversación</h2>
            <p className="text-sm text-neutro-piedra/50 font-outfit mt-1">
              O creá un nuevo mensaje directo o grupo con los botones de arriba
            </p>
          </div>
        ) : (
          <>
            {/* Header de la conversación */}
            <div className="px-4 py-3 border-b border-white/60 flex items-center gap-3 flex-shrink-0 bg-white/30">
              <button
                onClick={() => setVistaMovil('lista')}
                className="lg:hidden p-2 hover:bg-neutro-lienzo rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-neutro-piedra" />
              </button>
              {activeConv?.tipo === 'grupo' ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sol-300 to-sol-500 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
              ) : (
                <AvatarPlaceholder nombre={activeConv?.nombre || ''} size="sm" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutro-carbon font-outfit truncate">{activeConv?.nombre}</p>
                {activeConv?.tipo === 'grupo' && (
                  <p className="text-xs text-neutro-piedra/70 font-outfit">
                    {activeConv.participantes.length} participantes
                  </p>
                )}
              </div>
            </div>

            {/* Mensajes */}
            <div
              ref={msgContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
            >
              {/* Cargar más */}
              {hayMas && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={() => {
                      const primero = mensajes[0]?.created_at;
                      if (primero && activeId) fetchMensajes(activeId, primero);
                    }}
                    className="px-4 py-2 bg-white/70 border border-white/60 rounded-full text-sm text-neutro-piedra hover:bg-white transition-colors font-outfit"
                  >
                    <ChevronDown className="w-3 h-3 inline mr-1" />
                    Cargar mensajes anteriores
                  </button>
                </div>
              )}

              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crecimiento-500" />
                </div>
              )}

              {mensajes.map((msg, idx) => {
                const esPropio = msg.emisor_id === user?.id;
                const esMismoDia = idx > 0 && new Date(mensajes[idx - 1].created_at).toDateString() === new Date(msg.created_at).toDateString();
                const esMismoEmisor = idx > 0 && mensajes[idx - 1].emisor_id === msg.emisor_id && esMismoDia;

                return (
                  <div key={msg.id}>
                    {/* Separador de fecha */}
                    {!esMismoDia && (
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-neutro-piedra/15" />
                        <span className="text-[10px] text-neutro-piedra/60 font-outfit whitespace-nowrap">
                          {new Date(msg.created_at).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </span>
                        <div className="flex-1 h-px bg-neutro-piedra/15" />
                      </div>
                    )}

                    {/* Sistema */}
                    {msg.tipo === 'sistema' && (
                      <div className="text-center text-xs text-neutro-piedra/60 font-outfit py-1">{msg.contenido}</div>
                    )}

                    {/* Sticker */}
                    {msg.tipo === 'sticker' && (
                      <div className={`flex ${esPropio ? 'justify-end' : 'justify-start'} my-1`}>
                        <div
                          className="text-4xl select-none cursor-default relative group"
                          onContextMenu={e => { e.preventDefault(); setMenuMsgId(msg.id); }}
                        >
                          {msg.contenido}
                          <span className="absolute -bottom-4 right-0 text-[10px] text-neutro-piedra/50 font-outfit opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatHora(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Texto */}
                    {msg.tipo === 'texto' && (
                      <div className={`flex ${esPropio ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 ${esMismoEmisor ? 'mt-0.5' : 'mt-2'}`}>
                        {/* Avatar (solo si no es el mismo emisor consecutivo) */}
                        {!esPropio && (
                          <div className="w-7 flex-shrink-0">
                            {!esMismoEmisor && (
                              <AvatarPlaceholder nombre={msg.perfiles?.nombre_completo || '?'} size="sm" />
                            )}
                          </div>
                        )}

                        <div className={`max-w-[70%] group relative ${esPropio ? 'items-end' : 'items-start'} flex flex-col`}>
                          {/* Nombre (grupos, primer mensaje del emisor) */}
                          {!esPropio && !esMismoEmisor && activeConv?.tipo === 'grupo' && (
                            <p className="text-[10px] font-semibold text-crecimiento-700 ml-1 mb-0.5 font-outfit">
                              {msg.perfiles?.nombre_completo}
                            </p>
                          )}

                          {/* Burbuja */}
                          {editandoId === msg.id ? (
                            <div className="flex gap-2 items-center">
                              <input
                                ref={inputEditRef}
                                value={textoEditado}
                                onChange={e => setTextoEditado(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') { setEditandoId(null); }}}
                                className="rounded-2xl px-3 py-2 text-sm bg-white border border-crecimiento-300 focus:outline-none focus:ring-2 focus:ring-crecimiento-300 font-outfit min-h-[40px]"
                                autoFocus
                              />
                              <button onClick={guardarEdicion} className="p-1.5 bg-crecimiento-500 text-white rounded-xl hover:bg-crecimiento-600">
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditandoId(null)} className="p-1.5 bg-neutro-lienzo rounded-xl hover:bg-neutro-piedra/10">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed font-outfit cursor-default ${
                                esPropio
                                  ? 'bg-crecimiento-500 text-white rounded-br-md'
                                  : 'bg-white/80 border border-white/60 text-neutro-carbon rounded-bl-md'
                              } ${msg.eliminado_at ? 'opacity-60 italic' : ''}`}
                              onContextMenu={e => { e.preventDefault(); setMenuMsgId(msg.id); }}
                            >
                              {msg.contenido}

                              {/* Context menu button — hover */}
                              <button
                                onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                                className={`absolute top-1 ${esPropio ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md ${esPropio ? 'hover:bg-white/20' : 'hover:bg-neutro-lienzo'}`}
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Hora + editado */}
                          <div className={`flex items-center gap-1 mt-0.5 px-1 ${esPropio ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-neutro-piedra/50 font-outfit">{formatHora(msg.created_at)}</span>
                            {msg.editado_at && <span className="text-[10px] text-neutro-piedra/40 font-outfit">· editado</span>}
                          </div>

                          {/* Context menu */}
                          {menuMsgId === msg.id && !msg.eliminado_at && (
                            <div
                              className={`absolute top-full mt-1 z-10 bg-white rounded-2xl shadow-xl border border-white/60 py-1.5 min-w-[140px] ${esPropio ? 'right-0' : 'left-0'}`}
                              onMouseLeave={() => setMenuMsgId(null)}
                            >
                              {esPropio && msg.tipo === 'texto' && (
                                <button
                                  onClick={() => { setEditandoId(msg.id); setTextoEditado(msg.contenido); setMenuMsgId(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutro-carbon hover:bg-crecimiento-50 font-outfit transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-crecimiento-600" />
                                  Editar
                                </button>
                              )}
                              {(esPropio || ['director', 'admin'].includes(perfil?.rol || '')) && (
                                <button
                                  onClick={() => eliminarMensaje(msg.id)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-impulso-600 hover:bg-impulso-50 font-outfit transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Eliminar
                                </button>
                              )}
                              {!esPropio && (
                                <button
                                  onClick={() => reportarMensaje(msg.id)}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-sol-700 hover:bg-sol-50 font-outfit transition-colors"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                  Reportar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input área */}
            <div className="px-4 py-3 border-t border-white/60 flex-shrink-0 bg-white/30 relative">
              {/* Sticker picker */}
              {mostrarStickers && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl p-3">
                  <div className="grid grid-cols-10 gap-1">
                    {STICKERS.map(s => (
                      <button
                        key={s}
                        onClick={() => enviarMensaje(s, 'sticker')}
                        className="text-2xl p-1.5 hover:bg-crecimiento-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMostrarStickers(!mostrarStickers)}
                  className={`p-2.5 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 ${mostrarStickers ? 'bg-crecimiento-100 text-crecimiento-600' : 'hover:bg-neutro-lienzo/50 text-neutro-piedra'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(texto); }}}
                  placeholder="Escribí un mensaje..."
                  className="flex-1 px-4 py-2.5 bg-neutro-lienzo/50 rounded-2xl text-sm text-neutro-carbon placeholder-neutro-piedra/50 font-outfit focus:outline-none focus:ring-2 focus:ring-crecimiento-300 min-h-[44px]"
                />

                <button
                  onClick={() => enviarMensaje(texto)}
                  disabled={!texto.trim() || enviando}
                  className="p-2.5 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ Close sticker picker on outside click ══════════════ */}
      {mostrarStickers && (
        <div className="fixed inset-0 z-0" onClick={() => setMostrarStickers(false)} />
      )}

      {/* ═══ Modal: Nuevo DM ════════════════════════════════════ */}
      {modalDM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-carbon/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutro-lienzo">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutro-carbon font-quicksand">Nuevo mensaje directo</h2>
                <button onClick={() => setModalDM(false)} className="p-2 hover:bg-neutro-lienzo rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutro-piedra/50" />
                <input
                  autoFocus
                  type="text"
                  value={busquedaUser}
                  onChange={e => setBusquedaUser(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full pl-9 pr-3 py-2.5 bg-neutro-lienzo/50 rounded-xl text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-crecimiento-300 min-h-[44px]"
                />
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {loadingUsers && <p className="text-center text-sm text-neutro-piedra font-outfit py-4">Buscando...</p>}
                {!loadingUsers && busquedaUser && usuariosBusqueda.length === 0 && (
                  <p className="text-center text-sm text-neutro-piedra font-outfit py-4">Sin resultados</p>
                )}
                {usuariosBusqueda.map(u => (
                  <button
                    key={u.id}
                    onClick={() => crearDM(u.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-crecimiento-50 rounded-2xl transition-colors min-h-[56px]"
                  >
                    <AvatarPlaceholder nombre={u.nombre_completo} size="sm" />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-neutro-carbon font-outfit truncate">{u.nombre_completo}</p>
                      <p className="text-xs text-neutro-piedra/70 font-outfit">{u.rol}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modal: Nuevo grupo ══════════════════════════════════ */}
      {modalGrupo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-carbon/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutro-lienzo flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutro-carbon font-quicksand">Nuevo grupo</h2>
                <button onClick={() => setModalGrupo(false)} className="p-2 hover:bg-neutro-lienzo rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <input
                type="text"
                value={nombreGrupo}
                onChange={e => setNombreGrupo(e.target.value)}
                placeholder="Nombre del grupo *"
                className="w-full px-4 py-2.5 bg-neutro-lienzo/50 rounded-xl text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-crecimiento-300 min-h-[44px]"
              />
              <input
                type="text"
                value={descGrupo}
                onChange={e => setDescGrupo(e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full px-4 py-2.5 bg-neutro-lienzo/50 rounded-xl text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-crecimiento-300 min-h-[44px]"
              />

              {/* Seleccionados */}
              {seleccionados.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {seleccionados.map(u => (
                    <span key={u.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-crecimiento-100 text-crecimiento-800 rounded-full text-xs font-outfit">
                      {u.nombre_completo}
                      <button onClick={() => setSeleccionados(prev => prev.filter(x => x.id !== u.id))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Buscar usuarios */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutro-piedra/50" />
                <input
                  type="text"
                  value={busquedaUser}
                  onChange={e => setBusquedaUser(e.target.value)}
                  placeholder="Agregar participantes..."
                  className="w-full pl-9 pr-3 py-2.5 bg-neutro-lienzo/50 rounded-xl text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-crecimiento-300 min-h-[44px]"
                />
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {usuariosBusqueda.filter(u => !seleccionados.find(s => s.id === u.id)).map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSeleccionados(prev => [...prev, u])}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-crecimiento-50 rounded-xl transition-colors min-h-[48px]"
                  >
                    <AvatarPlaceholder nombre={u.nombre_completo} size="sm" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-neutro-carbon font-outfit">{u.nombre_completo}</p>
                      <p className="text-xs text-neutro-piedra/70 font-outfit">{u.rol}</p>
                    </div>
                    <Plus className="w-4 h-4 text-crecimiento-500 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-neutro-lienzo flex-shrink-0">
              <button
                onClick={crearGrupo}
                disabled={!nombreGrupo.trim() || seleccionados.length === 0}
                className="w-full py-3 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-2xl font-semibold font-outfit text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
              >
                Crear grupo ({seleccionados.length} participantes)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
