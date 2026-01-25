# Unificación de Roles - Equipo Profesional

## Resumen de Cambios

Se unificaron los roles de **psicopedagogía**, **coordinador** y **trabajador_social** bajo el concepto de **"Equipo Profesional"**, con acceso completo y equivalente a todas las funcionalidades de la plataforma.

---

## 🎯 Objetivos Alcanzados

1. **Unificación de permisos**: Los 3 roles ahora tienen acceso completo a:
   - Datos sensibles de niños (nombre completo, fecha de nacimiento, legajo)
   - Evaluaciones (crear, ver, editar)
   - Planes de intervención (crear con IA, gestionar)
   - Biblioteca psicopedagógica (subir documentos, consultar con IA)
   - Asignaciones de voluntarios
   - Análisis con IA

2. **Ingreso completo de niños**: Nuevo formulario multi-paso para trabajadora social con:
   - **Grabación de voz** con transcripción automática (Web Speech API)
   - **OCR de documentos** (preparado para Tesseract.js)
   - Datos completos de entrevista inicial (contexto familiar, alimentación, salud, escolaridad)
   - Generación automática de legajo (formato: APA-0001, APA-0002, etc.)

3. **Dashboard unificado**: EquipoProfesionalDashboard muestra las mismas opciones para los 3 roles

---

## 📁 Archivos Creados/Modificados

### 1. Migration SQL
**Archivo**: `supabase/migrations/20260118_unificar_roles_equipo.sql`

**Funciones**:
- ✅ Elimina políticas antiguas de RLS que separaban roles
- ✅ Crea políticas unificadas para equipo profesional
- ✅ Agrega campos a tabla `ninos`:
  - `nombre_completo` (encriptado)
  - `fecha_nacimiento` (encriptado)
  - `legajo` (único, formato APA-XXXX)
  - `contexto_familiar` (JSONB)
  - `alimentacion` (JSONB)
  - `escolaridad` (JSONB)
  - `salud` (JSONB)
  - `entrevista_inicial` (JSONB con transcripciones + OCR)
  - `ingresado_por`, `fecha_ingreso`, `pronostico_inicial`
- ✅ Trigger automático para generar legajos secuenciales

**Aplicar a todas las tablas**:
- `ninos`
- `sesiones`
- `evaluaciones`
- `planes_intervencion`
- `actividades_plan`
- `documentos`

### 2. Formulario de Ingreso Completo
**Archivo**: `src/app/dashboard/ninos/ingreso-completo/page.tsx`

**Características**:
- 📝 **4 pasos**:
  1. Datos básicos (alias, nombre completo, fecha nacimiento, nivel alfabetización)
  2. Contexto familiar (estructura, alimentación embarazo y actual)
  3. Salud y escolaridad (antecedentes, medicación, escuela, ausentismo)
  4. Evaluación inicial (pronóstico, observaciones, documentos)

- 🎙️ **Grabación de voz**:
  - Botón de grabar/detener
  - Transcripción automática en tiempo real (Web Speech API)
  - Guarda transcripciones al detener
  - Idioma: Español de Argentina

- 📄 **OCR de documentos**:
  - Upload de imágenes
  - Preparado para integración con Tesseract.js
  - Por ahora guarda metadata del documento

- 🔒 **Seguridad**:
  - Solo accesible para equipo profesional
  - Datos sensibles marcados con 🔒
  - TODO: Implementar encriptación de nombre_completo y fecha_nacimiento

### 3. Dashboard Unificado
**Archivo**: `src/components/dashboard/EquipoProfesionalDashboard.tsx`

**Métricas**:
- Total de niños
- Evaluaciones pendientes (>180 días)
- Planes activos
- Sesiones este mes

**Secciones principales**:
- Evaluaciones (con contador de pendientes)
- Planes de Intervención (badge IA)
- Biblioteca Psicopedagógica (badge RAG)
- Asignaciones
- Análisis con IA
- Perfiles de Niños

**Acciones rápidas**:
- Nueva Evaluación
- Nuevo Plan con IA
- Subir Documento
- Ver Niños
- **Ingreso Completo de Niño** (botón destacado)

### 4. Router Principal Actualizado
**Archivo**: `src/app/dashboard/page.tsx`

**Cambios**:
- Importa `EquipoProfesionalDashboard` en lugar de `PsicopedagogiaDashboard`
- Detecta 3 roles: `psicopedagogia`, `coordinador`, `trabajador_social`
- Renderiza dashboard unificado con título dinámico:
  - "Panel de Psicopedagogía 🎯"
  - "Panel de Coordinación 📊"
  - "Panel de Trabajo Social 🤝"

