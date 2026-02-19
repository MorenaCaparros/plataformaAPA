# 🧪 TESTING PENDIENTE — Plataforma APA
### Última actualización: 19/02/2026 — Commit `422affe` pusheado ✅

> **Estado del código:** todo commiteado y pusheado a `main`.
> **Pendiente crítico:** correr las 4 migraciones SQL en Supabase antes de testear Tandas 5-8.

---

## 🔴 MIGRACIONES SQL PENDIENTES (correr en Supabase SQL Editor)

> ⚠️ **Importante:** Las Tandas 5, 6, 7 y 8 no funcionarán hasta que corras estas migraciones.
> Orden: primero la 1, luego la 2, 3 y 4.

### Migración 1 — `20260219_biblioteca_rag_completa.sql` ← **CRÍTICA** (correr primero)
- Crea las tablas `documentos` y `document_chunks` (faltaban por completo)
- Crea la función `match_documents` para búsqueda vectorial
- Activa RLS + políticas por rol
- Índice HNSW en embeddings + índice GIN en tags
- **Fixes el error: "relation documentos does not exist"**

### Migración 2 — `20260219_documentos_tags.sql` (idempotente)
- Agrega columna `tags TEXT[]` a la tabla `documentos`
- Agrega índice GIN para búsqueda eficiente por tags
- Es seguro correr después de la migración 1

### Migración 3 — `20260219_planes_intervencion.sql`
- Crea tablas `planes_intervencion` y `comentarios_intervencion`
- RLS + índices

### Migración 4 — `20260219_historial_consultas_ia.sql`
- Crea tabla `historial_consultas_ia`
- RLS (usuario ve su propio historial, director ve todo)
- Índices por usuario + niño + modo

---
> Marcar con [x] cuando se pruebe y funcione, o anotar el bug encontrado.

---

## 🔵 Tanda 1 — Bugs de creación de usuario (18/02/2026)

### Test 1.1: Crear usuario desde panel admin
- [ ] Ir a `/dashboard/usuarios` → Crear nuevo usuario
- [ ] Completar formulario con email, nombre, rol (ej: voluntario)
- [ ] Verificar que se crea sin error "null email"
- [ ] Verificar que el perfil tiene email guardado en la tabla `perfiles`

### Test 1.2: Crear usuario con rol equipo_profesional
- [ ] Crear un usuario con rol `equipo_profesional`
- [ ] Verificar que no da error de CHECK constraint
- [ ] Verificar que aparece correctamente en la lista de usuarios

---

## 🟡 Tanda 2 — Fixes del voluntario (18/02/2026)

### Test 2.1: Autoevaluación — Título muestra las 4 áreas
- [ ] Loguearse como voluntario
- [ ] Ir a Autoevaluaciones → completar una autoevaluación
- [ ] Verificar que el header muestra **4 badges** (Lenguaje, Grafismo, Lectura/Escritura, Matemáticas) en vez de solo un área
- [ ] Verificar que el gradiente del header funciona correctamente

### Test 2.2: Autoevaluación — Progreso NO cuenta max_niños ni horas
- [ ] En la misma autoevaluación, verificar la barra de progreso
- [ ] La barra debe decir `X / Y` donde Y = **solo** las preguntas del banco (NO +2)
- [ ] Responder todas las preguntas y verificar que la barra llega a 100%
- [ ] Las preguntas especiales (max niños y horas) deben seguir apareciendo al final pero NO contar en el progreso

### Test 2.3: Autoevaluación — Score no afectado por preguntas especiales
- [ ] Completar y enviar la autoevaluación
- [ ] Verificar que el puntaje final es sobre 10 puntos (basado solo en preguntas de escala 1-5)
- [ ] Verificar en Supabase que `puntaje_final` y `porcentaje` NO están inflados por las preguntas especiales

### Test 2.4: Mi Perfil — Campos de disponibilidad para voluntario
- [ ] Loguearse como voluntario → ir a Mi Perfil (`/dashboard/mi-perfil`)
- [ ] Verificar que aparece sección **"Disponibilidad"** con:
  - [ ] Selector de max niños (botones 1, 2, 3)
  - [ ] Selector de horas semanales (botones +/−)
- [ ] Cambiar los valores y guardar
- [ ] Recargar la página y verificar que los valores se mantienen
- [ ] Verificar en Supabase que `max_ninos_asignados` y `horas_disponibles` se actualizaron

### Test 2.5: Mi Perfil — NO muestra disponibilidad para otros roles
- [ ] Loguearse como coordinador o director
- [ ] Ir a Mi Perfil
- [ ] Verificar que la sección "Disponibilidad" **NO aparece**

### Test 2.6: Biblioteca Drive — Voluntario NO ve carpeta "niños"
- [ ] Loguearse como voluntario
- [ ] Ir a Biblioteca → Google Drive
- [ ] Verificar que la carpeta "niños" (o "ninos") **NO aparece** en la lista de carpetas
- [ ] Loguearse como director/admin y verificar que la carpeta "niños" **SÍ aparece**

### Test 2.7: Sidebar — Voluntario NO ve "Niños" en el menú
- [ ] Loguearse como voluntario
- [ ] Verificar que en el sidebar/menú lateral **NO aparece** el link "Niños"
- [ ] Verificar que SÍ aparecen: Inicio, Sesiones, Asistencia, Autoevaluaciones, Biblioteca, Mi Perfil
- [ ] Loguearse como coordinador → verificar que "Niños" **SÍ aparece**

### Test 2.8: Dashboard voluntario — Score y estrellas visibles
- [ ] Loguearse como voluntario que **ya completó** una autoevaluación
- [ ] En el dashboard (`/dashboard`), verificar que aparece sección **"Mi Progreso"** con:
  - [ ] Puntaje de autoevaluación mostrado como **5 estrellas** (ej: 8/10 = 4 estrellas)
  - [ ] Texto con el puntaje numérico (ej: "8/10 puntos (80%)")
