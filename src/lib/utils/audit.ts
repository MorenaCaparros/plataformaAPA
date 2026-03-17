/**
 * Helper para registrar eventos en el audit_log desde API routes.
 *
 * Uso:
 *   await logAuditEvent(supabase, user, {
 *     accion: 'crear',
 *     tabla: 'ninos',
 *     registro_id: nino.id,
 *     descripcion: `Creó el niño "${nino.alias}"`,
 *   });
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditEventInput {
  accion: 'crear' | 'editar' | 'eliminar' | 'login' | 'asignar' | 'desasignar' | 'exportar' | 'acepto_terminos' | string;
  tabla?: string;
  registro_id?: string;
  descripcion: string;
  datos_previos?: Record<string, unknown> | null;
  datos_nuevos?: Record<string, unknown> | null;
}

export async function logAuditEvent(
  supabase: SupabaseClient,
  user: { id: string; email?: string },
  event: AuditEventInput,
): Promise<void> {
  try {
    // Obtener datos del perfil para enriquecer el log (sin bloquear si falla)
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .single();

    const usuario_nombre = perfil
      ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || user.email
      : user.email;

    await supabase.from('audit_log').insert({
      usuario_id:    user.id,
      usuario_nombre,
      usuario_rol:   perfil?.rol || null,
      accion:        event.accion,
      tabla:         event.tabla || null,
      registro_id:   event.registro_id || null,
      descripcion:   event.descripcion,
      datos_previos: event.datos_previos || null,
      datos_nuevos:  event.datos_nuevos || null,
    });
  } catch (e) {
    // Audit log nunca debe romper el flujo principal
    console.warn('[audit] No se pudo registrar evento:', e);
  }
}
