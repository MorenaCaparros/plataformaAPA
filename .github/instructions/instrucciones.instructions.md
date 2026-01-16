---
applyTo: '**'
---

# Instrucciones Técnicas - Plataforma APA

## ⚠️ SEGURIDAD CRÍTICA - LEER ANTES DE CUALQUIER CAMBIO

### 🔴 REGLAS ABSOLUTAS DE SEGURIDAD

**ANTES de escribir, modificar o commitear CUALQUIER código, SIEMPRE verificar:**

#### 1. NUNCA EXPONER CLAVES SECRETAS
❌ **PROHIBIDO subir al repositorio:**
- API Keys (Google AI, OpenAI, etc.)
- Tokens de autenticación
- Service Role Keys de Supabase
- Claves de encriptación
- Contraseñas o credenciales
- URLs privadas con tokens embebidos
- Cualquier secreto en archivos de configuración

✅ **OBLIGATORIO:**
- Usar variables de entorno (`.env.local`)
- NUNCA commitear archivos `.env*` (verificar `.gitignore`)
- Usar `NEXT_PUBLIC_` SOLO para claves públicas que deben exponerse al navegador
- Rotar claves inmediatamente si se exponen por error
- Usar Netlify/Vercel Environment Variables en producción

#### 2. DATOS SENSIBLES DE MENORES
⚠️ **Trabajamos con información de NIÑOS en contextos vulnerables:**

**SIEMPRE considerar:**
- Los datos de los niños son **INFORMACIÓN EXTREMADAMENTE SENSIBLE**
- Cumplir con normativas de protección de datos de menores
- Implementar encriptación para nombres completos y fechas de nacimiento
- Nunca loguear datos personales identificables
- Minimizar exposición de datos en APIs
- Implementar auditoría de accesos a datos sensibles
- Validar permisos en CADA operación con datos de niños

**PROHIBIDO:**
- Exponer datos completos de niños sin autenticación/autorización
- Guardar datos sensibles en logs
- Usar datos reales en ejemplos o documentación
- Compartir datos fuera de la plataforma sin anonimizar
- Cachear datos sensibles sin protección
- Permitir acceso sin validación de roles (RLS)

#### 3. CHECKLIST ANTES DE CADA COMMIT
```
[ ] ¿Estoy subiendo algún archivo .env?
[ ] ¿Hay API keys hardcodeadas en el código?
[ ] ¿Expongo datos sensibles de niños sin protección?
[ ] ¿Implementé RLS en nuevas tablas de Supabase?
[ ] ¿Valido roles antes de operaciones sensibles?
[ ] ¿Encripté datos identificables de menores?
[ ] ¿Los logs NO contienen información personal?
[ ] ¿Documenté nuevos secretos en .env.example?
```

#### 4. EN CASO DE EXPOSICIÓN ACCIDENTAL
**Acción inmediata si se sube un secreto por error:**
1. 🚨 NO simplemente borrar el commit (queda en historial de Git)
2. Rotar/regenerar la clave expuesta INMEDIATAMENTE
3. Revocar acceso de la clave comprometida
4. Limpiar historial de Git si es necesario (git filter-branch)
5. Notificar al equipo
6. Actualizar todas las instancias con la nueva clave

---

## Contexto General
Este es un proyecto de colaboración entre **GlobalIA** y la **ONG Adelante**. La plataforma APA es una herramienta de gestión y seguimiento educativo que permite el registro sistemático de sesiones educativas con niños, análisis de datos con IA, y generación de informes psicopedagógicos.

**Leer siempre**: [contexto-proyecto.md](./contexto-proyecto.md) para entender objetivos, fases y funcionalidades.

---

## Principios de Desarrollo

### 1. Privacidad y Seguridad (CRÍTICO)
- **Los datos de los niños son información sensible**
- Implementar autenticación y autorización robusta
- Control de acceso basado en roles (RBAC)
- Encriptación de datos sensibles en reposo y en tránsito
- Cumplir con normativas de protección de datos de menores
- Logs de auditoría para acceso a datos sensibles
- **NUNCA** exponer datos completos de niños en APIs públicas

### 2. Acceso por Roles

**Sistema de Anonimización:**
- Cada niño tiene un **número de legajo** (identificador único)
- Solo **Psicopedagogía** y **Director** ven identificación completa (incluyendo apellido)
- El **Administrador** puede "destrabar" accesos cuando sea estrictamente necesario
- Apellido oculto por defecto para todos los demás roles

**Voluntario Alfabetizador:**
- Ve: **número de legajo**, **nombre** (sin apellido), edad, historial educativo básico
- Ve: objetivos asignados para ese niño, qué hizo anteriormente, qué aprendió
- Ve: si el niño va encaminado o no con los objetivos
- Puede: registrar sesiones, ver sus propias observaciones
- Puede: consultar nombre completo si no lo recuerda

