export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      zonas: {
        Row: {
          id: string
          nombre: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          created_at?: string
          updated_at?: string
        }
      }
      perfiles: {
        Row: {
          id: string
          rol: 'voluntario' | 'coordinador' | 'psicopedagogia' | 'admin'
          zona_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          rol?: 'voluntario' | 'coordinador' | 'psicopedagogia' | 'admin'
          zona_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rol?: 'voluntario' | 'coordinador' | 'psicopedagogia' | 'admin'
          zona_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      ninos: {
        Row: {
          id: string
          alias: string
          rango_etario: '5-7' | '8-10' | '11-13' | '14+' | null
          nivel_alfabetizacion: string | null
          escolarizado: boolean | null
          metadata: Json
          zona_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          alias: string
          rango_etario?: '5-7' | '8-10' | '11-13' | '14+' | null
          nivel_alfabetizacion?: string | null
          escolarizado?: boolean | null
          metadata?: Json
          zona_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          alias?: string
          rango_etario?: '5-7' | '8-10' | '11-13' | '14+' | null
          nivel_alfabetizacion?: string | null
          escolarizado?: boolean | null
          metadata?: Json
          zona_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sesiones: {
        Row: {
          id: string
          nino_id: string
          voluntario_id: string
          fecha: string
          duracion_minutos: number | null
          items: Json
          observaciones_libres: string | null
          created_offline: boolean
          sincronizado_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nino_id: string
          voluntario_id: string
          fecha: string
          duracion_minutos?: number | null
          items?: Json
          observaciones_libres?: string | null
          created_offline?: boolean
          sincronizado_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nino_id?: string
          voluntario_id?: string
          fecha?: string
          duracion_minutos?: number | null
          items?: Json
          observaciones_libres?: string | null
          created_offline?: boolean
          sincronizado_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: 'voluntario' | 'coordinador' | 'psicopedagogia' | 'admin'
      }
      current_user_zona_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      rol_usuario: 'voluntario' | 'coordinador' | 'psicopedagogia' | 'admin'
      rango_etario: '5-7' | '8-10' | '11-13' | '14+'
    }
  }
}
