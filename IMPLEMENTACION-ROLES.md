# Implementación de Psicopedagogía y Trabajo Social

## ✅ Lo que se implementó

### 1. APIs para Psicopedagogía
- **POST /api/psicopedagogia/evaluaciones** - Crear evaluación inicial
- **GET /api/psicopedagogia/evaluaciones** - Listar evaluaciones (con filtro por niño)
- Validación de roles (solo psicopedagogía puede crear)
- Manejo de arrays para dificultades y fortalezas

### 2. APIs para Trabajo Social
- **POST /api/trabajo-social/entrevistas** - Crear entrevista familiar
- **GET /api/trabajo-social/entrevistas** - Listar entrevistas
- **POST /api/trabajo-social/audio** - Subir grabación de voz
- **DELETE /api/trabajo-social/audio** - Eliminar audio
- Validación de roles (solo trabajo social puede crear)
- Creación automática de alertas si hay situación de riesgo

### 3. Formularios Actualizados
- ✅ Formulario de evaluación inicial conectado a API
- ✅ Formulario de entrevista familiar conectado a API
- ✅ Subida de audio integrada (grabación desde el navegador)
- ✅ Selector de niño antes de completar formularios
- ✅ Detección de estado offline
- ✅ Validaciones y manejo de errores

### 4. Base de Datos
- **Migración SQL completa** con 6 nuevas tablas:
  - `evaluaciones_iniciales`
  - `planes_intervencion`
  - `seguimientos_mensuales`
  - `entrevistas_familiares`
  - `alertas_sociales`
  - `seguimientos_familiares`
- Row Level Security (RLS) por rol
- Índices optimizados
- Triggers para `updated_at`

### 5. Componentes
- **SelectorNino** - Componente reutilizable para seleccionar niño
  - Búsqueda por nombre o legajo
  - Control de visibilidad de apellido por rol
  - Feedback visual de selección

---

## 🚀 Cómo ejecutar las migraciones

### Opción 1: Supabase CLI (Recomendado)

```bash
# 1. Asegurarse de estar logueado en Supabase
supabase login

# 2. Vincular el proyecto (si no está vinculado)
supabase link --project-ref dntfckzpxcelmrrvcytl

# 3. Ejecutar la migración
supabase db push
```

### Opción 2: Dashboard de Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard/project/dntfckzpxcelmrrvcytl/editor)
2. Ir a **SQL Editor**
3. Abrir el archivo `supabase/migrations/psicopedagogia-trabajo-social.sql`
4. Copiar todo el contenido
5. Pegarlo en el SQL Editor
6. Click en **Run**

### Opción 3: Conexión directa con psql

```bash
# Obtener connection string de Supabase Dashboard
psql "postgresql://postgres:[PASSWORD]@db.dntfckzpxcelmrrvcytl.supabase.co:5432/postgres"

# Ejecutar el archivo SQL
\i supabase/migrations/psicopedagogia-trabajo-social.sql
```

---

## 📋 Post-migración: Verificar

```sql
-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'evaluaciones_iniciales',
    'planes_intervencion',
    'seguimientos_mensuales',
    'entrevistas_familiares',
    'alertas_sociales',
    'seguimientos_familiares'
  );

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE '%evaluaciones%' 
     OR tablename LIKE '%entrevistas%';
```

---

## 🔐 Configurar Storage para Audios

### Crear bucket en Supabase:

1. Ir a **Storage** en el dashboard
2. Crear nuevo bucket: `audios-entrevistas`
3. Configurar políticas:

```sql
-- Permitir subida solo a trabajo social
CREATE POLICY "trabajo_social_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audios-entrevistas' AND
    auth.jwt() ->> 'rol' IN ('trabajo_social', 'admin', 'director')
  );

-- Permitir lectura a roles autorizados
CREATE POLICY "authorized_read_audios" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audios-entrevistas' AND
    auth.jwt() ->> 'rol' IN ('trabajo_social', 'psicopedagogia', 'admin', 'director')
  );

-- Permitir eliminación solo a quien subió
CREATE POLICY "trabajo_social_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'audios-entrevistas' AND
    owner = auth.uid()
  );
```

