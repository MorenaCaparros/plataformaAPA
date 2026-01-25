# Plataforma APA - Contexto del Proyecto

## ¿Qué es la Plataforma APA?

Una **herramienta de gestión y evaluación con IA** desarrollada por **GlobalIA** en colaboración con la **ONG Adelante**, para el seguimiento continuo del proceso educativo de niños en contextos vulnerables. La plataforma APA facilita la observación sistemática y la toma de decisiones por parte de voluntarios alfabetizadores y profesionales de psicopedagogía.

---

## Objetivos del Proyecto

### Educativos
- Facilitar el seguimiento personalizado del progreso de cada niño
- Detectar tempranamente dificultades de aprendizaje
- Adaptar estrategias pedagógicas según necesidades individuales
- Mantener continuidad educativa en contextos de vulnerabilidad

### Emocionales
- Reconocer y registrar el estado emocional del niño en cada sesión
- Identificar patrones de frustración, motivación o desinterés
- Ajustar el acompañamiento según respuestas emocionales
- Crear un ambiente de aprendizaje contenedor

### De Seguimiento y Control
- Generar evaluaciones continuas (no solo diagnósticos anuales)
- Centralizar información para el equipo profesional
- Reducir tiempo de análisis manual de registros
- Producir informes automáticos basados en datos objetivos

---

## Enfoque General

### 1. Gestión del Contexto del Niño

La plataforma registra información relevante en cada sesión educativa, permitiendo observar el impacto del contexto social, emocional y educativo en el proceso de aprendizaje.

**Situaciones reconocidas:**
- Discontinuidad escolar
- Dificultades de alfabetización
- Atención limitada
- Frustración recurrente
- Respuestas emocionales variables
- Cambios en el entorno familiar/social

### 2. Seguimiento del Proceso Educativo

**Metodología:**
- Registros posteriores a cada sesión
- Checklists estructurados (5 minutos)
- Observaciones breves y guiadas
- Evaluaciones continuas vs diagnósticos anuales
- Detección temprana de dificultades y avances

### 3. Soporte a Voluntarios y Profesionales

**Para Voluntarios:**
- Herramienta simple y guiada
- Funciona offline (sincroniza después)
- Tiempo de carga: máximo 5 minutos
- No requiere conocimientos técnicos

**Para Profesionales:**
- Información centralizada
- Análisis automático de patrones
- Informes generados por IA
- Sugerencias basadas en bibliografía
- Reducción drástica de tiempo de análisis

### 4. Privacidad y Accesos

**Sistema de anonimización:**
- Cada niño tiene un **número de legajo** (identificador único)
- Solo **Psicopedagogía** y **Director/Administrador** ven identificación completa
- El **Director/Administrador** puede "destrabar" accesos cuando sea necesario
- Cumplimiento de normativas de protección de datos de menores

**Voluntarios visualizan:**
- **Número de legajo**
- **Nombre** (si no recuerdan pueden consultarlo)
- Edad/rango etario
- Historial educativo básico
- Objetivos asignados para ese niño
- Sus propias observaciones
- Qué hizo el niño anteriormente y qué aprendió
- Si va encaminado o no con los objetivos

**Coordinadores visualizan:**
- Información completa de su zona/barrio
- Asignación de voluntarios
- Reportes grupales

**Apellido del niño:**
- Oculto por defecto
- Solo accesible por psicopedagogía y director/administrador
- Desbloqueado por director/administrador cuando sea estrictamente necesario

---

## Sistema de Capacitación y Matching de Voluntarios

### Clasificación de Voluntarios por Habilidades

Los voluntarios son evaluados y capacitados en las **4 áreas principales** que se trabajan con los niños:

1. **Lenguaje y Vocabulario**
2. **Grafismo y Motricidad Fina**
3. **Lectura y Escritura**
4. **Nociones Matemáticas**

### Capacitaciones y Autoevaluaciones

**Quién puede crear capacitaciones:**
- Administrador/Director
- Trabajador Social
- Coordinador
- Psicopedagogía

**Tipos de evaluación:**
1. **Capacitaciones formales** (con certificado/registro)
   - Talleres presenciales
   - Cursos online
   - Material de estudio
   - Evaluación al finalizar

