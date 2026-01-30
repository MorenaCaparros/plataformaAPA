# 📋 Próximos Pasos - Plataforma APA

**Fecha:** 26 de Enero, 2026  
**Estado actual:** Sistema de autoevaluaciones funcional (CRUD completo)  
**Última actualización:** Implementación de gestión de plantillas con role-based access

---

## ✅ Completado Recientemente

### Sistema de Matching Automático (26/01/2026) 🚀
- [x] Algoritmo de scoring (habilidades vs déficits)
- [x] API endpoint `/api/matching/sugerencias`
- [x] Tabla `asignaciones` con RLS
- [x] Página de asignación con UI moderna
- [x] Visualización de compatibilidad por áreas
- [x] Sistema de scoring (0-100): habilidades (70%), disponibilidad (20%), zona (10%)
- [x] Botón en perfil del niño para asignar voluntario
- [x] Indicadores de disponibilidad (alta/media/baja)
- [x] Detalles del score desglosado
- [x] Confirmación antes de asignar
- [x] Desactivación automática de asignación anterior
- [x] Documentación completa en `RESUMEN-MATCHING-AUTOMATICO.md`

### Flujo de Completar Autoevaluaciones para Voluntarios (26/01/2026)
- [x] Página `/dashboard/autoevaluaciones/mis-respuestas/page.tsx`
  - Vista de autoevaluaciones disponibles (activo = true)
  - Estados: no iniciada, en progreso, completada
  - Estadísticas rápidas (completadas, en progreso, pendientes)
  - Botones dinámicos: "Comenzar", "Continuar" o "Ver resultados"
- [x] Página `/dashboard/autoevaluaciones/mis-respuestas/completar/[plantillaId]/page.tsx`
  - Formulario dinámico según tipo de pregunta
  - Escala 1-5: estrellas clickeables
  - Sí/No: botones toggle (Check/X con colores)
  - Texto abierto: textarea
  - Guardar progreso (borrador)
  - Enviar respuesta final con validación completa
  - Barra de progreso visual
  - Cálculo automático de puntaje para preguntas tipo escala
- [x] Página principal actualizada con Link a la ruta de completar
- [x] Diseño flotante orgánico aplicado consistentemente

### Sistema de Autoevaluaciones (26/01/2026)
- [x] Página principal con detección de roles (administrativos vs voluntarios)
- [x] Vista administrativa: muestra plantillas creadas
- [x] Vista voluntario: muestra estadísticas de completitud
- [x] Página de gestión (`/gestionar`) con lista de plantillas
- [x] Botón activar/desactivar plantillas con ícono visual (Eye/EyeOff)
- [x] Página de creación de plantillas (`/gestionar/crear`)
- [x] Página de edición de plantillas (`/gestionar/editar/[id]`)
- [x] Sistema de permisos basado en roles (RLS en Supabase)
- [x] Preguntas dinámicas (agregar/eliminar/editar)
- [x] Tipos de pregunta: escala 1-5, sí/no, texto abierto
- [x] 4 áreas: Lenguaje, Grafismo, Lectura/Escritura, Matemáticas

### Reemplazo de Iconos (25/01/2026)
- [x] Todos los emojis reemplazados por lucide-react icons
- [x] Páginas actualizadas: ninos, sesiones, perfiles, autoevaluaciones
- [x] Diseño flotante orgánico aplicado consistentemente

---

## 🚧 Pendientes Inmediatos

### 1. **MEDIA PRIORIDAD - Dashboard de Resultados**

**Funcionalidad:**
- Crear capacitaciones (admin/psico/coordinador/TS)
- Asignar a voluntarios específicos o todos
- Voluntarios completan capacitaciones
- Sistema suma estrellas al completar

**Páginas:**
- [ ] `/dashboard/capacitaciones/page.tsx` (lista)
- [ ] `/dashboard/capacitaciones/crear/page.tsx` (admin)
- [ ] `/dashboard/capacitaciones/[capacitacionId]/page.tsx` (detalles)
- [ ] `/dashboard/capacitaciones/[capacitacionId]/completar/page.tsx` (voluntario)

**Base de datos:**
```sql
capacitaciones (
  id uuid,
  titulo text,
  area text, -- lenguaje | grafismo | lectura_escritura | matematicas | general
  descripcion text,
  tipo text, -- presencial | online | autoevaluacion | material
  puntaje_otorgado number, -- estrellas que suma (1-5)
  contenido text,
  evaluacion jsonb, -- preguntas opcionales
  creado_por uuid,
  created_at timestamp
)

voluntarios_capacitaciones (
  id uuid,
  voluntario_id uuid,
  capacitacion_id uuid,
  estado text, -- pendiente | en_curso | completada | no_aprobada
  fecha_asignacion timestamp,
  fecha_completada timestamp,
  puntaje_obtenido number
)
```

---

### 4. **BAJA PRIORIDAD - Mejoras UX/UI**

- [ ] Agregar loading skeletons (reemplazar spinners)
- [ ] Animaciones de transición entre páginas
- [ ] Notificaciones toast (react-hot-toast)
- [ ] Confirmaciones elegantes (reemplazar `alert()` y `confirm()`)
- [ ] Drag & drop para reordenar preguntas en plantillas
- [ ] Preview de plantilla antes de guardar

