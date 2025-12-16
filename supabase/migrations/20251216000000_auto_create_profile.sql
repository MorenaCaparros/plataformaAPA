-- Trigger para crear perfil automáticamente al registrar usuario
-- Esto evita problemas de RLS y simplifica el flujo de registro

begin;

-- Función que crea el perfil automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, rol, metadata)
  values (new.id, 'voluntario', '{}');
  return new;
end;
$$;

-- Trigger que se dispara al crear un usuario en auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

commit;
