<!-- filepath: /Users/santiago/Desktop/plataformaAPA/CHECKLIST_APLICACION.md -->
# 📋 CHECKLIST — Plataforma APA (Acompañar Para Aprender)
### Asociación Civil Adelante | Actualizado: 19/02/2026

---

# ✅ HECHO

> Todo lo que ya está implementado, commiteado y funcionando.

---

## 1. Autenticación y Seguridad
- [x] Login con Supabase Auth funcional
- [x] Auditoría de seguridad: eliminación de contraseñas hardcodeadas del código
- [x] Reset individual de contraseña funcional (`/api/admin/resetear-password`)
- [x] Roles implementados: `director` (admin), `equipo_profesional`, `voluntario`

## 2. Storage — Migración a Google Drive
- [x] Migración completa de Supabase Storage → Google Drive
- [x] Eliminación de TODAS las referencias a Supabase Storage del código
- [x] Helper `getDriveImageUrl` implementado en 4 páginas
- [x] API de upload a Drive (`/api/drive/subir`)
- [x] API de fotos de perfil vía Drive (`/api/admin/perfil/foto`)
- [x] Carpeta `DRIVE_FOLDER_FOTOS` para fotos de perfil
- [x] Carpeta `DRIVE_FOLDER_AUDIOS` para grabaciones de reuniones
- [x] Playback de audio desde Google Drive funcional
- [x] `.env.example` actualizado con variables de Google Drive

## 3. Dashboards
- [x] Dashboard Voluntario funcional
- [x] Dashboard Admin funcional
- [x] Dashboard Equipo Profesional funcional (renombrado desde "Psicopedagogía" → "Panel de Profesionales")
- [x] Sidebar actualizado con nombres y rutas correctas

## 4. CRUD y Perfil de Niños
- [x] Formulario de registro completo con visibilidad por rol
- [x] Fecha de nacimiento con cálculo automático de edad y rango etario
- [x] Nombre completo y apellido guardados en `ninos_sensibles` (insert automático)
- [x] Visibilidad por rol: voluntarios ven "Alias", profesionales ven nombre completo 🔒
- [x] Foto de perfil del niño (upload + preview en tiempo real)
- [x] Escuela, turno, grado, si repitió año
- [x] Si asiste a terapia — desplegable con tipos (psicológica, fonoaudiológica, psicopedagógica, ocupacional, otra)
- [x] Contacto de referente escolar (tipo `referente_escolar` en `familiares_apoyo`)
- [x] Datos de madre y padre — tarjetas dinámicas para agregar/eliminar familiares con tipo, nombre, teléfono, relación
- [x] Notas del niño tipo bitácora (con fecha)
- [x] Nivel de alfabetización oculto de la vista (queda en DB para futuro)
- [x] Roles `psicopedagogia`, `director`, `admin`, `coordinador`, `trabajadora_social` con acceso completo en listado y perfil
- [x] Sección de grabaciones de reuniones en perfil del niño — audio player expandible, resumen IA, transcripción completa

## 5. Sesiones
- [x] CRUD de sesiones funcional
- [x] Corrección de errores en tabla `sesiones`
- [x] Corrección error 406 en asignaciones
- [x] Voluntario puede ver y descargar sus sesiones registradas
- [x] Bug fix: no se puede seleccionar un niño al crear sesión — dashboard y listado consultan tabla `asignaciones` primero
- [x] Opción "No completó el campo" en ítems de sesión (N/C, no afecta promedio)
- [x] Cronómetro de duración de sesión (auto-start, persistente al navegar, pausa persiste, banner de sesión activa)
- [x] Ítem de permanencia y año (solo sí/no — se registra en perfil del niño)
- [x] Porcentaje de asistencia acumulado visible en perfil del niño + nueva página `/dashboard/asistencia` para registro masivo
- [x] Fecha seleccionable al registrar sesión (default hoy, permite seleccionar días anteriores)
- [x] Registro de asistencia masivo: voluntarios y coordinadores pueden marcar presentes/ausentes a múltiples niños

