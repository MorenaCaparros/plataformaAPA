# APIs del Sistema de Capacitaciones y Matching

## 📚 Capacitaciones

### `GET /api/capacitaciones`
Lista todas las capacitaciones activas con filtros opcionales.

**Query params:**
- `area`: `lenguaje` | `grafismo` | `lectura_escritura` | `matematicas` | `general`
- `tipo`: `presencial` | `online` | `autoevaluacion` | `material`
- `id`: UUID de capacitación específica

**Response:**
```json
{
  "capacitaciones": [
    {
      "id": "uuid",
      "titulo": "Fundamentos de Alfabetización Inicial",
      "descripcion": "...",
      "area": "lectura_escritura",
      "tipo": "online",
      "puntaje_otorgado": 4,
      "duracion_estimada": 120,
      "contenido": "..."
    }
  ]
}
```

### `POST /api/capacitaciones`
Crear nueva capacitación (requiere rol: director/TS/coordinador/psico).

**Body:**
```json
{
  "titulo": "Matemática Lúdica",
  "descripcion": "Cómo enseñar matemáticas a través del juego",
  "area": "matematicas",
  "tipo": "presencial",
  "puntaje_otorgado": 3,
  "duracion_estimada": 90,
  "contenido": "Material del taller...",
  "evaluacion": [
    {
      "pregunta": "¿Qué es la conciencia fonológica?",
      "opciones": ["A", "B", "C"],
      "respuesta_correcta": "B"
    }
  ]
}
```

### `PUT /api/capacitaciones`
Actualizar capacitación (solo el creador).

### `DELETE /api/capacitaciones?id=uuid`
Desactivar capacitación.

---

## 🎓 Capacitaciones del Voluntario

### `GET /api/voluntarios/capacitaciones`
Ver capacitaciones del voluntario (propias o de otro si tienes permisos).

**Query params:**
- `voluntario_id`: UUID (opcional, por defecto el usuario actual)
- `estado`: `pendiente` | `en_curso` | `completada` | `no_aprobada`

**Response:**
```json
{
  "capacitaciones": [
    {
      "id": "uuid",
      "estado": "completada",
      "fecha_asignacion": "2025-01-15T10:00:00Z",
      "fecha_completada": "2025-01-20T15:30:00Z",
      "puntaje_obtenido": 4,
      "capacitacion": {
        "titulo": "Desarrollo del Lenguaje Oral",
        "area": "lenguaje",
        "puntaje_otorgado": 5
      }
    }
  ],
  "estadisticas": {
    "pendientes": 2,
    "en_curso": 1,
    "completadas": 5,
    "no_aprobadas": 0,
    "total": 8
  }
}
```

### `POST /api/voluntarios/capacitaciones`
Asignar capacitación a voluntario (requiere rol superior).

**Body:**
```json
{
  "voluntario_id": "uuid",
  "capacitacion_id": "uuid",
  "notas": "Prioridad alta"
}
```

### `PATCH /api/voluntarios/capacitaciones`
Actualizar estado de capacitación (el voluntario o roles superiores).

**Body:**
```json
{
  "id": "uuid",
  "estado": "completada",
  "puntaje_obtenido": 4,
  "respuestas": {...},
  "notas": "Excelente desempeño"
}
```

---

## ⭐ Habilidades del Voluntario

### `GET /api/voluntarios/habilidades`
Ver estrellas y habilidades por área.

**Query params:**
- `voluntario_id`: UUID (opcional)

**Response:**
```json
{
  "habilidades": [
    {
      "area": "lenguaje",
      "estrellas": 4.5,
      "capacitaciones_completadas": 3,
      "sesiones_realizadas": 12,
      "ultima_actualizacion": "2025-01-20T10:00:00Z"
    },
    {
      "area": "grafismo",
      "estrellas": 3.0,
      "capacitaciones_completadas": 2,
      "sesiones_realizadas": 8
    }
  ],
  "promedio": 3.8,
  "total_capacitaciones": 5,
  "total_sesiones": 20
}
```

### `PATCH /api/voluntarios/habilidades`
Actualizar habilidades manualmente (solo coordinador/psico).

**Body:**
```json
{
  "voluntario_id": "uuid",
  "area": "lectura_escritura",
  "estrellas": 4.5,
  "notas": "Evaluación manual tras observación"
}
```

---

## 🔗 Matching y Asignaciones

### `GET /api/matching/sugerencias`
Obtener mejores voluntarios para un niño.

**Query params:**
- `nino_id`: UUID (requerido)
- `limite`: number (default: 5)

**Response:**
```json
{
  "nino": {
    "id": "uuid",
    "alias": "Niño A",
    "rango_etario": "8-10"
  },
  "sugerencias": [
    {
      "voluntario_id": "uuid",
      "voluntario_nombre": "Ana López",
      "zona": "Barrio Norte",
      "score_matching": 52.5,
      "ninos_actuales": 2,
      "habilidades": [
        { "area": "lenguaje", "estrellas": 5.0 },
        { "area": "lectura_escritura", "estrellas": 4.0 }
      ]
    }
  ],
  "total": 5
}
```

