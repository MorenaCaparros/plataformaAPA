# 📋 CHECKLIST — Plataforma APA (Acompañar Para Aprender)
### ONG Adelante | Actualizado: 14/02/2026

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

## 9. Otros módulos funcionales
- [x] Capacitaciones — módulo funcional
- [x] Trabajo Social — módulo funcional
- [x] Autoevaluaciones — módulo base funcional
- [x] Biblioteca/RAG — módulo base funcional
- [x] Asignaciones equipo-niño — módulo base funcional
- [x] Upload de transcripciones funcional
- [x] VoiceToText implementado

---

# ❌ PENDIENTE

> Organizado por módulo. Prioridad indicada con 🔴 Alta, 🟠 Media, 🟡 Baja.

---

## 1. 🔴 Intervenciones (Prioridad Alta)
- [ ] **Comentarios con fecha** en planes de intervención
- [ ] **Historial de comentarios** por intervención (quién, cuándo, qué escribió)

## 2. 🔴 Sesiones — Bugs y mejoras
- [x] **Bug: no se puede seleccionar un niño al crear sesión** — fix: dashboard y listado ahora consultan tabla `asignaciones` primero, niños sin sesiones aparecen correctamente
- [x] Agregar opción "No completó el campo" en ítems de sesión (N/C, no afecta promedio) — ya implementado
- [x] Cronómetro de duración de sesión (auto-start, persistente al navegar, pausa persiste, banner de sesión activa en dashboard/listado)
- [x] Ítem de permanencia y año (solo sí/no — se registra en perfil del niño) — ya implementado
- [x] Porcentaje de asistencia acumulado visible en perfil del niño — ya implementado + nueva página /dashboard/asistencia para registro masivo
- [x] Fecha seleccionable al registrar sesión (default hoy, permite seleccionar días anteriores)
- [x] Registro de asistencia masivo: voluntarios y coordinadores pueden marcar presentes/ausentes a múltiples niños de una vez

## 3. 🔴 Autoevaluaciones — Refactorización completa
- [ ] **Equipo profesional puede editar y agregar preguntas** al banco de preguntas
- [ ] **Cada pregunta debe tener una respuesta correcta precargada** (para corrección automática)
- [ ] **Nuevos tipos de preguntas**: unir palabras, respuesta con imagen, selección múltiple, etc.
- [ ] **Configuración de asignación**: admin/equipo profesional configura cuántas preguntas se asignan a cada voluntario
- [ ] **Asignación aleatoria** de preguntas del banco al voluntario
- [ ] Máximo de niños por voluntario (≤3) como pregunta en autoevaluación
- [ ] Horas disponibles como pregunta en autoevaluación (se guardan en BD pero NO se muestran al voluntario)

## 4. 🔴 Voluntario — Autoevaluación y Capacitaciones
- [ ] Las preguntas vienen del **banco de preguntas** + preguntas adicionales (horas disponibles, máx. niños)
- [ ] **Resultados visibles** en el perfil del voluntario
- [ ] **Si el puntaje no es perfecto** → el voluntario debe completar capacitaciones antes de poder operar
- [ ] **Sistema de notificaciones** para recordar capacitaciones pendientes (intervalo configurable por admin)

## 5. 🔴 Gestión de Usuarios — Bugs y mejoras
- [x] **Agregar usuario individual** (formulario en `/dashboard/usuarios/nuevo`, POST en `/api/usuarios`) — con generación de password temporal, copy credentials, asignación de zona
- [x] **Bug CSV import**: los usuarios se crean en Supabase Auth pero NO en la tabla `perfiles` → fix: INSERT fallback si el trigger no crea el perfil
- [x] **Roles desactualizados en CSV import** → actualizado a 3 roles vigentes: `equipo_profesional`, `director`, `voluntario` (con backward compat de roles legacy: coordinador→equipo_profesional, psicopedagogia→equipo_profesional, admin→director)
- [x] Asignación de zona durante importación (sigue siendo opcional, funciona correctamente)

## 6. 🔴 Google Drive / Biblioteca — Acceso roto
- [ ] **Bug: archivos de Biblioteca completamente inaccesibles** — los archivos de Drive no se pueden abrir/descargar
- [ ] **Configurar permisos de Drive**: solo `fotos` y `transcripciones` deben ser restringidos (admin only); el resto de archivos debe ser accesible para todos los roles
- [ ] **Carpeta "ninos" en Biblioteca**: visible SOLO para rol `director`
- [ ] Agregar palabras clave/tags al subir documentos
- [ ] Descripción de documentos subidos al Drive
- [ ] Búsqueda por palabras clave en Biblioteca

## 7. 🟠 Módulo centralizado "Análisis con IA" (Nuevo)
- [ ] **Sección/página dedicada** para TODOS los análisis con IA (separar del perfil de niños y de biblioteca)
- [ ] **Consultas por niño específico, material o tema**
- [ ] **Historial de prompts/búsquedas** guardado en Supabase (tabla dedicada)
- [ ] **Sugerencias basadas en historial**: si se trabaja con un niño y aparece otro con particularidades similares, la IA sugiere la vinculación
- [ ] **Eliminar "Analizar con IA"** de perfiles individuales de niños y de biblioteca → centralizar todo en este módulo
- [ ] **Componente tipo Notebook/LMS** (ya existe base, necesita mejoras):
  - [ ] Cards en vez de bloques de texto
  - [ ] Soporte para diagramas de flujo
  - [ ] Actividades con referencias a libros (cita exacta: página, capítulo)
