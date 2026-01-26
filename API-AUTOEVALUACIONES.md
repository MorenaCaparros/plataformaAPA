# API de Autoevaluaciones - Documentación Completa

## 📋 Índice

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints](#endpoints)
   - [Plantillas de Autoevaluación](#plantillas-de-autoevaluación)
   - [Respuestas de Autoevaluación](#respuestas-de-autoevaluación)
4. [Modelos de Datos](#modelos-de-datos)
5. [Códigos de Error](#códigos-de-error)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Información General

**Base URL:** `http://localhost:3000/api`  
**Formato:** JSON  
**Autenticación:** Bearer Token (JWT)  
**Versión:** 1.0.0

### Sistema de Autoevaluaciones

El sistema permite que voluntarios completen autoevaluaciones configurables sobre sus habilidades en 4 áreas:
- `lenguaje` - Lenguaje y Vocabulario
- `grafismo` - Grafismo y Motricidad Fina
- `lectura_escritura` - Lectura y Escritura
- `matematicas` - Nociones Matemáticas

Las autoevaluaciones calculan puntajes automáticamente y actualizan las "estrellas" (nivel de habilidad 1-10) de cada voluntario.

---

## Autenticación

Todos los endpoints requieren autenticación mediante JWT token en el header:

```http
Authorization: Bearer <token>
```

### Obtener Token

**Desarrollo (solo local):**
```http
GET /api/debug/token
```

**Producción:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "contraseña"
}
```

---

## Endpoints

### Plantillas de Autoevaluación

#### 📄 Listar Plantillas

Obtiene todas las plantillas activas de autoevaluación.

```http
GET /api/plantillas-autoevaluacion
Authorization: Bearer <token>
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `area` | string | Filtrar por área específica: `lenguaje`, `grafismo`, `lectura_escritura`, `matematicas` |

**Response 200 OK:**
```json
[
  {
    "id": "uuid",
    "titulo": "Autoevaluación de Lenguaje y Vocabulario",
    "area": "lenguaje",
    "descripcion": "Evalúa tus habilidades para trabajar con niños en el desarrollo del lenguaje",
    "preguntas": [
      {
        "id": "p1",
        "tipo": "escala",
        "pregunta": "¿Qué tan cómodo/a te sentís explicando conceptos complejos?",
        "escala_min": 1,
        "escala_max": 10,
        "puntaje_maximo": 10
      },
      {
        "id": "p2",
        "tipo": "multiple_choice",
        "pregunta": "¿Cuánta experiencia tenés?",
        "opciones": ["Ninguna", "Poca", "Bastante", "Mucha"],
        "puntaje_por_opcion": [2, 5, 7, 10]
      },
      {
        "id": "p3",
        "tipo": "texto_abierto",
        "pregunta": "Describí una situación...",
        "min_caracteres": 100,
        "requiere_revision": true
      }
    ],
    "puntaje_maximo": 10,
    "requiere_revision": true,
    "activo": true,
    "creado_por": "uuid",
    "fecha_creacion": "2026-01-25T10:00:00Z",
    "ultima_modificacion": "2026-01-25T10:00:00Z"
  }
]
```

**Permisos:** Todos los usuarios autenticados

---

#### ➕ Crear Plantilla

Crea una nueva plantilla de autoevaluación.

```http
POST /api/plantillas-autoevaluacion
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "titulo": "Autoevaluación de Matemáticas",
  "area": "matematicas",
  "descripcion": "Evalúa tus conocimientos matemáticos",
  "preguntas": [
    {
      "id": "m1",
      "tipo": "escala",
      "pregunta": "¿Qué tan cómodo/a te sentís enseñando sumas?",
      "escala_min": 1,
      "escala_max": 10,
      "puntaje_maximo": 10
    },
    {
      "id": "m2",
      "tipo": "multiple_choice",
      "pregunta": "¿Conocés métodos de enseñanza?",
      "opciones": ["No", "Poco", "Sí", "Experto"],
      "puntaje_por_opcion": [2, 5, 8, 10]
    },
    {
      "id": "m3",
      "tipo": "texto_abierto",
      "pregunta": "Explica cómo enseñarías fracciones",
      "min_caracteres": 100,
      "requiere_revision": true
    }
  ],
  "puntaje_maximo": 10
}
```

**Campos Obligatorios:**
- `titulo` (string): Título de la plantilla
- `area` (string): Una de: `lenguaje`, `grafismo`, `lectura_escritura`, `matematicas`
- `preguntas` (array): Array de objetos pregunta (ver estructura abajo)

**Campos Opcionales:**
- `descripcion` (string): Descripción de la plantilla
- `puntaje_maximo` (integer): Puntaje máximo (default: 10)

**Estructura de Pregunta:**

**Tipo: `escala`**
```json
{
  "id": "string",
  "tipo": "escala",
  "pregunta": "string",
  "escala_min": 1,
  "escala_max": 10,
  "puntaje_maximo": 10
}
```

**Tipo: `multiple_choice`**
```json
{
  "id": "string",
  "tipo": "multiple_choice",
  "pregunta": "string",
  "opciones": ["opción1", "opción2", "opción3"],
  "puntaje_por_opcion": [2, 5, 10]
}
```

**Tipo: `texto_abierto`**
```json
{
  "id": "string",
  "tipo": "texto_abierto",
  "pregunta": "string",
  "min_caracteres": 100,
  "requiere_revision": true
}
```

**Response 201 Created:**
```json
{
  "id": "nuevo-uuid",
  "titulo": "Autoevaluación de Matemáticas",
  "area": "matematicas",
  "requiere_revision": true,
  "activo": true,
  ...
}
```

**Errores:**
- `400 Bad Request`: Faltan campos obligatorios o estructura inválida
- `403 Forbidden`: Usuario no tiene permisos (debe ser director/psicopedagogia/coordinador)

**Permisos:** `director`, `psicopedagogia`, `coordinador`

---

### Respuestas de Autoevaluación

#### 📄 Listar Respuestas

Obtiene respuestas de autoevaluaciones según el rol del usuario.

```http
GET /api/respuestas-autoevaluacion
Authorization: Bearer <token>
```

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `estado` | string | Filtrar por estado: `completada`, `en_revision`, `evaluada` |

**Comportamiento según rol:**
- **Voluntario**: Solo ve sus propias respuestas
- **Psico/Coordinador/Director**: Ve todas las respuestas (útil con filtro `estado=en_revision`)

**Response 200 OK:**
```json
[
  {
    "id": "uuid",
    "voluntario_id": "uuid",
    "plantilla_id": "uuid",
    "respuestas": [
      {
        "pregunta_id": "m1",
        "respuesta": "7"
      },
      {
        "pregunta_id": "m2",
        "respuesta": "Conozco bien"
      },
      {
        "pregunta_id": "m3",
        "respuesta": "Texto largo explicando..."
      }
    ],
    "puntaje_automatico": 6.5,
    "puntaje_manual": 8.5,
    "puntaje_total": 7.5,
    "estado": "evaluada",
    "fecha_completada": "2026-01-25T10:00:00Z",
    "evaluado_por": "uuid",
    "fecha_evaluacion": "2026-01-25T11:00:00Z",
    "comentarios_evaluador": "Excelente explicación",
    "plantilla": {
      "titulo": "Autoevaluación de Matemáticas",
      "area": "matematicas",
      "descripcion": "..."
    },
    "voluntario": {
      "nombre_completo": "Juan Pérez"
    },
    "evaluador": {
      "nombre_completo": "María González"
    }
  }
]
```

**Permisos:** Todos los usuarios autenticados (con filtros según rol)

---

#### ➕ Responder Autoevaluación

Permite a un voluntario completar una autoevaluación.

```http
POST /api/respuestas-autoevaluacion
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "plantilla_id": "uuid-de-la-plantilla",
  "respuestas": [
    {
      "pregunta_id": "m1",
      "respuesta": "7"
    },
    {
      "pregunta_id": "m2",
      "respuesta": "Conozco bien"
    },
    {
      "pregunta_id": "m3",
      "respuesta": "Les enseñaría usando objetos concretos como pizzas divididas en partes. Primero mostraría una pizza entera y luego la cortaría en 4 partes iguales para explicar 1/4. Haríamos ejercicios prácticos con dibujos antes de pasar a números abstractos."
    }
  ]
}
```

**Campos Obligatorios:**
- `plantilla_id` (uuid): ID de la plantilla a responder
- `respuestas` (array): Array con todas las respuestas

**Validaciones:**
- Debe responder TODAS las preguntas de la plantilla
- Preguntas de tipo `texto_abierto` deben tener al menos `min_caracteres`
- Preguntas de tipo `multiple_choice` deben elegir una opción válida
- Preguntas de tipo `escala` deben estar entre `escala_min` y `escala_max`

**Response 201 Created:**
```json
{
  "id": "nuevo-uuid",
  "voluntario_id": "uuid-del-voluntario",
  "plantilla_id": "uuid",
  "respuestas": [...],
  "puntaje_automatico": 6.5,
  "puntaje_manual": null,
  "puntaje_total": null,
  "estado": "en_revision",
  "fecha_completada": "2026-01-25T10:00:00Z"
}
```

**Estados de la respuesta:**
- `completada`: Solo tenía preguntas automáticas (multiple choice + escala), puntaje ya calculado
- `en_revision`: Tiene preguntas abiertas, esperando evaluación manual
- `evaluada`: Ya fue revisada por psico/coordinador

**Cálculo automático:**
- Preguntas `multiple_choice`: Usa `puntaje_por_opcion` según la opción elegida
- Preguntas `escala`: El valor seleccionado es el puntaje
- Preguntas `texto_abierto`: Requieren evaluación manual, no suman al puntaje automático
- **Normalización**: El puntaje final se normaliza a escala 1-10

**Errores:**
- `400 Bad Request`: Respuestas incompletas, texto muy corto, formato inválido
- `403 Forbidden`: Usuario no es voluntario
- `404 Not Found`: Plantilla no existe o no está activa

**Permisos:** Solo `voluntario`

---

#### 🔍 Ver Detalle de Respuesta

Obtiene todos los detalles de una respuesta específica.

```http
GET /api/respuestas-autoevaluacion/{id}
Authorization: Bearer <token>
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | uuid | ID de la respuesta |

**Response 200 OK:**
```json
{
  "id": "uuid",
  "voluntario_id": "uuid",
  "plantilla_id": "uuid",
  "respuestas": [
    {
      "pregunta_id": "m1",
      "respuesta": "7"
    }
  ],
  "puntaje_automatico": 6.5,
  "puntaje_manual": 8.5,
  "puntaje_total": 7.5,
  "estado": "evaluada",
  "fecha_completada": "2026-01-25T10:00:00Z",
  "evaluado_por": "uuid",
  "fecha_evaluacion": "2026-01-25T11:00:00Z",
  "comentarios_evaluador": "...",
  "plantilla": {
    "id": "uuid",
    "titulo": "...",
    "area": "matematicas",
    "preguntas": [...]
  },
  "voluntario": {
    "id": "uuid",
    "nombre_completo": "..."
  },
  "evaluador": {
    "nombre_completo": "..."
  }
}
```

**Permisos:** 
- Voluntario: Solo sus propias respuestas
- Psico/Coordinador/Director: Todas las respuestas

---

#### ✏️ Evaluar Respuesta

Permite a psico/coordinador asignar puntaje manual a preguntas abiertas.

```http
PATCH /api/respuestas-autoevaluacion/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | uuid | ID de la respuesta a evaluar |

**Request Body:**
```json
{
  "puntaje_manual": 8.5,
  "comentarios_evaluador": "Excelente explicación pedagógica. Usa elementos concretos y progresa de simple a complejo."
}
```

**Campos Obligatorios:**
- `puntaje_manual` (float): Puntaje de 0 a 10 para las preguntas abiertas

**Campos Opcionales:**
- `comentarios_evaluador` (string): Retroalimentación para el voluntario

**Response 200 OK:**
```json
{
  "id": "uuid",
  "voluntario_id": "uuid",
  "plantilla_id": "uuid",
  "respuestas": [...],
  "puntaje_automatico": 6.5,
  "puntaje_manual": 8.5,
  "puntaje_total": 7.5,
  "estado": "evaluada",
  "evaluado_por": "uuid-del-evaluador",
  "fecha_evaluacion": "2026-01-25T11:00:00Z",
  "comentarios_evaluador": "..."
}
```

**Cálculo del puntaje total:**
```
Si solo preguntas automáticas:
  puntaje_total = puntaje_automatico

Si solo preguntas abiertas:
  puntaje_total = puntaje_manual

Si preguntas mixtas:
  peso_automatico = cantidad_preguntas_automaticas / total_preguntas
  peso_manual = cantidad_preguntas_abiertas / total_preguntas
  puntaje_total = (puntaje_automatico * peso_automatico) + (puntaje_manual * peso_manual)
```

**Efecto secundario:**
🎯 **Al cambiar estado a `evaluada`, el trigger de base de datos actualiza automáticamente las estrellas del voluntario en `voluntarios_habilidades`**

**Errores:**
- `400 Bad Request`: Puntaje fuera de rango (0-10) o respuesta ya evaluada
- `403 Forbidden`: Usuario no tiene permisos
- `404 Not Found`: Respuesta no existe

**Permisos:** `director`, `psicopedagogia`, `coordinador`

---

## Modelos de Datos

### Plantilla de Autoevaluación

```typescript
interface PlantillaAutoevaluacion {
  id: string; // UUID
  titulo: string;
  area: 'lenguaje' | 'grafismo' | 'lectura_escritura' | 'matematicas';
  descripcion?: string;
  preguntas: Pregunta[];
  puntaje_maximo: number; // Default: 10
  requiere_revision: boolean; // Auto-detectado si tiene preguntas abiertas
  activo: boolean; // Default: true
  creado_por: string; // UUID del creador
  fecha_creacion: string; // ISO 8601
  ultima_modificacion: string; // ISO 8601
  metadata?: object;
}
```

### Pregunta

```typescript
type Pregunta = PreguntaEscala | PreguntaMultipleChoice | PreguntaTextoAbierto;

interface PreguntaEscala {
  id: string;
  tipo: 'escala';
  pregunta: string;
  escala_min: number; // Ej: 1
  escala_max: number; // Ej: 10
  puntaje_maximo: number; // Ej: 10
}

interface PreguntaMultipleChoice {
  id: string;
  tipo: 'multiple_choice';
  pregunta: string;
  opciones: string[]; // Ej: ["Ninguna", "Poca", "Mucha"]
  puntaje_por_opcion: number[]; // Ej: [2, 5, 10]
}

interface PreguntaTextoAbierto {
  id: string;
  tipo: 'texto_abierto';
  pregunta: string;
  min_caracteres: number; // Ej: 100
  requiere_revision: true;
}
```

### Respuesta de Autoevaluación

```typescript
interface RespuestaAutoevaluacion {
  id: string; // UUID
  voluntario_id: string; // UUID
  plantilla_id: string; // UUID
  respuestas: RespuestaIndividual[];
  puntaje_automatico: number | null; // 0-10
  puntaje_manual: number | null; // 0-10
  puntaje_total: number | null; // 0-10
  estado: 'completada' | 'en_revision' | 'evaluada';
  fecha_completada: string; // ISO 8601
  evaluado_por?: string; // UUID
  fecha_evaluacion?: string; // ISO 8601
  comentarios_evaluador?: string;
  metadata?: object;
  
  // Relaciones (solo en GET)
  plantilla?: PlantillaAutoevaluacion;
  voluntario?: { nombre_completo: string };
  evaluador?: { nombre_completo: string };
}

interface RespuestaIndividual {
  pregunta_id: string;
  respuesta: string; // Puede ser número (escala), texto (opción o texto abierto)
}
```

### Habilidades del Voluntario

```typescript
interface VoluntarioHabilidad {
  id: string; // UUID
  voluntario_id: string; // UUID
  area: 'lenguaje' | 'grafismo' | 'lectura_escritura' | 'matematicas';
  estrellas: number; // 0-10 (con decimales)
  capacitaciones_completadas: number;
  sesiones_realizadas: number;
  ultima_actualizacion: string; // ISO 8601
  notas?: string;
  metadata?: object;
}
```

---

## Códigos de Error

### Códigos HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Petición exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Error en los datos enviados (formato, validaciones) |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Usuario no tiene permisos para esta operación |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

### Formato de Error

```json
{
  "error": "Descripción del error en español"
}
```

**Ejemplos:**

```json
{
  "error": "Faltan campos obligatorios: titulo, area, preguntas"
}
```

```json
{
  "error": "No autorizado. Solo director, psicopedagogía o coordinador pueden crear plantillas"
}
```

```json
{
  "error": "Debe responder todas las preguntas"
}
```

---

## Ejemplos de Uso

### Flujo Completo: Voluntario Completa Autoevaluación

#### 1. Voluntario obtiene token
```bash
curl -X GET http://localhost:3000/api/debug/token
```

#### 2. Voluntario lista plantillas disponibles
```bash
curl -X GET http://localhost:3000/api/plantillas-autoevaluacion \
  -H "Authorization: Bearer <token>"
```

#### 3. Voluntario responde autoevaluación de Lenguaje
```bash
curl -X POST http://localhost:3000/api/respuestas-autoevaluacion \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plantilla_id": "uuid-lenguaje",
    "respuestas": [
      {"pregunta_id": "p1", "respuesta": "8"},
      {"pregunta_id": "p2", "respuesta": "Bastante"},
      {"pregunta_id": "p3", "respuesta": "En mi experiencia..."}
    ]
  }'
```

**Response:** Estado `en_revision` porque tiene pregunta abierta

#### 4. Psicopedagoga ve respuestas pendientes
```bash
curl -X GET "http://localhost:3000/api/respuestas-autoevaluacion?estado=en_revision" \
  -H "Authorization: Bearer <token-psico>"
```

#### 5. Psicopedagoga evalúa la respuesta
```bash
curl -X PATCH http://localhost:3000/api/respuestas-autoevaluacion/<id> \
  -H "Authorization: Bearer <token-psico>" \
  -H "Content-Type: application/json" \
  -d '{
    "puntaje_manual": 9,
    "comentarios_evaluador": "Excelente descripción de estrategias"
  }'
```

**Efecto:** Trigger actualiza las estrellas del voluntario en área `lenguaje`

#### 6. Voluntario consulta sus nuevas estrellas
```bash
curl -X GET http://localhost:3000/api/voluntarios/habilidades \
  -H "Authorization: Bearer <token-voluntario>"
```

**Response:** Área `lenguaje` ahora tiene estrellas actualizadas según puntaje_total

---

### Crear Plantilla con Preguntas Mixtas

```bash
curl -X POST http://localhost:3000/api/plantillas-autoevaluacion \
  -H "Authorization: Bearer <token-admin>" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Autoevaluación Completa de Grafismo",
    "area": "grafismo",
    "descripcion": "Evaluación integral de habilidades grafomotoras",
    "preguntas": [
      {
        "id": "g1",
        "tipo": "escala",
        "pregunta": "¿Cómo calificás tu habilidad para enseñar el agarre del lápiz?",
        "escala_min": 1,
        "escala_max": 10,
        "puntaje_maximo": 10
      },
      {
        "id": "g2",
        "tipo": "multiple_choice",
        "pregunta": "¿Conocés ejercicios de pre-escritura?",
        "opciones": ["No", "Pocos", "Varios", "Muchos"],
        "puntaje_por_opcion": [2, 5, 7, 10]
      },
      {
        "id": "g3",
        "tipo": "texto_abierto",
        "pregunta": "Describí 3 ejercicios para mejorar motricidad fina",
        "min_caracteres": 150,
        "requiere_revision": true
      }
    ],
    "puntaje_maximo": 10
  }'
```

---

## Notas Técnicas

### Sistema de Triggers

El sistema usa triggers de PostgreSQL para actualizar automáticamente las estrellas:

```sql
-- Trigger: actualizar_estrellas_autoevaluacion
-- Se ejecuta AFTER UPDATE cuando estado cambia a 'evaluada'
-- Efecto: Actualiza voluntarios_habilidades con el puntaje_total
```

**Comportamiento:**
- Si es la primera evaluación del área: `estrellas = puntaje_total`
- Si ya tenía estrellas: `estrellas = (estrellas_anterior + puntaje_total) / 2`

### Escala de Estrellas

- **Rango:** 0 a 10 (permite decimales, ej: 7.5)
- **Interpretación:**
  - 8-10: Fuerte
  - 5-7: Medio
  - 1-4: Inicial
  - 0: Sin evaluar

### Row Level Security (RLS)

Las tablas tienen políticas RLS configuradas:

**Plantillas:**
- Lectura: Todos ven plantillas activas
- Escritura: Solo director/psico/coordinador

**Respuestas:**
- Lectura: Voluntarios ven solo las suyas, staff ve todas
- Escritura: Voluntarios solo pueden crear (POST), staff puede evaluar (PATCH)

---

## Changelog

### v1.0.0 (2026-01-25)
- ✨ Sistema de autoevaluaciones configurables
- ✨ 3 tipos de preguntas: escala, multiple choice, texto abierto
- ✨ Cálculo automático de puntajes
- ✨ Evaluación manual para preguntas abiertas
- ✨ Actualización automática de estrellas mediante triggers
- ✨ Migración de escala 1-5 a 1-10

---

## Soporte

**Repositorio:** [GitHub - plataformaAPA](https://github.com/...)  
**Documentación adicional:** Ver `/docs` en el repositorio  
**Issues:** Reportar en GitHub Issues
