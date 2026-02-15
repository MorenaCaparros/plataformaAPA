'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { calcularEdad } from '@/lib/utils/date-helpers';
import MeetingRecorder from '@/components/forms/MeetingRecorder';
import type { MeetingRecordingResult } from '@/components/forms/MeetingRecorder';
import {
  ArrowLeft, UserPlus, Calendar, Users, GraduationCap,
  Phone, Trash2, Plus, MapPin, Baby, Heart, CheckCircle, AlertTriangle,
  Camera
} from 'lucide-react';
import type { Zona, Escuela, RangoEtario, Genero, TurnoEscolar } from '@/types/database';

// ─── Helpers ───────────────────────────────────────────────

/** Derive rango_etario from age in years */
function edadARango(edad: number | null): RangoEtario | null {
  if (edad === null) return null;
  if (edad <= 7) return '5-7';
  if (edad <= 10) return '8-10';
  if (edad <= 13) return '11-13';
  if (edad <= 16) return '14-16';
  return '17+';
}

// ─── Types ───────────────────────────────────────────────

type TipoFamiliar = 'padre' | 'madre' | 'tutor' | 'referente_escolar' | 'otro';

interface FamiliarForm {
  key: string;
  tipo: TipoFamiliar;
  nombre: string;
  telefono: string;
  email: string;
  relacion: string;
  vive_con_nino: boolean;
  es_contacto_principal: boolean;
}

const FAMILIAR_LABELS: Record<TipoFamiliar, string> = {
  madre: 'Madre',
  padre: 'Padre',
  tutor: 'Tutor/a',
  referente_escolar: 'Referente Escolar',
  otro: 'Otro familiar',
};

function createFamiliar(tipo: TipoFamiliar): FamiliarForm {
  return {
    key: crypto.randomUUID(),
    tipo,
    nombre: '',
    telefono: '',
    email: '',
    relacion: tipo === 'otro' ? '' : FAMILIAR_LABELS[tipo],
    vive_con_nino: tipo !== 'referente_escolar',
    es_contacto_principal: false,
  };
}

// ─── Shared input classes ─────────────────────────────────

const inputClass =
  'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl focus:ring-2 focus:ring-sol-400 focus:border-transparent text-neutro-carbon font-outfit shadow-[0_2px_8px_rgba(242,201,76,0.08)] min-h-[56px] placeholder:text-neutro-piedra/60 transition-all';