## 6. Grabación de Reuniones y Análisis con IA
- [x] Componente `MeetingRecorder` — grabación de audio con controles play/pause/resume/stop/descartar
- [x] Transcripción en vivo — Web Speech API (es-AR) convierte voz a texto en tiempo real
- [x] API de análisis de transcripción (`POST /api/ia/transcripcion-ingreso`) con Gemini
- [x] Auto-llenado del formulario desde datos extraídos por IA
- [x] Resumen narrativo de la reunión, guardable como observación
- [x] Protección por rol — solo profesionales autenticados pueden usar el endpoint de IA

## 7. Formulario de Salud + Alimentación
- [x] Secciones de Salud y Alimentación implementadas en formularios

## 8. Gestión de Usuarios y Perfiles
- [x] Página "Mi Perfil" funcional
- [x] Admin puede editar usuarios con fotos
- [x] API de perfil actualizada (`/api/admin/perfil`)
- [x] Gestión de usuarios (`/api/admin/usuarios`)
- [x] Agregar usuario individual (formulario en `/dashboard/usuarios/nuevo`, POST en `/api/usuarios`) — con generación de password temporal, copy credentials, asignación de zona
- [x] Bug fix CSV import: INSERT fallback si el trigger no crea el perfil
- [x] Roles actualizados en CSV import: 3 roles vigentes (`equipo_profesional`, `director`, `voluntario`) con backward compat de roles legacy
- [x] Asignación de zona durante importación (opcional, funciona correctamente)

## 9. Autoevaluaciones — Módulo completo
- [x] Módulo base funcional
- [x] Equipo profesional puede editar y agregar preguntas al banco — CRUD completo (crear, editar, eliminar preguntas con opciones)
- [x] Cada pregunta tiene respuesta correcta precargada — corrección automática por tipo (escala, sí/no, MC, texto)
- [x] Nuevos tipos de preguntas: `ordenar_palabras` (reordenar), `respuesta_imagen` (opciones sobre imagen), selección múltiple — CRUD en banco + render + corrección automática
- [x] Configuración de asignación: admin configura preguntas por área desde `/dashboard/configuracion` → tabla `configuracion_sistema` → `crear-desde-banco` lo carga como default
- [x] Asignación aleatoria de preguntas del banco al voluntario (shuffle + slice por área)
- [x] Máximo de niños por voluntario (≤3) como pregunta en autoevaluación
- [x] Horas disponibles como pregunta en autoevaluación (se guardan en BD, no se muestran al voluntario)
- [x] Las preguntas vienen del banco + preguntas adicionales (horas, máx. niños)
- [x] Resultados visibles en perfil del voluntario — vista expandible con detalle de cada respuesta (✅/❌/📝)
- [x] Si el puntaje no es perfecto → bloqueo de operación — banner ⛔ + botones "Nueva Sesión" deshabilitados
- [x] Sistema de notificaciones para recordar capacitaciones pendientes — API `/api/notificaciones/generar`, campana 🔔 en dashboard, intervalo configurable

## 10. Perfil de Voluntarios
- [x] Página de perfil del voluntario visible para coordinadores/profesionales — `/dashboard/usuarios/[id]/perfil`
- [x] Datos: estudios, fecha de ingreso a la Asociación Civil
- [x] Resultados de autoevaluación visibles — vista expandible de respuestas individuales
- [x] Historial de capacitaciones completadas
- [x] Última conexión del voluntario visible

## 11. Otros módulos funcionales
- [x] Capacitaciones — módulo funcional (bloqueo de operación implementado)
- [x] Trabajo Social — módulo funcional
- [x] Biblioteca/RAG — módulo base funcional
- [x] Asignaciones equipo-niño — módulo base funcional
- [x] Upload de transcripciones funcional
- [x] VoiceToText implementado