2. **Autoevaluaciones** (autodiagnóstico de habilidades)
   - Comprensión de conceptos
   - Capacidad de enseñanza
   - Experiencia práctica
   - Confianza en el área

**Estructura de una capacitación:**
```typescript
interface Capacitacion {
  id: string;
  titulo: string;
  area: 'lenguaje' | 'grafismo' | 'lectura_escritura' | 'matematicas' | 'general';
  descripcion: string;
  tipo: 'presencial' | 'online' | 'autoevaluacion' | 'material';
  puntaje_otorgado: number; // 1-5 estrellas
  fecha_creacion: Date;
  creado_por: string; // ID del admin/TS/coordinador
  contenido?: string; // Material de estudio
  evaluacion?: Pregunta[]; // Quiz opcional
}
```

### Sistema de Estrellas

**Cómo se obtienen estrellas:**
- Completar capacitaciones formales: 1-5 estrellas según complejidad
- Autoevaluaciones aprobadas: 1-3 estrellas
- Evaluaciones de coordinadores: 0-5 estrellas
- Experiencia en sesiones: +0.5 estrellas por cada 10 sesiones exitosas

**Visualización para el voluntario:**
- ⭐⭐⭐⭐⭐ Lenguaje y Vocabulario (5/5)
- ⭐⭐⭐ Grafismo y Motricidad Fina (3/5)
- ⭐⭐⭐⭐ Lectura y Escritura (4/5)
- ⭐⭐ Nociones Matemáticas (2/5)

**Puntaje total:** Promedio de todas las áreas

### Sistema de Matching Automático

**Objetivo:** Asignar el voluntario más adecuado a cada niño según las necesidades identificadas.

**Algoritmo de matching:**

1. **Identificar déficits del niño** (de evaluación psicopedagógica)
   - Lenguaje: Presenta dificultad
   - Lectura: En proceso
   - Matemáticas: Logrado
   - Grafismo: Presenta dificultad

2. **Identificar fortalezas del voluntario** (de capacitaciones/estrellas)
   - Lenguaje: ⭐⭐⭐⭐⭐
   - Lectura: ⭐⭐⭐
   - Matemáticas: ⭐⭐
   - Grafismo: ⭐⭐⭐⭐

3. **Calcular score de compatibilidad:**
   ```
   Score = Σ (estrellas_voluntario × prioridad_necesidad_niño)
   
   Prioridad según evaluación:
   - "Presenta dificultad" = 5 puntos
   - "En proceso" = 3 puntos
   - "Logrado" = 0 puntos
   ```

4. **Consideraciones adicionales:**
   - Disponibilidad horaria
   - Zona/barrio (proximidad)
   - Carga actual del voluntario (máx. 3 niños simultáneos)
   - Preferencias declaradas

**Ejemplo de matching:**

**Niño A:**
- Lenguaje: Presenta dificultad (5)
- Grafismo: Presenta dificultad (5)
- Lectura: En proceso (3)
- Matemáticas: Logrado (0)

**Voluntario 1:**
- Lenguaje: ⭐⭐⭐⭐⭐ (5)
- Grafismo: ⭐⭐ (2)
- Lectura: ⭐⭐⭐ (3)
- Matemáticas: ⭐⭐ (2)

**Score = (5×5) + (2×5) + (3×3) + (2×0) = 25 + 10 + 9 + 0 = 44 puntos**

**Voluntario 2 (comodín):**
- Lenguaje: ⭐⭐⭐⭐ (4)
- Grafismo: ⭐⭐⭐⭐ (4)
- Lectura: ⭐⭐⭐⭐ (4)
- Matemáticas: ⭐⭐⭐⭐ (4)

**Score = (4×5) + (4×5) + (4×3) + (4×0) = 20 + 20 + 12 + 0 = 52 puntos**

✅ **Voluntario 2 es mejor match** (habilidades balanceadas)

### Gestión de Capacitaciones

**Estado de capacitaciones del voluntario:**
- 📝 **Pendientes** - Asignadas pero no iniciadas
- 🔄 **En curso** - Iniciadas pero no completadas
- ✅ **Completadas** - Finalizadas con evaluación aprobada
- ❌ **No aprobadas** - Requieren repetición

