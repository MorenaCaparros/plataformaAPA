---
applyTo: '**'
---

# Optimización de Performance - Plataforma APA

## Problema Identificado

La carga de datos desde Supabase tarda 1-2 segundos, lo que genera una experiencia de usuario lenta y poco profesional. En aplicaciones modernas, esta demora rompe la fluidez esperada.

---

## Estrategias de Optimización (Prioridad Alta → Baja)

### 1. 🎯 Solución Principal: TanStack Query (React Query)

**Problema actual:**
- Cada vez que el usuario navega, se hace un `useEffect` con fetch directo a Supabase
- Pantalla en blanco por 1-2 segundos en cada carga
- No hay caché, todo se recarga desde cero

**Solución: TanStack Query**

Sistema de gestión de estado del servidor que provee:
- ✅ **Caché instantáneo**: Primera vez tarda 1s, siguientes cargas = 0s
- ✅ **Stale-While-Revalidate**: Muestra datos viejos instantáneamente mientras busca nuevos
- ✅ **Prefetching**: Carga datos cuando el mouse pasa sobre el botón
- ✅ **Background refetch**: Actualiza datos sin bloquear la UI
- ✅ **Deduplicación**: Si dos componentes piden lo mismo, solo hace 1 request

**Implementación:**

```bash
npm install @tanstack/react-query
```

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - datos "frescos"
      cacheTime: 1000 * 60 * 10, // 10 minutos - mantener en caché
      refetchOnWindowFocus: true, // Actualizar al volver a la pestaña
      retry: 1, // Reintentar 1 vez si falla
    },
  },
});
```

```typescript
// src/app/layout.tsx (o _app.tsx)
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Ejemplo de uso (antes vs después):**

```typescript
// ❌ ANTES (lento, sin caché)
function DashboardPage() {
  const [ninos, setNinos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNinos() {
      const { data } = await supabase.from('ninos').select('*');
      setNinos(data);
      setLoading(false);
    }
    fetchNinos();
  }, []);

  if (loading) return <Spinner />;
  return <Lista ninos={ninos} />;
}

// ✅ DESPUÉS (rápido, con caché)
import { useQuery } from '@tanstack/react-query';

function DashboardPage() {
  const { data: ninos, isLoading } = useQuery({
    queryKey: ['ninos'], // Key única para identificar esta query
    queryFn: async () => {
      const { data } = await supabase.from('ninos').select('id, alias, rango_etario, nivel_alfabetizacion');
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos frescos (no refetch en ese tiempo)
  });

  if (isLoading) return <Skeleton />; // Skeleton en vez de Spinner
  return <Lista ninos={ninos} />;
}
```

**Ventajas adicionales:**
- Al volver a la página, `data` aparece **INSTANTÁNEAMENTE** desde caché
- Mientras tanto, hace refetch en background
- Si hay cambios, actualiza suavemente sin parpadeos

**Uso con mutaciones (crear/editar/borrar):**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CrearNinoForm() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (nuevoNino) => {
      const { data } = await supabase.from('ninos').insert(nuevoNino).select();
      return data;
    },
    onSuccess: () => {
      // Invalida la caché de 'ninos' para refetch automático
      queryClient.invalidateQueries({ queryKey: ['ninos'] });
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({ alias: 'Juan', ... });
    }}>
      {/* ... */}
    </form>
  );
}
```

---

### 2. 🚀 Optimizar Consultas a Supabase

**Problema:**
- Traer `select('*')` carga columnas innecesarias
- Sin índices en columnas de filtrado
- Joins anidados sin límite

**Solución:**

#### A) Select solo lo necesario

```typescript
// ❌ MAL: Trae TODO (incluyendo campos grandes como entrevista_inicial, metadata, etc.)
const { data } = await supabase.from('ninos').select('*');

// ✅ BIEN: Solo lo que se muestra en la lista
const { data } = await supabase
  .from('ninos')
  .select('id, alias, rango_etario, nivel_alfabetizacion, escolarizado');