## 12. Intervenciones (Planes de Intervención) — Módulo completo
- [x] Tablas `planes_intervencion` y `comentarios_intervencion` recreadas con migración SQL + RLS + índices
- [x] API REST para planes (`/api/psicopedagogia/planes`) — GET con joins, filtros, conteo de comentarios; POST con validación de rol; PATCH con auto fecha_cierre
- [x] API REST para comentarios (`/api/psicopedagogia/comentarios`) — GET con autor, POST con auto autor_id, DELETE
- [x] Listado de planes (`/dashboard/psicopedagogia/planes/`) — stats bar, búsqueda, filtros por estado/área, cards con info de niño, badges, conteo de comentarios
- [x] Formulario de creación (`/dashboard/psicopedagogia/planes/nuevo/`) — selector de niño, título, área (6 opciones), prioridad, fecha estimada, objetivos dinámicos (+/−), actividades sugeridas
- [x] Detalle de plan (`/dashboard/psicopedagogia/planes/[planId]/`) — info completa, sidebar con metadatos, cambio de estado en línea
- [x] **Comentarios con fecha** en planes de intervención ✅
- [x] **Historial de comentarios** por intervención (quién, cuándo, qué escribió) ✅ — avatar, nombre, rol, fecha+hora, tipo de comentario (seguimiento/avance/dificultad/ajuste/cierre), eliminación de propios
- [x] Dashboard Psicopedagogía: `planesActivos` consulta Supabase en tiempo real (reemplaza hardcoded `0`)

---

# ❌ PENDIENTE

> Organizado por módulo. Prioridad indicada con 🔴 Alta, 🟠 Media, 🟡 Baja.

---

## 1. 🔴 Google Drive / Biblioteca — Acceso roto
- [x] **Bug fix: archivos inaccesibles** — nuevo endpoint proxy `/api/drive/proxy/[fileId]` que hace streaming autenticado con Service Account; el iframe apunta al proxy en lugar de a Drive directamente
- [x] **Descarga funcional** — botón ⬇️ usa `/api/drive/proxy/[fileId]?download=1` (Content-Disposition: attachment)
- [x] **Google Docs/Sheets/Slides** — se exportan a PDF via el proxy antes de servir al iframe
- [x] **Carpeta "ninos" visible SOLO para `director`** — filtro movido al servidor (`/api/drive/archivos`) usando el rol del perfil; carpetas de sistema (`fotos`, `transcripciones`) ocultas para todos desde la Biblioteca
- [x] **Búsqueda en tiempo real** — barra de búsqueda filtra archivos y carpetas por nombre
- [x] **Subir archivos desde la Biblioteca Drive** — botón "📤 Subir archivo" para roles `director`, `psicopedagogia`, `equipo_profesional` con modal inline
- [x] **Descripción de documentos** — campo de descripción al subir (guardado como `description` en Drive)
- [x] **Palabras clave/tags** — campo de tags separados por coma al subir (guardado como `appProperties.tags` en Drive); preview con pastillas de colores
- [ ] Búsqueda por palabras clave/tags en Drive (requiere listar appProperties en el GET)

## 2. 🟠 Biblioteca RAG — Tags en documentos (Nuevo)
- [x] **Columna `tags TEXT[]`** en tabla `documentos` + índice GIN para búsqueda eficiente
- [x] **Auto-tagging con IA** — al subir un documento sin tags, Gemini analiza los primeros chunks y genera 5-10 tags relevantes en background
- [x] **Tags manuales al subir** — campo de tags en el formulario de subida; si se completan, se usan directamente (sin llamar a la IA)
- [x] **Editor de tags inline** en la biblioteca — cualquier doc puede editarse con ✏️; botón "✨ Auto-IA" regenera los tags desde el contenido
- [x] **Filtro por tag** en la biblioteca — chips clickeables muestran solo docs del tag seleccionado
- [x] **Filtro por tag en el chat IA** — chips en el chat de biblioteca pre-filtran qué documentos consulta la IA (menos tokens, más precisión)
- [x] **Tags visibles en las cards** de la biblioteca — pastillas de colores por inicial del tag
- [ ] Búsqueda por palabras clave/tags en Google Drive (requiere listar `appProperties` en el GET de archivos)

