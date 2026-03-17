'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flag, Shield, Trash2, Check, Plus, X, AlertTriangle } from 'lucide-react';

interface Reporte {
  id: string;
  motivo: string | null;
  resuelto: boolean;
  created_at: string;
  reportado_por: string;
  resuelto_at: string | null;
  perfiles: { nombre_completo: string } | null;
  mensajes: {
    id: string;
    contenido: string;
    tipo: string;
    emisor_id: string;
    created_at: string;
    eliminado_at: string | null;
    conversacion_id: string;
    perfiles: { nombre_completo: string } | null;
  } | null;
}

interface Palabra {
  id: string;
  palabra: string;
  created_at: string;
  perfiles: { nombre_completo: string } | null;
}

type Tab = 'reportes' | 'palabras';

const ROLES_ADMIN = ['director', 'admin'];

export default function AdminMensajesPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('reportes');
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [palabras, setPalabras] = useState<Palabra[]>([]);
  const [loading, setLoading] = useState(true);
  const [soloSinResolver, setSoloSinResolver] = useState(true);

  // Nueva palabra
  const [nuevaPalabra, setNuevaPalabra] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [errorPalabra, setErrorPalabra] = useState('');

  if (!authLoading && perfil && !ROLES_ADMIN.includes(perfil.rol)) {
    router.push('/dashboard');
  }

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/mensajes/reportes');
    const data = await res.json();
    setReportes(data.reportes || []);
    setLoading(false);
  }, []);

  const fetchPalabras = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/mensajes/palabras');
    const data = await res.json();
    setPalabras(data.palabras || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (tab === 'reportes') fetchReportes();
    else fetchPalabras();
  }, [user, tab, fetchReportes, fetchPalabras]);

  const resolverReporte = async (id: string, accion: 'resolver' | 'eliminar_mensaje') => {
    await fetch('/api/admin/mensajes/reportes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, accion }),
    });
    fetchReportes();
  };

  const eliminarPalabra = async (id: string) => {
    await fetch(`/api/admin/mensajes/palabras/${id}`, { method: 'DELETE' });
    setPalabras(prev => prev.filter(p => p.id !== id));
  };

  const agregarPalabra = async () => {
    if (!nuevaPalabra.trim()) return;
    setAgregando(true);
    setErrorPalabra('');
    const res = await fetch('/api/admin/mensajes/palabras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ palabra: nuevaPalabra }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorPalabra(data.error || 'Error');
    } else {
      setPalabras(prev => [data.palabra, ...prev]);
      setNuevaPalabra('');
    }
    setAgregando(false);
  };

  const reportesFiltrados = soloSinResolver ? reportes.filter(r => !r.resuelto) : reportes;
  const pendientes = reportes.filter(r => !r.resuelto).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 hover:bg-white/50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutro-piedra" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutro-carbon font-quicksand">
            🛡️ Moderación de Mensajes
          </h1>
          <p className="text-sm text-neutro-piedra font-outfit">
            Reportes y filtro de palabras prohibidas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl p-1.5 w-fit">
        <button
          onClick={() => setTab('reportes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium font-outfit transition-colors min-h-[44px] ${tab === 'reportes' ? 'bg-impulso-500 text-white shadow-sm' : 'text-neutro-piedra hover:text-neutro-carbon'}`}
        >
          <Flag className="w-4 h-4" />
          Reportes
          {pendientes > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === 'reportes' ? 'bg-white/30 text-white' : 'bg-impulso-100 text-impulso-700'}`}>
              {pendientes}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('palabras')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium font-outfit transition-colors min-h-[44px] ${tab === 'palabras' ? 'bg-neutro-carbon text-white shadow-sm' : 'text-neutro-piedra hover:text-neutro-carbon'}`}
        >
          <Shield className="w-4 h-4" />
          Palabras prohibidas
          {palabras.length > 0 && <span className="text-[10px] opacity-60">({palabras.length})</span>}
        </button>
      </div>

      {/* ── Tab Reportes ── */}
      {tab === 'reportes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutro-piedra font-outfit">
              {reportesFiltrados.length} {soloSinResolver ? 'pendiente(s)' : `de ${reportes.length} total(es)`}
            </p>
            <button
              onClick={() => setSoloSinResolver(!soloSinResolver)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-outfit transition-colors border min-h-[40px] ${soloSinResolver ? 'bg-sol-100 border-sol-300 text-sol-800' : 'bg-white/60 border-white/60 text-neutro-piedra'}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {soloSinResolver ? 'Solo pendientes' : 'Todos'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-impulso-500" />
            </div>
          ) : reportesFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl">
              <Flag className="w-12 h-12 text-neutro-piedra/25 mx-auto mb-3" />
              <p className="text-neutro-piedra font-outfit">
                {soloSinResolver ? 'No hay reportes pendientes 🎉' : 'No hay reportes'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportesFiltrados.map(rep => (
                <div
                  key={rep.id}
                  className={`bg-white/70 backdrop-blur-sm border rounded-2xl p-5 space-y-3 ${rep.resuelto ? 'border-crecimiento-200 opacity-70' : 'border-impulso-200'}`}
                >
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {rep.resuelto ? (
                        <Check className="w-5 h-5 text-crecimiento-500 flex-shrink-0" />
                      ) : (
                        <Flag className="w-5 h-5 text-impulso-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-neutro-carbon font-outfit">
                          Reportado por: {rep.perfiles?.nombre_completo || '—'}
                        </p>
                        <p className="text-xs text-neutro-piedra/70 font-outfit">
                          {new Date(rep.created_at).toLocaleString('es-AR')}
                          {rep.motivo && <> · {rep.motivo}</>}
                        </p>
                      </div>
                    </div>
                    {rep.resuelto && (
                      <span className="px-2.5 py-1 bg-crecimiento-100 text-crecimiento-700 rounded-full text-xs font-outfit">
                        Resuelto
                      </span>
                    )}
                  </div>

                  {/* Mensaje reportado */}
                  {rep.mensajes && (
                    <div className={`rounded-xl p-3.5 text-sm font-outfit border ${rep.mensajes.eliminado_at ? 'bg-neutro-lienzo/50 border-neutro-piedra/10 italic text-neutro-piedra' : 'bg-impulso-50 border-impulso-100 text-neutro-carbon'}`}>
                      <p className="text-xs text-neutro-piedra/60 mb-1">
                        Mensaje de: <strong>{rep.mensajes.perfiles?.nombre_completo || '—'}</strong>
                        {' · '}{new Date(rep.mensajes.created_at).toLocaleString('es-AR')}
                      </p>
                      {rep.mensajes.eliminado_at
                        ? '🗑️ Mensaje ya eliminado'
                        : rep.mensajes.tipo === 'sticker'
                          ? `Sticker: ${rep.mensajes.contenido}`
                          : `"${rep.mensajes.contenido}"`
                      }
                    </div>
                  )}

                  {/* Acciones */}
                  {!rep.resuelto && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => resolverReporte(rep.id, 'resolver')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-crecimiento-500 text-white rounded-xl text-xs font-outfit hover:bg-crecimiento-600 transition-colors min-h-[40px]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Resolver (mantener mensaje)
                      </button>
                      {!rep.mensajes?.eliminado_at && (
                        <button
                          onClick={() => resolverReporte(rep.id, 'eliminar_mensaje')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-impulso-500 text-white rounded-xl text-xs font-outfit hover:bg-impulso-600 transition-colors min-h-[40px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar mensaje
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Palabras ── */}
      {tab === 'palabras' && (
        <div className="space-y-4">
          {/* Agregar nueva */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-neutro-carbon font-quicksand text-sm">Agregar palabra prohibida</h3>
            <p className="text-xs text-neutro-piedra/70 font-outfit">
              Las palabras se reemplazan automáticamente con *** en los mensajes enviados. No diferencia mayúsculas/minúsculas.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaPalabra}
                onChange={e => { setNuevaPalabra(e.target.value); setErrorPalabra(''); }}
                onKeyDown={e => { if (e.key === 'Enter') agregarPalabra(); }}
                placeholder="Ej: mala_palabra"
                className="flex-1 px-4 py-2.5 bg-white border border-neutro-piedra/20 rounded-xl text-sm font-outfit focus:outline-none focus:ring-2 focus:ring-crecimiento-300 min-h-[44px]"
              />
              <button
                onClick={agregarPalabra}
                disabled={agregando || !nuevaPalabra.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-xl text-sm font-outfit transition-colors disabled:opacity-40 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            {errorPalabra && (
              <p className="text-xs text-impulso-600 font-outfit">{errorPalabra}</p>
            )}
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neutro-carbon/30" />
            </div>
          ) : palabras.length === 0 ? (
            <div className="text-center py-12 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl">
              <Shield className="w-10 h-10 text-neutro-piedra/25 mx-auto mb-2" />
              <p className="text-neutro-piedra font-outfit text-sm">Sin palabras prohibidas configuradas</p>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_140px_40px] gap-4 px-5 py-3 bg-neutro-lienzo/40 border-b border-white/60 text-xs font-semibold text-neutro-piedra font-outfit uppercase tracking-wide">
                <span>Palabra</span>
                <span>Agregada por</span>
                <span></span>
              </div>
              <ul className="divide-y divide-white/40">
                {palabras.map(p => (
                  <li key={p.id} className="grid grid-cols-[1fr_140px_40px] gap-4 items-center px-5 py-3.5">
                    <code className="text-sm font-mono text-neutro-carbon bg-neutro-lienzo/60 px-2 py-0.5 rounded-lg w-fit">
                      {p.palabra}
                    </code>
                    <span className="text-xs text-neutro-piedra/70 font-outfit truncate">
                      {p.perfiles?.nombre_completo || '—'}
                    </span>
                    <button
                      onClick={() => eliminarPalabra(p.id)}
                      className="p-2 hover:bg-impulso-50 rounded-xl text-neutro-piedra/50 hover:text-impulso-600 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
