'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { calcularEdad, formatearEdad } from '@/lib/utils/date-helpers';
import {
  ArrowLeft, Plus, BookOpen, ClipboardList, Target, Info, ChevronRight,
  UserCheck, Camera, Heart, GraduationCap, Phone, StickyNote, Calendar,
  Users, CheckCircle, XCircle, Upload, Trash2, Save, Stethoscope,
  Mic, Volume2, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Nino, NinoSensible, Zona, Escuela, Perfil, FamiliarApoyo } from '@/types/database';

// ─── Types ───────────────────────────────────────────────────

interface NinoCompleto extends Nino {
  zonas: Pick<Zona, 'id' | 'nombre'> | null;
  escuelas: Pick<Escuela, 'id' | 'nombre'> | null;
  ninos_sensibles: NinoSensible | null;
}

interface Sesion {
  id: string;
  fecha: string;
  duracion_minutos: number;
  observaciones_libres: string;
  voluntario_id: string;
}

interface AsignacionActiva {
  id: string;
  fecha_asignacion: string;
  score_matching: number | null;
  voluntario: Pick<Perfil, 'id' | 'nombre' | 'apellido'> | null;
}

interface NotaBitacora {
  id: string;
  texto: string;
  fecha: string;
  autor_nombre: string;
}

interface GrabacionReunion {
  id: string;
  storage_path: string;
  transcripcion: string | null;
  duracion_segundos: number | null;
  fecha_grabacion: string;
  entrevista_conclusiones: string | null;
  autor_nombre: string;
}

const TIPOS_TERAPIA = [
  { value: 'psicologica', label: 'Psicológica' },
  { value: 'fonoaudiologica', label: 'Fonoaudiológica' },
  { value: 'psicopedagogica', label: 'Psicopedagógica' },
  { value: 'ocupacional', label: 'Ocupacional' },
  { value: 'otra', label: 'Otra' },
];

// ─── Component ───────────────────────────────────────────────