**Notificaciones (Plus - Fase 3):**
- WhatsApp: "Nueva capacitación disponible: Lectura inicial"
- Email: "Recordatorio: Completá la autoevaluación de matemáticas"
- In-app: Badge con cantidad de capacitaciones pendientes

### Dashboard del Voluntario

**Vista principal:**
```
┌─────────────────────────────────────────┐
│  Mis Habilidades                        │
├─────────────────────────────────────────┤
│  ⭐⭐⭐⭐⭐ Lenguaje (5/5)                │
│  ⭐⭐⭐⭐ Lectura y Escritura (4/5)       │
│  ⭐⭐⭐ Grafismo (3/5)                    │
│  ⭐⭐ Matemáticas (2/5)                   │
├─────────────────────────────────────────┤
│  Capacitaciones                         │
│  ✅ Completadas: 8                      │
│  🔄 En curso: 2                         │
│  📝 Pendientes: 3                       │
├─────────────────────────────────────────┤
│  Niños asignados: 2/3                   │
│  - Juan (Lenguaje + Lectura)            │
│  - María (Grafismo + Matemáticas)       │
└─────────────────────────────────────────┘
```

### Dashboard para Coordinadores/Psicopedagogía

**Vista de asignación:**
```
┌─────────────────────────────────────────┐
│  Sugerencias de Matching                │
├─────────────────────────────────────────┤
│  Niño: Pedro (7 años)                   │
│  Necesidades:                           │
│  🔴 Lenguaje (Presenta dificultad)      │
│  🟡 Lectura (En proceso)                │
│                                         │
│  Voluntarios sugeridos:                 │
│  1. Ana López (Score: 52) ⭐            │
│     ⭐⭐⭐⭐⭐ Lenguaje                   │
│     ⭐⭐⭐⭐ Lectura                      │
│     Disponible: Lunes y Miércoles       │
│     [Asignar]                           │
│                                         │
│  2. Carlos Gómez (Score: 48)            │
│     ⭐⭐⭐⭐⭐ Lenguaje                   │
│     ⭐⭐⭐ Lectura                        │
│     Disponible: Martes y Jueves         │
│     [Asignar]                           │
└─────────────────────────────────────────┘
```

---

## Fases del Proyecto

### 📋 FASE 1 - Diciembre 2025: Diseño Conceptual

**Objetivos a definir:**
- Educativos
- Emocionales  
- De seguimiento y control

**Reunión con psicopedagogía para:**
- Validar enfoque de observación por sesión
- Definir indicadores relevantes
- Acordar lenguaje y nivel de interpretación

**Diseño de ítems de registro (20-40 ítems):**
1. Atención y concentración
2. Conducta y comportamiento
3. Emociones y motivación
4. Lectura y escritura
5. Matemática y lógica
6. Interacción con el voluntario

**Datos a recopilar:**
- Nivel de alfabetización
- Habilidades cognitivas básicas
- Atención y concentración
- Motivación y respuesta emocional
- Intereses observados
- Contexto educativo
- Frecuencia y duración de sesiones

**Definición de roles:**
- Director/Administrador (y Director de Programa) - Rol único con máximo acceso
- Coordinador (Nivel 2, dividido por equipos)
- Voluntario alfabetizador
- Trabajadora Social
- Psicopedagogía

---

## Flujo Operativo del Programa

### Paso 1: Ingreso Formal del Niño

**Responsable principal:** Trabajadora Social + Psicopedagoga

**Proceso:**
1. **Registro inicial**
   - Asignación de número de legajo (identificador único)
   - Datos básicos del niño

2. **Entrevista inicial a la familia** (Trabajadora Social)
   - Alimentación durante el embarazo
   - Alimentación actual del niño
   - Asistencia a la escuela (concurrencia escolar)
   - Contexto familiar y social
   - Pronóstico inicial

3. **Ingreso formal** (Psicopedagoga)
   - Validación de datos
   - Evaluación diagnóstica inicial
   - Asignación a grupo/barrio
   - Creación de perfil en la plataforma

**Nota:** Las trabajadoras sociales trabajan principalmente con celular y pueden utilizar grabación de voz para facilitar el registro.

### Paso 2: Evaluación de Dificultades

**Responsable:** Psicopedagoga (Evaluador)

**Áreas de evaluación:**
1. **Lenguaje y Vocabulario**
   - Comprensión de órdenes
   - Identificación de objetos
   - Formación de oraciones
   - Pronunciación

