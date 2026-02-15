# Esquema de Base de Datos - Plataforma APA

**Fecha de inspección:** 10/2/2026, 04:10:24

🔍 Inspeccionando Base de Datos de Supabase

================================================================================


================================================================================
📊 TABLA: NINOS
================================================================================

📈 Total de registros: 5

📋 Columnas detectadas (36):

     id                             | Tipo: string
     alias                          | Tipo: string
     rango_etario                   | Tipo: string
     nivel_alfabetizacion           | Tipo: string
     escolarizado                   | Tipo: boolean
     metadata                       | Tipo: object
     zona_id                        | Tipo: null
     created_at                     | Tipo: string
     updated_at                     | Tipo: string
     plan_intervencion_activo_id    | Tipo: null
  🔒 nombre_completo                | Tipo: null
  🔒 fecha_nacimiento               | Tipo: null
     legajo                         | Tipo: string
     contexto_familiar              | Tipo: object
     alimentacion                   | Tipo: object
     escolaridad                    | Tipo: object
     salud                          | Tipo: object
     entrevista_inicial             | Tipo: object
     ingresado_por                  | Tipo: null
     fecha_ingreso                  | Tipo: string
     pronostico_inicial             | Tipo: null
     foto_perfil_url                | Tipo: null
     escuela                        | Tipo: null
     grado                          | Tipo: null
     permanece_escuela              | Tipo: boolean
     asiste_terapia                 | Tipo: boolean
     tipo_terapia                   | Tipo: null
     datos_padre                    | Tipo: object
     datos_madre                    | Tipo: object
     referente_escolar              | Tipo: object
     notas_perfil                   | Tipo: null
     asistencia_total               | Tipo: number
     asistencia_presente            | Tipo: number
     requiere_atencion_especial     | Tipo: boolean
     tipo_atencion_requerida        | Tipo: null
     genero                         | Tipo: null

================================================================================
📊 TABLA: NINOS_SENSIBLES
================================================================================

📈 Total de registros: 0

⚠️  Tabla vacía - no se pudo detectar estructura

================================================================================
📊 TABLA: PERFILES
================================================================================

📈 Total de registros: 19

📋 Columnas detectadas (11):

     id                             | Tipo: string
     rol                            | Tipo: string
     zona_id                        | Tipo: string
     metadata                       | Tipo: object
     created_at                     | Tipo: string
     updated_at                     | Tipo: string
     foto_perfil_url                | Tipo: null
     estudios                       | Tipo: object
     fecha_ingreso                  | Tipo: null
     max_ninos_asignados            | Tipo: number
     ultima_conexion                | Tipo: null

================================================================================
📊 TABLA: SESIONES
================================================================================

📈 Total de registros: 21

📋 Columnas detectadas (12):

     id                             | Tipo: string
     nino_id                        | Tipo: string
     voluntario_id                  | Tipo: string
     fecha                          | Tipo: string
     duracion_minutos               | Tipo: number
     items                          | Tipo: object
     observaciones_libres           | Tipo: string
     created_offline                | Tipo: boolean
     sincronizado_at                | Tipo: null
     created_at                     | Tipo: string
     updated_at                     | Tipo: string
     items_no_completados           | Tipo: object

================================================================================
📊 TABLA: ZONAS
================================================================================

📈 Total de registros: 4

📋 Columnas detectadas (8):

     id                             | Tipo: string
  🔒 nombre                         | Tipo: string
     created_at                     | Tipo: string
     updated_at                     | Tipo: string
     descripcion                    | Tipo: string
     coordinador_id                 | Tipo: null
     activa                         | Tipo: boolean
     metadata                       | Tipo: object

================================================================================
📊 TABLA: ASIGNACIONES
================================================================================

📈 Total de registros: 0

⚠️  Tabla vacía - no se pudo detectar estructura

================================================================================
📊 TABLA: HISTORIAL_CAMBIOS
================================================================================

📈 Total de registros: 0

⚠️  Tabla vacía - no se pudo detectar estructura

================================================================================
📊 TABLA: TUTORES
================================================================================
❌ Error: Could not find the table 'public.tutores' in the schema cache


================================================================================
📊 TABLA: ESCUELAS
================================================================================

📈 Total de registros: 0

⚠️  Tabla vacía - no se pudo detectar estructura

================================================================================
📊 TABLA: GRABACIONES_VOZ
================================================================================
❌ Error: Could not find the table 'public.grabaciones_voz' in the schema cache


================================================================================
📊 TABLA: CAPACITACIONES
================================================================================

📈 Total de registros: 7

📋 Columnas detectadas (13):

     id                             | Tipo: string
     titulo                         | Tipo: string
     descripcion                    | Tipo: string
     area                           | Tipo: string
     tipo                           | Tipo: string
     puntaje_otorgado               | Tipo: number
     contenido                      | Tipo: string
     evaluacion                     | Tipo: null
     duracion_estimada              | Tipo: number
     creado_por                     | Tipo: null
     fecha_creacion                 | Tipo: string
     activo                         | Tipo: boolean
     metadata                       | Tipo: object

================================================================================
📊 TABLA: VOLUNTARIOS_CAPACITACIONES
================================================================================

📈 Total de registros: 0

⚠️  Tabla vacía - no se pudo detectar estructura

================================================================================
📊 TABLA: FEEDBACK
================================================================================
❌ Error: Could not find the table 'public.feedback' in the schema cache


================================================================================
📊 TABLA: PLANTILLAS_AUTOEVALUACION
================================================================================

📈 Total de registros: 1

📋 Columnas detectadas (12):

     id                             | Tipo: string
     titulo                         | Tipo: string
     area                           | Tipo: string
     descripcion                    | Tipo: string
     preguntas                      | Tipo: object
     puntaje_maximo                 | Tipo: number
     requiere_revision              | Tipo: boolean
     activo                         | Tipo: boolean
     creado_por                     | Tipo: null
     fecha_creacion                 | Tipo: string
     ultima_modificacion            | Tipo: string
     metadata                       | Tipo: object

================================================================================
📊 TABLA: RESPUESTAS_AUTOEVALUACION
================================================================================

📈 Total de registros: 4

📋 Columnas detectadas (13):

     id                             | Tipo: string
     voluntario_id                  | Tipo: string
     plantilla_id                   | Tipo: string
     respuestas                     | Tipo: object
     puntaje_automatico             | Tipo: number
     puntaje_manual                 | Tipo: null
     puntaje_total                  | Tipo: null
     estado                         | Tipo: string
     fecha_completada               | Tipo: string
     evaluado_por                   | Tipo: null
     fecha_evaluacion               | Tipo: null
     comentarios_evaluador          | Tipo: null
     metadata                       | Tipo: object

================================================================================
✅ Inspección completada
================================================================================
