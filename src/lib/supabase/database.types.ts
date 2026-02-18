export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      actividades_plan: {
        Row: {
          areas: string[] | null
          completada: boolean | null
          created_at: string | null
          descripcion: string
          duracion_minutos: number | null
          fecha_completada: string | null
          id: string
          indicadores_exito: string[] | null
          instrucciones: string
          materiales: string[] | null
          objetivos: string[] | null
          plan_id: string
          resultado: string | null
          semana: number
          titulo: string
          updated_at: string | null
        }
        Insert: {
          areas?: string[] | null
          completada?: boolean | null
          created_at?: string | null
          descripcion: string
          duracion_minutos?: number | null
          fecha_completada?: string | null
          id?: string
          indicadores_exito?: string[] | null
          instrucciones: string
          materiales?: string[] | null
          objetivos?: string[] | null
          plan_id: string
          resultado?: string | null
          semana: number
          titulo: string
          updated_at?: string | null
        }
        Update: {
          areas?: string[] | null
          completada?: boolean | null
          created_at?: string | null
          descripcion?: string
          duracion_minutos?: number | null
          fecha_completada?: string | null
          id?: string
          indicadores_exito?: string[] | null
          instrucciones?: string
          materiales?: string[] | null
          objetivos?: string[] | null
          plan_id?: string
          resultado?: string | null
          semana?: number
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actividades_plan_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_intervencion"
            referencedColumns: ["id"]
          },
        ]
      }
      actividades_planificadas: {
        Row: {
          actividad: string | null
          completada: boolean | null
          created_at: string | null
          fecha_prevista: string | null
          fecha_realizada: string | null
          id: string
          numero_encuentro: number
          objetivo_especifico: string | null
          observaciones: string | null
          plan_id: string | null
          updated_at: string | null
        }
        Insert: {
          actividad?: string | null
          completada?: boolean | null
          created_at?: string | null
          fecha_prevista?: string | null
          fecha_realizada?: string | null
          id?: string
          numero_encuentro: number
          objetivo_especifico?: string | null
          observaciones?: string | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actividad?: string | null
          completada?: boolean | null
          created_at?: string | null
          fecha_prevista?: string | null
          fecha_realizada?: string | null
          id?: string
          numero_encuentro?: number
          objetivo_especifico?: string | null
          observaciones?: string | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alertas_sociales: {
        Row: {
          acciones_tomadas: string | null
          created_at: string | null
          derivado_a: string | null
          descripcion: string
          estado: string | null
          fecha_alerta: string
          fecha_resolucion: string | null
          gravedad: string
          id: string
          nino_id: string
          tipo_alerta: string
          trabajadora_social_id: string
          updated_at: string | null
        }
        Insert: {
          acciones_tomadas?: string | null
          created_at?: string | null
          derivado_a?: string | null
          descripcion: string
          estado?: string | null
          fecha_alerta?: string
          fecha_resolucion?: string | null
          gravedad: string
          id?: string
          nino_id: string
          tipo_alerta: string
          trabajadora_social_id: string
          updated_at?: string | null
        }
        Update: {
          acciones_tomadas?: string | null
          created_at?: string | null
          derivado_a?: string | null
          descripcion?: string
          estado?: string | null
          fecha_alerta?: string
          fecha_resolucion?: string | null
          gravedad?: string
          id?: string
          nino_id?: string
          tipo_alerta?: string
          trabajadora_social_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_sociales_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_sociales_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "alertas_sociales_trabajadora_social_id_fkey"
            columns: ["trabajadora_social_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_sociales_trabajadora_social_id_fkey"
            columns: ["trabajadora_social_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      areas_evaluacion: {
        Row: {
          activa: boolean | null
          color: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          id: string
          nombre: string
          orden: number | null
        }
        Insert: {
          activa?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number | null
        }
        Update: {
          activa?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_evaluacion_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_evaluacion_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      asignaciones: {
        Row: {
          activo: boolean
          asignado_por: string | null
          created_at: string
          fecha_asignacion: string
          fecha_finalizacion: string | null
          id: string
          nino_id: string
          notas: string | null
          score_matching: number | null
          updated_at: string
          voluntario_id: string
        }
        Insert: {
          activo?: boolean
          asignado_por?: string | null
          created_at?: string
          fecha_asignacion?: string
          fecha_finalizacion?: string | null
          id?: string
          nino_id: string
          notas?: string | null
          score_matching?: number | null
          updated_at?: string
          voluntario_id: string
        }
        Update: {
          activo?: boolean
          asignado_por?: string | null
          created_at?: string
          fecha_asignacion?: string
          fecha_finalizacion?: string | null
          id?: string
          nino_id?: string
          notas?: string | null
          score_matching?: number | null
          updated_at?: string
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
          {
            foreignKeyName: "asignaciones_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "asignaciones_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      asignaciones_voluntarios: {
        Row: {
          activo: boolean | null
          areas_foco: Json | null
          asignado_por: string | null
          fecha_asignacion: string | null
          fecha_finalizacion: string | null
          id: string
          metadata: Json | null
          nino_id: string
          notas: string | null
          score_matching: number | null
          voluntario_id: string
        }
        Insert: {
          activo?: boolean | null
          areas_foco?: Json | null
          asignado_por?: string | null
          fecha_asignacion?: string | null
          fecha_finalizacion?: string | null
          id?: string
          metadata?: Json | null
          nino_id: string
          notas?: string | null
          score_matching?: number | null
          voluntario_id: string
        }
        Update: {
          activo?: boolean | null
          areas_foco?: Json | null
          asignado_por?: string | null
          fecha_asignacion?: string | null
          fecha_finalizacion?: string | null
          id?: string
          metadata?: Json | null
          nino_id?: string
          notas?: string | null
          score_matching?: number | null
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_voluntarios_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_voluntarios_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "asignaciones_voluntarios_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_voluntarios_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      capacitaciones: {
        Row: {
          activo: boolean | null
          area: string
          contenido: string | null
          creado_por: string | null
          descripcion: string | null
          duracion_estimada: number | null
          evaluacion: Json | null
          fecha_creacion: string | null
          id: string
          metadata: Json | null
          puntaje_otorgado: number
          tipo: string
          titulo: string
        }
        Insert: {
          activo?: boolean | null
          area: string
          contenido?: string | null
          creado_por?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          evaluacion?: Json | null
          fecha_creacion?: string | null
          id?: string
          metadata?: Json | null
          puntaje_otorgado: number
          tipo: string
          titulo: string
        }
        Update: {
          activo?: boolean | null
          area?: string
          contenido?: string | null
          creado_por?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          evaluacion?: Json | null
          fecha_creacion?: string | null
          id?: string
          metadata?: Json | null
          puntaje_otorgado?: number
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number | null
          chunk_text: string
          created_at: string
          documento_id: string
          embedding: string | null
          id: string
          metadata: Json
        }
        Insert: {
          chunk_index?: number | null
          chunk_text: string
          created_at?: string
          documento_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          chunk_index?: number | null
          chunk_text?: string
          created_at?: string
          documento_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          autor: string | null
          contenido: string | null
          id: string
          metadata: Json
          storage_path: string | null
          subido_at: string
          subido_por: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          autor?: string | null
          contenido?: string | null
          id?: string
          metadata?: Json
          storage_path?: string | null
          subido_at?: string
          subido_por?: string | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          autor?: string | null
          contenido?: string | null
          id?: string
          metadata?: Json
          storage_path?: string | null
          subido_at?: string
          subido_por?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      entrevistas_familiares: {
        Row: {
          acciones_pendientes: string[] | null
          alimentacion_actual: string | null
          alimentacion_embarazo: string | null
          asiste_escuela: boolean | null
          asistencia_regular: boolean | null
          audio_entrevista_url: string | null
          audio_transcription: string | null
          calidad_alimentacion: string | null
          comidas_diarias: number | null
          complicaciones_embarazo: string | null
          composicion_familiar: Json | null
          controles_prenatales: boolean | null
          controles_salud_regulares: boolean | null
          created_at: string | null
          created_offline: boolean | null
          cual_obra_social: string | null
          derivaciones_sugeridas: string[] | null
          diagnosticos_previos: string[] | null
          dificultades_escolares: string | null
          fecha_entrevista: string
          grado_actual: string | null
          id: string
          lugar_entrevista: string
          medicacion_actual: string | null
          nino_id: string
          nombre_escuela: string | null
          notas_alimentacion: string | null
          obra_social: boolean | null
          observaciones_trabajadora_social: string
          participacion_comunitaria: string | null
          personas_presentes: Json | null
          prioridad_atencion: string | null
          proxima_visita: string | null
          red_apoyo_familiar: string | null
          relacion_hermanos: string | null
          relacion_padres: string | null
          sincronizado_at: string | null
          situacion_economica: Json | null
          situacion_riesgo: boolean | null
          tipo_entrevista: string | null
          tipo_riesgo: string[] | null
          trabajadora_social_id: string
          updated_at: string | null
          vivienda: Json | null
        }
        Insert: {
          acciones_pendientes?: string[] | null
          alimentacion_actual?: string | null
          alimentacion_embarazo?: string | null
          asiste_escuela?: boolean | null
          asistencia_regular?: boolean | null
          audio_entrevista_url?: string | null
          audio_transcription?: string | null
          calidad_alimentacion?: string | null
          comidas_diarias?: number | null
          complicaciones_embarazo?: string | null
          composicion_familiar?: Json | null
          controles_prenatales?: boolean | null
          controles_salud_regulares?: boolean | null
          created_at?: string | null
          created_offline?: boolean | null
          cual_obra_social?: string | null
          derivaciones_sugeridas?: string[] | null
          diagnosticos_previos?: string[] | null
          dificultades_escolares?: string | null
          fecha_entrevista?: string
          grado_actual?: string | null
          id?: string
          lugar_entrevista: string
          medicacion_actual?: string | null
          nino_id: string
          nombre_escuela?: string | null
          notas_alimentacion?: string | null
          obra_social?: boolean | null
          observaciones_trabajadora_social: string
          participacion_comunitaria?: string | null
          personas_presentes?: Json | null
          prioridad_atencion?: string | null
          proxima_visita?: string | null
          red_apoyo_familiar?: string | null
          relacion_hermanos?: string | null
          relacion_padres?: string | null
          sincronizado_at?: string | null
          situacion_economica?: Json | null
          situacion_riesgo?: boolean | null
          tipo_entrevista?: string | null
          tipo_riesgo?: string[] | null
          trabajadora_social_id: string
          updated_at?: string | null
          vivienda?: Json | null
        }
        Update: {
          acciones_pendientes?: string[] | null
          alimentacion_actual?: string | null
          alimentacion_embarazo?: string | null
          asiste_escuela?: boolean | null
          asistencia_regular?: boolean | null
          audio_entrevista_url?: string | null
          audio_transcription?: string | null
          calidad_alimentacion?: string | null
          comidas_diarias?: number | null
          complicaciones_embarazo?: string | null
          composicion_familiar?: Json | null
          controles_prenatales?: boolean | null
          controles_salud_regulares?: boolean | null
          created_at?: string | null
          created_offline?: boolean | null
          cual_obra_social?: string | null
          derivaciones_sugeridas?: string[] | null
          diagnosticos_previos?: string[] | null
          dificultades_escolares?: string | null
          fecha_entrevista?: string
          grado_actual?: string | null
          id?: string
          lugar_entrevista?: string
          medicacion_actual?: string | null
          nino_id?: string
          nombre_escuela?: string | null
          notas_alimentacion?: string | null
          obra_social?: boolean | null
          observaciones_trabajadora_social?: string
          participacion_comunitaria?: string | null
          personas_presentes?: Json | null
          prioridad_atencion?: string | null
          proxima_visita?: string | null
          red_apoyo_familiar?: string | null
          relacion_hermanos?: string | null
          relacion_padres?: string | null
          sincronizado_at?: string | null
          situacion_economica?: Json | null
          situacion_riesgo?: boolean | null
          tipo_entrevista?: string | null
          tipo_riesgo?: string[] | null
          trabajadora_social_id?: string
          updated_at?: string | null
          vivienda?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "entrevistas_familiares_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrevistas_familiares_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "entrevistas_familiares_trabajadora_social_id_fkey"
            columns: ["trabajadora_social_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrevistas_familiares_trabajadora_social_id_fkey"
            columns: ["trabajadora_social_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          created_at: string | null
          fecha: string
          id: string
          nino_id: string | null
          numero_encuentro: number | null
          observaciones_generales: string | null
          psicopedagoga_id: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fecha: string
          id?: string
          nino_id?: string | null
          numero_encuentro?: number | null
          observaciones_generales?: string | null
          psicopedagoga_id?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: string
          nino_id?: string | null
          numero_encuentro?: number | null
          observaciones_generales?: string | null
          psicopedagoga_id?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "evaluaciones_psicopedagoga_id_fkey"
            columns: ["psicopedagoga_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_psicopedagoga_id_fkey"
            columns: ["psicopedagoga_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      evaluaciones_iniciales: {
        Row: {
          agarre_lapiz: string | null
          comprension_lectora: number | null
          comprension_ordenes: number | null
          conteo: number | null
          created_at: string | null
          dificultades_identificadas: string[] | null
          escritura_nombre: number | null
          escritura_oraciones: number | null
          escritura_palabras: number | null
          fecha_evaluacion: string
          formacion_oraciones: number | null
          fortalezas: string[] | null
          id: string
          identificacion_objetos: number | null
          identificacion_silabas: number | null
          lectura_palabras: number | null
          lectura_textos: number | null
          nino_id: string
          nivel_alfabetizacion: string
          notas_grafismo: string | null
          notas_lectoescritura: string | null
          notas_lenguaje: string | null
          notas_matematicas: string | null
          observaciones_generales: string
          pronunciacion: number | null
          psicopedagoga_id: string
          razonamiento_logico: number | null
          recomendaciones: string
          reconocimiento_consonantes: number | null
          reconocimiento_numeros: number | null
          reconocimiento_vocales: number | null
          representacion_figuras: number | null
          resta_basica: number | null
          suma_basica: number | null
          tipo_trazo: string | null
          updated_at: string | null
        }
        Insert: {
          agarre_lapiz?: string | null
          comprension_lectora?: number | null
          comprension_ordenes?: number | null
          conteo?: number | null
          created_at?: string | null
          dificultades_identificadas?: string[] | null
          escritura_nombre?: number | null
          escritura_oraciones?: number | null
          escritura_palabras?: number | null
          fecha_evaluacion?: string
          formacion_oraciones?: number | null
          fortalezas?: string[] | null
          id?: string
          identificacion_objetos?: number | null
          identificacion_silabas?: number | null
          lectura_palabras?: number | null
          lectura_textos?: number | null
          nino_id: string
          nivel_alfabetizacion: string
          notas_grafismo?: string | null
          notas_lectoescritura?: string | null
          notas_lenguaje?: string | null
          notas_matematicas?: string | null
          observaciones_generales: string
          pronunciacion?: number | null
          psicopedagoga_id: string
          razonamiento_logico?: number | null
          recomendaciones: string
          reconocimiento_consonantes?: number | null
          reconocimiento_numeros?: number | null
          reconocimiento_vocales?: number | null
          representacion_figuras?: number | null
          resta_basica?: number | null
          suma_basica?: number | null
          tipo_trazo?: string | null
          updated_at?: string | null
        }
        Update: {
          agarre_lapiz?: string | null
          comprension_lectora?: number | null
          comprension_ordenes?: number | null
          conteo?: number | null
          created_at?: string | null
          dificultades_identificadas?: string[] | null
          escritura_nombre?: number | null
          escritura_oraciones?: number | null
          escritura_palabras?: number | null
          fecha_evaluacion?: string
          formacion_oraciones?: number | null
          fortalezas?: string[] | null
          id?: string
          identificacion_objetos?: number | null
          identificacion_silabas?: number | null
          lectura_palabras?: number | null
          lectura_textos?: number | null
          nino_id?: string
          nivel_alfabetizacion?: string
          notas_grafismo?: string | null
          notas_lectoescritura?: string | null
          notas_lenguaje?: string | null
          notas_matematicas?: string | null
          observaciones_generales?: string
          pronunciacion?: number | null
          psicopedagoga_id?: string
          razonamiento_logico?: number | null
          recomendaciones?: string
          reconocimiento_consonantes?: number | null
          reconocimiento_numeros?: number | null
          reconocimiento_vocales?: number | null
          representacion_figuras?: number | null
          resta_basica?: number | null
          suma_basica?: number | null
          tipo_trazo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_iniciales_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_iniciales_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "evaluaciones_iniciales_psicopedagoga_id_fkey"
            columns: ["psicopedagoga_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_iniciales_psicopedagoga_id_fkey"
            columns: ["psicopedagoga_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      habilidades: {
        Row: {
          activa: boolean | null
          area_id: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          escalas: Json
          id: string
          nombre: string
          orden: number | null
        }
        Insert: {
          activa?: boolean | null
          area_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          escalas?: Json
          id?: string
          nombre: string
          orden?: number | null
        }
        Update: {
          activa?: boolean | null
          area_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          escalas?: Json
          id?: string
          nombre?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habilidades_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habilidades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habilidades_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      historial_cambios: {
        Row: {
          accion: string
          cambios: Json
          created_at: string | null
          id: string
          ip_address: unknown
          registro_id: string | null
          tabla_afectada: string
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          cambios: Json
          created_at?: string | null
          id?: string
          ip_address?: unknown
          registro_id?: string | null
          tabla_afectada: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          cambios?: Json
          created_at?: string | null
          id?: string
          ip_address?: unknown
          registro_id?: string | null
          tabla_afectada?: string
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      nino_voluntarios: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nino_id: string
          voluntario_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nino_id: string
          voluntario_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nino_id?: string
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nino_voluntarios_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nino_voluntarios_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "nino_voluntarios_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nino_voluntarios_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      ninos: {
        Row: {
          alias: string
          alimentacion: Json | null
          asiste_terapia: boolean | null
          asistencia_presente: number | null
          asistencia_total: number | null
          contexto_familiar: Json | null
          created_at: string
          datos_madre: Json | null
          datos_padre: Json | null
          entrevista_inicial: Json | null
          escolaridad: Json | null
          escolarizado: boolean | null
          escuela: string | null
          fecha_ingreso: string | null
          fecha_nacimiento: string | null
          foto_perfil_url: string | null
          grado: string | null
          id: string
          ingresado_por: string | null
          legajo: string | null
          metadata: Json
          nivel_alfabetizacion: string | null
          nombre_completo: string | null
          notas_perfil: string | null
          permanece_escuela: boolean | null
          plan_intervencion_activo_id: string | null
          pronostico_inicial: string | null
          rango_etario: Database["public"]["Enums"]["rango_etario"] | null
          referente_escolar: Json | null
          salud: Json | null
          tipo_terapia: string[] | null
          updated_at: string
          zona_id: string | null
        }
        Insert: {
          alias: string
          alimentacion?: Json | null
          asiste_terapia?: boolean | null
          asistencia_presente?: number | null
          asistencia_total?: number | null
          contexto_familiar?: Json | null
          created_at?: string
          datos_madre?: Json | null
          datos_padre?: Json | null
          entrevista_inicial?: Json | null
          escolaridad?: Json | null
          escolarizado?: boolean | null
          escuela?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          foto_perfil_url?: string | null
          grado?: string | null
          id?: string
          ingresado_por?: string | null
          legajo?: string | null
          metadata?: Json
          nivel_alfabetizacion?: string | null
          nombre_completo?: string | null
          notas_perfil?: string | null
          permanece_escuela?: boolean | null
          plan_intervencion_activo_id?: string | null
          pronostico_inicial?: string | null
          rango_etario?: Database["public"]["Enums"]["rango_etario"] | null
          referente_escolar?: Json | null
          salud?: Json | null
          tipo_terapia?: string[] | null
          updated_at?: string
          zona_id?: string | null
        }
        Update: {
          alias?: string
          alimentacion?: Json | null
          asiste_terapia?: boolean | null
          asistencia_presente?: number | null
          asistencia_total?: number | null
          contexto_familiar?: Json | null
          created_at?: string
          datos_madre?: Json | null
          datos_padre?: Json | null
          entrevista_inicial?: Json | null
          escolaridad?: Json | null
          escolarizado?: boolean | null
          escuela?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          foto_perfil_url?: string | null
          grado?: string | null
          id?: string
          ingresado_por?: string | null
          legajo?: string | null
          metadata?: Json
          nivel_alfabetizacion?: string | null
          nombre_completo?: string | null
          notas_perfil?: string | null
          permanece_escuela?: boolean | null
          plan_intervencion_activo_id?: string | null
          pronostico_inicial?: string | null
          rango_etario?: Database["public"]["Enums"]["rango_etario"] | null
          referente_escolar?: Json | null
          salud?: Json | null
          tipo_terapia?: string[] | null
          updated_at?: string
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ninos_ingresado_por_fkey"
            columns: ["ingresado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ninos_ingresado_por_fkey"
            columns: ["ingresado_por"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
          {
            foreignKeyName: "ninos_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      ninos_sensibles: {
        Row: {
          created_at: string
          fecha_nacimiento_encrypted: string | null
          nino_id: string
          nombre_completo_encrypted: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha_nacimiento_encrypted?: string | null
          nino_id: string
          nombre_completo_encrypted?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha_nacimiento_encrypted?: string | null
          nino_id?: string
          nombre_completo_encrypted?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ninos_sensibles_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: true
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ninos_sensibles_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: true
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string
          estudios: Json | null
          fecha_ingreso: string | null
          foto_perfil_url: string | null
          horas_disponibles: number | null
          id: string
          max_ninos_asignados: number | null
          metadata: Json
          rol: Database["public"]["Enums"]["rol_usuario"]
          ultima_conexion: string | null
          updated_at: string
          zona_id: string | null
        }
        Insert: {
          created_at?: string
          estudios?: Json | null
          fecha_ingreso?: string | null
          foto_perfil_url?: string | null
          horas_disponibles?: number | null
          id: string
          max_ninos_asignados?: number | null
          metadata?: Json
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultima_conexion?: string | null
          updated_at?: string
          zona_id?: string | null
        }
        Update: {
          created_at?: string
          estudios?: Json | null
          fecha_ingreso?: string | null
          foto_perfil_url?: string | null
          horas_disponibles?: number | null
          id?: string
          max_ninos_asignados?: number | null
          metadata?: Json
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultima_conexion?: string | null
          updated_at?: string
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_intervencion: {
        Row: {
          actividades: Json
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          duracion_semanas: number | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          materiales_necesarios: string[] | null
          nino_id: string
          objetivo_general: string
          objetivos_especificos: string[] | null
          observaciones: string | null
          psicopedagogo_id: string
          titulo: string
          updated_at: string | null
          voluntario_asignado_id: string | null
        }
        Insert: {
          actividades?: Json
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          duracion_semanas?: number | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          materiales_necesarios?: string[] | null
          nino_id: string
          objetivo_general: string
          objetivos_especificos?: string[] | null
          observaciones?: string | null
          psicopedagogo_id: string
          titulo: string
          updated_at?: string | null
          voluntario_asignado_id?: string | null
        }
        Update: {
          actividades?: Json
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          duracion_semanas?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          materiales_necesarios?: string[] | null
          nino_id?: string
          objetivo_general?: string
          objetivos_especificos?: string[] | null
          observaciones?: string | null
          psicopedagogo_id?: string
          titulo?: string
          updated_at?: string | null
          voluntario_asignado_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planes_intervencion_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_intervencion_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "planes_intervencion_psicopedagogo_id_fkey"
            columns: ["psicopedagogo_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_intervencion_psicopedagogo_id_fkey"
            columns: ["psicopedagogo_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
          {
            foreignKeyName: "planes_intervencion_voluntario_asignado_id_fkey"
            columns: ["voluntario_asignado_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_intervencion_voluntario_asignado_id_fkey"
            columns: ["voluntario_asignado_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      plantillas_autoevaluacion: {
        Row: {
          activo: boolean | null
          area: string
          creado_por: string | null
          descripcion: string | null
          fecha_creacion: string | null
          id: string
          metadata: Json | null
          preguntas: Json
          puntaje_maximo: number
          requiere_revision: boolean | null
          titulo: string
          ultima_modificacion: string | null
        }
        Insert: {
          activo?: boolean | null
          area: string
          creado_por?: string | null
          descripcion?: string | null
          fecha_creacion?: string | null
          id?: string
          metadata?: Json | null
          preguntas: Json
          puntaje_maximo?: number
          requiere_revision?: boolean | null
          titulo: string
          ultima_modificacion?: string | null
        }
        Update: {
          activo?: boolean | null
          area?: string
          creado_por?: string | null
          descripcion?: string | null
          fecha_creacion?: string | null
          id?: string
          metadata?: Json | null
          preguntas?: Json
          puntaje_maximo?: number
          requiere_revision?: boolean | null
          titulo?: string
          ultima_modificacion?: string | null
        }
        Relationships: []
      }
      respuestas_autoevaluacion: {
        Row: {
          comentarios_evaluador: string | null
          estado: string
          evaluado_por: string | null
          fecha_completada: string | null
          fecha_evaluacion: string | null
          id: string
          metadata: Json | null
          plantilla_id: string
          puntaje_automatico: number | null
          puntaje_manual: number | null
          puntaje_total: number | null
          respuestas: Json
          voluntario_id: string
        }
        Insert: {
          comentarios_evaluador?: string | null
          estado?: string
          evaluado_por?: string | null
          fecha_completada?: string | null
          fecha_evaluacion?: string | null
          id?: string
          metadata?: Json | null
          plantilla_id: string
          puntaje_automatico?: number | null
          puntaje_manual?: number | null
          puntaje_total?: number | null
          respuestas: Json
          voluntario_id: string
        }
        Update: {
          comentarios_evaluador?: string | null
          estado?: string
          evaluado_por?: string | null
          fecha_completada?: string | null
          fecha_evaluacion?: string | null
          id?: string
          metadata?: Json | null
          plantilla_id?: string
          puntaje_automatico?: number | null
          puntaje_manual?: number | null
          puntaje_total?: number | null
          respuestas?: Json
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_autoevaluacion_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_autoevaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_autoevaluacion_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_autoevaluacion_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      resultados_evaluacion: {
        Row: {
          created_at: string | null
          evaluacion_id: string | null
          habilidad_id: string | null
          id: string
          nivel: number
          observaciones: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          evaluacion_id?: string | null
          habilidad_id?: string | null
          id?: string
          nivel: number
          observaciones?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          evaluacion_id?: string | null
          habilidad_id?: string | null
          id?: string
          nivel?: number
          observaciones?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resultados_evaluacion_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_evaluacion_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimientos_familiares: {
        Row: {
          cambios_contexto: string | null
          created_at: string | null
          created_offline: boolean | null
          cumplimiento_acuerdos: boolean | null
          entrevista_relacionada_id: string | null
          fecha_proxima_accion: string | null
          fecha_seguimiento: string
          id: string
          nino_id: string
          observaciones: string
          proxima_accion: string | null
          sincronizado_at: string | null
          situacion_actual: string
          tipo_contacto: string
          trabajadora_social_id: string
        }
        Insert: {
          cambios_contexto?: string | null
          created_at?: string | null
          created_offline?: boolean | null
          cumplimiento_acuerdos?: boolean | null
          entrevista_relacionada_id?: string | null
          fecha_proxima_accion?: string | null
          fecha_seguimiento?: string
          id?: string
          nino_id: string
          observaciones: string
          proxima_accion?: string | null
          sincronizado_at?: string | null
          situacion_actual: string
          tipo_contacto: string
          trabajadora_social_id: string
        }
        Update: {
          cambios_contexto?: string | null
          created_at?: string | null
          created_offline?: boolean | null
          cumplimiento_acuerdos?: boolean | null
          entrevista_relacionada_id?: string | null
          fecha_proxima_accion?: string | null
          fecha_seguimiento?: string
          id?: string
          nino_id?: string
          observaciones?: string
          proxima_accion?: string | null
          sincronizado_at?: string | null
          situacion_actual?: string
          tipo_contacto?: string
          trabajadora_social_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimientos_familiares_entrevista_relacionada_id_fkey"
            columns: ["entrevista_relacionada_id"]
            isOneToOne: false
            referencedRelation: "entrevistas_familiares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_familiares_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_familiares_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "seguimientos_familiares_trabajadora_social_id_fkey"
            columns: ["trabajadora_social_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_familiares_trabajadora_social_id_fkey"
            columns: ["trabajadora_social_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      seguimientos_mensuales: {
        Row: {
          ajustes_plan: string | null
          anio: number
          cambio_actividades: boolean | null
          cambio_objetivos: boolean | null
          created_at: string | null
          derivacion_a: string | null
          derivacion_necesaria: boolean | null
          dificultades_persistentes: string[] | null
          fecha_evaluacion: string
          fortalezas_observadas: string[] | null
          id: string
          mes: number
          nino_id: string
          objetivos_evaluados: Json | null
          patrones_detectados: string[] | null
          plan_intervencion_id: string
          psicopedagoga_id: string
          resumen_ia: string | null
          sesiones_analizadas: number | null
          sugerencias_ia: string[] | null
        }
        Insert: {
          ajustes_plan?: string | null
          anio: number
          cambio_actividades?: boolean | null
          cambio_objetivos?: boolean | null
          created_at?: string | null
          derivacion_a?: string | null
          derivacion_necesaria?: boolean | null
          dificultades_persistentes?: string[] | null
          fecha_evaluacion: string
          fortalezas_observadas?: string[] | null
          id?: string
          mes: number
          nino_id: string
          objetivos_evaluados?: Json | null
          patrones_detectados?: string[] | null
          plan_intervencion_id: string
          psicopedagoga_id: string
          resumen_ia?: string | null
          sesiones_analizadas?: number | null
          sugerencias_ia?: string[] | null
        }
        Update: {
          ajustes_plan?: string | null
          anio?: number
          cambio_actividades?: boolean | null
          cambio_objetivos?: boolean | null
          created_at?: string | null
          derivacion_a?: string | null
          derivacion_necesaria?: boolean | null
          dificultades_persistentes?: string[] | null
          fecha_evaluacion?: string
          fortalezas_observadas?: string[] | null
          id?: string
          mes?: number
          nino_id?: string
          objetivos_evaluados?: Json | null
          patrones_detectados?: string[] | null
          plan_intervencion_id?: string
          psicopedagoga_id?: string
          resumen_ia?: string | null
          sesiones_analizadas?: number | null
          sugerencias_ia?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "seguimientos_mensuales_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_mensuales_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "seguimientos_mensuales_psicopedagoga_id_fkey"
            columns: ["psicopedagoga_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_mensuales_psicopedagoga_id_fkey"
            columns: ["psicopedagoga_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      sesiones: {
        Row: {
          created_at: string
          created_offline: boolean
          duracion_minutos: number | null
          fecha: string
          id: string
          items: Json
          items_no_completados: string[] | null
          nino_id: string
          observaciones_libres: string | null
          sincronizado_at: string | null
          updated_at: string
          voluntario_id: string
        }
        Insert: {
          created_at?: string
          created_offline?: boolean
          duracion_minutos?: number | null
          fecha: string
          id?: string
          items?: Json
          items_no_completados?: string[] | null
          nino_id: string
          observaciones_libres?: string | null
          sincronizado_at?: string | null
          updated_at?: string
          voluntario_id: string
        }
        Update: {
          created_at?: string
          created_offline?: boolean
          duracion_minutos?: number | null
          fecha?: string
          id?: string
          items?: Json
          items_no_completados?: string[] | null
          nino_id?: string
          observaciones_libres?: string | null
          sincronizado_at?: string | null
          updated_at?: string
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "ninos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_nino_id_fkey"
            columns: ["nino_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["nino_id"]
          },
          {
            foreignKeyName: "sesiones_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      voluntarios_capacitaciones: {
        Row: {
          capacitacion_id: string
          estado: string
          evaluador_id: string | null
          fecha_asignacion: string | null
          fecha_completada: string | null
          fecha_inicio: string | null
          id: string
          metadata: Json | null
          notas: string | null
          puntaje_obtenido: number | null
          respuestas: Json | null
          voluntario_id: string
        }
        Insert: {
          capacitacion_id: string
          estado?: string
          evaluador_id?: string | null
          fecha_asignacion?: string | null
          fecha_completada?: string | null
          fecha_inicio?: string | null
          id?: string
          metadata?: Json | null
          notas?: string | null
          puntaje_obtenido?: number | null
          respuestas?: Json | null
          voluntario_id: string
        }
        Update: {
          capacitacion_id?: string
          estado?: string
          evaluador_id?: string | null
          fecha_asignacion?: string | null
          fecha_completada?: string | null
          fecha_inicio?: string | null
          id?: string
          metadata?: Json | null
          notas?: string | null
          puntaje_obtenido?: number | null
          respuestas?: Json | null
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voluntarios_capacitaciones_capacitacion_id_fkey"
            columns: ["capacitacion_id"]
            isOneToOne: false
            referencedRelation: "capacitaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voluntarios_capacitaciones_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voluntarios_capacitaciones_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      voluntarios_habilidades: {
        Row: {
          area: string
          capacitaciones_completadas: number | null
          estrellas: number
          id: string
          metadata: Json | null
          notas: string | null
          sesiones_realizadas: number | null
          ultima_actualizacion: string | null
          voluntario_id: string
        }
        Insert: {
          area: string
          capacitaciones_completadas?: number | null
          estrellas?: number
          id?: string
          metadata?: Json | null
          notas?: string | null
          sesiones_realizadas?: number | null
          ultima_actualizacion?: string | null
          voluntario_id: string
        }
        Update: {
          area?: string
          capacitaciones_completadas?: number | null
          estrellas?: number
          id?: string
          metadata?: Json | null
          notas?: string | null
          sesiones_realizadas?: number | null
          ultima_actualizacion?: string | null
          voluntario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voluntarios_habilidades_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voluntarios_habilidades_voluntario_id_fkey"
            columns: ["voluntario_id"]
            isOneToOne: false
            referencedRelation: "vista_mejores_matches"
            referencedColumns: ["voluntario_id"]
          },
        ]
      }
      zonas: {
        Row: {
          activa: boolean | null
          coordinador_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          metadata: Json | null
          nombre: string
          updated_at: string
        }
        Insert: {
          activa?: boolean | null
          coordinador_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean | null
          coordinador_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vista_mejores_matches: {
        Row: {
          alias: string | null
          carga_actual: number | null
          disponibilidad: string | null
          nino_id: string | null
          nino_zona_id: string | null
          rango_etario: Database["public"]["Enums"]["rango_etario"] | null
          score_compatibilidad: number | null
          voluntario_id: string | null
          voluntario_nombre: string | null
          zona_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ninos_zona_id_fkey"
            columns: ["nino_zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calcular_porcentaje_asistencia: {
        Args: { nino_id: string }
        Returns: number
      }
      calcular_score_matching: {
        Args: { p_nino_id: string; p_voluntario_id: string }
        Returns: number
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      current_user_zona_id: { Args: never; Returns: string }
      generar_items_observacion: { Args: never; Returns: Json }
      match_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          documento: Json
          documento_id: string
          id: string
          similitud: number
          texto: string
        }[]
      }
      obtener_progreso_area: {
        Args: { p_area_nombre: string; p_nino_id: string }
        Returns: {
          evaluacion_final: number
          evaluacion_inicial: number
          evaluacion_parcial: number
          habilidad: string
        }[]
      }
      sugerir_voluntarios_para_nino: {
        Args: { p_limite?: number; p_nino_id: string }
        Returns: {
          habilidades: Json
          ninos_actuales: number
          score_matching: number
          voluntario_id: string
          voluntario_nombre: string
          zona: string
        }[]
      }
      user_has_role: { Args: { required_roles: string[] }; Returns: boolean }
    }
    Enums: {
      rango_etario: "5-7" | "8-10" | "11-13" | "14+"
      rol_perfil:
        | "voluntario"
        | "coordinador"
        | "psicopedagogia"
        | "trabajador_social"
        | "admin"
      rol_usuario:
        | "voluntario"
        | "coordinador"
        | "psicopedagogia"
        | "admin"
        | "trabajador_social"
        | "director"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      rango_etario: ["5-7", "8-10", "11-13", "14+"],
      rol_perfil: [
        "voluntario",
        "coordinador",
        "psicopedagogia",
        "trabajador_social",
        "admin",
      ],
      rol_usuario: [
        "voluntario",
        "coordinador",
        "psicopedagogia",
        "admin",
        "trabajador_social",
        "director",
      ],
    },
  },
} as const