---

### 5. **BAJA PRIORIDAD - Testing y Optimización**

- [ ] Tests unitarios (Vitest)
  - Lógica de matching
  - Cálculo de scores
  - Validaciones de formularios

- [ ] Tests E2E (Playwright)
  - Flujo completo: crear plantilla → completar autoevaluación
  - Flujo de matching: evaluar niño → asignar voluntario

- [ ] Optimización de queries
  - Implementar TanStack Query (React Query) para caché
  - Prefetching de datos frecuentes
  - Paginación en listados grandes

---

## 🔐 Checklist de Seguridad (Antes de Push)

- [x] `.gitignore` incluye todos los archivos `.env*` (excepto `.env.example`)
- [x] No hay API keys hardcodeadas en el código
- [x] Variables de entorno usan `process.env.VARIABLE`
- [x] RLS habilitado en todas las tablas sensibles
- [x] Políticas de Supabase verificadas

**Comandos antes de push:**
```bash
# Verificar que no haya archivos .env trackeados
git status | grep ".env"

# Si aparecen, eliminarlos del staging
git rm --cached .env.local

# Revisar diff antes de commitear
git diff --staged

# Push
git add .
git commit -m "feat: sistema completo de autoevaluaciones con CRUD y roles"
git push origin main
```

---

## 📚 Recursos para Continuar

### Documentación de Referencia
- **Contexto del proyecto:** `.github/instructions/contexto-proyecto.md`
- **Stack técnico:** `.github/instructions/stack-tecnologico.instructions.md`
- **Instrucciones generales:** `.github/instructions/instrucciones.instructions.md`
- **Diseño UI:** `.github/instructions/diseno-ui.instructions.md`

### Patrones de Código Establecidos

**Estructura de página con permisos:**
```typescript
'use client';

import { useAuth } from '@/lib/contexts/AuthContext';

export default function MiPagina() {
  const { perfil } = useAuth();
  const rolesPermitidos = ['director', 'psicopedagogia'];
  const tienePermiso = perfil && rolesPermitidos.includes(perfil.rol);

  useEffect(() => {
    if (!tienePermiso) {
      router.push('/dashboard');
    }
  }, [perfil, tienePermiso]);

  if (!tienePermiso) return null;

  // ... resto del componente
}
```

**Formulario con estado dinámico:**
```typescript
const [items, setItems] = useState<Item[]>([]);

function agregar() {
  setItems([...items, { id: Date.now().toString(), ...valores }]);
}

function eliminar(id: string) {
  setItems(items.filter(i => i.id !== id));
}

function actualizar(id: string, campo: string, valor: any) {
  setItems(items.map(i => i.id === id ? { ...i, [campo]: valor } : i));
}
```

**Query de Supabase con manejo de errores:**
```typescript
async function fetchData() {
  try {
    const { data, error } = await supabase
      .from('tabla')
      .select('*')
      .order('campo');

    if (error) throw error;
    setData(data || []);
  } catch (error) {
    console.error('Error:', error);
    alert('Mensaje amigable para el usuario');
  } finally {
    setLoading(false);
  }
}
```

---

## 🎯 Priorización Sugerida

### Sprint 1 (Esta semana)
1. **Flujo de completar autoevaluaciones** - Los voluntarios necesitan poder responder
2. **Dashboard de resultados** - Los admins necesitan ver las respuestas

### Sprint 2 (Próxima semana)
3. **Sistema de matching automático** - Core del valor de la plataforma
4. **Sistema de capacitaciones** - Genera las estrellas para el matching

### Sprint 3 (Semana siguiente)
5. **Mejoras UX/UI** - Pulir la experiencia
6. **Testing y optimización** - Asegurar calidad

---

## 💡 Notas Importantes

- **RLS Crítico:** Siempre verificar políticas antes de crear tablas nuevas
- **Mobile-First:** Todas las páginas deben funcionar perfectamente en celular
- **Iconos Consistentes:** Usar lucide-react para todos los iconos
- **Diseño Flotante:** Seguir el sistema Luminiscencia Orgánica Flotante
- **Roles:** Siempre validar permisos en client y server
- **Datos Sensibles:** Nunca exponer información completa de niños a voluntarios

---

## 🔄 Workflow de Desarrollo

1. **Crear rama feature:**
   ```bash
   git checkout -b feature/nombre-funcionalidad
   ```

2. **Desarrollar con commits atómicos:**
   ```bash
   git commit -m "feat: descripción específica"
   git commit -m "fix: corrección de bug X"
   ```

3. **Antes de mergear a main:**
   - Verificar que compile sin errores
   - Revisar que no haya secretos expuestos
   - Probar flujo completo en localhost
   - Verificar RLS en Supabase

4. **Mergear y deployar:**
   ```bash
   git checkout main
   git merge feature/nombre-funcionalidad
   git push origin main
   ```

---

## 📞 Contacto y Soporte

- **Equipo:** GlobalIA + ONG Adelante
- **Validación técnica:** Equipo GlobalIA
- **Validación contenido:** Nicanor + Psicopedagogía

---

**Última actualización:** 26 de Enero, 2026  
**Versión:** 1.0.0  
**Estado:** Sistema de autoevaluaciones funcional - Listo para continuar con flujo de voluntarios