**Coordinador (Nivel 2, por Equipo/Barrio):**
- Ve: información completa de niños asignados a su zona/grupo (con apellido)
- Ve: voluntarios de su equipo y asignaciones
- Puede: revisar sesiones, generar reportes, asignar y reasignar voluntarios
- Puede: gestionar inventario de materiales de su sede
- Puede: registrar feedback a voluntarios (cualitativo y cuantitativo)

**Trabajadora Social:**
- Ve: datos sociofamiliares completos, información de contacto de familias
- Puede: registrar entrevista inicial (con opción de grabación de voz)
- Puede: seguimiento de intervenciones con familias
- Puede: generar alertas sociales (ausentismo, cambios en contexto familiar)
- Dispositivo principal: Celular (mobile-first + offline)

**Psicopedagogía:**
- Acceso completo a todos los datos (incluyendo legajo completo con apellido)
- Puede: evaluar, planificar intervenciones, analizar patrones, generar informes
- Puede: subir bibliografía, consultar sistema RAG, usar herramientas de IA
- Puede: crear y ajustar planes de intervención
- Puede: gestionar base de datos de voluntarios con capacitaciones

**Director/Administrador (y Director de Programa):**
- **Rol único** con acceso completo a todos los datos del programa
- Ve: dashboard ejecutivo con métricas e impacto
- Puede: gestionar roles y permisos, exportar datos, generar reportes institucionales
- Puede: dar feedback a coordinadores (palabras y cuantificación con Gemini)
- Puede: desbloquear accesos (ver apellido cuando sea necesario)
- Puede: gestionar backups, seguridad, usuarios
- Gestión completa del sistema y configuración técnica

### 3. Offline-First (Mobile)
- La aplicación móvil debe funcionar sin conexión
- Sincronización automática cuando hay internet
- Manejo de conflictos en sincronización
- Indicadores claros de estado (online/offline/sincronizando)
- Almacenamiento local seguro

### 4. Usabilidad
- Formularios de sesión deben completarse en **5 minutos máximo**
- **Diseño 100% responsive mobile-first** (voluntarios usan celular)
  - TODAS las páginas deben funcionar perfectamente en móviles
  - Touch-friendly: botones grandes, espaciado adecuado
  - Textos legibles sin zoom
  - Inputs optimizados para teclado móvil
  - Navegación fácil con una mano
- Lenguaje claro, sin jerga técnica innecesaria
- Feedback inmediato en acciones del usuario
- Manejo de errores amigable

---

## Arquitectura Técnica

### Stack Tecnológico (Recomendado)
**Frontend:**
- React/Next.js o Vue/Nuxt para web
- React Native o Flutter para mobile (offline-first)
- TypeScript obligatorio
- Tailwind CSS o similar

**Backend:**
- Node.js/Express o Python/FastAPI
- PostgreSQL para datos estructurados
- Redis para caché y colas
- Sistema de mensajería para sincronización (RabbitMQ/Redis)

**IA y RAG:**
- Modelo base: GPT-4, Claude 3.5, Gemini Pro (evaluar costo/privacidad)
- Vector DB: Pinecone, Weaviate, o Qdrant
- LangChain/LlamaIndex para orquestación RAG
- Embeddings: OpenAI, Cohere, o modelos open-source

**Infraestructura:**
- Docker para containerización
- CI/CD automatizado
- Monitoreo y alertas (Sentry, LogRocket)
- Backup automático diario

---

## Estructura de Datos

### Sesión Educativa (20-40 ítems)
Categorías principales:
1. **Atención y Concentración**
2. **Conducta y Comportamiento**
3. **Respuesta Emocional** (motivación, frustración, alegría)
4. **Lectura y Escritura**
5. **Matemática y Lógica**
6. **Interacción con el Voluntario**
7. **Contexto Observado** (discontinuidad escolar, situación emocional)

**Formato de registro:**
```typescript
interface SesionEducativa {
  id: string;
  ninoId: string;
  voluntarioId: string;
  fecha: Date;
  duracion: number; // minutos
  items: ItemObservacion[];
  observacionesLibres: string;
  createdOffline: boolean;
  sincronizado: boolean;
}

interface ItemObservacion {
  categoria: string;
  item: string;
  valor: 1 | 2 | 3 | 4 | 5; // escala Likert
  notas?: string;
}
```

### Perfil del Niño
```typescript
interface PerfilNino {
  id: string;
  // Datos sensibles (solo acceso restringido)
  nombreCompleto: string;
  fechaNacimiento: Date;
  
  // Datos operativos (acceso voluntarios)
  alias: string;
  rangoEtario: '5-7' | '8-10' | '11-13' | '14+';
  
  // Contexto educativo
  nivelAlfabetizacion: string;
  escolarizado: boolean;
  dificultadesIdentificadas: string[];
  
  // Metadata
  fechaIngreso: Date;
  sesionesTotales: number;
  ultimaSesion: Date;
}
```