---

## 🧪 Testing

### Test de evaluación inicial:

```bash
# En otra terminal, iniciar el servidor de desarrollo
npm run dev

# Navegar a:
http://localhost:3000/dashboard/psicopedagogia/evaluaciones/nueva
```

**Pasos:**
1. Seleccionar un niño
2. Completar formulario de evaluación
3. Hacer clic en "Guardar Evaluación"
4. Verificar que se redirige a la lista
5. Verificar en Supabase que se guardó el registro

### Test de entrevista familiar:

```bash
# Navegar a:
http://localhost:3000/dashboard/trabajo-social/entrevista/nueva
```

**Pasos:**
1. Seleccionar un niño
2. (Opcional) Grabar audio de la entrevista
3. Completar formulario
4. Hacer clic en "Guardar Entrevista"
5. Verificar que el audio se subió a Storage
6. Verificar que la entrevista se guardó en la DB

---

## 🔄 Próximos pasos

### Funcionalidades faltantes:

1. **Páginas de listado:**
   - `/dashboard/psicopedagogia/evaluaciones` - Lista de evaluaciones
   - `/dashboard/trabajo-social/entrevistas` - Lista de entrevistas

2. **Crear planes de intervención:**
   - `/dashboard/psicopedagogia/planes/nuevo`
   - Integrar con evaluación inicial
   - Asignar objetivos anuales y mensuales

3. **Seguimiento mensual:**
   - `/dashboard/psicopedagogia/seguimiento`
   - Analizar sesiones del mes con IA
   - Ajustar plan de intervención

4. **Alertas sociales:**
   - `/dashboard/trabajo-social/alertas`
   - Dashboard de alertas activas
   - Sistema de notificaciones

5. **Sincronización offline:**
   - Service Worker para caché
   - IndexedDB para almacenamiento local
   - Background sync cuando hay conexión

6. **Transcripción de audios:**
   - Integrar API de transcripción (Google Speech-to-Text)
   - Guardar transcripción en campo `audio_transcription`

---

## 📊 Esquema de datos

### evaluaciones_iniciales
```
├── Lenguaje (4 items)
├── Grafismo (3 items)
├── Lectoescritura (9 items)
├── Matemáticas (5 items)
└── Conclusiones (5 campos)
```

### entrevistas_familiares
```
├── Básicos (tipo, lugar, personas presentes)
├── Embarazo (alimentación, controles)
├── Alimentación actual
├── Escolaridad
├── Vivienda (JSONB)
├── Situación económica (JSONB)
├── Salud
├── Dinámicas familiares
├── Observaciones y riesgo
└── Audio (URL + transcripción)
```

---

## 🔒 Seguridad implementada

✅ Validación de roles en todas las APIs
✅ RLS en todas las tablas
✅ Políticas de Storage para audios
✅ No se exponen datos sensibles sin autorización
✅ Auditoría con `created_at` y `updated_at`
✅ Detección de situaciones de riesgo automática

---

## 💡 Notas importantes

1. **Apellido oculto:** El `SelectorNino` recibe prop `mostrarApellido` que se pasa como `true` solo para psicopedagogía y director.

2. **Offline:** Los formularios detectan si no hay conexión con `!navigator.onLine` y marcan el campo `created_offline`.

3. **Alertas automáticas:** Si una entrevista tiene `situacion_riesgo=true` y prioridad alta/urgente, se crea una alerta automáticamente.

4. **Audio:** Los archivos de audio se guardan en formato WebM (nativo del navegador). Para reproducción universal, considerar conversión a MP3.

5. **JSONB:** Los campos `composicion_familiar`, `vivienda`, `situacion_economica`, `objetivos_anuales`, etc. usan JSONB para flexibilidad.