## 3. 🟠 Módulo centralizado "Análisis con IA"
- [x] **Página dedicada `/dashboard/ia`** — selector de modo, chat enriquecido, historial, fuentes
- [x] **3 modos de consulta**: Consultar Biblioteca (RAG con filtro por tags), Analizar Niño (sesiones + bibliografía), Consulta Libre
- [x] **Historial persistente en Supabase** — tabla `historial_consultas_ia` con RLS; GET/POST en `/api/ia/historial`; panel lateral desplegable con búsqueda de consultas previas
- [x] **Sugerencias de vinculación** — al analizar un niño, detecta otros con el mismo nivel/perfil y sugiere comparación
- [x] **Filtro por tags en modo Biblioteca** — mismos chips que la biblioteca RAG
- [x] **Fuentes siempre visibles** en la respuesta del asistente
- [x] **Sidebar actualizado** — enlace "✨ Módulo IA" visible para `director`, `psicopedagogia`, `equipo_profesional`
- [ ] **Cards en vez de bloques de texto** (mejora UX futura — hoy usa markdown)
- [ ] **Soporte para diagramas de flujo** (roadmap)
- [ ] **Eliminar "Analizar con IA"** de perfiles individuales de niños (mantener por ahora, centralizar después)

## 4. 🟠 Equipo Profesional — Matching y acceso IA
- [ ] **Sistema de matching** voluntario-niño debe funcionar correctamente (depende de autoevaluaciones funcionando)
- [ ] **Acceso al módulo "Análisis con IA"** también desde el rol equipo profesional

## 5. 🟠 Admin — Visibilidad y tracking
- [ ] **Última conexión visible** para TODOS los perfiles (voluntarios, equipo profesional)
- [ ] **Tracking de capacitaciones**: ver qué voluntarios completaron y cuáles no

## 6. 🟠 Gestión de Zonas
- [ ] Página dedicada de gestión de zonas (CRUD: crear, editar, eliminar)
- [ ] Filtrado por zona
- [ ] "Zonas" como sección propia (no redirigir a usuarios)
- [ ] Poder cambiar/asignar zona
- [ ] Ver niños y voluntarios filtrados por zona

## 7. 🟠 Asignaciones Equipo-Niño
- [ ] Agregar equipo al niño — poder asignar un niño a un equipo/zona fácilmente
- [ ] Mantener horas en BD pero ocultar de la vista del voluntario

## 8. 🟠 Sesión Persistente
- [ ] Mantener sesión iniciada (persistencia de auth — no cerrar al recargar/cerrar app)
- [ ] Investigar e implementar solución de sesión persistente

## 9. 🟠 Estética Mobile
- [ ] Menú hamburguesa en parte izquierda superior (verificar que no obstaculice)
- [ ] Revisar todos los flujos en celular
- [ ] Touch targets de 44x44px mínimo en todos los botones

## 10. 🟡 Auditoría (Log de cambios)
- [ ] **Log completo de auditoría**: historial de TODOS los cambios en el sistema
- [ ] Registrar: quién hizo el cambio, qué cambió, cuándo
- [ ] Vista filtrable por usuario, fecha, tipo de cambio
- [ ] Última conexión de cada usuario

## 11. 🟡 Mensajería (Roadmap futuro)
- [ ] Chat interno entre usuarios
- [ ] Crear grupos
- [ ] Admin puede gestionar y ver mensajes si alguien reporta
- [ ] Filtro de palabras prohibidas (automático)
- [ ] Stickers

## 11. 🟡 Términos y Condiciones
- [ ] Redacción de T&C
- [ ] Pantalla de aceptación al registrarse
- [ ] Registro de aceptación en BD

---

