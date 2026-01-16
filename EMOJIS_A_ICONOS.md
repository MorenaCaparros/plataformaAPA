# 🔄 Guía para Reemplazar Emojis por Iconos Profesionales

## Cambios Realizados

### ✅ AdminDashboard.tsx
- ✅ Emojis de métricas reemplazados por iconos de lucide-react
- ✅ Emojis de tarjetas de navegación reemplazados

### ✅ Usuarios page
- ✅ Botón "Importar CSV" ahora usa icono Upload

## Archivos Pendientes de Actualizar

Para completar el cambio visual profesional, necesitás actualizar manualmente estos archivos reemplazando emojis por iconos de lucide-react:

### 1. src/app/dashboard/configuracion/page.tsx
**Emojis a reemplazar:**
- ⚙️ → `<Settings className="w-6 h-6" />`
- 📊 → `<Database className="w-6 h-6" />`
- 🔒 → `<Shield className="w-6 h-6" />`
- 🔔 → `<Bell className="w-6 h-6" />`

**Agregar import:**
```tsx
import { Settings, Database, Shield, Bell } from 'lucide-react';
```

### 2. src/app/dashboard/usuarios/importar/page.tsx
**Emoji a reemplazar:**
- 📋 → `<FileText className="w-5 h-5" />`

**Import:**
```tsx
import { FileText } from 'lucide-react';
```

### 3. src/components/dashboard/VoluntarioDashboard.tsx
**Emojis a reemplazar:**
- 📚 → `<BookOpen className="w-16 h-16" />`
- 📝 → `<FileEdit className="w-5 h-5" />`
- 📋 → `<List className="w-5 h-5" />`

**Import:**
```tsx
import { BookOpen, FileEdit, List } from 'lucide-react';
```

### 4. src/app/dashboard/ninos/[ninoId]/page.tsx
**Emojis a reemplazar:**
- 📚 → `<BookOpen className="w-5 h-5" />`
- 📝 → `<FileEdit className="w-5 h-5" />`
- 📋 → `<ClipboardList className="w-5 h-5" />`
- 🎯 → `<Target className="w-5 h-5" />`

**Import:**
```tsx
import { BookOpen, FileEdit, ClipboardList, Target } from 'lucide-react';
```

### 5. src/app/dashboard/admin/reportes/page.tsx
**Emojis a reemplazar:**
- 📊 → `<BarChart className="w-8 h-8" />`
- 👥 → `<Users className="w-8 h-8" />`
- 📚 → `<BookOpen className="w-8 h-8" />`

**Import:**
```tsx
import { BarChart, Users, BookOpen, Download } from 'lucide-react';
```

### 6. src/app/dashboard/sesiones/[sesionId]/page.tsx
**Emojis a reemplazar:**
- 📊 → `<Info className="w-5 h-5" />`
- 📝 → `<FileText className="w-5 h-5" />`

**Import:**
```tsx
import { Info, FileText } from 'lucide-react';
```

### 7. src/app/dashboard/trabajo-social/alertas/page.tsx
**Emojis a reemplazar:**
- 📚 → `<BookOpen className="w-5 h-5" />`
- 📤 → `<Send className="w-4 h-4" />`

**Import:**
```tsx
import { BookOpen, Send, AlertTriangle } from 'lucide-react';
```

## Iconos de lucide-react Recomendados

### Categorías de Uso Común

**Usuarios y Perfiles:**
- `<Users />` - Múltiples usuarios
- `<UserCheck />` - Voluntarios
- `<User />` - Usuario individual
- `<UserCog />` - Administración de usuarios

**Documentos y Archivos:**
- `<FileText />` - Documentos de texto
- `<File />` - Archivo genérico
- `<FileEdit />` - Editar archivo
- `<ClipboardList />` - Lista de tareas

**Datos y Análisis:**
- `<BarChart />` - Gráficos
- `<TrendingUp />` - Crecimiento
- `<Database />` - Base de datos
- `<Activity />` - Actividad/métricas

**Educación:**
- `<BookOpen />` - Biblioteca/lectura
- `<GraduationCap />` - Educación
- `<Target />` - Objetivos
- `<Award />` - Logros

**Acciones:**
- `<Upload />` - Subir archivos
- `<Download />` - Descargar
- `<Send />` - Enviar
- `<Save />` - Guardar

**Navegación:**
- `<Settings />` - Configuración
- `<Home />` - Inicio
- `<Building2 />` - Equipos/sedes
- `<MapPin />` - Ubicación

**Alertas y Estados:**
- `<AlertTriangle />` - Alerta/advertencia
- `<CheckCircle />` - Éxito
- `<XCircle />` - Error
- `<Info />` - Información

## Beneficios de Usar Iconos en lugar de Emojis

✅ **Más profesional** - Diseño consistente y corporativo
✅ **Mejor accesibilidad** - Iconos SVG escalables
✅ **Customizable** - Puedes cambiar colores y tamaños fácilmente
✅ **Responsive** - Se ven bien en todos los dispositivos
✅ **No depende de fuentes** - Siempre se ve igual en todos los navegadores