2. **Grafismo y Motricidad Fina**
   - Agarre del lápiz
   - Tipo de trazo
   - Representación de figuras

3. **Lectura y Escritura**
   - Reconocimiento de vocales/consonantes
   - Identificación de sílabas
   - Lectura de palabras y textos
   - Escritura (nombre, palabras, oraciones)
   - Comprensión lectora

4. **Nociones Matemáticas**
   - Conteo y reconocimiento de números
   - Conceptos básicos (suma, resta, etc.)
   - Razonamiento lógico

**Resultado:** Informe de dificultades identificadas

### Paso 3: Plan de Intervención

**Responsable:** Psicopedagoga (Planificación)

**Proceso:**
1. **Definición de objetivos**
   - Objetivos anuales (generales)
   - Objetivos a corto plazo (mensuales)
   - Sincronización entre ambos

2. **Diseño de actividades**
   - Actividades específicas según dificultades detectadas
   - Estimulación de áreas con deficiencia
   - Adaptación según edad y nivel

3. **Asignación de voluntario**
   - Match voluntario-niño según disponibilidad y zona
   - Sistema de matching automático basado en habilidades
   - Sugerencias inteligentes: voluntario fuerte en área X → niño con déficit en área X
   - Reasignación cuando sea necesario
   - Registro de capacitaciones del voluntario
   - Sistema de estrellas por área de dominio

4. **Recursos y materiales**
   - Selección de actividades de la biblioteca
   - Materiales necesarios
   - Tiempo estimado de cada actividad

### Evaluación Continua

**Evaluación a corto plazo (MENSUAL):**
- Realizada por Psicopedagoga
- Basada en registros semanales del voluntario
- Objetivo: detectar si el plan funciona rápidamente
- Ajustes inmediatos según resultados

**Evaluación a mediano plazo (Cada 3-6 meses):**
- Evaluación formal de progreso
- Contraste con objetivos de mediano plazo
- Ajuste del plan de intervención

**Evaluación anual:**
- Evaluación completa de inicio a fin de año
- Contraste con objetivos anuales
- Decisión sobre continuidad/graduación

**Desafío clave:** Determinar rápidamente si las intervenciones están funcionando para el aprendizaje del niño.

---

### 🔨 FASE 2 - Enero 2025: Construcción y Recolección

**Desarrollo de la plataforma:**
- ✅ Uso desde celular
- ✅ Funcionamiento offline
- ✅ Sincronización posterior con internet

**Formularios/checklists de sesión:**
- Simples y rápidos (5 minutos máximo)
- Campos guiados
- Sin campos libres extensos

**Testing con equipo GlobalIA:**
- Detección de bugs
- Claridad de los ítems
- Tiempos reales de carga
- Usabilidad mobile

**Análisis de calidad de datos:**
- Qué información aporta valor real
- Qué ítems pueden eliminarse o ajustarse
- Validación de consistencia

**Perfiles de niños por edad:**
- Rangos etarios: 5-7, 8-10, 11-13, 14+
- Variaciones de indicadores según edad
- Necesidades específicas por grupo
- Validación con Nicanor y psicopedagogía

---

### 🤖 FASE 3 - Finales de Enero: Motor de IA

**Selección de modelo base:**
- Opciones: GPT-4, Claude 3.5, Gemini Pro, Llama 3
- Evaluación: presupuesto vs privacidad vs necesidades
- Consideración de modelos open-source para mayor control

**Implementación de IA:**
- ⚠️ **Herramienta de análisis y apoyo, NO diagnóstico clínico**
- Enfoque preventivo y descriptivo
- Basado en evidencia pedagógica

**Funciones principales:**
1. Generación de resúmenes semanales por niño
2. Detección de patrones y tendencias
3. Identificación de señales tempranas de dificultad
4. Sugerencias de acompañamiento educativo
5. Análisis comparativo con bibliografía

**Comportamiento del agente:**
- Lenguaje profesional y claro
- Enfoque descriptivo y preventivo
- SIN emitir diagnósticos
- Recomendaciones basadas en evidencia
- **Siempre cita fuentes**

**Implementación técnica:**
- Prompting estructurado
- Perfiles dinámicos por niño (JSON)
- RAG con material psicopedagógico validado
- Bibliografía, criterios, actividades sugeridas