# 📊 ESTADO ACTUAL DE LA PLATAFORMA

| Módulo | Estado | Notas |
|--------|--------|-------|
| Auth/Login | ✅ Funcional | Falta persistencia de sesión |
| Storage (Google Drive) | ✅ Migrado | Supabase Storage eliminado por completo |
| Dashboard Voluntario | ✅ Funcional | Notificaciones 🔔, bloqueo, scores ✅ |
| Dashboard Admin | ✅ Funcional | Falta log de auditoría |
| Dashboard Profesional | ✅ Funcional | Renombrado ✅ |
| Mi Perfil | ✅ Funcional | Fotos vía Drive ✅ |
| CRUD Niños | ✅ Funcional | Campos completos, foto, visibilidad por rol ✅ |
| Ingreso Completo | ✅ Funcional | Madre/padre/referente + escolaridad + familiares ✅ |
| Grabación Reuniones | ✅ Funcional | MeetingRecorder + transcripción + IA ✅ |
| Registro con IA | ✅ Funcional | Auto-llenado desde transcripción vía Gemini ✅ |
| Perfil Niño | ✅ Funcional | Grabaciones, nombre por rol, foto ✅ |
| Sesiones | ✅ Funcional | CRUD, cronómetro, asistencia masiva, fecha seleccionable ✅ |
| Autoevaluaciones | ✅ Funcional | CRUD banco ✅, nuevos tipos ✅, config ✅, notificaciones ✅, corrección automática ✅ |
| Capacitaciones | ✅ Funcional | Bloqueo de operación implementado ✅ |
| Perfil Voluntario | ✅ Funcional | Scores, historial, detalle expandible ✅ |
| Gestión Usuarios | ✅ Funcional | Crear individual ✅, CSV import fix ✅, roles actualizados ✅ |
| Trabajo Social | ✅ Funcional | — |
| Configuración Admin | ✅ Funcional | Preguntas/área, notificaciones toggle + intervalo ✅ |
| Biblioteca/RAG | ✅ Funcional | Proxy autenticado ✅, permisos por rol ✅, búsqueda ✅, upload+tags ✅, tags IA ✅, filtro chat ✅ |
| Equipos/Zonas | ⚠️ Parcial | Falta CRUD de zonas dedicado |
| Asignaciones | ⚠️ Parcial | Matching depende de autoevaluaciones (ya funcionales) |
| Intervenciones | ✅ Funcional | Planes + comentarios con fecha, historial completo ✅ |
| Módulo IA centralizado | ✅ Funcional | Historial ✅, 3 modos ✅, vinculación ✅ |
| Auditoría/Logs | ❌ No existe | Pendiente |
| Mensajería | ❌ No existe | Roadmap futuro |

---

# 📝 HISTORIAL DE COMMITS

### 19/02/2026 — Commit `422affe` (main) — +3874/-452 líneas — **PUSHEADO ✅**
**feat: sistema de tags RAG + Módulo IA centralizado + Drive proxy**
- 25 archivos modificados/creados; build 0 errores TypeScript
- Ver detalle completo en secciones § Tags, § Módulo IA, § Drive Proxy, § Intervenciones más abajo

### 19/02/2026 — SQL Migration: Biblioteca RAG — tablas base (documentos + chunks + función)
**Corrección: tablas documentos y document_chunks faltaban en Supabase**
- `supabase/migrations/20260219_biblioteca_rag_completa.sql` — **NUEVO** Crea `documentos`, `document_chunks`, función `match_documents`, RLS, índices GIN + HNSW

