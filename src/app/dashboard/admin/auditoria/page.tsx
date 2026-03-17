'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  ArrowLeft, Search, Filter, Clock, User, Database, ChevronLeft,
  ChevronRight, Eye, RefreshCw,
} from 'lucide-react';

interface AuditLog {
  id: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  usuario_rol: string | null;
  accion: string;
  tabla: string | null;
  registro_id: string | null;
  descripcion: string;
  datos_previos: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Paleta de colores por acción ─────────────────────────────
const COLORES_ACCION: Record<string, string> = {
  crear:           'bg-crecimiento-100 text-crecimiento-800 border-crecimiento-200',
  editar:          'bg-blue-100 text-blue-800 border-blue-200',
  eliminar:        'bg-impulso-100 text-impulso-800 border-impulso-200',
  login:           'bg-purple-100 text-purple-800 border-purple-200',
  asignar:         'bg-sol-100 text-sol-800 border-sol-200',
  desasignar:      'bg-orange-100 text-orange-800 border-orange-200',
  exportar:        'bg-teal-100 text-teal-800 border-teal-200',
  acepto_terminos: 'bg-green-100 text-green-800 border-green-200',
};

const colorAccion = (accion: string) =>
  COLORES_ACCION[accion] || 'bg-neutro-lienzo text-neutro-carbon border-neutro-piedra/20';

const ICONOS_ACCION: Record<string, string> = {
  crear: '✚', editar: '✏️', eliminar: '🗑️', login: '🔑',
  asignar: '🔗', desasignar: '✂️', exportar: '📤', acepto_terminos: '✅',
};

const ACCIONES = ['', 'crear', 'editar', 'eliminar', 'login', 'asignar', 'desasignar', 'exportar', 'acepto_terminos'];
const TABLAS   = ['', 'ninos', 'sesiones', 'asignaciones', 'perfiles', 'documentos', 'zonas', 'planes_intervencion'];

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)   return 'Hace un momento';
  if (min < 60)  return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7)     return `Hace ${d} días`;
  return formatFecha(iso);
}