---

### 🧪 FASE 4 - Febrero 2025: Pruebas Piloto

**Implementación piloto:**
- Grupos pequeños
- Distintos barrios
- Distintos rangos etarios
- Voluntarios con diferentes niveles de experiencia

**Evaluación:**
- Utilidad real de los informes
- Claridad de las sugerencias
- Nivel de adopción por voluntarios
- Tiempo real de uso

**Ajustes necesarios:**
- Ítems de observación
- Lógica de alertas
- Redacción de reportes
- UX/UI mobile

**Reducción de sesgos:**
- Culturales
- De interpretación
- De carga subjetiva
- Validación con equipo diverso

**Seguridad adicional:**
- Medidas de protección de datos
- Auditoría de accesos
- Consentimientos informados
- Capacitación en manejo de datos sensibles

**Capacitación:**
- Voluntarios: uso de la app
- Coordinadores: interpretación de informes
- Psicopedagogía: herramientas de IA y RAG

---

### 🚀 FASE 5 - Marzo 2025: Lanzamiento

**Lanzamiento oficial:**
- Uso regular en sesiones educativas
- Monitoreo continuo de uso
- Soporte técnico activo

**Informes periódicos:**
- Para psicopedagogía (semanal)
- Para coordinación (quincenal)
- Para equipo general (mensual)

**Evaluación de impacto:**
- Detección temprana de necesidades
- Mejora en planificación de intervenciones
- Reducción de tiempo de análisis manual
- Satisfacción de voluntarios y profesionales

**Roadmap de evolución:**
- Ampliación de funcionalidades
- Futura interacción niño-IA (gamificación)
- Integración de juegos educativos digitales
- Dashboard de impacto para reportes externos
- Exportación de datos para investigación (anonimizados)

---

## Sistema Tipo NotebookLM

### Concepto General

Un módulo interno que permite a los psicopedagogos subir bibliografía especializada y convertirla en una "base de conocimiento" consultable y utilizable por la IA.

### Implementación en APA

#### 1️⃣ Módulo "Biblioteca Psicopedagógica"

**Tipos de archivos soportados:**
- PDF (papers, guías internas, criterios de evaluación)
- DOCX
- TXT / Markdown
- (Opcional) Links a Google Drive

**Proceso automático al subir:**
1. Extracción de texto (OCR si es necesario)
2. División en chunks (pedazos con contexto)
3. Generación de embeddings
4. Almacenamiento en vector DB (índice)
5. Metadata: autor, fecha, tipo de documento, tags

#### 2️⃣ Experiencias para el Usuario

**Con esos documentos, la plataforma ofrece:**

✅ **Resumen ejecutivo** del documento (1 página)
✅ **Puntos clave** / conceptos principales
✅ **Glosario** (términos + definiciones)
✅ **Preguntas sugeridas** basadas en el contenido
✅ **Plantillas**: "Checklist de observación por sesión" basado en ese paper
✅ **Q&A con citas**: "¿Qué indicadores recomiendan para frustración?" → respuesta + referencias a fragmentos del PDF

#### 3️⃣ Respuestas con Respaldo

**Cada respuesta incluye:**
- Citaciones (página/fragmento)
- Extracto de la fuente original
- Link al documento completo

**Esto es clave para:**
- Confiabilidad profesional
- Evitar alucinaciones de la IA
- Trazabilidad de recomendaciones

---

### Costos a Considerar

#### A) Costo Técnico (Desarrollo)
- Ingesta + parsing de PDF (OCR si es necesario)
- Indexación y vector DB
- UI para biblioteca + búsqueda + chat con citas
- Sistema de permisos (solo psicopedagogía sube)

#### B) Costo Económico (Uso de IA)
- Embeddings (cuando se sube un documento)
- Generación (cuando se pregunta/resume)
- **En la práctica:** Si lo usan pocas personas (psicopedagogía), el costo es manejable
- Estimado: USD 50-200/mes según volumen

#### C) Costo de Calidad
- Prompts de estructuración bien diseñados
- Control de citaciones riguroso
- Filtro: "Si no está en los docs, decir 'no sé'"
- Testing continuo de precisión

---

### Implementación por Capas (MVP)

