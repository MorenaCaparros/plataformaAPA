-- =====================================================================
-- AUDIT LOG — Plataforma APA
-- =====================================================================
-- Registra quién cambió qué y cuándo en las tablas principales.
-- Solo admin/director pueden leer esta tabla vía RLS.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- TABLA PRINCIPAL
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Quién hizo la acción (puede ser NULL si fue un trigger del sistema)
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    text,
  user_rol      text,
  -- Qué tabla y qué fila
  tabla         text NOT NULL,
  fila_id       text NOT NULL,
  -- Qué operación
  accion        text NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  -- Valores antes y después (NULL en INSERT / DELETE respectivamente)
  valores_antes jsonb,
  valores_despues jsonb,
  -- Campos que cambiaron (conveniente para filtrar)
  campos_modificados text[],
  -- Contexto extra opcional (ej: IP, user_agent si se pasa desde la API)
  metadata      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices para las búsquedas más comunes en la vista filtrable
CREATE INDEX IF NOT EXISTS idx_audit_user      ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_tabla     ON public.audit_logs(tabla);
CREATE INDEX IF NOT EXISTS idx_audit_accion    ON public.audit_logs(accion);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_fila      ON public.audit_logs(tabla, fila_id);

COMMENT ON TABLE public.audit_logs IS 'Log de auditoría: quién cambió qué y cuándo';

-- ─────────────────────────────────────────────────────────────────────
-- RLS — Solo admin puede leer, nadie puede modificar desde el cliente
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admin/director leen
CREATE POLICY "audit_solo_admin_lee" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid()
        AND rol IN ('admin', 'director')
    )
  );

-- Nadie puede insertar/actualizar/borrar desde el cliente (solo el trigger con SECURITY DEFINER)
CREATE POLICY "audit_no_insert_cliente" ON public.audit_logs
  FOR INSERT WITH CHECK (false);

CREATE POLICY "audit_no_update_cliente" ON public.audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "audit_no_delete_cliente" ON public.audit_logs
  FOR DELETE USING (false);

-- ─────────────────────────────────────────────────────────────────────
-- FUNCIÓN GENÉRICA DE AUDITORÍA
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid;
  v_user_email text;
  v_user_rol   text;
  v_antes      jsonb;
  v_despues    jsonb;
  v_campos     text[];
  v_fila_id    text;
  v_key        text;
BEGIN
  -- Obtener usuario actual desde JWT (puede ser NULL si es trigger del sistema)
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email, rol
      INTO v_user_email, v_user_rol
      FROM public.perfiles
     WHERE id = v_user_id;
  END IF;

  -- Valores según la operación
  IF TG_OP = 'INSERT' THEN
    v_antes    := NULL;
    v_despues  := to_jsonb(NEW);
    v_fila_id  := NEW.id::text;
    v_campos   := ARRAY(SELECT jsonb_object_keys(to_jsonb(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    v_antes    := to_jsonb(OLD);
    v_despues  := NULL;
    v_fila_id  := OLD.id::text;
    v_campos   := NULL;
  ELSE -- UPDATE
    v_antes    := to_jsonb(OLD);
    v_despues  := to_jsonb(NEW);
    v_fila_id  := NEW.id::text;
    -- Solo los campos que realmente cambiaron
    SELECT array_agg(key)
      INTO v_campos
      FROM jsonb_each(to_jsonb(NEW)) AS n(key, value)
     WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value;
  END IF;

  INSERT INTO public.audit_logs (
    user_id, user_email, user_rol,
    tabla, fila_id,
    accion,
    valores_antes, valores_despues,
    campos_modificados
  ) VALUES (
    v_user_id, v_user_email, v_user_rol,
    TG_TABLE_NAME, v_fila_id,
    TG_OP,
    v_antes, v_despues,
    v_campos
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- TRIGGERS — Tablas que queremos auditar
-- ─────────────────────────────────────────────────────────────────────

-- Perfiles (creación/edición de usuarios)
DROP TRIGGER IF EXISTS trg_audit_perfiles ON public.perfiles;
CREATE TRIGGER trg_audit_perfiles
  AFTER INSERT OR UPDATE OR DELETE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Niños
DROP TRIGGER IF EXISTS trg_audit_ninos ON public.ninos;
CREATE TRIGGER trg_audit_ninos
  AFTER INSERT OR UPDATE OR DELETE ON public.ninos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Sesiones
DROP TRIGGER IF EXISTS trg_audit_sesiones ON public.sesiones;
CREATE TRIGGER trg_audit_sesiones
  AFTER INSERT OR UPDATE OR DELETE ON public.sesiones
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Asignaciones
DROP TRIGGER IF EXISTS trg_audit_asignaciones ON public.asignaciones;
CREATE TRIGGER trg_audit_asignaciones
  AFTER INSERT OR UPDATE OR DELETE ON public.asignaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Documentos
DROP TRIGGER IF EXISTS trg_audit_documentos ON public.documentos;
CREATE TRIGGER trg_audit_documentos
  AFTER INSERT OR UPDATE OR DELETE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