### 5. Página de Registro Actualizada
**Archivo**: `src/app/(auth)/registro/page.tsx`

**Cambios necesarios**:
- Ya incluye `trabajador_social` como opción de rol
- El tipo `Rol` ya está actualizado

---

## 🚀 Instrucciones de Implementación

### Paso 1: Ejecutar Migration SQL

1. Abrir **Supabase Dashboard**
2. Ir a **SQL Editor**
3. Copiar todo el contenido de `supabase/migrations/20260118_unificar_roles_equipo.sql`
4. Ejecutar la query
5. Verificar mensaje de éxito:
   ```
   ✅ ROLES UNIFICADOS
   ✅ CAMPOS AGREGADOS A TABLA NINOS
   ```

**Validar**:
```sql
-- Ver políticas creadas
SELECT * FROM pg_policies WHERE tablename IN ('ninos', 'sesiones', 'evaluaciones', 'planes_intervencion');

-- Ver columnas agregadas
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ninos' AND column_name IN ('legajo', 'contexto_familiar', 'entrevista_inicial');

-- Probar generación de legajo
INSERT INTO ninos (alias, rango_etario, nivel_alfabetizacion, escolarizado) 
VALUES ('Test', '8-10', 'Pre-silábico', true) RETURNING legajo;
-- Debería devolver: APA-0001 (o siguiente número)
```

### Paso 2: Verificar Código Frontend

Los archivos ya están creados. Verificar que no haya errores de TypeScript:

```bash
npm run build
```

Si hay errores, revisar imports y tipos.

### Paso 3: Probar Ingreso Completo

1. Iniciar sesión como **trabajadora social** (trabajador1@gmail.com, password: 123456)
2. Ir al dashboard → Ver botón verde "Ingreso Completo de Niño"
3. Click en el botón
4. Completar el formulario paso a paso:
   - **Paso 1**: Alias, nombre completo, fecha nacimiento
   - **Paso 2**: Contexto familiar, alimentación (probar botón "Grabar Entrevista")
   - **Paso 3**: Salud y escolaridad
   - **Paso 4**: Pronóstico, observaciones, documentos (probar "Escanear Documento")
5. Guardar
6. Verificar que se creó el niño con legajo asignado

**Validar en Supabase**:
```sql
SELECT legajo, alias, nombre_completo, contexto_familiar, entrevista_inicial 
FROM ninos 
WHERE legajo LIKE 'APA-%' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Paso 4: Probar Acceso Unificado

**Como Psicopedagogía** (psico2@gmail.com):
- ✅ Ver dashboard con todas las secciones
- ✅ Acceder a /dashboard/ninos → ver niños completos
- ✅ Acceder a /dashboard/psicopedagogia/evaluaciones
- ✅ Acceder a /dashboard/psicopedagogia/planes
- ✅ Acceder a /dashboard/biblioteca

**Como Coordinador** (coord1@gmail.com):
- ✅ Ver mismo dashboard
- ✅ Mismo acceso a todas las rutas
- ✅ Título: "Panel de Coordinación 📊"

**Como Trabajadora Social** (trabajador1@gmail.com):
- ✅ Ver mismo dashboard
- ✅ Poder ingresar niños con formulario completo
- ✅ Acceso a evaluaciones y planes
- ✅ Título: "Panel de Trabajo Social 🤝"

### Paso 5: Pruebas de Grabación de Voz

**Requisitos**:
- Navegador: Chrome, Edge, Safari (con permiso de micrófono)
- No funciona en HTTP (solo HTTPS o localhost)

**Probar**:
1. En el formulario de ingreso, paso 2
2. Click en "Grabar Entrevista"
3. Permitir acceso al micrófono
4. Hablar claramente
5. Ver transcripción en tiempo real
6. Click en "Detener"
7. Verificar que se guardó en "Transcripciones Guardadas"

**Si no funciona**:
- Verificar que el navegador soporte Web Speech API
- Revisar consola del navegador por errores
- El mensaje "Grabando..." debe aparecer

### Paso 6: Pruebas de OCR (Preparatorio)

Por ahora, el OCR solo guarda metadata del documento.

**Para integrar Tesseract.js real**:
```bash
npm install tesseract.js
```

Luego modificar la función `handleFileUpload` en `ingreso-completo/page.tsx`:

```typescript
import Tesseract from 'tesseract.js';

// Dentro de handleFileUpload:
const { data: { text } } = await Tesseract.recognize(
  imageData,
  'spa', // Español
  {
    logger: m => console.log(m)
  }
);