- [ ] **Accesible para admin Y equipo profesional**

## 8. 🟠 Equipo Profesional — Matching y acceso IA
- [ ] **Sistema de matching** voluntario-niño debe funcionar correctamente (depende de autoevaluaciones funcionando)
- [ ] **Acceso al módulo "Análisis con IA"** también desde el rol equipo profesional

## 9. 🟠 Perfil de Voluntarios (página dedicada)
- [ ] Página de perfil del voluntario visible para coordinadores/profesionales
- [ ] Datos: estudios, fecha de ingreso a la ONG
- [ ] Resultados de autoevaluación visibles
- [ ] Historial de capacitaciones completadas
- [ ] Última conexión del voluntario visible

## 10. 🟠 Admin — Visibilidad y tracking
- [ ] **Última conexión visible** para TODOS los perfiles (voluntarios, equipo profesional)
- [ ] **Tracking de capacitaciones**: ver qué voluntarios completaron y cuáles no

## 11. 🟠 Gestión de Zonas
- [ ] Página dedicada de gestión de zonas (CRUD: crear, editar, eliminar)
- [ ] Filtrado por zona
- [ ] "Zonas" como sección propia (no redirigir a usuarios)
- [ ] Poder cambiar/asignar zona
- [ ] Ver niños y voluntarios filtrados por zona

## 12. 🟠 Asignaciones Equipo-Niño
- [ ] Agregar equipo al niño — poder asignar un niño a un equipo/zona fácilmente
- [ ] Mantener horas en BD pero ocultar de la vista del voluntario

## 13. 🟠 Sesión Persistente
- [ ] Mantener sesión iniciada (persistencia de auth — no cerrar al recargar/cerrar app)
- [ ] Investigar e implementar solución de sesión persistente

## 14. 🟠 Estética Mobile
- [ ] Menú hamburguesa en parte izquierda superior (verificar que no obstaculice)
- [ ] Revisar todos los flujos en celular
- [ ] Touch targets de 44x44px mínimo en todos los botones

## 15. 🟡 Auditoría (Log de cambios)
- [ ] **Log completo de auditoría**: historial de TODOS los cambios en el sistema
- [ ] Registrar: quién hizo el cambio, qué cambió, cuándo
- [ ] Vista filtrable por usuario, fecha, tipo de cambio
- [ ] Última conexión de cada usuario

## 16. 🟡 Mensajería (Roadmap futuro)
- [ ] Chat interno entre usuarios
- [ ] Crear grupos
- [ ] Admin puede gestionar y ver mensajes si alguien reporta
- [ ] Filtro de palabras prohibidas (automático)
- [ ] Stickers

## 17. 🟡 Términos y Condiciones
- [ ] Redacción de T&C
- [ ] Pantalla de aceptación al registrarse
- [ ] Registro de aceptación en BD

---

# 📊 ESTADO ACTUAL DE LA PLATAFORMA

| Módulo | Estado | Notas |
|--------|--------|-------|
| Auth/Login | ✅ Funcional | Falta persistencia de sesión |
| Storage (Google Drive) | ✅ Migrado | Supabase Storage eliminado por completo |
| Dashboard Voluntario | ✅ Funcional | — |
| Dashboard Admin | ✅ Funcional | Falta log de auditoría |
| Dashboard Profesional | ✅ Funcional | Renombrado ✅ |
| Mi Perfil | ✅ Funcional | Fotos vía Drive ✅ |
| CRUD Niños | ✅ Funcional | Campos completos, foto, visibilidad por rol ✅ |
| Ingreso Completo | ✅ Funcional | Madre/padre/referente + escolaridad + familiares ✅ |
| Grabación Reuniones | ✅ Funcional | MeetingRecorder + transcripción + IA ✅ |
| Registro con IA | ✅ Funcional | Auto-llenado desde transcripción vía Gemini ✅ |
| Perfil Niño | ✅ Funcional | Grabaciones, nombre por rol, foto ✅ |
| Sesiones | ⚠️ Bug | No se puede seleccionar niño al crear sesión |
| Autoevaluaciones | ⚠️ Parcial | Base funcional, falta refactorización completa |
| Biblioteca/RAG | ❌ Roto | Archivos inaccesibles desde Drive |
| Equipos/Zonas | ⚠️ Parcial | Falta CRUD de zonas dedicado |
| Asignaciones | ⚠️ Parcial | Depende de autoevaluaciones |
| Capacitaciones | ✅ Funcional | Falta tracking por admin |
| Trabajo Social | ✅ Funcional | — |
| Intervenciones | ⚠️ Parcial | Falta comentarios con fecha |
| Usuarios (import CSV) | ⚠️ Bug | No crea en tabla perfiles, roles desactualizados |
| Perfil Voluntario | ❌ No existe | Página dedicada pendiente |
| Módulo IA centralizado | ❌ No existe | Nuevo módulo propuesto |
| Auditoría/Logs | ❌ No existe | Pendiente |
| Mensajería | ❌ No existe | Roadmap futuro |

---

# 📝 HISTORIAL DE COMMITS

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