// ─── Componente de detalle JSON ──────────────────────────────
function JsonPanel({ data, label }: { data: Record<string, unknown> | null; label: string }) {
  if (!data) return <p className="text-xs text-neutro-piedra/60 italic">— ninguno —</p>;
  return (
    <pre className="text-xs bg-neutro-lienzo/50 rounded-xl p-3 overflow-auto max-h-48 font-mono text-neutro-carbon/70 leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function AuditoriaPage() {
  const router = useRouter();
  const { user, perfil, loading: authLoading } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');
  const [filtroDesdeFecha, setFiltroDesdeFecha] = useState('');
  const [filtroHastaFecha, setFiltroHastaFecha] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Log seleccionado para ver detalle
  const [logDetalle, setLogDetalle] = useState<AuditLog | null>(null);

  const rolesPermitidos = ['director', 'admin', 'psicopedagogia', 'equipo_profesional'];
  const tieneAcceso = perfil?.rol && rolesPermitidos.includes(perfil.rol);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (busqueda)        params.set('q', busqueda);
      if (filtroAccion)    params.set('accion', filtroAccion);
      if (filtroTabla)     params.set('tabla', filtroTabla);
      if (filtroDesdeFecha) params.set('desde', filtroDesdeFecha + 'T00:00:00');
      if (filtroHastaFecha) params.set('hasta', filtroHastaFecha + 'T23:59:59');

      const res = await fetch(`/api/admin/auditoria?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, busqueda, filtroAccion, filtroTabla, filtroDesdeFecha, filtroHastaFecha]);

  useEffect(() => {
    if (user && tieneAcceso) fetchLogs();
  }, [user, tieneAcceso, fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [busqueda, filtroAccion, filtroTabla, filtroDesdeFecha, filtroHastaFecha]);

  if (!authLoading && user && !tieneAcceso) {
    router.push('/dashboard');
    return null;
  }

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroAccion('');
    setFiltroTabla('');
    setFiltroDesdeFecha('');
    setFiltroHastaFecha('');
  };

  const hayFiltros = busqueda || filtroAccion || filtroTabla || filtroDesdeFecha || filtroHastaFecha;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-white/50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutro-piedra" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutro-carbon font-quicksand">
              🔍 Log de Auditoría
            </h1>
            <p className="text-sm text-neutro-piedra font-outfit">
              Historial de cambios en el sistema — {total} registros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/70 border border-white/60 rounded-2xl text-neutro-carbon hover:bg-white transition-colors text-sm font-outfit min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-outfit min-h-[44px] transition-colors border ${
              hayFiltros
                ? 'bg-crecimiento-500 text-white border-crecimiento-500'
                : 'bg-white/70 border-white/60 text-neutro-carbon hover:bg-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros {hayFiltros && `(${[busqueda, filtroAccion, filtroTabla, filtroDesdeFecha, filtroHastaFecha].filter(Boolean).length})`}
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutro-piedra/60" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar en descripción..."
          className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl text-neutro-carbon placeholder-neutro-piedra/50 font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-crecimiento-300 min-h-[48px]"
        />
      </div>

      {/* Panel de filtros avanzados */}
      {mostrarFiltros && (
        <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutro-piedra mb-1.5 font-outfit">Acción</label>
              <select
                value={filtroAccion}
                onChange={(e) => setFiltroAccion(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-neutro-piedra/20 rounded-xl text-neutro-carbon font-outfit text-sm focus:outline-none min-h-[44px]"
              >
                <option value="">Todas las acciones</option>
                {ACCIONES.filter(a => a).map(a => (
                  <option key={a} value={a}>{ICONOS_ACCION[a] || ''} {a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutro-piedra mb-1.5 font-outfit">Entidad</label>
              <select
                value={filtroTabla}
                onChange={(e) => setFiltroTabla(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-neutro-piedra/20 rounded-xl text-neutro-carbon font-outfit text-sm focus:outline-none min-h-[44px]"
              >
                <option value="">Todas las entidades</option>
                {TABLAS.filter(t => t).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutro-piedra mb-1.5 font-outfit">Desde</label>
              <input
                type="date"
                value={filtroDesdeFecha}
                onChange={(e) => setFiltroDesdeFecha(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-neutro-piedra/20 rounded-xl text-neutro-carbon font-outfit text-sm focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutro-piedra mb-1.5 font-outfit">Hasta</label>
              <input
                type="date"
                value={filtroHastaFecha}
                onChange={(e) => setFiltroHastaFecha(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-neutro-piedra/20 rounded-xl text-neutro-carbon font-outfit text-sm focus:outline-none min-h-[44px]"
              />
            </div>
          </div>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-impulso-600 hover:text-impulso-700 font-outfit underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Tabla / Cards */}
      <div className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crecimiento-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-12 h-12 text-neutro-piedra/30 mx-auto mb-3" />
            <p className="text-neutro-piedra font-outfit">Sin registros de auditoría{hayFiltros ? ' para los filtros aplicados' : ''}</p>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="mt-2 text-sm text-crecimiento-600 hover:underline font-outfit">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Encabezado — desktop */}
            <div className="hidden md:grid grid-cols-[140px_1fr_100px_100px_40px] gap-4 px-5 py-3 bg-neutro-lienzo/50 border-b border-white/60 text-xs font-semibold text-neutro-piedra font-outfit uppercase tracking-wide">
              <span>Fecha</span>
              <span>Descripción</span>
              <span>Acción</span>
              <span>Entidad</span>
              <span></span>
            </div>

            <ul className="divide-y divide-white/40">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="grid grid-cols-1 md:grid-cols-[140px_1fr_100px_100px_40px] gap-3 md:gap-4 items-center px-5 py-4 hover:bg-sol-50/30 transition-colors"
                >
                  {/* Fecha */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-neutro-piedra/50 flex-shrink-0 hidden md:block" />
                    <div className="min-w-0">
                      <p className="text-xs text-neutro-carbon font-outfit">{formatRelativo(log.created_at)}</p>
                      <p className="text-[10px] text-neutro-piedra/60 font-outfit">{formatFecha(log.created_at)}</p>
                    </div>
                  </div>

                  {/* Descripción + usuario */}
                  <div className="min-w-0">
                    <p className="text-sm text-neutro-carbon font-outfit leading-snug truncate">{log.descripcion}</p>
                    {log.usuario_nombre && (
                      <p className="text-xs text-neutro-piedra/70 font-outfit flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 flex-shrink-0" />
                        {log.usuario_nombre}
                        {log.usuario_rol && <span className="opacity-60">· {log.usuario_rol}</span>}
                      </p>
                    )}
                  </div>

                  {/* Acción badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border font-outfit ${colorAccion(log.accion)}`}>
                      {ICONOS_ACCION[log.accion] || '·'} {log.accion}
                    </span>
                  </div>

                  {/* Tabla */}
                  <div>
                    {log.tabla && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neutro-lienzo/70 text-neutro-piedra border border-neutro-piedra/15 font-outfit">
                        <Database className="w-3 h-3" />
                        {log.tabla}
                      </span>
                    )}
                  </div>

                  {/* Ver detalle */}
                  <button
                    onClick={() => setLogDetalle(log)}
                    className="p-2 hover:bg-crecimiento-50 rounded-xl transition-colors text-neutro-piedra hover:text-crecimiento-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Paginación */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/60 bg-neutro-lienzo/30">
              <p className="text-xs text-neutro-piedra font-outfit">
                Mostrando {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} de {total} registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-white/60 bg-white/50 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-outfit text-neutro-carbon min-w-[80px] text-center">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl border border-white/60 bg-white/50 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de detalle */}
      {logDetalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-carbon/40 backdrop-blur-sm p-4"
          onClick={() => setLogDetalle(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-neutro-lienzo">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-neutro-carbon font-quicksand">Detalle del evento</h2>
                  <p className="text-sm text-neutro-piedra font-outfit mt-0.5">{formatFecha(logDetalle.created_at)}</p>
                </div>
                <button
                  onClick={() => setLogDetalle(null)}
                  className="p-2 hover:bg-neutro-lienzo rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-neutro-piedra uppercase tracking-wide font-outfit mb-1">Acción</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorAccion(logDetalle.accion)}`}>
                    {ICONOS_ACCION[logDetalle.accion] || '·'} {logDetalle.accion}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutro-piedra uppercase tracking-wide font-outfit mb-1">Entidad</p>
                  <p className="text-sm text-neutro-carbon font-outfit">{logDetalle.tabla || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutro-piedra uppercase tracking-wide font-outfit mb-1">Usuario</p>
                  <p className="text-sm text-neutro-carbon font-outfit">{logDetalle.usuario_nombre || '—'}</p>
                  <p className="text-xs text-neutro-piedra/70 font-outfit">{logDetalle.usuario_rol || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutro-piedra uppercase tracking-wide font-outfit mb-1">ID del registro</p>
                  <p className="text-xs text-neutro-carbon font-mono break-all">{logDetalle.registro_id || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutro-piedra uppercase tracking-wide font-outfit mb-1">Descripción</p>
                <p className="text-sm text-neutro-carbon font-outfit">{logDetalle.descripcion}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutro-piedra uppercase tracking-wide font-outfit mb-2">Datos previos</p>
                <JsonPanel data={logDetalle.datos_previos} label="previos" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutro-piedra uppercase tracking-wide font-outfit mb-2">Datos nuevos</p>
                <JsonPanel data={logDetalle.datos_nuevos} label="nuevos" />
              </div>

              {logDetalle.ip_address && (
                <p className="text-xs text-neutro-piedra/60 font-outfit">IP: {logDetalle.ip_address}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