const labelClass = 'block text-sm font-medium text-neutro-carbon font-outfit mb-2';
const sectionTitleClass =
  'text-lg font-semibold text-neutro-carbon font-quicksand flex items-center gap-2 mb-4';

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function NuevoNinoPage() {
  const router = useRouter();
  const { user, perfil } = useAuth();
  const [loading, setLoading] = useState(false);

  // Reference data
  const [zonas, setZonas] = useState<Pick<Zona, 'id' | 'nombre'>[]>([]);
  const [escuelas, setEscuelas] = useState<Pick<Escuela, 'id' | 'nombre'>[]>([]);

  // Form state — basic fields
  const [alias, setAlias] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState<Genero | ''>('');
  const [escolarizado, setEscolarizado] = useState(true);
  const [gradoEscolar, setGradoEscolar] = useState('');
  const [turnoEscolar, setTurnoEscolar] = useState<TurnoEscolar | ''>('');
  const [escuelaId, setEscuelaId] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Foto de perfil (upload at registration for professionals)
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Familiares
  const [familiares, setFamiliares] = useState<FamiliarForm[]>([
    createFamiliar('madre'),
    createFamiliar('padre'),
  ]);

  // ─── Recording / Transcription state ───────────────────────
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcripcion, setTranscripcion] = useState('');
  const [duracionGrabacion, setDuracionGrabacion] = useState(0);
  const [resumenIA, setResumenIA] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [camposAutocompletados, setCamposAutocompletados] = useState(false);

  // ─── Derived values ───────────────────────────────────────

  const edadCalculada = useMemo(() => calcularEdad(fechaNacimiento || null), [fechaNacimiento]);
  const rangoCalculado = useMemo(() => edadARango(edadCalculada), [edadCalculada]);

  const rolActual = (perfil as any)?.rol as string | undefined;
  const esProfesional = ['psicopedagogia', 'director', 'admin', 'coordinador', 'trabajadora_social'].includes(
    rolActual || ''
  );

  // ─── Fetch reference data ──────────────────────────────────

  useEffect(() => {
    fetchZonas();
    fetchEscuelas();
  }, []);

  useEffect(() => {
    if (perfil?.zona_id && !zonaId) {
      setZonaId(perfil.zona_id);
    }
  }, [perfil]);

  const fetchZonas = async () => {
    const { data } = await supabase
      .from('zonas')
      .select('id, nombre')
      .eq('activa', true)
      .order('nombre');
    setZonas(data || []);
  };

  const fetchEscuelas = async () => {
    const { data } = await supabase
      .from('escuelas')
      .select('id, nombre')
      .eq('activa', true)
      .order('nombre');
    setEscuelas(data || []);
  };

  // ─── Foto handler ───────────────────────────────────────

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccioná una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  // ─── Familiar helpers ─────────────────────────────────────

  const addFamiliar = (tipo: TipoFamiliar = 'otro') => {
    setFamiliares((prev) => [...prev, createFamiliar(tipo)]);
  };

  const removeFamiliar = (key: string) => {
    setFamiliares((prev) => prev.filter((f) => f.key !== key));
  };

  const updateFamiliar = (key: string, field: keyof FamiliarForm, value: any) => {
    setFamiliares((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [field]: value } : f))
    );
  };

  // ─── Recording callbacks ──────────────────────────────────

  const handleRecordingComplete = useCallback((result: MeetingRecordingResult) => {
    setAudioBlob(result.audioBlob);
    setTranscripcion(result.transcripcion);
    setDuracionGrabacion(result.duracionSegundos);
  }, []);

  const handleAnalizar = useCallback(async (textoTranscripcion: string) => {
    if (!textoTranscripcion.trim()) return;
    setAnalizando(true);

    try {
      const res = await fetch('/api/ia/transcripcion-ingreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcripcion: textoTranscripcion, modo: 'ambos' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al analizar');
      }

      const { datos_extraidos, resumen } = await res.json();

      // Auto-fill form fields from AI extraction
      if (datos_extraidos) {
        if (datos_extraidos.alias && !alias) setAlias(datos_extraidos.alias);
        // Also set nombre completo if AI found a full name
        if (datos_extraidos.alias && !nombreCompleto) setNombreCompleto(datos_extraidos.alias);
        if (datos_extraidos.apellido && !apellido) setApellido(datos_extraidos.apellido);
        if (datos_extraidos.fecha_nacimiento && !fechaNacimiento) setFechaNacimiento(datos_extraidos.fecha_nacimiento);
        if (datos_extraidos.genero && !genero) setGenero(datos_extraidos.genero);
        if (datos_extraidos.escolarizado !== null && datos_extraidos.escolarizado !== undefined) {
          setEscolarizado(datos_extraidos.escolarizado);
        }
        if (datos_extraidos.grado_escolar && !gradoEscolar) setGradoEscolar(datos_extraidos.grado_escolar);
        if (datos_extraidos.turno_escolar && !turnoEscolar) setTurnoEscolar(datos_extraidos.turno_escolar);

        // Try to match escuela by name
        if (datos_extraidos.nombre_escuela && !escuelaId) {
          const match = escuelas.find(
            (e) => e.nombre.toLowerCase().includes(datos_extraidos.nombre_escuela.toLowerCase())
          );
          if (match) setEscuelaId(match.id);
        }

        // Auto-fill familiares from extraction
        if (datos_extraidos.familiares && Array.isArray(datos_extraidos.familiares) && datos_extraidos.familiares.length > 0) {
          const nuevosFamiliares: FamiliarForm[] = datos_extraidos.familiares.map((f: any) => ({
            key: crypto.randomUUID(),
            tipo: (['madre', 'padre', 'tutor', 'referente_escolar', 'otro'].includes(f.tipo) ? f.tipo : 'otro') as TipoFamiliar,
            nombre: f.nombre || '',
            telefono: f.telefono || '',
            email: '',
            relacion: f.relacion || FAMILIAR_LABELS[f.tipo as TipoFamiliar] || '',
            vive_con_nino: f.vive_con_nino ?? true,
            es_contacto_principal: false,
          }));
          // Replace empty familiares or merge
          const familiaresLlenos = familiares.filter((f) => f.nombre.trim());
          if (familiaresLlenos.length === 0) {
            setFamiliares(nuevosFamiliares);
          } else {
            // Add new ones that don't already exist
            const existingNames = new Set(familiaresLlenos.map((f) => f.nombre.toLowerCase()));
            const nuevos = nuevosFamiliares.filter((f: FamiliarForm) => !existingNames.has(f.nombre.toLowerCase()));
            if (nuevos.length > 0) setFamiliares([...familiaresLlenos, ...nuevos]);
          }
        }

        if (datos_extraidos.observaciones && !observaciones) {
          setObservaciones(datos_extraidos.observaciones);
        }

        setCamposAutocompletados(true);
      }

      // Save summary
      if (resumen) {
        setResumenIA(resumen);
      }
    } catch (error: any) {
      console.error('Error analizando transcripción:', error);
      alert('Error al analizar la transcripción: ' + error.message);
    } finally {
      setAnalizando(false);
    }
  }, [alias, nombreCompleto, apellido, fechaNacimiento, genero, gradoEscolar, turnoEscolar, escuelaId, escuelas, familiares, observaciones]);

  // ─── Submit ────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) {
      alert('El alias es obligatorio.');
      return;
    }
    setLoading(true);

    try {
      // 1. Insert niño
      const { data: nino, error: ninoError } = await supabase
        .from('ninos')
        .insert({
          alias: alias.trim(),
          fecha_nacimiento: fechaNacimiento || null,
          rango_etario: rangoCalculado ?? null,
          genero: genero || null,
          escolarizado,
          grado_escolar: escolarizado && gradoEscolar ? gradoEscolar : null,
          turno_escolar: escolarizado && turnoEscolar ? turnoEscolar : null,
          escuela_id: escolarizado && escuelaId ? escuelaId : null,
          zona_id: zonaId || perfil?.zona_id || null,
          fecha_ingreso: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (ninoError) throw ninoError;

      const ninoId = nino.id;

      // 1b. Upload profile photo if provided
      if (fotoFile) {
        try {
          const ext = fotoFile.name.split('.').pop();
          const filePath = `ninos/${ninoId}/perfil.${ext}`;

          const { error: uploadFotoError } = await supabase.storage
            .from('fotos-perfil')
            .upload(filePath, fotoFile, { upsert: true });

          if (!uploadFotoError) {
            const { data: urlData } = supabase.storage
              .from('fotos-perfil')
              .getPublicUrl(filePath);

            await supabase
              .from('ninos')
              .update({ foto_perfil_url: urlData.publicUrl })
              .eq('id', ninoId);
          } else {
            console.error('Error subiendo foto de perfil:', uploadFotoError);
          }
        } catch (fotoErr) {
          console.error('Error procesando foto:', fotoErr);
        }
      }

      // 1c. Insert ninos_sensibles if professional provided nombre/apellido
      if (esProfesional && (nombreCompleto.trim() || apellido.trim())) {
        const { error: sensibleError } = await supabase
          .from('ninos_sensibles')
          .insert({
            nino_id: ninoId,
            nombre_completo_encrypted: nombreCompleto.trim() || alias.trim(),
            apellido_encrypted: apellido.trim(),
          });
        if (sensibleError) console.error('Error guardando datos sensibles:', sensibleError);
      }

      // 2. Auto-assign current volunteer
      if (user?.id && rolActual === 'voluntario') {
        const { error: asignacionError } = await supabase
          .from('asignaciones')
          .insert({
            nino_id: ninoId,
            voluntario_id: user.id,
            activa: true,
            fecha_asignacion: new Date().toISOString().split('T')[0],
          });
        if (asignacionError) console.error('Error al crear asignación:', asignacionError);
      }

      // 3. Insert familiares (only those with a name filled in)
      const familiaresConNombre = familiares.filter((f) => f.nombre.trim());
      if (familiaresConNombre.length > 0) {
        const rows = familiaresConNombre.map((f) => ({
          nino_id: ninoId,
          tipo: f.tipo,
          nombre: f.nombre.trim(),
          telefono: f.telefono.trim() || null,
          email: f.email.trim() || null,
          relacion: f.relacion.trim() || null,
          vive_con_nino: f.vive_con_nino,
          es_contacto_principal: f.es_contacto_principal,
        }));
        const { error: famError } = await supabase
          .from('familiares_apoyo')
          .insert(rows);
        if (famError) console.error('Error guardando familiares:', famError);
      }

      // 4. Create entrevista inicial (with observations + AI summary)
      let entrevistaId: string | null = null;
      const tieneContenido = observaciones.trim() || resumenIA.trim() || transcripcion.trim();

      if (tieneContenido) {
        const conclusiones = [
          resumenIA ? `--- Resumen generado por IA ---\n${resumenIA}` : '',
          observaciones.trim() ? `--- Observaciones manuales ---\n${observaciones.trim()}` : '',
        ].filter(Boolean).join('\n\n');

        const { data: entrevista, error: entrevistaError } = await supabase
          .from('entrevistas')
          .insert({
            nino_id: ninoId,
            entrevistador_id: user?.id ?? null,
            tipo: 'inicial',
            fecha: new Date().toISOString().split('T')[0],
            duracion_minutos: duracionGrabacion > 0 ? Math.ceil(duracionGrabacion / 60) : null,
            observaciones: transcripcion.trim() || null,
            conclusiones: conclusiones || null,
          })
          .select('id')
          .single();

        if (entrevistaError) {
          console.error('Error guardando entrevista:', entrevistaError);
        } else {
          entrevistaId = entrevista.id;
        }
      }

      // 5. Upload audio + save grabacion_voz record
      if (audioBlob && audioBlob.size > 0) {
        const timestamp = Date.now();
        const storagePath = `grabaciones-reuniones/${ninoId}/${timestamp}.webm`;

        const { error: uploadError } = await supabase.storage
          .from('grabaciones-reuniones')
          .upload(storagePath, audioBlob, {
            contentType: 'audio/webm',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error subiendo audio:', uploadError);
        } else {
          // Save metadata in grabaciones_voz
          const { error: grabError } = await supabase
            .from('grabaciones_voz')
            .insert({
              entrevista_id: entrevistaId,
              nino_id: ninoId,
              usuario_id: user?.id ?? null,
              storage_path: storagePath,
              duracion_segundos: duracionGrabacion || null,
              formato: 'webm',
              tamanio_bytes: audioBlob.size,
              transcripcion: transcripcion.trim() || null,
              procesada: true,
            });

          if (grabError) console.error('Error guardando metadata de grabación:', grabError);
        }
      }

      alert('✅ Niño registrado exitosamente');
      router.push(`/dashboard/ninos/${ninoId}`);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al registrar niño: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 mb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-[0_4px_16px_rgba(242,201,76,0.1)] px-6 py-4">
            <div className="flex justify-between items-center">
              <Link
                href="/dashboard/ninos"
                className="flex items-center gap-2 text-neutro-piedra hover:text-neutro-carbon transition-colors font-outfit font-medium min-h-[44px]"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-neutro-carbon font-quicksand flex items-center gap-2">
                <UserPlus size={24} className="text-crecimiento-500" />
                Registrar Niño
              </h1>
              <div className="w-16 sm:w-24" />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Form ──────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── SECTION 1: Datos del niño ───────────────────── */}
          <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8 space-y-5">
            <h2 className={sectionTitleClass}>
              <Baby size={20} className="text-sol-500" />
              Datos del niño
            </h2>

            {/* Alias */}
            <div>
              <label className={labelClass}>
                {esProfesional ? 'Alias / Nombre operativo *' : 'Nombre del niño *'}
              </label>
              <input
                type="text"
                required
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className={inputClass}
                placeholder="Ej: Juan, María, Luisito..."
              />
              <p className="mt-1.5 text-xs text-neutro-piedra font-outfit">
                {esProfesional
                  ? 'Este es el nombre visible para los voluntarios (sin apellido).'
                  : 'No uses el nombre completo por privacidad.'}
              </p>
            </div>

            {/* Nombre completo + Apellido (solo profesionales) */}
            {esProfesional && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      🔒 Nombre completo
                    </span>
                  </label>
                  <input
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    className={inputClass}
                    placeholder="Nombre completo del niño"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      🔒 Apellido
                    </span>
                  </label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className={inputClass}
                    placeholder="Apellido del niño"
                  />
                </div>
                <p className="sm:col-span-2 -mt-2 text-xs text-amber-600 font-outfit">
                  Datos sensibles — solo visible para el equipo profesional y dirección.
                </p>
              </div>
            )}

            {/* Foto de perfil (profesionales) */}
            {esProfesional && (
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5">
                    <Camera size={14} className="text-crecimiento-500" />
                    Foto de perfil
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-sol-200 to-crecimiento-200 flex items-center justify-center shadow-md flex-shrink-0">
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={28} className="text-white/70" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="block w-full text-sm text-neutro-piedra font-outfit file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-crecimiento-100 file:text-crecimiento-700 hover:file:bg-crecimiento-200 file:cursor-pointer file:transition-colors"
                    />
                    <p className="mt-1.5 text-xs text-neutro-piedra font-outfit">
                      Máximo 5MB. Los voluntarios podrán ver la foto pero no modificarla.
                    </p>
                  </div>
                  {fotoPreview && (
                    <button
                      type="button"
                      onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                      className="p-2 text-neutro-piedra hover:text-impulso-500 transition-colors"
                      title="Quitar foto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Fecha de nacimiento + age preview */}
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-sol-500" />
                  Fecha de nacimiento
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="date"
                  value={fechaNacimiento}
                  max={new Date().toISOString().split('T')[0]}
                  min="2005-01-01"
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className={inputClass + ' sm:max-w-[220px]'}
                />
                {edadCalculada !== null && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 bg-sol-100 text-sol-800 rounded-full text-sm font-semibold font-outfit">
                      {edadCalculada} años
                    </span>
                    <span className="text-xs text-neutro-piedra font-outfit">
                      (Rango: {rangoCalculado})
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-neutro-piedra font-outfit">
                La edad y el rango etario se calculan automáticamente.
              </p>
            </div>

            {/* Género */}
            <div>
              <label className={labelClass}>Género</label>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value as Genero | '')}
                className={inputClass}
              >
                <option value="">Sin especificar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </div>

            {/* Zona */}
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-crecimiento-500" />
                  Equipo / Zona
                </span>
              </label>
              <select
                value={zonaId}
                onChange={(e) => setZonaId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin asignar</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── SECTION 2: Escolaridad ──────────────────────── */}
          <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8 space-y-5">
            <h2 className={sectionTitleClass}>
              <GraduationCap size={20} className="text-crecimiento-500" />
              Escolaridad
            </h2>

            {/* ¿Asiste a la escuela? */}
            <div>
              <label className={labelClass}>¿Asiste a la escuela? *</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="radio"
                    name="escolarizado"
                    checked={escolarizado}
                    onChange={() => setEscolarizado(true)}
                    className="w-5 h-5 text-crecimiento-500 focus:ring-crecimiento-400"
                  />
                  <span className="text-neutro-carbon font-outfit">Sí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="radio"
                    name="escolarizado"
                    checked={!escolarizado}
                    onChange={() => setEscolarizado(false)}
                    className="w-5 h-5 text-crecimiento-500 focus:ring-crecimiento-400"
                  />
                  <span className="text-neutro-carbon font-outfit">No</span>
                </label>
              </div>
            </div>

            {escolarizado && (
              <>
                {/* Escuela */}
                <div>
                  <label className={labelClass}>Escuela</label>
                  <select
                    value={escuelaId}
                    onChange={(e) => setEscuelaId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sin especificar</option>
                    {escuelas.map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grado + Turno */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Grado escolar</label>
                    <input
                      type="text"
                      value={gradoEscolar}
                      onChange={(e) => setGradoEscolar(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: 3° grado"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Turno</label>
                    <select
                      value={turnoEscolar}
                      onChange={(e) => setTurnoEscolar(e.target.value as TurnoEscolar | '')}
                      className={inputClass}
                    >
                      <option value="">Sin especificar</option>
                      <option value="mañana">Mañana</option>
                      <option value="tarde">Tarde</option>
                      <option value="noche">Noche</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── SECTION 3: Familiares / Contactos ────────────── */}
          <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8 space-y-5">
            <h2 className={sectionTitleClass}>
              <Users size={20} className="text-impulso-500" />
              Familiares y Contactos
            </h2>
            <p className="text-xs text-neutro-piedra font-outfit -mt-2">
              Completá lo que sepas. Los campos vacíos se pueden cargar después.
            </p>

            {familiares.map((fam) => (
              <FamiliarCard
                key={fam.key}
                familiar={fam}
                onChange={(field, value) => updateFamiliar(fam.key, field, value)}
                onRemove={() => removeFamiliar(fam.key)}
                canRemove={familiares.length > 1}
              />
            ))}

            {/* Add buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addFamiliar('tutor')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/80 border border-white/60 text-sm font-outfit text-neutro-carbon hover:shadow-md transition-all min-h-[44px]"
              >
                <Plus size={14} /> Tutor/a
              </button>
              <button
                type="button"
                onClick={() => addFamiliar('referente_escolar')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/80 border border-white/60 text-sm font-outfit text-neutro-carbon hover:shadow-md transition-all min-h-[44px]"
              >
                <Plus size={14} /> Referente Escolar
              </button>
              <button
                type="button"
                onClick={() => addFamiliar('otro')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/80 border border-white/60 text-sm font-outfit text-neutro-carbon hover:shadow-md transition-all min-h-[44px]"
              >
                <Plus size={14} /> Otro
              </button>
            </div>
          </div>

          {/* ── SECTION 4: Observaciones (professional roles only) */}
          {esProfesional && (
            <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(242,201,76,0.1)] p-6 sm:p-8 space-y-5">
              <h2 className={sectionTitleClass}>
                <Heart size={20} className="text-impulso-400" />
                Observaciones iniciales
              </h2>
              <div>
                <label className={labelClass}>Notas u observaciones al momento del ingreso</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                  className={inputClass + ' min-h-[120px] resize-y'}
                  placeholder="Contexto familiar, situación particular, derivación, etc."
                />
              </div>
            </div>
          )}

          {/* ── SECTION 5: Grabación de reunión (professional) ── */}
          {esProfesional && (
            <div className="space-y-4">
              <MeetingRecorder
                onRecordingComplete={handleRecordingComplete}
                onTranscripcionChange={setTranscripcion}
                onAnalizar={handleAnalizar}
                analizando={analizando}
                disabled={loading}
              />

              {/* AI auto-fill confirmation banner */}
              {camposAutocompletados && (
                <div className="flex items-start gap-3 bg-crecimiento-50/60 border border-crecimiento-200/40 rounded-2xl p-4">
                  <CheckCircle size={20} className="text-crecimiento-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-crecimiento-800 font-outfit">
                      Campos autocompletados por IA
                    </p>
                    <p className="text-xs text-crecimiento-600 font-outfit mt-1">
                      Revisá los datos extraídos y corregí lo que sea necesario antes de guardar.
                    </p>
                  </div>
                </div>
              )}

              {/* AI-generated meeting summary */}
              {resumenIA && (
                <div className="bg-white/60 backdrop-blur-md border border-sol-200/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutro-carbon font-outfit flex items-center gap-2">
                      <span className="text-base">✨</span> Resumen de la reunión (generado por IA)
                    </h4>
                  </div>
                  <textarea
                    value={resumenIA}
                    onChange={(e) => setResumenIA(e.target.value)}
                    rows={5}
                    className={inputClass + ' min-h-[100px] resize-y text-sm'}
                  />
                  <p className="text-xs text-neutro-piedra font-outfit">
                    Este resumen se guardará en el perfil del niño. Podés editarlo antes de guardar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Buttons ───────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:flex-1 px-6 py-4 min-h-[56px] bg-white/80 backdrop-blur-sm border border-white/60 text-neutro-carbon rounded-2xl hover:shadow-[0_4px_16px_rgba(242,201,76,0.15)] font-medium font-outfit active:scale-95 transition-all flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-6 py-4 min-h-[56px] bg-gradient-to-r from-crecimiento-400 to-crecimiento-500 text-white rounded-2xl hover:shadow-[0_8px_24px_rgba(164,198,57,0.25)] font-semibold font-outfit disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center shadow-[0_4px_16px_rgba(164,198,57,0.15)]"
            >
              {loading ? 'Guardando...' : '✓ Registrar Niño'}
            </button>
          </div>
        </form>

        {/* ── Info footer ──────────────────────────────────── */}
        <div className="bg-sol-50/60 backdrop-blur-sm border border-sol-200/40 rounded-3xl p-6 shadow-[0_4px_16px_rgba(242,201,76,0.08)]">
          <h3 className="font-semibold text-sol-800 mb-3 font-quicksand flex items-center gap-2">
            <span className="text-xl">ℹ️</span> Importante
          </h3>
          <ul className="text-sm text-sol-700 space-y-2 font-outfit">
            {!esProfesional && (
              <li>• Los datos sensibles (nombre completo, DNI) los cargará el equipo profesional desde el perfil del niño</li>
            )}
            <li>• El nivel de alfabetización se establece mediante evaluación, no al registrar</li>
            {rolActual === 'voluntario' && (
              <li>• El niño quedará automáticamente asignado a vos</li>
            )}
            <li>• Se generará un número de legajo automáticamente</li>
            <li>• Podés empezar a registrar sesiones inmediatamente</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FAMILIAR CARD COMPONENT
// ═══════════════════════════════════════════════════════════

function FamiliarCard({
  familiar,
  onChange,
  onRemove,
  canRemove,
}: {
  familiar: FamiliarForm;
  onChange: (field: keyof FamiliarForm, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const tipoColors: Record<TipoFamiliar, string> = {
    madre: 'bg-impulso-50 border-impulso-200/50',
    padre: 'bg-crecimiento-50 border-crecimiento-200/50',
    tutor: 'bg-sol-50 border-sol-200/50',
    referente_escolar: 'bg-blue-50 border-blue-200/50',
    otro: 'bg-neutro-100 border-neutro-200/50',
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
        tipoColors[familiar.tipo] || tipoColors.otro
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={familiar.tipo}
            onChange={(e) => onChange('tipo', e.target.value)}
            className="text-sm font-semibold font-outfit bg-transparent border-none focus:ring-0 p-0 pr-6 text-neutro-carbon cursor-pointer"
          >
            <option value="madre">👩 Madre</option>
            <option value="padre">👨 Padre</option>
            <option value="tutor">🧑‍🤝‍🧑 Tutor/a</option>
            <option value="referente_escolar">🏫 Referente Escolar</option>
            <option value="otro">👤 Otro</option>
          </select>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-neutro-piedra hover:text-impulso-500 transition-colors rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutro-piedra font-outfit mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={familiar.nombre}
            onChange={(e) => onChange('nombre', e.target.value)}
            className={inputClass + ' !min-h-[44px] !py-2 text-sm'}
            placeholder={`Nombre del/la ${FAMILIAR_LABELS[familiar.tipo].toLowerCase()}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutro-piedra font-outfit mb-1">
            <span className="flex items-center gap-1">
              <Phone size={12} /> Teléfono
            </span>
          </label>
          <input
            type="tel"
            value={familiar.telefono}
            onChange={(e) => onChange('telefono', e.target.value)}
            className={inputClass + ' !min-h-[44px] !py-2 text-sm'}
            placeholder="Ej: 11-2345-6789"
          />
        </div>
      </div>

      {/* Extra row for email + flags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutro-piedra font-outfit mb-1">
            Email (opcional)
          </label>
          <input
            type="email"
            value={familiar.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={inputClass + ' !min-h-[44px] !py-2 text-sm'}
            placeholder="email@ejemplo.com"
          />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-outfit text-neutro-carbon min-h-[44px]">
            <input
              type="checkbox"
              checked={familiar.vive_con_nino}
              onChange={(e) => onChange('vive_con_nino', e.target.checked)}
              className="w-4 h-4 rounded text-crecimiento-500 focus:ring-crecimiento-400"
            />
            Vive con el niño
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-outfit text-neutro-carbon min-h-[44px]">
            <input
              type="checkbox"
              checked={familiar.es_contacto_principal}
              onChange={(e) => onChange('es_contacto_principal', e.target.checked)}
              className="w-4 h-4 rounded text-sol-500 focus:ring-sol-400"
            />
            Contacto principal
          </label>
        </div>
      </div>
    </div>
  );
}