export default function NinoPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const { user, perfil } = useAuth();
  const ninoId = params.ninoId as string;
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // State
  const [nino, setNino] = useState<NinoCompleto | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [asignacionActiva, setAsignacionActiva] = useState<AsignacionActiva | null>(null);
  const [familiares, setFamiliares] = useState<FamiliarApoyo[]>([]);
  const [notas, setNotas] = useState<NotaBitacora[]>([]);
  const [grabaciones, setGrabaciones] = useState<GrabacionReunion[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [asistenciaPorcentaje, setAsistenciaPorcentaje] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    total_sesiones: 0,
    mis_sesiones: 0,
    horas_totales: 0,
    primera_sesion: null as string | null,
    ultima_sesion: null as string | null,
  });

  // Editable fields (only for roles with full access)
  const [editPermanencia, setEditPermanencia] = useState<boolean>(true);
  const [editAnoPermanencia, setEditAnoPermanencia] = useState<number>(new Date().getFullYear());
  const [editTerapia, setEditTerapia] = useState<string[]>([]);

  const isVoluntario = perfil?.rol === 'voluntario';
  const tieneAccesoCompleto = perfil?.rol && ['psicopedagogia', 'director', 'admin', 'coordinador', 'trabajadora_social'].includes(perfil.rol);

  useEffect(() => {
    if (user) fetchDatos();
  }, [ninoId, user]);

  // ─── Data fetching ─────────────────────────────────────────

  const fetchDatos = async () => {
    try {
      setLoading(true);

      // 1. Niño with relations
      const selectFields = tieneAccesoCompleto
        ? `*, zonas(id, nombre), escuelas(id, nombre), ninos_sensibles(*)`
        : `*, zonas(id, nombre), escuelas(id, nombre)`;

      const { data: ninoData, error: ninoError } = await supabase
        .from('ninos')
        .select(selectFields)
        .eq('id', ninoId)
        .single();

      if (ninoError) throw ninoError;
      const ninoCompleto = ninoData as NinoCompleto;
      setNino(ninoCompleto);

      // Init editable fields from nino data
      setEditPermanencia(ninoCompleto.activo);
      setEditAnoPermanencia(new Date().getFullYear());
      // terapia is stored as a JSON array in the ninos_sensibles or as a separate column; 
      // we'll use a convention: stored in nino's metadata-free approach

      // 2. Active assignment
      const { data: asignacionData } = await supabase
        .from('asignaciones')
        .select(`
          id, fecha_asignacion, score_matching,
          perfiles!asignaciones_voluntario_id_fkey (id, nombre, apellido)
        `)
        .eq('nino_id', ninoId)
        .eq('activa', true)
        .limit(1)
        .single();

      if (asignacionData) {
        setAsignacionActiva({
          id: asignacionData.id,
          fecha_asignacion: asignacionData.fecha_asignacion,
          score_matching: asignacionData.score_matching,
          voluntario: (asignacionData as any).perfiles || null,
        });
      }

      // 3. Familiares / contacts (only for full-access roles)
      if (tieneAccesoCompleto) {
        const { data: familiaresData } = await supabase
          .from('familiares_apoyo')
          .select('*')
          .eq('nino_id', ninoId)
          .order('tipo', { ascending: true });
        setFamiliares(familiaresData || []);
      }

      // 4. Sessions
      let sesionesQuery = supabase
        .from('sesiones')
        .select('id, fecha, duracion_minutos, observaciones_libres, voluntario_id')
        .eq('nino_id', ninoId)
        .order('fecha', { ascending: false });

      if (isVoluntario) {
        sesionesQuery = sesionesQuery.eq('voluntario_id', user?.id);
      }

      const { data: sesionesData, error: sesionesError } = await sesionesQuery;
      if (sesionesError) throw sesionesError;
      setSesiones(sesionesData || []);

      // 5. Stats
      const { count: totalSesiones } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .eq('nino_id', ninoId);

      const { count: misSesiones } = await supabase
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .eq('nino_id', ninoId)
        .eq('voluntario_id', user?.id);

      const horasTotales = (sesionesData || []).reduce(
        (acc: number, s: any) => acc + (s.duracion_minutos || 0), 0
      );
      const fechaOrdenada = [...(sesionesData || [])].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

      setEstadisticas({
        total_sesiones: totalSesiones || 0,
        mis_sesiones: misSesiones || 0,
        horas_totales: Math.round((horasTotales / 60) * 10) / 10,
        primera_sesion: fechaOrdenada[0]?.fecha || null,
        ultima_sesion: fechaOrdenada[fechaOrdenada.length - 1]?.fecha || null,
      });

      // 6. Asistencia %
      const { count: totalAsistencias } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('nino_id', ninoId);
      const { count: presentes } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .eq('nino_id', ninoId)
        .eq('presente', true);

      if (totalAsistencias && totalAsistencias > 0) {
        setAsistenciaPorcentaje(Math.round(((presentes || 0) / totalAsistencias) * 100));
      }

      // 7. Notas / bitácora — we store them as entrevistas with tipo='nota_bitacora' 
      //    or a dedicated light-weight approach. For now query entrevistas with tipo note.
      if (tieneAccesoCompleto) {
        const { data: notasData } = await supabase
          .from('entrevistas')
          .select('id, observaciones, fecha, entrevistador_id, perfiles:entrevistador_id(nombre, apellido)')
          .eq('nino_id', ninoId)
          .eq('tipo', 'nota_bitacora')
          .order('fecha', { ascending: false })
          .limit(20);

        if (notasData) {
          setNotas(
            notasData.map((n: any) => ({
              id: n.id,
              texto: n.observaciones || '',
              fecha: n.fecha,
              autor_nombre: n.perfiles
                ? `${n.perfiles.nombre} ${n.perfiles.apellido}`
                : 'Desconocido',
            }))
          );
        }

        // 8. Grabaciones de reuniones
        const { data: grabacionesData } = await supabase
          .from('grabaciones_voz')
          .select('id, storage_path, transcripcion, duracion_segundos, fecha_grabacion, entrevista_id, perfiles:usuario_id(nombre, apellido), entrevistas:entrevista_id(conclusiones)')
          .eq('nino_id', ninoId)
          .order('fecha_grabacion', { ascending: false })
          .limit(20);

        if (grabacionesData) {
          setGrabaciones(
            grabacionesData.map((g: any) => ({
              id: g.id,
              storage_path: g.storage_path,
              transcripcion: g.transcripcion,
              duracion_segundos: g.duracion_segundos,
              fecha_grabacion: g.fecha_grabacion,
              entrevista_conclusiones: g.entrevistas?.conclusiones || null,
              autor_nombre: g.perfiles
                ? `${g.perfiles.nombre} ${g.perfiles.apellido}`
                : 'Desconocido',
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching datos:', error);
      alert('Error al cargar los datos del niño');
      router.push('/dashboard/ninos');
    } finally {
      setLoading(false);
    }
  };

  // ─── Actions ───────────────────────────────────────────────

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !nino) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccioná una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }

    try {
      setSubiendoFoto(true);
      const ext = file.name.split('.').pop();
      const filePath = `ninos/${ninoId}/perfil.${ext}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('fotos-perfil')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(filePath);

      // Update nino record
      const { error: updateError } = await supabase
        .from('ninos')
        .update({ foto_perfil_url: urlData.publicUrl })
        .eq('id', ninoId);

      if (updateError) throw updateError;

      setNino({ ...nino, foto_perfil_url: urlData.publicUrl });
    } catch (error) {
      console.error('Error subiendo foto:', error);
      alert('Error al subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleGuardarNota = async () => {
    if (!nuevaNota.trim() || !user) return;

    try {
      setGuardando(true);
      const { data, error } = await supabase
        .from('entrevistas')
        .insert({
          nino_id: ninoId,
          entrevistador_id: user.id,
          tipo: 'nota_bitacora',
          fecha: new Date().toISOString().split('T')[0],
          observaciones: nuevaNota.trim(),
        })
        .select('id, observaciones, fecha')
        .single();

      if (error) throw error;

      setNotas([
        {
          id: data.id,
          texto: data.observaciones || '',
          fecha: data.fecha,
          autor_nombre: `${(perfil as any)?.nombre || (perfil as any)?.metadata?.nombre || ''} ${(perfil as any)?.apellido || (perfil as any)?.metadata?.apellido || ''}`.trim() || 'Yo',
        },
        ...notas,
      ]);
      setNuevaNota('');
    } catch (error) {
      console.error('Error guardando nota:', error);
      alert('Error al guardar la nota');
    } finally {
      setGuardando(false);
    }
  };

  const handleTogglePermanencia = async (valor: boolean) => {
    if (!nino) return;
    try {
      const { error } = await supabase
        .from('ninos')
        .update({ activo: valor })
        .eq('id', ninoId);
      if (error) throw error;
      setEditPermanencia(valor);
      setNino({ ...nino, activo: valor });
    } catch (error) {
      console.error('Error actualizando permanencia:', error);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatearFechaRelativa = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 7) return `Hace ${diff} días`;
    if (diff < 30) return `Hace ${Math.floor(diff / 7)} semanas`;
    return formatearFecha(fecha);
  };

  const getFamiliarPorTipo = (tipo: string) => familiares.filter((f) => f.tipo === tipo);
  const madre = getFamiliarPorTipo('madre')[0];
  const padre = getFamiliarPorTipo('padre')[0];
  const referenteEscolar = getFamiliarPorTipo('referente_escolar')[0];

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crecimiento-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!nino) return null;

  const edadTexto = formatearEdad(nino.fecha_nacimiento, nino.rango_etario);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* ═══ Header ═══ */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="text-crecimiento-600 hover:text-crecimiento-700 font-medium mb-3 flex items-center gap-2 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="flex items-start gap-4">
            {/* Foto de perfil */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-sol-200 to-crecimiento-200 flex items-center justify-center shadow-lg">
                {nino.foto_perfil_url ? (
                  <img
                    src={nino.foto_perfil_url}
                    alt={nino.alias}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {nino.alias.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {tieneAccesoCompleto && (
                <>
                  <button
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={subiendoFoto}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    title="Cambiar foto"
                  >
                    {subiendoFoto ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSubirFoto}
                  />
                </>
              )}
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
                {tieneAccesoCompleto && nino.ninos_sensibles?.nombre_completo_encrypted
                  ? `${nino.ninos_sensibles.nombre_completo_encrypted} ${nino.ninos_sensibles.apellido_encrypted || ''}`.trim()
                  : nino.alias}
              </h1>
              {tieneAccesoCompleto && nino.ninos_sensibles?.nombre_completo_encrypted && (
                <p className="text-sm text-gray-500 mb-1">
                  Alias: <span className="font-medium">{nino.alias}</span>
                </p>
              )}
              {nino.legajo && (
                <p className="text-sm text-gray-500 font-mono mb-2">Legajo: {nino.legajo}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {edadTexto && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-sol-100 text-sol-700 font-medium">
                    {edadTexto}
                  </span>
                )}
                {nino.fecha_nacimiento && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatearFecha(nino.fecha_nacimiento)}
                  </span>
                )}
                {nino.escolarizado && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crecimiento-100 text-crecimiento-700 font-medium">
                    <GraduationCap className="w-4 h-4" />
                    {nino.grado_escolar || 'Escolarizado'}
                  </span>
                )}
                {nino.zonas && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-impulso-100 text-impulso-700 font-medium">
                    {nino.zonas.nombre}
                  </span>
                )}
                {/* Permanencia badge */}
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${
                    nino.activo
                      ? 'bg-crecimiento-100 text-crecimiento-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {nino.activo ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Activo</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" /> Inactivo</>
                  )}
                </span>
                {/* Asistencia badge */}
                {asistenciaPorcentaje !== null && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                      asistenciaPorcentaje >= 75
                        ? 'bg-crecimiento-100 text-crecimiento-700'
                        : asistenciaPorcentaje >= 50
                        ? 'bg-sol-100 text-sol-700'
                        : 'bg-impulso-100 text-impulso-700'
                    }`}
                  >
                    Asistencia: {asistenciaPorcentaje}%
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex-shrink-0 flex gap-2">
              {!isVoluntario && (
                <button
                  onClick={() => router.push(`/dashboard/ninos/${ninoId}/asignar-voluntario`)}
                  className="px-4 py-2.5 bg-gradient-to-r from-impulso-400 to-crecimiento-500 hover:from-impulso-500 hover:to-crecimiento-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all touch-manipulation min-h-[44px] flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">Asignar</span>
                </button>
              )}
              <button
                onClick={() => router.push(`/dashboard/sesiones/nueva/${ninoId}`)}
                className="px-4 py-2.5 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all touch-manipulation min-h-[44px] flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nueva Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══ Estadísticas ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-xs text-gray-500 mb-1">Total Sesiones</p>
            <p className="text-3xl font-bold text-gray-900">{estadisticas.total_sesiones}</p>
          </div>
          {isVoluntario && (
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-xs text-gray-500 mb-1">Mis Sesiones</p>
              <p className="text-3xl font-bold text-crecimiento-600">{estadisticas.mis_sesiones}</p>
            </div>
          )}
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-xs text-gray-500 mb-1">Horas Totales</p>
            <p className="text-3xl font-bold text-gray-900">{estadisticas.horas_totales}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-xs text-gray-500 mb-1">Última Sesión</p>
            <p className="text-sm font-bold text-gray-900">
              {estadisticas.ultima_sesion
                ? formatearFechaRelativa(estadisticas.ultima_sesion)
                : 'Ninguna'}
            </p>
          </div>
          {asistenciaPorcentaje !== null && (
            <div className="bg-white rounded-xl p-4 shadow-md">
              <p className="text-xs text-gray-500 mb-1">Asistencia</p>
              <p className={`text-3xl font-bold ${
                asistenciaPorcentaje >= 75 ? 'text-crecimiento-600' :
                asistenciaPorcentaje >= 50 ? 'text-sol-600' : 'text-impulso-600'
              }`}>
                {asistenciaPorcentaje}%
              </p>
            </div>
          )}
        </div>

        {/* ═══ Datos sensibles (solo psico/director/admin) ═══ */}
        {tieneAccesoCompleto && nino.ninos_sensibles && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
              🔒 Datos Sensibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-0.5">Nombre completo</p>
                <p className="font-medium text-gray-900">{nino.ninos_sensibles.nombre_completo_encrypted}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Apellido</p>
                <p className="font-medium text-gray-900">{nino.ninos_sensibles.apellido_encrypted}</p>
              </div>
              {nino.ninos_sensibles.fecha_nacimiento_encrypted && (
                <div>
                  <p className="text-gray-500 mb-0.5">Fecha de nacimiento (sensible)</p>
                  <p className="font-medium text-gray-900">{nino.ninos_sensibles.fecha_nacimiento_encrypted}</p>
                </div>
              )}
              {nino.ninos_sensibles.dni_encrypted && (
                <div>
                  <p className="text-gray-500 mb-0.5">DNI</p>
                  <p className="font-medium text-gray-900">{nino.ninos_sensibles.dni_encrypted}</p>
                </div>
              )}
              {nino.ninos_sensibles.direccion && (
                <div className="sm:col-span-2">
                  <p className="text-gray-500 mb-0.5">Dirección</p>
                  <p className="font-medium text-gray-900">{nino.ninos_sensibles.direccion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Información del niño ═══ */}
        {!isVoluntario && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Información del Niño
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {nino.fecha_nacimiento && (
                <div>
                  <p className="text-gray-500 mb-0.5">Fecha de nacimiento</p>
                  <p className="font-medium text-gray-900">
                    {formatearFecha(nino.fecha_nacimiento)}
                    {' '}
                    <span className="text-gray-500">({edadTexto})</span>
                  </p>
                </div>
              )}
              {nino.genero && (
                <div>
                  <p className="text-gray-500 mb-0.5">Género</p>
                  <p className="font-medium text-gray-900 capitalize">{nino.genero.replace('_', ' ')}</p>
                </div>
              )}
              {nino.escuelas && (
                <div>
                  <p className="text-gray-500 mb-0.5">Escuela</p>
                  <p className="font-medium text-gray-900">{nino.escuelas.nombre}</p>
                </div>
              )}
              {nino.grado_escolar && (
                <div>
                  <p className="text-gray-500 mb-0.5">Grado</p>
                  <p className="font-medium text-gray-900">{nino.grado_escolar}</p>
                </div>
              )}
              {nino.turno_escolar && (
                <div>
                  <p className="text-gray-500 mb-0.5">Turno escolar</p>
                  <p className="font-medium text-gray-900 capitalize">{nino.turno_escolar}</p>
                </div>
              )}
              {nino.fecha_ingreso && (
                <div>
                  <p className="text-gray-500 mb-0.5">Fecha de ingreso al programa</p>
                  <p className="font-medium text-gray-900">{formatearFecha(nino.fecha_ingreso)}</p>
                </div>
              )}

              {/* Permanencia */}
              <div>
                <p className="text-gray-500 mb-0.5">Permanencia en el programa</p>
                {tieneAccesoCompleto ? (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleTogglePermanencia(true)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        editPermanencia
                          ? 'bg-crecimiento-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => handleTogglePermanencia(false)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        !editPermanencia
                          ? 'bg-impulso-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">
                    {nino.activo ? 'Sí — activo' : 'No — inactivo'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Terapia (solo full access) ═══ */}
        {tieneAccesoCompleto && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-impulso-500" />
              Asiste a terapia
            </h2>
            <div className="flex flex-wrap gap-2">
              {TIPOS_TERAPIA.map((t) => {
                const isSelected = editTerapia.includes(t.value);
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      setEditTerapia((prev) =>
                        isSelected ? prev.filter((v) => v !== t.value) : [...prev, t.value]
                      );
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation ${
                      isSelected
                        ? 'bg-impulso-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
              {editTerapia.length === 0 && (
                <p className="text-sm text-gray-400 italic py-2">No asiste a terapia (o no especificado)</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ Familiares y contactos (solo full access) ═══ */}
        {tieneAccesoCompleto && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-impulso-400" />
              Familiares y Contactos
            </h2>

            <div className="space-y-4">
              {/* Madre */}
              <FamiliarCard label="Madre" familiar={madre} icon="👩" />
              {/* Padre */}
              <FamiliarCard label="Padre" familiar={padre} icon="👨" />
              {/* Referente escolar */}
              <FamiliarCard label="Referente escolar" familiar={referenteEscolar} icon="🏫" />
              {/* Otros */}
              {familiares
                .filter((f) => !['madre', 'padre', 'referente_escolar'].includes(f.tipo))
                .map((f) => (
                  <FamiliarCard key={f.id} label={f.tipo === 'tutor' ? 'Tutor' : 'Otro'} familiar={f} icon="👤" />
                ))}
              {familiares.length === 0 && (
                <p className="text-sm text-gray-400 italic">No hay familiares registrados</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ Voluntario Asignado (solo no-voluntarios) ═══ */}
        {!isVoluntario && (
          <div className="bg-gradient-to-br from-crecimiento-50 to-sol-50 border border-crecimiento-200 rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-xl font-bold text-crecimiento-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              Voluntario Asignado
            </h2>

            {asignacionActiva ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crecimiento-500 to-sol-400 flex items-center justify-center text-white font-bold text-lg">
                    {asignacionActiva.voluntario?.nombre?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {asignacionActiva.voluntario
                        ? `${asignacionActiva.voluntario.nombre} ${asignacionActiva.voluntario.apellido}`
                        : 'Sin nombre'}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Asignado: {formatearFecha(asignacionActiva.fecha_asignacion)}</span>
                      {asignacionActiva.score_matching != null && asignacionActiva.score_matching > 0 && (
                        <span className="px-2 py-0.5 bg-crecimiento-100 text-crecimiento-700 rounded-full text-xs font-medium">
                          Score: {asignacionActiva.score_matching}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/ninos/${ninoId}/asignar-voluntario`)}
                  className="px-4 py-2 text-sm bg-white border border-crecimiento-300 text-crecimiento-700 rounded-lg hover:bg-crecimiento-50 transition-colors font-medium"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Sin voluntario asignado</p>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/ninos/${ninoId}/asignar-voluntario`)}
                  className="px-4 py-2 text-sm bg-crecimiento-500 text-white rounded-lg hover:bg-crecimiento-600 transition-colors font-medium"
                >
                  Asignar Voluntario
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Notas / Bitácora (solo full access) ═══ */}
        {tieneAccesoCompleto && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-sol-500" />
              Notas / Bitácora
            </h2>

            {/* Add new note */}
            <div className="flex gap-2 mb-4">
              <textarea
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                placeholder="Escribí una nota sobre este niño..."
                rows={2}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sol-400 focus:border-transparent resize-none text-sm"
              />
              <button
                onClick={handleGuardarNota}
                disabled={!nuevaNota.trim() || guardando}
                className="self-end px-4 py-2 bg-sol-500 hover:bg-sol-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] flex items-center gap-1"
              >
                {guardando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <><Save className="w-4 h-4" /> Guardar</>
                )}
              </button>
            </div>

            {/* Notes list */}
            {notas.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay notas registradas</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notas.map((nota) => (
                  <div key={nota.id} className="p-3 bg-sol-50 rounded-lg border border-sol-100">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{nota.texto}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{formatearFecha(nota.fecha)}</span>
                      <span>·</span>
                      <span>{nota.autor_nombre}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ Grabaciones de Reuniones (solo full access) ═══ */}
        {tieneAccesoCompleto && grabaciones.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mic className="w-5 h-5 text-impulso-500" />
              Grabaciones de Reuniones
            </h2>

            <div className="space-y-4">
              {grabaciones.map((grabacion) => (
                <GrabacionCard
                  key={grabacion.id}
                  grabacion={grabacion}
                  ninoId={ninoId}
                  formatearFecha={formatearFecha}
                />
              ))}
            </div>
          </div>
        )}

        {/* ═══ Historial de Sesiones ═══ */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              {isVoluntario ? 'Mis Sesiones Registradas' : 'Historial de Sesiones'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isVoluntario
                ? 'Tus sesiones con este niño'
                : 'Todas las sesiones registradas para este niño'}
            </p>
          </div>

          {sesiones.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-2">
                {isVoluntario
                  ? 'Aún no registraste ninguna sesión con este niño'
                  : 'No hay sesiones registradas todavía'}
              </p>
              <button
                onClick={() => router.push(`/dashboard/sesiones/nueva/${ninoId}`)}
                className="mt-4 px-6 py-2.5 bg-crecimiento-500 hover:bg-crecimiento-600 text-white rounded-lg font-semibold shadow-md transition-all touch-manipulation min-h-[44px]"
              >
                Registrar Primera Sesión
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sesiones.map((sesion) => (
                <div
                  key={sesion.id}
                  className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/sesiones/${sesion.id}`)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-1">{formatearFecha(sesion.fecha)}</p>
                      <p className="text-sm text-gray-600">Duración: {sesion.duracion_minutos} minutos</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  </div>
                  {sesion.observaciones_libres && (
                    <p className="text-sm text-gray-700 line-clamp-2 mt-2">{sesion.observaciones_libres}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Info para voluntarios ═══ */}
        {isVoluntario && (
          <div className="bg-sol-50 border border-sol-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-6 h-6 text-sol-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-sol-900 font-medium mb-1">Vista de Voluntario</p>
                <p className="text-sm text-sol-700">
                  Solo ves tus propias sesiones con este niño. Los coordinadores y el equipo profesional pueden ver todas las sesiones.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function FamiliarCard({
  label,
  familiar,
  icon,
}: {
  label: string;
  familiar: FamiliarApoyo | undefined;
  icon: string;
}) {
  if (!familiar) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-xs text-gray-400 italic">Sin datos registrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{familiar.nombre}</p>
        <p className="text-xs text-gray-500 mb-1">{label}{familiar.relacion ? ` — ${familiar.relacion}` : ''}</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {familiar.telefono && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3" /> {familiar.telefono}
            </span>
          )}
          {familiar.email && (
            <span className="inline-flex items-center gap-1">📧 {familiar.email}</span>
          )}
          {familiar.vive_con_nino && (
            <span className="inline-flex items-center gap-1 text-crecimiento-600 font-medium">🏠 Vive con el niño</span>
          )}
          {familiar.es_contacto_principal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sol-100 text-sol-700 rounded-full font-medium">
              ⭐ Contacto principal
            </span>
          )}
        </div>
        {familiar.notas && (
          <p className="text-xs text-gray-500 mt-1 italic">{familiar.notas}</p>
        )}
      </div>
    </div>
  );
}

// ─── Grabacion Card ──────────────────────────────────────────

function GrabacionCard({
  grabacion,
  ninoId,
  formatearFecha,
}: {
  grabacion: GrabacionReunion;
  ninoId: string;
  formatearFecha: (fecha: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const formatDuracion = (seg: number | null) => {
    if (!seg) return '';
    const min = Math.floor(seg / 60);
    const s = seg % 60;
    return `${min}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayAudio = async () => {
    if (audioUrl) return;
    setLoadingAudio(true);
    try {
      const { data } = await supabase.storage
        .from('grabaciones-reuniones')
        .createSignedUrl(grabacion.storage_path, 3600);

      if (data?.signedUrl) {
        setAudioUrl(data.signedUrl);
      }
    } catch (err) {
      console.error('Error getting audio URL:', err);
    } finally {
      setLoadingAudio(false);
    }
  };

  const resumenIA = grabacion.entrevista_conclusiones?.includes('--- Resumen generado por IA ---')
    ? grabacion.entrevista_conclusiones.split('--- Resumen generado por IA ---')[1]?.split('---')[0]?.trim()
    : grabacion.entrevista_conclusiones;

  return (
    <div className="border border-impulso-100 rounded-xl overflow-hidden bg-impulso-50/30">
      <button
        type="button"
        onClick={() => {
          setExpanded(!expanded);
          if (!expanded) handlePlayAudio();
        }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-impulso-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-impulso-100 rounded-lg">
            <Mic className="w-4 h-4 text-impulso-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Reunión de ingreso
              {grabacion.duracion_segundos && (
                <span className="text-gray-500 font-normal ml-2">
                  ({formatDuracion(grabacion.duracion_segundos)})
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {formatearFecha(grabacion.fecha_grabacion.split('T')[0])} · {grabacion.autor_nombre}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-impulso-100">
          <div className="pt-3">
            {loadingAudio ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-impulso-400 border-t-transparent" />
                Cargando audio...
              </div>
            ) : audioUrl ? (
              <div className="flex items-center gap-2 bg-white rounded-lg p-2">
                <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
                <audio src={audioUrl} controls className="w-full" style={{ maxHeight: '40px' }} />
              </div>
            ) : (
              <button
                onClick={handlePlayAudio}
                className="flex items-center gap-2 text-sm text-impulso-600 hover:text-impulso-700 font-medium"
              >
                <Volume2 className="w-4 h-4" /> Cargar audio
              </button>
            )}
          </div>

          {resumenIA && (
            <div className="bg-sol-50 rounded-lg p-3 border border-sol-100">
              <p className="text-xs font-semibold text-sol-700 mb-1 flex items-center gap-1">
                ✨ Resumen de la reunión
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{resumenIA}</p>
            </div>
          )}

          {grabacion.transcripcion && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Transcripción
              </p>
              <div className="bg-white rounded-lg p-3 border border-gray-100 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {grabacion.transcripcion}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