- [ ] Verificar las **4 tarjetas de áreas** (Lenguaje, Grafismo, Lectura/Escritura, Matemáticas):
  - [ ] Cada una muestra estrellas según el score del área
  - [ ] Si necesita capacitación, dice "Capacitación pendiente" en rojo
  - [ ] Colores distintos por área (azul, verde, violeta, naranja)

### Test 2.9: Dashboard voluntario — Sin autoevaluación completada
- [ ] Loguearse como voluntario que **NO completó** ninguna autoevaluación
- [ ] Verificar que la sección "Mi Progreso" **NO aparece**
- [ ] Verificar que SÍ aparece el banner amarillo de "Tenés X autoevaluaciones pendientes"

### Test 2.10: Dashboard voluntario — Acciones rápidas
- [ ] Verificar que en "Acciones Rápidas" aparece **"📚 Biblioteca"** en vez de "👦 Ver Niños"

---

## 🔴 Tanda 3 — Autoevaluaciones: corrección automática, perfil, bloqueo (18/02/2026)

### Test 3.1: Corrección automática — Preguntas escala 1-5
- [ ] Loguearse como voluntario
- [ ] Completar una autoevaluación que tenga preguntas de escala 1-5
- [ ] Enviar la autoevaluación
- [ ] Verificar que el alert final muestra puntaje real (no fórmula vieja `promedio * 2`)
- [ ] Verificar en Supabase → `respuestas_capacitaciones`:
  - [ ] `es_correcta = true` si respondió 4 o 5
  - [ ] `es_correcta = false` si respondió 1, 2 o 3
  - [ ] `puntaje_obtenido` es proporcional (ej: 3/5 × puntaje_max)

### Test 3.2: Corrección automática — Preguntas Sí/No
- [ ] Si hay preguntas sí/no en el banco, completar una autoevaluación con ellas
- [ ] Verificar que compara correctamente con `respuesta_correcta` de la pregunta
- [ ] En Supabase: `es_correcta = true` si coincide, `false` si no
- [ ] `puntaje_obtenido` = puntaje_max si correcta, 0 si incorrecta

### Test 3.3: Corrección automática — Multiple choice
- [ ] Si hay preguntas multiple_choice en el banco, completar una
- [ ] Verificar que compara la opción elegida con la opción marcada como `es_correcta` en `opciones_pregunta`
- [ ] En Supabase: `es_correcta` y `puntaje_obtenido` reflejan si acertó o no

### Test 3.4: Corrección automática — Texto abierto
- [ ] Si hay preguntas de texto libre, completar una
- [ ] Verificar que en Supabase: `es_correcta = null` (requiere revisión manual)
- [ ] `puntaje_obtenido = 0` (se asigna manualmente después)

### Test 3.5: Resultado final — Alert detallado
- [ ] Al enviar la autoevaluación, verificar que el alert muestra:
  - [ ] Puntaje X/10 con porcentaje
  - [ ] Cantidad de correctas ✅
  - [ ] Cantidad de incorrectas ❌ (si las hay)
  - [ ] Cantidad de revisión pendiente 📝 (si hay texto abierto)
  - [ ] Warning si porcentaje < 70%

### Test 3.6: Perfil voluntario — Vista expandible de respuestas
- [ ] Loguearse como director/coordinador/psicopedagogía
- [ ] Ir a `/dashboard/usuarios` → click en un voluntario que completó autoevaluaciones
- [ ] En la sección "Historial de Autoevaluaciones", verificar:
  - [ ] Cada autoevaluación tiene un icono de chevron (▼)
  - [ ] Al hacer click, se expande y muestra las respuestas individuales
  - [ ] Cada respuesta muestra ✅/❌/📝 según si fue correcta/incorrecta/manual
  - [ ] Muestra la respuesta del voluntario y la respuesta correcta
  - [ ] Muestra el puntaje obtenido vs máximo por pregunta
  - [ ] Las de texto abierto dicen "Respuesta de texto — requiere revisión manual"
  - [ ] Al hacer click de nuevo, se colapsa

### Test 3.7: Dashboard voluntario — Banner de bloqueo prominente
- [ ] Loguearse como voluntario que tiene `necesita_capacitacion = true` en algún área
- [ ] Verificar que aparece un banner rojo/grande con:
  - [ ] ⛔ "Operación bloqueada — Capacitación requerida"
  - [ ] Lista de áreas con puntaje no perfecto
  - [ ] Botón "📚 Completar Capacitaciones" (link a `/dashboard/capacitaciones`)
  - [ ] Botón "📋 Ver Autoevaluaciones" (link a `/dashboard/autoevaluaciones`)

### Test 3.8: Dashboard voluntario — Botones Nueva Sesión bloqueados
- [ ] Con el mismo voluntario bloqueado:
  - [ ] Verificar que los botones "Nueva Sesión" en cada niño muestran **"🔒 Bloqueado"**
  - [ ] Verificar que están **deshabilitados** (gris, cursor not-allowed)
  - [ ] Verificar que al hacer click **NO navegan** a nueva sesión
  - [ ] Verificar que el botón "Ver Perfil" del niño **SÍ funciona** normalmente

### Test 3.9: Dashboard voluntario — Sin bloqueo cuando todo está OK
- [ ] Loguearse como voluntario con puntaje perfecto (100%) en todas las áreas
- [ ] Verificar que NO aparece el banner de bloqueo
- [ ] Verificar que los botones "Nueva Sesión" funcionan normalmente (verde, clickeable)

---

## 📝 Bugs encontrados durante testing

| # | Test | Descripción del bug | Estado |
|---|------|---------------------|--------|
| 1 |      |                     |        |
| 2 |      |                     |        |
| 3 |      |                     |        |

---

## ✅ Archivos modificados en esta tanda