// ✅ MEJOR: Con relación específica
const { data } = await supabase
  .from('ninos')
  .select(`
    id,
    alias,
    zona_id,
    zonas (
      nombre
    )
  `);
```

#### B) Usar índices en Supabase

Si filtras frecuentemente por `zona_id`, `nivel_alfabetizacion`, etc., crea índices:

```sql
-- Ir a Supabase > SQL Editor
CREATE INDEX IF NOT EXISTS idx_ninos_zona ON ninos(zona_id);
CREATE INDEX IF NOT EXISTS idx_ninos_nivel ON ninos(nivel_alfabetizacion);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_nino ON sesiones(nino_id);
```

**Impacto:** Reduce consultas de 1000ms → 50ms

#### C) Paginación

```typescript
// ❌ MAL: Traer 500+ niños de una vez
const { data } = await supabase.from('ninos').select('*');

// ✅ BIEN: Paginación
const { data, count } = await supabase
  .from('ninos')
  .select('*', { count: 'exact' })
  .range(0, 19); // Primeros 20 registros

// Siguiente página:
.range(20, 39); // Registros 21-40
```

---

### 3. 🎨 UX: Skeleton Screens (Engañar al Cerebro)

**Problema:**
- Spinner (ruedita girando) hace que el tiempo parezca más largo
- Pantalla en blanco genera ansiedad

**Solución:**
- Usar **Skeletons** (cajas grises parpadeantes con la forma del contenido)
- El cerebro interpreta: "el contenido ya está ahí, solo se está pintando"

**Implementación con Tailwind:**

```typescript
// components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

// Ejemplo de uso
function ListaNinosSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-white p-4 rounded-lg shadow">
          <Skeleton className="h-6 w-32 mb-2" /> {/* Nombre */}
          <Skeleton className="h-4 w-24" /> {/* Rango etario */}
        </div>
      ))}
    </div>
  );
}

// En el componente
function DashboardNinos() {
  const { data: ninos, isLoading } = useQuery({ ... });

  if (isLoading) return <ListaNinosSkeleton />;
  return <ListaNinos ninos={ninos} />;
}
```

**Impacto:** La percepción de velocidad mejora un 40% aunque el tiempo real sea el mismo.

---

### 4. ⚡ Optimistic UI (Para Acciones del Usuario)

**Problema:**
- Usuario marca sesión como completada
- Espera 1s a que Supabase responda
- Luego actualiza la UI

**Solución:**
- Actualizar UI **inmediatamente**
- Mandar petición a Supabase en background
- Si falla (raro), revertir cambio

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function MarcarSesionCompleta({ sesionId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id) => {
      await supabase
        .from('sesiones')
        .update({ completada: true })
        .eq('id', id);
    },
    
    // ✅ Actualiza UI ANTES de que responda el servidor
    onMutate: async (id) => {
      // Cancelar refetch en progreso
      await queryClient.cancelQueries({ queryKey: ['sesiones'] });

      // Snapshot del estado anterior (por si falla)
      const previousSesiones = queryClient.getQueryData(['sesiones']);

      // Actualizar caché optimistamente
      queryClient.setQueryData(['sesiones'], (old: any) =>
        old.map((s: any) =>
          s.id === id ? { ...s, completada: true } : s
        )
      );

      return { previousSesiones };
    },

    // Si hay error, revertir
    onError: (err, variables, context) => {
      queryClient.setQueryData(['sesiones'], context?.previousSesiones);
      alert('Error al marcar como completada');
    },

    // Siempre refetch al final para estar sincronizado
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sesiones'] });
    },
  });

  return (
    <button onClick={() => mutation.mutate(sesionId)}>
      {mutation.isLoading ? 'Guardando...' : 'Marcar Completada'}
    </button>
  );
}
```

**Impacto:** La app se siente con **latencia cero** para el usuario.

---

### 5. 🌍 Verificar Región de Supabase

