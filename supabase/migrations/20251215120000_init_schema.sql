-- Plataforma APA - Esquema inicial (Supabase/PostgreSQL)
-- Enfoque: privacidad por diseño (separar datos sensibles), RLS por roles, escalable.

begin;

-- Extensiones
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Tipos
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rol_usuario') then
    create type public.rol_usuario as enum ('voluntario', 'coordinador', 'psicopedagogia', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'rango_etario') then
    create type public.rango_etario as enum ('5-7', '8-10', '11-13', '14+');
  end if;
end $$;

-- Utilidades
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Importante: helpers para policies. SECURITY DEFINER para evitar problemas con RLS.
create or replace function public.current_user_role()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select p.rol
  from public.perfiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_user_zona_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.zona_id
  from public.perfiles p
  where p.id = auth.uid();
$$;

-- Tablas core

create table if not exists public.zonas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger zonas_set_updated_at
before update on public.zonas
for each row execute function public.set_updated_at();

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol_usuario not null default 'voluntario',
  zona_id uuid references public.zonas (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists perfiles_rol_idx on public.perfiles (rol);
create index if not exists perfiles_zona_idx on public.perfiles (zona_id);

create trigger perfiles_set_updated_at
before update on public.perfiles
for each row execute function public.set_updated_at();

-- Niños: separar datos operativos (visible a voluntarios) vs sensibles (solo roles autorizados)
create table if not exists public.ninos (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  rango_etario public.rango_etario,
  nivel_alfabetizacion text,
  escolarizado boolean,
  metadata jsonb not null default '{}'::jsonb,
  zona_id uuid references public.zonas (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ninos_zona_idx on public.ninos (zona_id);
create index if not exists ninos_rango_etario_idx on public.ninos (rango_etario);

create trigger ninos_set_updated_at
before update on public.ninos
for each row execute function public.set_updated_at();

create table if not exists public.ninos_sensibles (
  nino_id uuid primary key references public.ninos (id) on delete cascade,
  -- Guardar ya encriptado desde la app/edge function. No almacenar texto plano.
  nombre_completo_encrypted text,
  fecha_nacimiento_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ninos_sensibles_set_updated_at
before update on public.ninos_sensibles
for each row execute function public.set_updated_at();

-- Asignaciones: qué voluntarios pueden ver qué niños
create table if not exists public.nino_voluntarios (
  id uuid primary key default gen_random_uuid(),
  nino_id uuid not null references public.ninos (id) on delete cascade,
  voluntario_id uuid not null references public.perfiles (id) on delete cascade,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (nino_id, voluntario_id)
);

create index if not exists nino_voluntarios_voluntario_idx on public.nino_voluntarios (voluntario_id);
create index if not exists nino_voluntarios_nino_idx on public.nino_voluntarios (nino_id);

-- Sesiones educativas
create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  nino_id uuid not null references public.ninos (id) on delete restrict,
  voluntario_id uuid not null references public.perfiles (id) on delete restrict,
  fecha timestamptz not null,
  duracion_minutos integer,
  items jsonb not null default '[]'::jsonb,
  observaciones_libres text,
  created_offline boolean not null default false,
  sincronizado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sesiones_nino_fecha_idx on public.sesiones (nino_id, fecha desc);
create index if not exists sesiones_voluntario_fecha_idx on public.sesiones (voluntario_id, fecha desc);

create trigger sesiones_set_updated_at
before update on public.sesiones
for each row execute function public.set_updated_at();

-- Biblioteca psicopedagógica (RAG)
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  autor text,
  tipo text,
  storage_path text,
  contenido text,
  metadata jsonb not null default '{}'::jsonb,
  subido_por uuid references public.perfiles (id) on delete set null,
  subido_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos (id) on delete cascade,
  chunk_index integer,
  chunk_text text not null,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_documento_idx on public.document_chunks (documento_id);

-- Seguridad: RLS
alter table public.zonas enable row level security;
alter table public.perfiles enable row level security;
alter table public.ninos enable row level security;
alter table public.ninos_sensibles enable row level security;
alter table public.nino_voluntarios enable row level security;
alter table public.sesiones enable row level security;
alter table public.documentos enable row level security;
alter table public.document_chunks enable row level security;

-- Policies

-- Zonas: cualquier usuario autenticado puede leer. Admin puede gestionar.
create policy "zonas_select_authenticated" on public.zonas
  for select to authenticated
  using (true);

create policy "zonas_write_admin" on public.zonas
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Perfiles: cada usuario puede ver/editar su perfil. Admin/psicoped puede ver todos.
create policy "perfiles_select_self" on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.current_user_role() in ('admin', 'psicopedagogia'));

create policy "perfiles_insert_self" on public.perfiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "perfiles_update_self" on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin')
  with check (id = auth.uid() or public.current_user_role() = 'admin');

-- Niños (datos operativos)
-- Voluntario: solo niños asignados.
-- Coordinador: niños de su zona.
-- Psicopedagogía/Admin: todos.
create policy "ninos_select_por_rol" on public.ninos
  for select to authenticated
  using (
    public.current_user_role() in ('admin', 'psicopedagogia')
    or (
      public.current_user_role() = 'coordinador'
      and zona_id is not distinct from public.current_user_zona_id()
    )
    or (
      public.current_user_role() = 'voluntario'
      and exists (
        select 1
        from public.nino_voluntarios nv
        where nv.nino_id = public.ninos.id
          and nv.voluntario_id = auth.uid()
          and nv.activo = true
      )
    )
  );

-- Escritura de niños: coordinador/psicoped/admin (MVP). Voluntario no.
create policy "ninos_write_privilegiados" on public.ninos
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador'));

create policy "ninos_update_privilegiados" on public.ninos
  for update to authenticated
  using (public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador'))
  with check (public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador'));

-- Niños sensibles: solo psicopedagogía/admin; coordinador solo si el niño está en su zona.
create policy "ninos_sensibles_select" on public.ninos_sensibles
  for select to authenticated
  using (
    public.current_user_role() in ('admin', 'psicopedagogia')
    or (
      public.current_user_role() = 'coordinador'
      and exists (
        select 1
        from public.ninos n
        where n.id = public.ninos_sensibles.nino_id
          and n.zona_id is not distinct from public.current_user_zona_id()
      )
    )
  );

create policy "ninos_sensibles_write" on public.ninos_sensibles
  for all to authenticated
  using (public.current_user_role() in ('admin', 'psicopedagogia'))
  with check (public.current_user_role() in ('admin', 'psicopedagogia'));

-- Asignaciones niño-voluntario: coordinador/psicoped/admin.
create policy "nino_voluntarios_read" on public.nino_voluntarios
  for select to authenticated
  using (
    public.current_user_role() in ('admin', 'psicopedagogia')
    or (
      public.current_user_role() = 'coordinador'
      and exists (
        select 1 from public.ninos n
        where n.id = public.nino_voluntarios.nino_id
          and n.zona_id is not distinct from public.current_user_zona_id()
      )
    )
    or (
      public.current_user_role() = 'voluntario'
      and voluntario_id = auth.uid()
    )
  );

create policy "nino_voluntarios_write_privilegiados" on public.nino_voluntarios
  for insert to authenticated
  with check (public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador'));

create policy "nino_voluntarios_update_privilegiados" on public.nino_voluntarios
  for update to authenticated
  using (public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador'))
  with check (public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador'));

-- Sesiones: voluntario ve/crea solo las suyas y solo si el niño está asignado.
-- Coordinador ve sesiones de niños de su zona. Psicoped/admin ven todo.
create policy "sesiones_select_por_rol" on public.sesiones
  for select to authenticated
  using (
    public.current_user_role() in ('admin', 'psicopedagogia')
    or (
      public.current_user_role() = 'coordinador'
      and exists (
        select 1 from public.ninos n
        where n.id = public.sesiones.nino_id
          and n.zona_id is not distinct from public.current_user_zona_id()
      )
    )
    or (
      public.current_user_role() = 'voluntario'
      and voluntario_id = auth.uid()
    )
  );

create policy "sesiones_insert_voluntario" on public.sesiones
  for insert to authenticated
  with check (
    (
      public.current_user_role() = 'voluntario'
      and voluntario_id = auth.uid()
      and exists (
        select 1 from public.nino_voluntarios nv
        where nv.nino_id = public.sesiones.nino_id
          and nv.voluntario_id = auth.uid()
          and nv.activo = true
      )
    )
    or (public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador'))
  );

create policy "sesiones_update_propias_o_privilegiados" on public.sesiones
  for update to authenticated
  using (
    (public.current_user_role() = 'voluntario' and voluntario_id = auth.uid())
    or public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador')
  )
  with check (
    (public.current_user_role() = 'voluntario' and voluntario_id = auth.uid())
    or public.current_user_role() in ('admin', 'psicopedagogia', 'coordinador')
  );

-- Documentos/chunks: solo psicopedagogía/admin.
create policy "documentos_select" on public.documentos
  for select to authenticated
  using (public.current_user_role() in ('admin', 'psicopedagogia'));

create policy "documentos_write" on public.documentos
  for all to authenticated
  using (public.current_user_role() in ('admin', 'psicopedagogia'))
  with check (public.current_user_role() in ('admin', 'psicopedagogia'));

create policy "document_chunks_select" on public.document_chunks
  for select to authenticated
  using (public.current_user_role() in ('admin', 'psicopedagogia'));

create policy "document_chunks_write" on public.document_chunks
  for all to authenticated
  using (public.current_user_role() in ('admin', 'psicopedagogia'))
  with check (public.current_user_role() in ('admin', 'psicopedagogia'));

commit;