### `GET /api/asignaciones`
Listar asignaciones voluntario-niño.

**Query params:**
- `voluntario_id`: UUID (opcional)
- `nino_id`: UUID (opcional)
- `activo`: boolean (default: true)

**Response:**
```json
{
  "asignaciones": [
    {
      "id": "uuid",
      "voluntario_id": "uuid",
      "nino_id": "uuid",
      "fecha_asignacion": "2025-01-10T10:00:00Z",
      "activo": true,
      "score_matching": 48.5,
      "areas_foco": ["lenguaje", "lectura_escritura"],
      "voluntario": {
        "metadata": {
          "nombre": "Carlos",
          "apellido": "Gómez"
        }
      },
      "nino": {
        "alias": "Niño B",
        "rango_etario": "8-10"
      }
    }
  ],
  "total": 1
}
```

### `POST /api/asignaciones`
Crear asignación voluntario-niño (requiere coordinador/psico/director).

**Body:**
```json
{
  "voluntario_id": "uuid",
  "nino_id": "uuid",
  "areas_foco": ["lenguaje", "grafismo"],
  "notas": "Match sugerido por algoritmo"
}
```

### `PATCH /api/asignaciones`
Actualizar o finalizar asignación.

**Body:**
```json
{
  "id": "uuid",
  "activo": false,
  "notas": "Finalizado por graduación del niño"
}
```

### `DELETE /api/asignaciones?id=uuid`
Eliminar asignación (solo director).

---

## 🔐 Autenticación

Todas las APIs requieren autenticación mediante Bearer token:

```typescript
const token = supabase.auth.session()?.access_token;

fetch('/api/capacitaciones', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🚀 Ejemplos de Uso

### 1. Voluntario completa una capacitación

```typescript
// Voluntario inicia capacitación
await fetch('/api/voluntarios/capacitaciones', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'capacitacion-asignacion-id',
    estado: 'en_curso'
  })
});

// Voluntario completa capacitación
await fetch('/api/voluntarios/capacitaciones', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'capacitacion-asignacion-id',
    estado: 'completada',
    puntaje_obtenido: 4
  })
});

// ✅ Trigger automático actualiza sus estrellas en voluntarios_habilidades
```

### 2. Coordinador asigna voluntario a niño basado en sugerencias

```typescript
// 1. Obtener sugerencias
const sugerencias = await fetch(
  `/api/matching/sugerencias?nino_id=${ninoId}&limite=5`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
).then(r => r.json());

// 2. Mostrar mejores matches al coordinador
console.log(sugerencias.sugerencias[0]); // Mejor match

// 3. Crear asignación
await fetch('/api/asignaciones', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    voluntario_id: sugerencias.sugerencias[0].voluntario_id,
    nino_id: ninoId,
    areas_foco: ['lenguaje', 'lectura_escritura']
  })
});
```

### 3. Ver dashboard del voluntario

```typescript
// Obtener capacitaciones
const { capacitaciones, estadisticas } = await fetch(
  '/api/voluntarios/capacitaciones',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
).then(r => r.json());

// Obtener habilidades/estrellas
const { habilidades, promedio } = await fetch(
  '/api/voluntarios/habilidades',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
).then(r => r.json());

// Obtener niños asignados
const { asignaciones } = await fetch(
  '/api/asignaciones',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
).then(r => r.json());
```

---

## ✅ Flujo Completo del Sistema

```
1. Admin crea capacitación
   POST /api/capacitaciones

2. Coordinador asigna capacitación a voluntario
   POST /api/voluntarios/capacitaciones

3. Voluntario ve capacitación pendiente
   GET /api/voluntarios/capacitaciones?estado=pendiente

4. Voluntario inicia capacitación
   PATCH /api/voluntarios/capacitaciones {estado: "en_curso"}

5. Voluntario completa capacitación
   PATCH /api/voluntarios/capacitaciones {estado: "completada", puntaje_obtenido: 4}

6. ✨ TRIGGER AUTOMÁTICO actualiza estrellas
   → voluntarios_habilidades.estrellas += puntaje

7. Coordinador busca voluntario para niño
   GET /api/matching/sugerencias?nino_id=xxx

8. Sistema sugiere mejores matches (basado en estrellas vs déficits del niño)

9. Coordinador asigna voluntario a niño
   POST /api/asignaciones

10. Voluntario ve sus niños asignados
    GET /api/asignaciones
```

---

## 📊 Algoritmo de Matching

```
Score = Σ (estrellas_voluntario × prioridad_deficit_niño)

Prioridad según evaluación:
- "Presenta dificultad" = 5 puntos
- "En proceso" = 3 puntos
- "Logrado" = 0 puntos

Bonus por disponibilidad:
- < 2 niños asignados: +20%
- ≥ 3 niños asignados: -30%

Ejemplo:
Niño con déficit en Lenguaje (5) y Grafismo (5)
Voluntario con ⭐⭐⭐⭐⭐ Lenguaje y ⭐⭐⭐⭐ Grafismo
Score = (5 × 5) + (4 × 5) = 45 puntos
```