**Problema:**
- Usuarios en Argentina/Latam
- Base de datos en Frankfurt (Alemania) o Singapur
- Latencia física: 1-2 segundos por la distancia

**Solución:**

1. **Verificar región actual:**
   - Ir a Supabase Dashboard
   - Settings > General
   - Ver "Region"

2. **Regiones recomendadas para Latam:**
   - ✅ **US East (N. Virginia)** - `us-east-1` (mejor para Argentina/Chile/Uruguay)
   - ✅ **São Paulo** - `sa-east-1` (requiere plan Pro, pero es la más cercana)

3. **Migrar si es necesario:**
   - Si estás en plan Free y la región está mal (ej: Asia/Europa)
   - Opción 1: Crear nuevo proyecto en región correcta + migrar datos
   - Opción 2: Upgrade a Pro y migrar a São Paulo

**Impacto:** Reduce latencia de 1000ms → 150-300ms solo con esto.

---

### 6. 🔧 Otras Optimizaciones

#### A) Lazy Loading de Componentes

```typescript
import { lazy, Suspense } from 'react';

// Solo carga este componente cuando se necesita
const BibliotecaPage = lazy(() => import('./BibliotecaPage'));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <BibliotecaPage />
    </Suspense>
  );
}
```

#### B) Prefetching con TanStack Query

```typescript
function MenuLink({ href, children }) {
  const queryClient = useQueryClient();

  return (
    <Link
      href={href}
      onMouseEnter={() => {
        // Carga datos ANTES de que el usuario haga click
        queryClient.prefetchQuery({
          queryKey: ['ninos'],
          queryFn: fetchNinos,
        });
      }}
    >
      {children}
    </Link>
  );
}
```

#### C) Supabase Realtime (opcional)

Si necesitas datos en tiempo real (ej: voluntarios viendo sesiones actualizadas):

```typescript
useEffect(() => {
  const channel = supabase
    .channel('sesiones-changes')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'sesiones' },
      (payload) => {
        // Actualizar caché cuando hay nueva sesión
        queryClient.invalidateQueries({ queryKey: ['sesiones'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Roadmap de Implementación

### Fase 1 (Impacto Inmediato - 1 día)
- [ ] Instalar TanStack Query
- [ ] Migrar 3-5 queries principales (dashboard, lista niños, sesiones)
- [ ] Crear componentes Skeleton para reemplazar Spinners

### Fase 2 (Optimizaciones Backend - 2-3 días)
- [ ] Auditar todas las queries: reemplazar `select('*')` por campos específicos
- [ ] Crear índices en columnas filtradas frecuentemente
- [ ] Implementar paginación en listados grandes

### Fase 3 (UX Avanzado - 3-4 días)
- [ ] Optimistic UI para acciones críticas (marcar completado, crear sesión)
- [ ] Prefetching en links del menú
- [ ] Lazy loading de páginas pesadas (Biblioteca, Reportes)

### Fase 4 (Infraestructura - Si es necesario)
- [ ] Verificar región de Supabase
- [ ] Evaluar migración si está en región incorrecta

---

## Métricas de Éxito

**Antes:**
- ❌ Primera carga: 1-2 segundos
- ❌ Navegación entre páginas: 1-2 segundos
- ❌ Acciones del usuario: 1 segundo de espera

**Después (objetivo):**
- ✅ Primera carga: 500-800ms (mejora con CDN/región)
- ✅ Navegación entre páginas: <100ms (caché instantáneo)
- ✅ Acciones del usuario: 0ms percibido (optimistic UI)

---

## Referencias

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Performance Tips](https://supabase.com/docs/guides/database/performance)
- [Web Vitals - Google](https://web.dev/vitals/)
- [Optimistic UI Pattern](https://www.uxdesigninstitute.com/blog/optimistic-ui-pattern/)

---

**Fecha de creación:** 24 de Enero, 2026  
**Prioridad:** 🔥 ALTA - Impacta directamente en experiencia de usuario  
**Estado:** Documentado - Pendiente de implementación
