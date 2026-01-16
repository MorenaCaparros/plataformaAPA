# 🧹 Cómo Limpiar Usuarios de Prueba

## El Problema

Los emails que intentás importar **ya existen** en la base de datos de intentos anteriores de importación. Por eso seguís viendo errores de "duplicate key" aunque cambies los emails en el CSV.

## Solución: Eliminar Usuarios Existentes

### Opción 1: Desde el Dashboard de Supabase (RECOMENDADO - MÁS FÁCIL)

1. **Ir a tu proyecto en Supabase**: https://supabase.com/dashboard

2. **Navegar a Authentication > Users**

3. **Buscar y eliminar** los siguientes usuarios:
   - volun1@gmail.com
   - volun2@gmail.com
   - volun3@gmail.com
   - volun4@gmail.com
   - volun5@gmail.com
   - volun6@gmail.com
   - psico1@gmail.com
   - psico2@gmail.com
   - coord1@gmail.com
   - coord2@gmail.com
   - coord3@gmail.com
   - coord4@gmail.com
   - admin1@gmail.com
   - admin2@gmail.com
   - admin3@gmail.com

4. **Click en cada usuario** → Botón "Delete user" → Confirmar

### Opción 2: SQL (más rápido, pero requiere ejecutar en SQL Editor)

1. **Ir a SQL Editor** en Supabase Dashboard

2. **Ejecutar el script** `supabase/migrations/limpiar_usuarios_prueba.sql`

3. **PRIMERO ejecutar la query de verificación**:
   ```sql
   SELECT 
     u.id,
     u.email,
     p.rol
   FROM auth.users u
   LEFT JOIN public.perfiles p ON p.id = u.id
   WHERE 
     u.email LIKE 'volun%@gmail.com'
     OR u.email LIKE 'coord%@gmail.com'
     OR u.email LIKE 'psico%@gmail.com'
     OR u.email LIKE 'admin%@gmail.com';
   ```

4. **Ver la lista de usuarios** que se eliminarán

5. **Ejecutar el DELETE de perfiles**:
   ```sql
   DELETE FROM public.perfiles
   WHERE id IN (
     SELECT id FROM auth.users
     WHERE 
       email LIKE 'volun%@gmail.com'
       OR email LIKE 'coord%@gmail.com'
       OR email LIKE 'psico%@gmail.com'
       OR email LIKE 'admin%@gmail.com'
   );
   ```

6. **Los usuarios de auth.users deben eliminarse desde el dashboard** (Supabase no permite DELETE directo por seguridad)

### Opción 3: Usar Emails Completamente Nuevos

Si querés evitar limpiar, usá emails que nunca hayas usado antes:

```
voluntario1@apa-prueba.com
voluntario2@apa-prueba.com
coord1@apa-prueba.com
psico1@apa-prueba.com
admin-test@apa-prueba.com
```

## Después de Limpiar

1. ✅ El **problema de mayúsculas ya está resuelto** - ahora la plataforma acepta "Voluntario" y lo convierte automáticamente a "voluntario"

2. ✅ El sistema **detecta duplicados antes de intentar crear** y da un mensaje más claro

3. **Volver a intentar la importación CSV** con los mismos emails

## Verificar que Funcionó

Después de limpiar e importar exitosamente, deberías ver:

```
✅ Usuarios importados exitosamente: 15
```

Y en la página de Usuarios deberías ver los 15 nuevos usuarios listados.
