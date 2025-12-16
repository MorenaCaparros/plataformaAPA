# Supabase (Base de Datos)

Este repo usa migraciones SQL para definir el esquema y las políticas RLS.

## Aplicar migraciones (opción A: Supabase CLI)

1. Instalar Supabase CLI.
2. En la raíz del repo:
   - `supabase init`
   - Conectar el proyecto (si ya existe): `supabase link`
   - Aplicar: `supabase db push`

## Aplicar migraciones (opción B: Supabase Dashboard)

- Abrir Supabase → SQL Editor
- Ejecutar el contenido de:
  - `supabase/migrations/20251215120000_init_schema.sql`

## Notas de seguridad
- Los datos sensibles del niño van en `public.ninos_sensibles` y deben guardarse **encriptados**.
- El acceso se controla con RLS según rol (`public.perfiles.rol`).