setFormData(prev => ({
  ...prev,
  documentos_ocr: [
    ...prev.documentos_ocr,
    {
      nombre: file.name,
      texto: text
    }
  ]
}));
```

---

## 🔐 Seguridad Pendiente

### Encriptación de Datos Sensibles

**TODO**: Implementar encriptación de `nombre_completo` y `fecha_nacimiento`.

**Opción 1: Encriptación en Frontend (antes de enviar)**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY; // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Opción 2: Encriptación en Backend (Edge Function)**
- Crear Edge Function que reciba datos
- Encriptar en servidor con key segura
- Guardar en DB

**Recomendación**: Opción 2 es más segura (key nunca expuesta al cliente)

### Variables de Entorno

Agregar a `.env.local`:
```env
# Clave de encriptación (32 bytes en base64)
ENCRYPTION_KEY=your-32-byte-key-here-base64-encoded
```

Generar clave:
```javascript
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('base64');
console.log(key);
```

---

## 📊 Nuevas Rutas Disponibles

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/dashboard/ninos/ingreso-completo` | Equipo Profesional | Formulario completo con grabación + OCR |
| `/dashboard/psicopedagogia/evaluaciones` | Equipo Profesional | Lista y nueva evaluación |
| `/dashboard/psicopedagogia/planes` | Equipo Profesional | Planes con generación IA |
| `/dashboard/psicopedagogia/asignaciones` | Equipo Profesional | Gestión voluntario-niño |
| `/dashboard/psicopedagogia/analisis` | Equipo Profesional | Análisis con IA |
| `/dashboard/biblioteca` | Equipo Profesional | RAG con documentos |

---

## 🐛 Posibles Problemas y Soluciones

### Problema 1: Error al ejecutar SQL - "relation already exists"
**Causa**: La tabla o índice ya existe de una ejecución anterior.

**Solución**:
```sql
-- Verificar si existe
SELECT * FROM ninos LIMIT 1;

-- Si ya tiene las columnas, no ejecutar la migration nuevamente
-- O modificar el SQL para usar ALTER TABLE IF NOT EXISTS
```

### Problema 2: Grabación de voz no funciona
**Causa**: Navegador no soporta Web Speech API o falta permiso.

**Solución**:
- Usar Chrome/Edge (mejor soporte)
- Verificar que esté en HTTPS o localhost
- Permitir acceso al micrófono cuando lo solicite
- Revisar consola del navegador

### Problema 3: No se genera el legajo automático
**Causa**: El trigger no se ejecutó correctamente.

**Solución**:
```sql
-- Verificar que el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_generar_legajo';

-- Si no existe, ejecutar:
CREATE TRIGGER trigger_generar_legajo
  BEFORE INSERT ON ninos
  FOR EACH ROW
  EXECUTE FUNCTION generar_legajo();
```

### Problema 4: Error de permisos RLS
**Causa**: Las políticas no se aplicaron o el rol del usuario no está correcto.

**Solución**:
```sql
-- Verificar rol del usuario
SELECT id, email, rol FROM perfiles WHERE email = 'trabajador1@gmail.com';

-- Cambiar rol si es necesario
UPDATE perfiles SET rol = 'trabajador_social' WHERE email = 'trabajador1@gmail.com';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'ninos';
```

---

## ✅ Checklist de Verificación

- [ ] SQL migration ejecutada sin errores
- [ ] Tabla `ninos` tiene nuevas columnas (legajo, contexto_familiar, etc.)
- [ ] Trigger de legajo funciona (genera APA-XXXX)
- [ ] Políticas RLS unificadas creadas
- [ ] Frontend compila sin errores TypeScript
- [ ] Dashboard unificado se muestra para los 3 roles
- [ ] Botón "Ingreso Completo" visible en dashboard
- [ ] Formulario de 4 pasos funciona
- [ ] Grabación de voz transcribe correctamente
- [ ] Upload de documentos funciona
- [ ] Guardar niño crea registro con legajo
- [ ] Equipo profesional puede ver datos completos
- [ ] Voluntarios NO ven datos sensibles (nombre completo, fecha nacimiento)

---

## 🔄 Próximos Pasos

1. **Encriptación**: Implementar crypto para nombre_completo y fecha_nacimiento
2. **OCR Real**: Integrar Tesseract.js para extracción de texto
3. **Validaciones**: Agregar validaciones de campos obligatorios
4. **Permisos Granulares**: Revisar si algún rol necesita restricciones específicas
5. **Auditoría**: Loguear quién accede a datos sensibles
6. **Tests**: Crear tests E2E para el flujo de ingreso completo

---

## 📚 Documentación de Referencia

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Forms](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations)

---

**Fecha de implementación**: 18 de Enero, 2026
**Desarrollador**: GlobalIA
**Proyecto**: Plataforma APA - ONG Adelante