#### 📦 MVP 1 - Rápido y Útil
**Funcionalidades básicas:**
- Subida de PDF/DOCX
- Resumen automático + puntos clave
- Chat "pregúntale a tus docs" con citas
- **Tiempo estimado:** 2-3 semanas

#### 📦 MVP 2 - Máximo Valor para APA
**Convertir docs en herramientas:**
- Generar ítems de observación sugeridos
- Generar criterios de alerta
- Sugerir actividades/intervenciones del catálogo
- **Tiempo estimado:** 3-4 semanas adicionales

#### 📦 MVP 3 - Nivel Pro
**Análisis avanzado:**
- Comparar sesiones reales vs bibliografía ("contraste")
- Informes automáticos citando guías internas: "Según guía X..."
- Detección de inconsistencias entre observaciones y mejores prácticas
- **Tiempo estimado:** 4-6 semanas adicionales

---

### Conexión con el Core de la Plataforma

**Dos fuentes de verdad:**

1. **Datos de sesiones** (lo que cargan voluntarios)
   - Observaciones reales
   - Progreso del niño
   - Contexto actual

2. **Biblioteca psicopedagógica** (lo que suben profesionales)
   - Evidencia científica
   - Mejores prácticas
   - Criterios de intervención

**La IA hace el puente:**
- Analiza sesiones
- Sustenta sugerencias con la biblioteca (RAG)
- Genera recomendaciones con respaldo teórico
- Identifica gaps entre práctica y teoría

**Ejemplo de output:**
```
📊 Resumen Semanal - Juan (8 años)

Observaciones destacadas:
- Incremento en frustración durante ejercicios de escritura (4/5 sesiones)
- Dificultad para mantener atención más de 10 minutos
- Respuesta positiva a actividades lúdicas de lectura

Patrones identificados:
- La frustración aparece específicamente con tareas de caligrafía
- Mejor desempeño en horario matutino

Sugerencias de acompañamiento:
1. Incorporar más actividades lúdicas para escritura (Ref: Guía APA 2024, p. 45)
2. Sesiones más cortas con descansos frecuentes (Ref: Manual de Atención, p. 12)
3. Refuerzo positivo en pequeños logros (Ref: Estrategias Motivacionales, p. 78)

⚠️ Señal de atención: Considerar evaluación especializada si frustración persiste 2 semanas más.
```

---

## Roles y Permisos

| Funcionalidad | Voluntario | Coordinador | Psicopedagogía | Admin |
|---------------|------------|-------------|----------------|-------|
| Ver alias del niño | ✅ | ✅ | ✅ | ✅ |
| Ver datos completos del niño | ❌ | ✅ (zona) | ✅ | ✅ |
| Registrar sesión | ✅ | ✅ | ✅ | ✅ |
| Ver todas las sesiones | ❌ | ✅ (zona) | ✅ | ✅ |
| Generar informes | ❌ | ✅ | ✅ | ✅ |
| Subir a biblioteca | ❌ | ❌ | ✅ | ✅ |
| Consultar RAG | ❌ | Limitado | ✅ | ✅ |
| Configurar sistema | ❌ | ❌ | ❌ | ✅ |

---

## Indicadores de Éxito

**Métricas operativas:**
- Tiempo promedio de carga de sesión < 5 minutos
- Tasa de adopción por voluntarios > 80%
- Uptime del sistema > 99%
- Sincronización offline exitosa > 95%

**Métricas de impacto:**
- Detección temprana de dificultades (antes de 4 semanas)
- Reducción de tiempo de análisis manual (>70%)
- Satisfacción de profesionales con informes de IA (>4/5)
- Mejora en planificación de intervenciones (medible cualitativamente)

---

## Equipo y Stakeholders

**Desarrollo:** Equipo GlobalIA
**Validación Pedagógica:** Nicanor + Equipo de Psicopedagogía
**Testing:** Voluntarios + Coordinadores
**Usuarios finales:** Voluntarios, Coordinadores, Psicopedagogía

---

## Referencias y Recursos Adicionales

- Normativas de protección de datos de menores en Argentina
- Guías de psicopedagogía de APA (a subir a la biblioteca)
- Papers sobre alfabetización en contextos vulnerables
- Estándares de accesibilidad (WCAG 2.1)
- Mejores prácticas de UX para aplicaciones offline-first