---

## Sistema RAG (Tipo NotebookLM)

### Biblioteca Psicopedagógica

**Ingesta de Documentos:**
1. Upload de PDF/DOCX/TXT
2. Extracción de texto (OCR si es necesario)
3. Chunking inteligente (mantener contexto)
4. Generación de embeddings
5. Almacenamiento en vector DB con metadata

**Funcionalidades MVP1:**
- Resumen automático del documento
- Extracción de puntos clave
- Glosario de términos
- Preguntas sugeridas
- Chat Q&A con **citaciones** (página/fragmento)

**Funcionalidades MVP2:**
- Generación de ítems de observación basados en bibliografía
- Criterios de alerta sugeridos
- Catálogo de actividades/intervenciones

**Funcionalidades MVP3:**
- Contraste sesiones reales vs bibliografía
- Informes con referencias: "Según guía X, página Y..."

### Motor de IA

**Comportamiento del Agente:**
- Lenguaje profesional y claro
- Enfoque descriptivo y preventivo
- **NO emite diagnósticos clínicos**
- Recomendaciones basadas en evidencia pedagógica
- Siempre cita fuentes cuando usa RAG

**Funciones Principales:**
1. Generación de resúmenes semanales por niño
2. Detección de patrones y tendencias
3. Identificación de señales tempranas de dificultad
4. Sugerencias de acompañamiento educativo
5. Análisis comparativo con bibliografía

**Prompting Estructurado:**
```
Eres un asistente psicopedagógico especializado en alfabetización.
Tu objetivo es ayudar a voluntarios y profesionales a comprender
el progreso educativo de niños en contextos vulnerables.

NUNCA des diagnósticos clínicos.
SIEMPRE cita las fuentes de la biblioteca cuando hagas sugerencias.
Usa lenguaje claro y empático.
Enfócate en observaciones descriptivas y sugerencias constructivas.

Contexto del niño: {perfil_json}
Últimas 5 sesiones: {sesiones_json}
Bibliografía relevante: {fragmentos_rag}

Genera un resumen semanal que incluya:
- Observaciones destacadas
- Patrones identificados
- Sugerencias de acompañamiento (con referencias)
```

---

## Guidelines de Código

### General
- TypeScript/Python con tipos estrictos
- Código comentado en español (es el idioma del equipo)
- Nombres de variables/funciones en español o inglés consistente
- Tests unitarios para lógica crítica
- Tests E2E para flujos principales

### API Design
- RESTful donde tenga sentido
- GraphQL para queries complejas de dashboard
- Versionado de API (`/api/v1/`)
- Documentación automática (Swagger/OpenAPI)
- Rate limiting y throttling

### Manejo de Errores
- Logging estructurado (JSON)
- Códigos de error consistentes
- Mensajes de error útiles para el usuario
- No exponer detalles técnicos en producción

### Performance
- Paginación en listados
- Caché estratégico (sesiones recientes, perfiles)
- Lazy loading en frontend
- Optimización de queries (N+1, índices)
- Compresión de assets

---

## Fases del Proyecto

### FASE 1 - Diciembre 2025: Diseño Conceptual
- Definir ítems de observación (20-40)
- Validar con equipo de psicopedagogía
- Diseñar perfiles etarios
- Definir roles y permisos

### FASE 2 - Enero 2025: Construcción y Recolección
- Desarrollar plataforma de carga (mobile + offline)
- Implementar formularios/checklists
- Testear con equipo interno
- Validar calidad de datos

### FASE 3 - Finales Enero: Motor de IA
- Seleccionar modelo base
- Implementar RAG con biblioteca psicopedagógica
- Desarrollar prompts estructurados
- Sistema de resúmenes y alertas

### FASE 4 - Febrero: Pruebas Piloto
- Testing con grupos pequeños
- Ajustar ítems y alertas
- Reducir sesgos
- Capacitación a usuarios

### FASE 5 - Marzo: Lanzamiento
- Despliegue oficial
- Monitoreo continuo
- Evaluación de impacto
- Roadmap de evolución

---

## Checklist Pre-Deploy

- [ ] Tests passing (unit + integration + E2E)
- [ ] Auditoría de seguridad
- [ ] Revisión de permisos y roles
- [ ] Backup configurado
- [ ] Monitoreo activo
- [ ] Documentación actualizada
- [ ] Plan de rollback
- [ ] Capacitación completada
- [ ] Consentimientos informados firmados
- [ ] Cumplimiento legal verificado

---

## Contactos y Recursos

**Validación Técnica:** Equipo GlobalIA
**Validación Contenido:** Nicanor + Psicopedagogía
**Recursos:** Ver [contexto-proyecto.md](./contexto-proyecto.md)