### 19/02/2026 — Módulo IA centralizado: historial + 3 modos + vinculación
**Nuevo módulo `/dashboard/ia` — consultas unificadas a la IA con historial persistente**
- `supabase/migrations/20260219_historial_consultas_ia.sql` — **NUEVO** Tabla `historial_consultas_ia` + RLS + índices
- `src/app/api/ia/historial/route.ts` — **NUEVO** GET (paginado, rol-aware) + POST (guarda consulta con tokens estimados)
- `src/app/dashboard/ia/page.tsx` — **NUEVO** Módulo IA: 3 modos (Biblioteca/Análisis Niño/Libre), filtro tags, selector niño, historial lateral, sugerencias vinculación, markdown+fuentes
- `src/components/layouts/Sidebar.tsx` — **EDITADO** Agrega enlace "Módulo IA" + ícono `SparklesIcon` (roles: director, psicopedagogia, equipo_profesional)

### 19/02/2026 — Biblioteca RAG: sistema de tags (auto-IA + manual + filtro chat)
**Tags en documentos psicopedagógicos — generación automática, edición manual, filtro en biblioteca y chat**
- `supabase/migrations/20260219_documentos_tags.sql` — **NUEVO** Columna `tags TEXT[]` + índice GIN en tabla `documentos`
- `src/app/api/documentos/autotag/route.ts` — **NUEVO** POST: lee primeros 4 chunks, llama a Gemini Flash para generar 5-10 tags, los guarda en la tabla
- `src/app/api/documentos/[id]/route.ts` — **EDITADO** Agrega PATCH para actualizar tags manualmente (sanitiza, deduplica, max 10)
- `src/app/api/documentos/procesar/route.ts` — **EDITADO** Acepta `tags` manual desde FormData; si no hay tags manuales, dispara autotag en background tras indexar
- `src/app/api/chat/route.ts` — **EDITADO** Acepta `tags[]` en el body; pre-filtra documentos con `.overlaps('tags', tagsFiltro)` antes del RAG; incluye info de filtro en respuesta
- `src/app/dashboard/biblioteca/page.tsx` — **REESCRITO** Filtro por tag (chips), editor inline de tags con preview de pastillas, botón ✨ Auto-IA por documento, búsqueda combinada texto+tag
- `src/app/dashboard/biblioteca/chat/page.tsx` — **REESCRITO** Chips de tags en barra superior; al seleccionar, la consulta solo busca en docs con esos tags (menos tokens, más precisión)
- `src/app/dashboard/biblioteca/subir/page.tsx` — **EDITADO** Campo tags con preview de pastillas; si se dejan vacíos, la IA los genera automáticamente

### 19/02/2026 — Google Drive / Biblioteca: proxy, permisos por rol, upload con metadatos, búsqueda
**Biblioteca Drive — fixes completos: preview autenticado, descarga, upload mejorado, filtrado de carpetas**
- `src/app/api/drive/proxy/[fileId]/route.ts` — **NUEVO** Proxy streaming autenticado con Service Account; exporta Google Docs/Sheets/Slides a PDF; soporta `?download=1` (Content-Disposition: attachment)
- `src/app/api/drive/archivos/route.ts` — **EDITADO** Filtrado de carpetas movido al servidor: lee `rol` de `perfiles`; oculta `fotos`/`transcripciones` para todos; oculta `ninos`/`niños` para no-directores
- `src/app/api/drive/subir/route.ts` — **EDITADO** Lee `description` y `tags` de FormData; guarda como `description` + `appProperties.tags` en Drive
- `src/app/dashboard/biblioteca/drive/page.tsx` — **REESCRITO** Preview vía proxy, botón ⬇️ con proxy, búsqueda en tiempo real, modal upload con descripción+tags+pastillas, botón Subir por rol