| Archivo | Cambio |
|---------|--------|
| `src/app/api/usuarios/route.ts` | Email agregado a 3 operaciones de perfiles |
| `supabase/migrations/20260218_agregar_rol_equipo_profesional.sql` | CHECK constraint incluye equipo_profesional |
| `src/app/dashboard/autoevaluaciones/mis-respuestas/completar/[plantillaId]/page.tsx` | Título con 4 áreas, progreso sin +2 |
| `src/app/dashboard/mi-perfil/page.tsx` | Campos max_niños y horas para voluntario |
| `src/app/dashboard/biblioteca/drive/page.tsx` | Oculta carpeta "niños" para voluntario |
| `src/components/layouts/Sidebar.tsx` | "Niños" restringido (no visible para voluntario) |
| `src/components/dashboard/VoluntarioDashboard.tsx` | Score + estrellas + áreas en dashboard, acción rápida cambiada |
| `src/app/dashboard/autoevaluaciones/mis-respuestas/completar/[plantillaId]/page.tsx` | Corrección automática real por tipo (escala, sí/no, MC, texto) |
| `src/app/dashboard/usuarios/[id]/perfil/page.tsx` | Vista expandible de respuestas individuales por autoevaluación |
| `src/components/dashboard/VoluntarioDashboard.tsx` | Banner bloqueo ⛔ + botones Nueva Sesión deshabilitados |

---

## 🟣 Tanda 4 — Autoevaluaciones: nuevos tipos, config, notificaciones (18/02/2026)

### Test 4.1: Banco de preguntas — Crear pregunta "Ordenar palabras"
- [ ] Loguearse como equipo profesional o director
- [ ] Ir a Autoevaluaciones → Gestionar → Banco de Preguntas
- [ ] Agregar nueva pregunta con tipo **"Ordenar palabras"**
- [ ] Verificar que aparece la interfaz para agregar palabras en orden
- [ ] Agregar al menos 3 palabras y guardar
- [ ] Verificar que la pregunta aparece en la lista con las "pastillas" de palabras ordenadas
- [ ] Verificar en Supabase que `datos_extra` tiene `{"palabras": [...]}` y `respuesta_correcta` es pipe-delimited