### 19/02/2026 — Intervenciones: módulo completo (planes + comentarios)
**Planes de Intervención — CRUD completo + historial de comentarios con fecha**
- `supabase/migrations/20260219_planes_intervencion.sql` — **NUEVO** Migración: tablas `planes_intervencion` + `comentarios_intervencion`, RLS, índices
- `src/app/api/psicopedagogia/planes/route.ts` — **NUEVO** API planes (GET/POST/PATCH) con joins, filtros, conteo comentarios
- `src/app/api/psicopedagogia/comentarios/route.ts` — **NUEVO** API comentarios (GET/POST/DELETE) con autor
- `src/app/dashboard/psicopedagogia/planes/page.tsx` — **REESCRITO** Listado planes con stats, búsqueda, filtros estado/área
- `src/app/dashboard/psicopedagogia/planes/nuevo/page.tsx` — **REESCRITO** Formulario creación con objetivos dinámicos, selector niño
- `src/app/dashboard/psicopedagogia/planes/[planId]/page.tsx` — **NUEVO** Detalle plan + sección comentarios (historial + form + tipos)
- `src/components/dashboard/PsicopedagogiaDashboard.tsx` — planesActivos con query real Supabase

### 18/02/2026 — Commit `5ae98af` (main) — +1071/-58 líneas
**Nuevos tipos pregunta, config admin, sistema notificaciones**
- `src/app/api/notificaciones/generar/route.ts` — **NUEVO** API de generación de recordatorios
- `src/app/dashboard/autoevaluaciones/gestionar/banco-preguntas/page.tsx` — CRUD para `ordenar_palabras` y `respuesta_imagen`
- `src/app/dashboard/autoevaluaciones/gestionar/crear-desde-banco/page.tsx` — Propaga `imagen_url` y `datos_extra`, carga config default
- `src/app/dashboard/autoevaluaciones/mis-respuestas/completar/[plantillaId]/page.tsx` — Render + corrección para nuevos tipos
- `src/app/dashboard/configuracion/page.tsx` — **REESCRITO** Config funcional con DB
- `src/components/dashboard/VoluntarioDashboard.tsx` — Campana 🔔 + panel notificaciones

### 18/02/2026 — Commit `71bfe44` (main)
**Corrección automática, resultados en perfil, banner bloqueo capacitaciones**
- Corrección automática por tipo de pregunta (escala, sí/no, MC, texto)
- Vista expandible de respuestas individuales en perfil voluntario
- Banner ⛔ bloqueo operación + botones Nueva Sesión deshabilitados

### 14/02/2026 — Commit `ba4bce4` (main) — +1886/-634 líneas
**Migración Google Drive + Perfiles + Seguridad + Fixes**
- `src/lib/drive-storage.ts` — Helper de Google Drive
- `src/app/api/admin/perfil/route.ts` — API perfil
- `src/app/api/admin/perfil/foto/route.ts` — API foto perfil
- `src/app/api/storage/upload/route.ts` — Upload genérico
- `src/app/dashboard/mi-perfil/page.tsx` — Página Mi Perfil
- `src/app/api/drive/subir/route.ts` — Upload a Drive
- `src/app/api/audio/route.ts` — Playback audio
- `src/app/api/admin/resetear-password/route.ts` — Reset password
- `src/app/api/admin/usuarios/route.ts` — Gestión usuarios
- `src/app/dashboard/ninos/[ninoId]/page.tsx` — Perfil niño
- `src/app/dashboard/usuarios/[id]/editar/page.tsx` — Editar usuario
- `src/app/dashboard/usuarios/page.tsx` — Lista usuarios
- `src/components/Sidebar.tsx` — Sidebar actualizado
- `.env.example` — Variables de entorno actualizadas

### 14/02/2026 — Commit `a448138` (main) — +1701/-154 líneas
**Registro completo + MeetingRecorder + IA**
- `src/components/forms/MeetingRecorder.tsx` — **NUEVO** ~400 líneas
- `src/app/api/ia/transcripcion-ingreso/route.ts` — **NUEVO** ~120 líneas
- `src/app/dashboard/ninos/nuevo/page.tsx` — **REESCRITURA COMPLETA** ~950 líneas
- `src/app/dashboard/ninos/[ninoId]/page.tsx` — Grabaciones en perfil
- `src/app/dashboard/ninos/page.tsx` — Roles ampliados

---

> **Nota**: Este checklist se actualiza en cada sesión de trabajo. Los ítems se mueven de PENDIENTE a HECHO a medida que se completan.