### Test 4.2: Banco de preguntas — Crear pregunta "Respuesta con imagen"
- [ ] Agregar nueva pregunta con tipo **"Respuesta con imagen"**
- [ ] Verificar que aparece campo de URL de imagen + preview
- [ ] Agregar una URL de imagen válida (ej: https://via.placeholder.com/300)
- [ ] Agregar opciones de respuesta y marcar una como correcta
- [ ] Guardar y verificar que la imagen se muestra en la lista
- [ ] Verificar en Supabase que `imagen_url` está guardado correctamente

### Test 4.3: Banco de preguntas — Editar preguntas nuevos tipos
- [ ] Editar una pregunta de tipo "Ordenar palabras"
- [ ] Verificar que las palabras se cargan correctamente en modo edición
- [ ] Modificar el orden, agregar/eliminar palabras, guardar
- [ ] Editar una pregunta de tipo "Respuesta con imagen"
- [ ] Verificar que la URL de imagen se carga y la preview funciona
- [ ] Cambiar el tipo de la pregunta a otro tipo y verificar que los campos se resetean

### Test 4.4: Completar autoevaluación — Ordenar palabras
- [ ] Loguearse como voluntario
- [ ] Completar una autoevaluación que tenga preguntas de tipo "Ordenar palabras"
- [ ] Verificar que las palabras aparecen en orden aleatorio con botón "Empezar a ordenar"
- [ ] Reordenar usando los botones ▲/▼
- [ ] Enviar la respuesta y verificar corrección automática:
  - [ ] `es_correcta = true` si el orden es correcto
  - [ ] `es_correcta = false` si el orden es incorrecto

### Test 4.5: Completar autoevaluación — Respuesta con imagen
- [ ] Completar una autoevaluación que tenga preguntas de tipo "Respuesta con imagen"
- [ ] Verificar que la imagen se muestra sobre las opciones de respuesta
- [ ] Seleccionar una opción y verificar corrección automática
- [ ] Verificar que funciona igual que multiple_choice pero con imagen visible

### Test 4.6: Crear desde banco — Config default preguntas por área
- [ ] Loguearse como director
- [ ] Ir a Configuración → cambiar "Preguntas por área" a 3
- [ ] Guardar configuración
- [ ] Ir a Autoevaluaciones → Gestionar → Crear desde Banco
- [ ] Verificar que el valor default de "Preguntas por área" es **3** (no 5)
- [ ] Verificar que se pueden crear autoevaluaciones con los nuevos tipos de preguntas incluidos

### Test 4.7: Configuración — Página funcional
- [ ] Loguearse como director
- [ ] Ir a `/dashboard/configuracion`
- [ ] Verificar sección **Autoevaluaciones**:
  - [ ] Input numérico "Preguntas por área" con botones +/−
  - [ ] Link "Gestionar Banco de Preguntas"
- [ ] Verificar sección **Notificaciones**:
  - [ ] Toggle "Recordatorios activos"
  - [ ] Input "Intervalo de recordatorios" con conversión a días visible
  - [ ] Al desactivar toggle, el campo de intervalo se desactiva (opacity)
- [ ] Cambiar valores y guardar → verificar animación de éxito ✅
- [ ] Recargar página → verificar que los valores persisten
- [ ] Verificar en Supabase tabla `configuracion_sistema` que los valores se actualizaron

### Test 4.8: Notificaciones — Campana en dashboard voluntario
- [ ] Loguearse como voluntario
- [ ] Verificar que aparece el botón 🔔 en la esquina superior derecha del dashboard
- [ ] Si no hay notificaciones, al hacer click se muestra "Sin notificaciones" con 🔕
- [ ] Verificar que NO aparece badge rojo si no hay notificaciones no leídas

### Test 4.9: Notificaciones — Generación automática de recordatorios
- [ ] Loguearse como voluntario con **capacitaciones pendientes** (necesita_capacitacion = true en algún área)
- [ ] Esperar 2-3 segundos en el dashboard (se dispara POST a `/api/notificaciones/generar`)
- [ ] Verificar que aparece badge rojo con "1" en la campana 🔔
- [ ] Hacer click en la campana → verificar que aparece notificación:
  - [ ] Título: "📚 Capacitaciones pendientes"
  - [ ] Mensaje menciona las áreas pendientes
  - [ ] Punto azul de "no leída"
  - [ ] Timestamp relativo (ej: "Ahora", "Hace 1 min")
- [ ] Recargar la página → verificar que NO se crea otra notificación (intervalo no cumplido)
- [ ] Verificar en Supabase tabla `notificaciones` que se creó el registro con tipo `recordatorio_capacitacion`

### Test 4.10: Notificaciones — Marcar como leída
- [ ] Con una notificación no leída visible en el panel:
  - [ ] Hacer click en la notificación → se marca como leída + navega a `/dashboard/capacitaciones`
  - [ ] Verificar que el badge rojo se reduce o desaparece
  - [ ] Reabrir el panel → la notificación ya no tiene punto azul
- [ ] Crear varias notificaciones (ej: cambiar intervalo a 0 horas temporalmente)
- [ ] Verificar que "Marcar todas como leídas" funciona y el badge desaparece

### Test 4.11: Notificaciones — No se generan cuando están desactivadas
- [ ] Loguearse como director → Configuración → desactivar "Recordatorios activos" → Guardar
- [ ] Loguearse como voluntario con capacitaciones pendientes
- [ ] Verificar que NO se crea nueva notificación en el dashboard
- [ ] Reactivar las notificaciones desde configuración

### Test 4.12: Notificaciones — No se generan si no hay pendientes
- [ ] Loguearse como voluntario con puntaje perfecto (100%) en todas las áreas
- [ ] Verificar que NO se generan notificaciones de recordatorio
- [ ] La campana puede estar vacía o mostrar notificaciones viejas

### Test 4.13: Crear desde banco — Propaga campos nuevos
- [ ] Crear una autoevaluación desde el banco que incluya preguntas de tipo ordenar_palabras y respuesta_imagen
- [ ] Verificar en Supabase que las preguntas creadas tienen `imagen_url` y `datos_extra` copiados correctamente del banco
- [ ] Completar esta autoevaluación como voluntario y verificar que los nuevos tipos se renderizan y corrigen bien

---

## ✅ Archivos modificados en Tanda 4

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260218_autoevaluaciones_mejoras.sql` | **NUEVO** — Migración: nuevos tipos pregunta, `configuracion_sistema`, `notificaciones`, RLS |
| `src/app/dashboard/autoevaluaciones/gestionar/banco-preguntas/page.tsx` | CRUD para `ordenar_palabras` y `respuesta_imagen` (crear, editar, render) |
| `src/app/dashboard/autoevaluaciones/mis-respuestas/completar/[plantillaId]/page.tsx` | Render + corrección automática para `ordenar_palabras` y `respuesta_imagen` |
| `src/app/dashboard/autoevaluaciones/gestionar/crear-desde-banco/page.tsx` | Propaga `imagen_url` y `datos_extra`, carga config default preguntas/área |
| `src/app/dashboard/configuracion/page.tsx` | **REESCRITO** — Config funcional: preguntas/área, notificaciones toggle + intervalo |
| `src/app/api/notificaciones/generar/route.ts` | **NUEVO** — API genera recordatorios con intervalo configurable |
| `src/components/dashboard/VoluntarioDashboard.tsx` | Campana 🔔 con panel notificaciones, generación automática al cargar |

---

## 🟢 Tanda 5 — Intervenciones: Planes + Comentarios (19/02/2026)

> **Prerequisito**: Ejecutar la migración `supabase/migrations/20260219_planes_intervencion.sql` en Supabase antes de testear.

### Test 5.1: Dashboard Psicopedagogía — Contador de planes activos
- [ ] Loguearse como equipo profesional o director
- [ ] Ir al dashboard de Psicopedagogía (`/dashboard/psicopedagogia`)
- [ ] Verificar que la tarjeta "Planes Activos" muestra un número real (no hardcoded `0`)
- [ ] Si no hay planes creados aún, debe mostrar `0` (desde Supabase, no hardcoded)

### Test 5.2: Listado de planes — Página funcional
- [ ] Ir a `/dashboard/psicopedagogia/planes/`
- [ ] Verificar que la página carga correctamente (NO muestra "Módulo en reconstrucción")
- [ ] Verificar la barra de stats: Total, Activos, Pausados, Completados
- [ ] Si no hay planes, debe mostrar mensaje vacío con botón "Crear Plan"

### Test 5.3: Crear plan de intervención
- [ ] Ir a `/dashboard/psicopedagogia/planes/nuevo/`
- [ ] Verificar que carga la lista de niños en el selector
- [ ] Seleccionar un niño
- [ ] Completar título (ej: "Plan de lectoescritura para Juan")
- [ ] Seleccionar área (verificar las 6 opciones: lenguaje, grafismo, lectura_escritura, matematicas, socio_emocional, otra)
- [ ] Seleccionar prioridad (alta, media, baja)
- [ ] Agregar fecha de fin estimada
- [ ] Agregar 2-3 objetivos usando el botón "+" (verificar que el botón "−" elimina objetivos)
- [ ] Escribir actividades sugeridas en el textarea
- [ ] Enviar formulario
- [ ] Verificar que redirige a la página de detalle del plan creado
- [ ] Verificar en Supabase tabla `planes_intervencion` que se creó correctamente

### Test 5.4: Listado de planes — Filtros y búsqueda
- [ ] Volver al listado `/dashboard/psicopedagogia/planes/`
- [ ] Verificar que el plan recién creado aparece como tarjeta
- [ ] Usar el campo de búsqueda → verificar que filtra por título o alias del niño
- [ ] Filtrar por estado (activo/pausado/completado/cerrado) → verificar que filtra correctamente
- [ ] Filtrar por área → verificar que filtra correctamente
- [ ] Verificar que la tarjeta muestra: niño, área (badge de color), prioridad (badge), conteo de comentarios
- [ ] Verificar que las stats de la barra superior se actualizan con los planes existentes

### Test 5.5: Detalle del plan — Información completa
- [ ] Hacer click en un plan del listado
- [ ] Verificar que carga la página de detalle (`/dashboard/psicopedagogia/planes/[planId]`)
- [ ] Verificar sección principal:
  - [ ] Título del plan
  - [ ] Descripción (si la tiene)
  - [ ] Lista de objetivos (bullets)
  - [ ] Actividades sugeridas
- [ ] Verificar sidebar:
  - [ ] Niño asociado (alias)
  - [ ] Área con badge de color
  - [ ] Prioridad con badge
  - [ ] Estado actual
  - [ ] Fecha de inicio
  - [ ] Fecha estimada de fin
  - [ ] Creado por (nombre del profesional)

### Test 5.6: Detalle del plan — Cambiar estado
- [ ] En la página de detalle, usar el dropdown de estado
- [ ] Cambiar de "activo" a "pausado" → verificar que se actualiza
- [ ] Cambiar a "completado" → verificar que se asigna `fecha_cierre` automáticamente
- [ ] Verificar en Supabase que `estado` y `fecha_cierre` se actualizaron
- [ ] Volver al listado → verificar que el plan refleja el nuevo estado y las stats se actualizaron

### Test 5.7: Comentarios — Agregar comentario con tipo
- [ ] En la página de detalle de un plan, ir a la sección "Comentarios"
- [ ] Verificar que aparecen los 5 botones de tipo: Seguimiento, Avance, Dificultad, Ajuste, Cierre
- [ ] Seleccionar tipo "Seguimiento"
- [ ] Escribir un comentario (ej: "El niño mostró mejora en la lectura oral")
- [ ] Enviar el comentario
- [ ] Verificar que aparece en el historial con:
  - [ ] Avatar o inicial del autor
  - [ ] Nombre y apellido del autor
  - [ ] Rol del autor (badge)
  - [ ] Fecha y hora del comentario
  - [ ] Badge del tipo de comentario (ej: "Seguimiento" en color correspondiente)
  - [ ] Contenido del comentario

### Test 5.8: Comentarios — Múltiples comentarios y tipos
- [ ] Agregar un segundo comentario con tipo "Avance"
- [ ] Agregar un tercer comentario con tipo "Dificultad"
- [ ] Verificar que todos aparecen en orden cronológico (más viejo arriba, más nuevo abajo)
- [ ] Verificar que cada uno tiene su badge de tipo con color diferenciado
- [ ] Verificar que el conteo de comentarios en el listado de planes se actualiza

### Test 5.9: Comentarios — Eliminar comentario propio
- [ ] Verificar que tus propios comentarios tienen un botón de eliminar (🗑️ o ✕)
- [ ] Eliminar un comentario propio → verificar que desaparece del historial
- [ ] Verificar que NO puedes eliminar comentarios de otro usuario (botón no visible)

### Test 5.10: Comentarios — Historial con múltiples autores
- [ ] Loguearse con un usuario diferente (otro profesional o director)
- [ ] Ir al mismo plan de intervención
- [ ] Agregar un comentario
- [ ] Verificar que el historial muestra comentarios de ambos autores, cada uno con su nombre y avatar
- [ ] Verificar que el segundo usuario solo puede eliminar sus propios comentarios

### Test 5.11: Validaciones del formulario de creación
- [ ] Ir a `/dashboard/psicopedagogia/planes/nuevo/`
- [ ] Intentar enviar sin seleccionar niño → debe bloquear o mostrar error
- [ ] Intentar enviar sin título → debe bloquear o mostrar error
- [ ] Verificar que la lista de objetivos no envía objetivos vacíos (strings vacíos)

### Test 5.12: Acceso por rol
- [ ] Loguearse como voluntario
- [ ] Intentar acceder a `/dashboard/psicopedagogia/planes/` → verificar que no tiene acceso o se redirige
- [ ] Loguearse como equipo_profesional → verificar acceso completo
- [ ] Loguearse como director → verificar acceso completo

---

## ✅ Archivos modificados en Tanda 5

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260219_planes_intervencion.sql` | **NUEVO** — Migración: tablas `planes_intervencion` + `comentarios_intervencion`, RLS, índices |
| `src/app/api/psicopedagogia/planes/route.ts` | **NUEVO** — API planes GET/POST/PATCH con joins, filtros, conteo comentarios |
| `src/app/api/psicopedagogia/comentarios/route.ts` | **NUEVO** — API comentarios GET/POST/DELETE con autor |
| `src/app/dashboard/psicopedagogia/planes/page.tsx` | **REESCRITO** — Listado con stats, búsqueda, filtros, cards |
| `src/app/dashboard/psicopedagogia/planes/nuevo/page.tsx` | **REESCRITO** — Formulario creación con objetivos dinámicos |
| `src/app/dashboard/psicopedagogia/planes/[planId]/page.tsx` | **NUEVO** — Detalle plan + comentarios con historial completo |
| `src/components/dashboard/PsicopedagogiaDashboard.tsx` | planesActivos con query real Supabase (reemplaza hardcoded 0) |

---

## 🟢 Tanda 6 — Google Drive / Biblioteca (19/02/2026)

> Fixes al módulo Biblioteca: proxy de autenticación, descarga, subida con metadatos, filtrado de carpetas por rol, búsqueda en tiempo real.

### Test 6.1: Preview de archivos en el iframe (proxy)
- [ ] Loguearse con cualquier rol con acceso a Biblioteca (`/dashboard/biblioteca/drive`)
- [ ] Hacer clic en cualquier archivo (PDF, imagen, video)
- [ ] Verificar que el preview se carga correctamente en el panel derecho **sin pedir login de Google**
- [ ] Verificar que no aparece el error "No tienes acceso" o "403 Forbidden"

### Test 6.2: Preview de Google Docs / Sheets / Slides
- [ ] Si hay un archivo de Google Docs, Sheets o Slides en el Drive, hacer clic sobre él
- [ ] Verificar que el proxy lo exporta a PDF y lo muestra en el iframe (no un error de "No se puede previsualizar")
- [ ] El panel de preview debe mostrar el contenido del documento renderizado como PDF

### Test 6.3: Botón de descarga (⬇️)
- [ ] Hacer clic en un archivo para seleccionarlo
- [ ] Verificar que aparece el botón **⬇️ Descargar** en el panel de preview o en la card del archivo
- [ ] Hacer clic en Descargar → el navegador debe abrir el diálogo de descarga con el nombre correcto del archivo
- [ ] Verificar que el archivo descargado es correcto y no está corrupto

### Test 6.4: Descarga de Google Docs / Sheets / Slides
- [ ] Hacer clic en Descargar sobre un archivo de Google Docs/Sheets/Slides
- [ ] Verificar que se descarga como PDF (no como archivo de Drive nativo)
- [ ] Verificar que el PDF descargado tiene el contenido correcto del documento

### Test 6.5: Búsqueda en tiempo real
- [ ] En `/dashboard/biblioteca/drive`, escribir parte del nombre de un archivo en la barra de búsqueda
- [ ] Verificar que la lista de archivos/carpetas se filtra en tiempo real (sin recargar la página)
- [ ] Borrar el texto → verificar que vuelven a aparecer todos los archivos
- [ ] Buscar texto que no coincide con ningún archivo → verificar que aparece un mensaje de "sin resultados"

### Test 6.6: Subir archivo — rol autorizado
- [ ] Loguearse como `director`, `psicopedagogia` o `equipo_profesional`
- [ ] Ir a `/dashboard/biblioteca/drive`
- [ ] Verificar que aparece el botón **📤 Subir archivo**
- [ ] Hacer clic → verificar que se abre el modal de subida
- [ ] Seleccionar un archivo (PDF o imagen), agregar título, descripción y tags (ej: `lectura, lenguaje, inicial`)
- [ ] Verificar que aparecen las **pastillas de colores** con cada tag mientras se escribe
- [ ] Hacer clic en **Subir** → verificar que el archivo aparece en la lista sin recargar

### Test 6.7: Subir archivo — rol NO autorizado
- [ ] Loguearse como `voluntario`
- [ ] Ir a `/dashboard/biblioteca/drive`
- [ ] Verificar que el botón **📤 Subir archivo NO aparece** en la interfaz

### Test 6.8: Metadatos guardados — descripción y tags en Drive
- [ ] Subir un archivo con descripción "Recurso de apoyo para lectura inicial" y tags "lectura, fonemas"
- [ ] Ir a Google Drive (consola o web) y buscar el archivo recién subido
- [ ] Verificar que el campo **Description** del archivo contiene el texto de descripción ingresado
- [ ] Verificar en las propiedades del archivo que `appProperties.tags` contiene los tags (puede verificarse vía API de Drive o logs del servidor)

### Test 6.9: Filtrado de carpetas — carpetas de sistema ocultas para todos
- [ ] Loguearse con **cualquier rol** (incluso director)
- [ ] Ir a `/dashboard/biblioteca/drive` (carpeta raíz)
- [ ] Verificar que las carpetas `fotos` y `transcripciones` **NO aparecen** en el listado
- [ ] Navegar a una subcarpeta → verificar que dentro de subcarpetas sí se ven todos los archivos (el filtro solo aplica en el root)

### Test 6.10: Filtrado de carpetas — carpeta "ninos" solo visible para director
- [ ] Loguearse como `equipo_profesional` o `voluntario`
- [ ] Ir a `/dashboard/biblioteca/drive`
- [ ] Verificar que la carpeta `ninos` (o `niños`) **NO aparece** en el listado
- [ ] Loguearse como `director`
- [ ] Ir a `/dashboard/biblioteca/drive`
- [ ] Verificar que la carpeta `ninos` (o `niños`) **SÍ aparece** para el director
- [ ] Navegar dentro de esa carpeta → verificar que los archivos se muestran correctamente

### Test 6.11: Proxy — autenticación requerida
- [ ] Sin estar logueado (o con una sesión inválida), intentar acceder directamente a `/api/drive/proxy/CUALQUIER_FILE_ID`
- [ ] Verificar que responde **401 Unauthorized** y no devuelve contenido del archivo
- [ ] Verificar que tampoco funciona con `?download=1`

### Test 6.12: Navegación de carpetas + preview combinados
- [ ] Hacer doble clic en una carpeta para entrar a ella
- [ ] Verificar que la breadcrumb/navegación se actualiza correctamente
- [ ] Hacer clic en un archivo dentro de la carpeta → verificar que el proxy sirve el preview sin errores
- [ ] Usar el botón "Atrás" o breadcrumb para volver a la raíz → verificar que los filtros de carpetas siguen aplicándose

---

## ✅ Archivos modificados en Tanda 6

| Archivo | Cambio |
|---------|--------|
| `src/app/api/drive/proxy/[fileId]/route.ts` | **NUEVO** — Proxy autenticado: streaming con Service Account, export PDF para Google Docs/Sheets/Slides, soporte `?download=1` |
| `src/app/api/drive/archivos/route.ts` | **EDITADO** — Filtrado de carpetas movido al servidor: lee rol del usuario desde `perfiles`; oculta `fotos`/`transcripciones` para todos; oculta `ninos`/`niños` para no-directores |
| `src/app/api/drive/subir/route.ts` | **EDITADO** — Acepta `description` y `tags` en FormData; los guarda como `description` y `appProperties.tags` en Drive |
| `src/app/dashboard/biblioteca/drive/page.tsx` | **REESCRITO** — Preview via proxy, botón ⬇️ descarga, barra búsqueda en tiempo real, modal upload con descripción+tags+pastillas, botón Subir solo para roles autorizados |

---

## 🟢 Tanda 7 — Biblioteca RAG: sistema de tags (19/02/2026)

> Auto-tagging con IA, edición manual de tags, filtro por tag en biblioteca y en chat IA para ahorro de tokens.

### Test 7.1: Tags auto-generados al subir un documento (sin tags manuales)
- [ ] Loguearse como `psicopedagogia` o `director`
- [ ] Ir a `/dashboard/biblioteca/subir`
- [ ] Subir un PDF **sin completar el campo de tags**
- [ ] Esperar que se complete el procesamiento (la pantalla redirige a la biblioteca)
- [ ] Esperar ~10-15 segundos adicionales (el auto-tag corre en background)
- [ ] Recargar `/dashboard/biblioteca`
- [ ] Verificar que el documento recién subido **muestra tags en pastillas de colores** (ej: "lectura", "alfabetizacion", etc.)
- [ ] Verificar que los tags son coherentes con el contenido del documento

### Test 7.2: Tags manuales al subir (tienen prioridad sobre la IA)
- [ ] Subir otro documento completando el campo tags con: `estrategias, lenguaje, inclusion`
- [ ] Verificar que aparecen las **pastillas de preview** mientras se escribe (antes de subir)
- [ ] Subir el documento → verificar que en la biblioteca aparece exactamente con los tags ingresados
- [ ] Verificar que NO se dispara el auto-tag de IA (ya tiene tags manuales)

### Test 7.3: Editor inline — editar tags de un documento existente
- [ ] En `/dashboard/biblioteca`, hacer clic en el botón ✏️ de un documento (o en "+ tags" si no tiene ninguno)
- [ ] Verificar que aparece el editor inline con los tags actuales en formato "tag1, tag2, tag3"
- [ ] Modificar los tags (agregar, quitar, cambiar)
- [ ] Verificar que aparecen las **pastillas de preview** mientras se escribe
- [ ] Hacer clic en **✓ Guardar**
- [ ] Verificar que los nuevos tags se muestran en la card del documento
- [ ] Verificar en Supabase que el campo `tags` de la tabla `documentos` se actualizó

### Test 7.4: Auto-tag desde el editor inline (botón ✨ Auto-IA)
- [ ] Abrir el editor inline de un documento (✏️)
- [ ] Hacer clic en **✨ Auto-IA**
- [ ] Verificar que el botón muestra "✨ ..." mientras procesa
- [ ] Cuando termina, verificar que el campo de texto del editor se actualiza con los nuevos tags
- [ ] Verificar que las pastillas de preview aparecen
- [ ] Guardar → verificar que los tags se persisten

### Test 7.5: Filtro por tag en la biblioteca
- [ ] En `/dashboard/biblioteca`, verificar que aparece la barra de filtros con chips de todos los tags únicos
- [ ] Hacer clic en un tag (ej: "lectura")
- [ ] Verificar que solo se muestran documentos que contienen ese tag
- [ ] El contador arriba debe mostrar "X / Y documentos • tag: lectura"
- [ ] Hacer clic en el mismo tag de nuevo → verificar que se deselecciona y vuelven todos los docs
- [ ] Hacer clic en **Todos** → verifica que se limpian todos los filtros

### Test 7.6: Filtro combinado — búsqueda de texto + tag
- [ ] Activar un filtro de tag (ej: "escritura")
- [ ] También escribir texto en la barra de búsqueda (ej: "estrategia")
- [ ] Verificar que se muestran solo los docs que cumplen AMBAS condiciones (tienen el tag Y el texto en título/autor/tags)
- [ ] Limpiar el filtro de tag → verificar que vuelven a aparecer todos los que coinciden con el texto

### Test 7.7: Tags como chips filtrables en las cards
- [ ] En la card de un documento, hacer clic en uno de sus tags (ej: "fonemas")
- [ ] Verificar que la biblioteca automáticamente filtra por ese tag
- [ ] Verificar que el chip del tag activo tiene un ring/borde destacado

### Test 7.8: Filtro por tag en el chat IA — chips en la barra superior
- [ ] Ir a `/dashboard/biblioteca/chat`
- [ ] Verificar que aparece la barra "🏷️ Filtrar por tema:" con chips de todos los tags disponibles
- [ ] Seleccionar un tag (ej: "lectura")
- [ ] Verificar que el chip cambia de estilo (ring activo) y aparece el mensaje "⚡ Modo enfocado activo..."
- [ ] Hacer una pregunta relacionada (ej: "¿qué estrategias hay?")
- [ ] Verificar que la respuesta incluye "⚡ Filtrado por: lectura" en el pie del mensaje del asistente
- [ ] Verificar que `totalDocumentos` es menor que el total de la biblioteca (solo docs con ese tag)

### Test 7.9: Chat IA — ahorro de tokens con filtro activo
- [ ] En el chat, seleccionar 2 tags (ej: "lectura" + "fonemas")
- [ ] Verificar que el placeholder del input dice: "Preguntá sobre: lectura, fonemas..."
- [ ] Verificar que el footer dice: "⚡ Modo enfocado: solo busca en documentos con tags [lectura, fonemas]"
- [ ] Enviar una pregunta → verificar que la respuesta es coherente y acotada al tema
- [ ] Hacer clic en **limpiar** → verificar que se deseleccionan todos los tags
- [ ] Verificar que el footer vuelve al mensaje estándar de la biblioteca

### Test 7.10: Acceso por roles — solo pueden editar tags los roles autorizados
- [ ] Loguearse como `voluntario`
- [ ] Ir a `/dashboard/biblioteca`
- [ ] Verificar que NO aparece el botón ✏️ ni el botón "+ tags" en las cards
- [ ] Los tags se deben mostrar como chips de solo lectura (no clickeables para filtrar, o solo para filtrar)
- [ ] Loguearse como `equipo_profesional` → verificar que SÍ puede editar tags

---

## ✅ Archivos modificados en Tanda 7

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260219_documentos_tags.sql` | **NUEVO** — `tags TEXT[]` + índice GIN en tabla `documentos` |
| `src/app/api/documentos/autotag/route.ts` | **NUEVO** — POST: genera 5-10 tags con Gemini Flash leyendo primeros 4 chunks; sanitiza y guarda |
| `src/app/api/documentos/[id]/route.ts` | **EDITADO** — Agrega PATCH para actualizar tags manualmente |
| `src/app/api/documentos/procesar/route.ts` | **EDITADO** — Acepta `tags` manual; si vacíos, dispara autotag en background |
| `src/app/api/chat/route.ts` | **EDITADO** — Acepta `tags[]`; filtra docs con `.overlaps()`; pasa IDs al RPC; reduce chunks si hay filtro activo |
| `src/app/dashboard/biblioteca/page.tsx` | **REESCRITO** — Chips de filtro por tag, editor inline con preview de pastillas, botón ✨ Auto-IA |
| `src/app/dashboard/biblioteca/chat/page.tsx` | **REESCRITO** — Chips de tag en barra superior; query incluye `tags` para pre-filtrar RAG |
| `src/app/dashboard/biblioteca/subir/page.tsx` | **EDITADO** — Campo tags con preview de pastillas; vacío = IA genera automáticamente |

---

## 🟣 Tanda 8 — Módulo IA centralizado (19/02/2026)

> **Prerequisito:** Correr `supabase/migrations/20260219_historial_consultas_ia.sql` en el SQL Editor de Supabase.

### Test 8.1: Acceso al módulo desde Sidebar
- [ ] Loguearse como `equipo_profesional` o `director` o `psicopedagogia`
- [ ] Verificar que el Sidebar muestra el ítem **"Módulo IA"** con ícono ✨
- [ ] Hacer clic → llegar a `/dashboard/ia` sin error
- [ ] Loguearse como `voluntario` → verificar que el ítem **NO aparece** en el sidebar

### Test 8.2: Selector de modos
- [ ] Ir a `/dashboard/ia`
- [ ] Verificar que aparecen 3 botones: "Consultar Biblioteca", "Analizar Niño", "Consulta Libre"
- [ ] Hacer clic en cada uno → verificar que cambia el color del botón activo, la descripción y las preguntas sugeridas
- [ ] Al cambiar de modo, verificar que se limpian tags seleccionados y niño seleccionado

### Test 8.3: Modo Consultar Biblioteca con filtro de tags
- [ ] Seleccionar modo "Consultar Biblioteca"
- [ ] Verificar que aparecen chips de tags (si hay documentos con tags en la DB)
- [ ] Seleccionar 1-2 tags → verificar que los chips se marcan con ✓
- [ ] Enviar una pregunta → verificar que la respuesta menciona documentos de esos tags
- [ ] Verificar que el mensaje del asistente muestra el badge "⚡ tag1, tag2"
- [ ] Verificar que en "Fuentes consultadas" aparecen los documentos referenciados

### Test 8.4: Modo Analizar Niño — selector
- [ ] Seleccionar modo "Analizar Niño"
- [ ] Verificar que aparece el buscador de niños
- [ ] Tipear 2-3 letras → verificar que el dropdown filtra correctamente
- [ ] Seleccionar un niño → verificar que aparece el badge verde con alias + rango etario + nivel
- [ ] Verificar que aparece el enlace "Ver perfil →" junto al selector
- [ ] Sin niño seleccionado, el input dice "Primero seleccioná un niño arriba..." y está deshabilitado

### Test 8.5: Modo Analizar Niño — consulta
- [ ] Con un niño seleccionado, hacer clic en una pregunta sugerida (ej: "¿Cómo evolucionó su nivel de lectura?")
- [ ] Verificar que se envía la consulta y aparece respuesta del asistente
- [ ] Verificar que la respuesta contiene información relevante a las sesiones del niño
- [ ] Si el niño tiene nivel similar a otros, verificar que aparece el panel amarillo de "💡 Niños con perfil similar"

### Test 8.6: Modo Consulta Libre
- [ ] Seleccionar modo "Consulta Libre"
- [ ] No deben aparecer ni filtro de tags ni selector de niño
- [ ] Escribir una pregunta pedagógica (ej: "¿Qué es la conciencia fonológica?")
- [ ] Verificar que la respuesta usa la biblioteca RAG y muestra fuentes
- [ ] Verificar que el badge del mensaje del asistente dice "Asistente IA"

### Test 8.7: Historial — persistencia
- [ ] Hacer 2-3 consultas en diferentes modos
- [ ] Hacer clic en el botón "Historial" en el header
- [ ] Verificar que el panel lateral se abre con las consultas realizadas
- [ ] Cada entrada debe mostrar: badge de modo, fecha, extracto de la pregunta, tags usados (si aplica)
- [ ] Hacer clic en una entrada del historial → verificar que se carga la conversación en el chat

### Test 8.8: Historial — carga paginada
- [ ] Si hay más de 10 entradas, verificar que aparece el botón "Cargar más (X restantes)"
- [ ] Hacer clic → verificar que se agregan más entradas sin reemplazar las existentes

### Test 8.9: Limpiar / Nueva consulta
- [ ] Después de una conversación, hacer clic en "Nueva consulta"
- [ ] Verificar que los mensajes se borran
- [ ] Verificar que las sugerencias de vinculación también desaparecen
- [ ] El selector de modo, tags y niño se mantienen (no se resetean)

### Test 8.10: Contexto activo visible en el input
- [ ] Seleccionar un niño + un tag (en modo biblioteca con tags)
- [ ] Verificar que encima del textarea aparecen pastillas con: niño seleccionado (verde) y tags activos
- [ ] Hacer clic en la X de un tag desde las pastillas del input → verificar que se deselecciona

---

## ✅ Archivos modificados en Tanda 8

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260219_historial_consultas_ia.sql` | **NUEVO** — Tabla `historial_consultas_ia` + RLS (usuario ve su historial, director ve todo) + índices |
| `src/app/api/ia/historial/route.ts` | **NUEVO** — GET paginado (filtrable por modo/niño), POST (guarda con tokens_aprox estimados) |
| `src/app/dashboard/ia/page.tsx` | **NUEVO** — Módulo IA central: 3 modos, filtro tags, selector niño con dropdown, historial lateral, sugerencias vinculación, markdown+fuentes, Enter para enviar |
| `src/components/layouts/Sidebar.tsx` | **EDITADO** — Agrega `SparklesIcon` y enlace "Módulo IA" (roles: director, psicopedagogia, equipo_profesional) |
