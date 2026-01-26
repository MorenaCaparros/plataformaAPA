---
applyTo: 'src/**/*.tsx,src/**/*.css'
---

# Guía de Diseño UI - Plataforma APA

## Filosofía: "Luminiscencia Orgánica Flotante"

La interfaz debe ser **cálida, humana y moderna**. Contenedores de luz que flotan en un espacio seguro, sin rigidez ni frialdad corporativa. **Elemento flotante, NO estructura de bloque.**

### Principios Fundamentales del Diseño "Floating Organic"

1. **Todo Flota** - Ningún elemento debe tocar los bordes de la pantalla. Los componentes principales (sidebar, tarjetas, modales) tienen márgenes generosos y parecen flotar sobre el fondo.

2. **Sombras de Color (Glow)** - NO usar sombras grises/negras estándar. Las sombras deben ser del mismo color que el acento del elemento, creando efecto de bioluminiscencia: "Adelante ilumina".

3. **Bordes Suaves (Rounded)** - Todo debe tener esquinas muy redondeadas (rounded-3xl o más). Nada de esquinas filosas o cuadradas.

4. **Vidrio Esmerilado (Glassmorphism)** - Los elementos principales usan `bg-white/60 backdrop-blur-xl` para parecer vidrio flotante.

5. **Paleta Exclusiva** - SOLO usar los colores del logo de Adelante: Amarillo (#F2C94C), Verde (#A4C639), Rojo (#E63946). **Prohibido usar violetas, azules, o cualquier color fuera de la marca.**

---

## Paleta de Colores (Extraída del Logo Adelante)

### Colores Principales

```typescript
colors: {
  // Sol Adelante (Primario Cálido)
  'sol': {
    50: '#FFF9E6',
    100: '#FFF2CC',
    200: '#FFE599',
    300: '#FFD966',
    400: '#F2C94C', // Principal - El sol del logo
    500: '#E6B800',
    600: '#CC9900',
    700: '#997300',
    800: '#664D00',
    900: '#332600',
  },
  
  // Crecimiento (Primario Acción)
  'crecimiento': {
    50: '#F5F9E8',
    100: '#EBF3D1',
    200: '#D7E7A3',
    300: '#C3DB75',
    400: '#A4C639', // Principal - El tallo del logo
    500: '#8CAF2E',
    600: '#6F8B24',
    700: '#53681B',
    800: '#384612',
    900: '#1C2309',
  },
  
  // Impulso (Acento)
  'impulso': {
    50: '#FDEAEC',
    100: '#FBD5D9',
    200: '#F7ABB3',
    300: '#F3818D',
    400: '#E63946', // Principal - La sonrisa del logo
    500: '#D32F3E',
    600: '#A62531',
    700: '#7A1B25',
    800: '#4D1218',
    900: '#27090C',
  },
  
  // Neutros Orgánicos
  'neutro': {
    lienzo: '#F9F7F3',      // Fondo general (hueso/crema, NO blanco)
    carbon: '#2D3436',      // Texto principal (NO negro puro)
    piedra: '#636E72',      // Texto secundario
    vidrio: 'rgba(255, 255, 255, 0.7)', // Superficies flotantes
  }
}
```

### Asignación de Colores por Contexto

**Regla de Oro:** Cada sección/funcionalidad tiene un color asignado del logo:

- **Niños** 👦 → Rojo (`impulso-400`) + fondo `bg-impulso-50`
- **Sesiones** 📝 → Amarillo (`sol-400`) + fondo `bg-sol-50`
- **Usuarios/Equipos** 👥 → Verde (`crecimiento-400`) + fondo `bg-crecimiento-50`
- **Biblioteca** 📚 → Amarillo (`sol-400`) + fondo `bg-sol-50`
- **Alertas/Warnings** ⚠️ → Rojo (`impulso-400`)
- **Éxito/Progreso** ✅ → Verde (`crecimiento-400`)

**Prohibido:** Usar violetas, índigos, azules, o cualquier color que no esté en el logo de Adelante.

---

## Componentes Globales

### 1. Tarjetas con Sombra de Color (Glow Effect)

**Concepto:** Las tarjetas emiten luz propia del color de su acento (bioluminiscencia).

```tsx
// Tarjeta de Niños (Rojo/Impulso)
<div className="
  relative group
  bg-white/60 
  backdrop-blur-md 
  rounded-[2rem]
  border border-white/60
  p-6
  transition-all duration-300
  shadow-xl shadow-impulso-500/5
  hover:shadow-impulso-500/10
  hover:-translate-y-1
">
  {/* Ícono con fondo suave del mismo color */}
  <div className="
    h-14 w-14 
    rounded-2xl 
    bg-impulso-50 
    flex items-center justify-center 
    mb-4 
    text-impulso-500
    group-hover:scale-110 
    transition-transform
  ">
    <IconoNiño size={28} strokeWidth={2.5} />
  </div>

  {/* Título con fuente Rounded */}
  <h3 className="font-quicksand font-bold text-2xl text-neutro-carbon">
    39
  </h3>
  <p className="font-medium text-neutro-piedra text-sm">Niños Activos</p>

  {/* Decoración sutil - punto pulsante */}
  <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-impulso-400 animate-pulse" />
</div>

// Tarjeta de Sesiones (Amarillo/Sol)
<div className="
  bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6
  transition-all duration-300
  shadow-xl shadow-sol-500/5 hover:shadow-sol-500/10
  hover:-translate-y-1
">
  <div className="h-14 w-14 rounded-2xl bg-sol-50 flex items-center justify-center mb-4 text-sol-500">
    <IconoSesion size={28} />
  </div>
  {/* ... */}
</div>

// Tarjeta de Equipos (Verde/Crecimiento)
<div className="
  bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6
  transition-all duration-300
  shadow-xl shadow-crecimiento-500/5 hover:shadow-crecimiento-500/10
  hover:-translate-y-1
">
  <div className="h-14 w-14 rounded-2xl bg-crecimiento-50 flex items-center justify-center mb-4 text-crecimiento-500">
    <IconoEquipo size={28} />
  </div>
  {/* ... */}
</div>
```

**Utilidades de Sombra de Color en Tailwind:**
```typescript
// En tailwind.config.ts
boxShadow: {
  'glow-sol': '0 8px 32px rgba(242, 201, 76, 0.15)',
  'glow-sol-lg': '0 12px 48px rgba(242, 201, 76, 0.25)',
  'glow-crecimiento': '0 8px 32px rgba(164, 198, 57, 0.15)',
  'glow-crecimiento-lg': '0 12px 48px rgba(164, 198, 57, 0.25)',
  'glow-impulso': '0 8px 32px rgba(230, 57, 70, 0.15)',
  'glow-impulso-lg': '0 12px 48px rgba(230, 57, 70, 0.25)',
}
```

### 2. Navegación: "Isla Flotante Despegada"

**Regla Crítica:** El sidebar NO debe tocar los bordes. Debe flotar con márgenes.

```tsx
<aside className="
  fixed 
  left-4 top-4 bottom-4          // ← Despegado 1rem de todos los bordes
  w-64
  h-[calc(100vh-2rem)]           // ← Altura calculada
  bg-white/80                     // ← NO bg-white sólido
  backdrop-blur-xl               // ← Vidrio esmerilado
  rounded-3xl                    // ← Súper redondeado
  border border-white/50
  shadow-lg shadow-sol-500/10    // ← Sombra de color
  p-4
  transition-all duration-300
  data-[collapsed=true]:w-20
">
  {/* Logo con gradiente de marca */}
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sol-400 to-crecimiento-400 flex items-center justify-center shadow-glow-sol">
      <span className="text-white font-quicksand font-bold text-xl">A</span>
    </div>
    <span className="font-quicksand font-bold text-xl text-neutro-carbon">Adelante</span>
  </div>

  {/* Navegación con estado activo */}
  <nav className="space-y-2">
    <Link href="/dashboard/ninos" className="
      flex items-center gap-3 px-3 py-3 rounded-2xl
      transition-all duration-200
      text-neutro-piedra
      hover:bg-impulso-50 hover:text-impulso-600
      data-[active=true]:bg-gradient-to-r 
      data-[active=true]:from-impulso-400 
      data-[active=true]:to-impulso-500 
      data-[active=true]:text-white 
      data-[active=true]:shadow-glow-impulso
    ">
      <IconoNiño className="w-5 h-5" />
      <span className="font-dm-sans font-medium">Niños</span>
    </Link>

    <Link href="/dashboard/sesiones" className="
      flex items-center gap-3 px-3 py-3 rounded-2xl
      transition-all duration-200
      text-neutro-piedra
      hover:bg-sol-50 hover:text-sol-600
      data-[active=true]:bg-gradient-to-r 
      data-[active=true]:from-sol-400 
      data-[active=true]:to-sol-500 
      data-[active=true]:text-white 
      data-[active=true]:shadow-glow-sol
    ">
      <IconoSesion className="w-5 h-5" />
      <span className="font-dm-sans font-medium">Sesiones</span>
    </Link>

    <Link href="/dashboard/equipos" className="
      flex items-center gap-3 px-3 py-3 rounded-2xl
      transition-all duration-200
      text-neutro-piedra
      hover:bg-crecimiento-50 hover:text-crecimiento-600
      data-[active=true]:bg-gradient-to-r 
      data-[active=true]:from-crecimiento-400 
      data-[active=true]:to-crecimiento-500 
      data-[active=true]:text-white 
      data-[active=true]:shadow-glow-crecimiento
    ">
      <IconoEquipo className="w-5 h-5" />
      <span className="font-dm-sans font-medium">Equipos</span>
    </Link>
  </nav>
</aside>

{/* Spacer para que el contenido no quede tapado */}
<div className="hidden lg:block w-72" />
```

### 3. Botones Principales

```tsx
// CTA Principal (Verde Crecimiento)
<button className="
  bg-gradient-to-r from-crecimiento-400 to-crecimiento-500
  text-white
  font-medium
  px-6 py-3
  rounded-2xl
  shadow-glow-crecimiento
  hover:shadow-glow-crecimiento-lg
  hover:translate-y-[-1px]
  transition-all duration-200
  active:scale-95
">
  Acción Principal
</button>

// CTA Secundario
<button className="
  bg-white/60
  backdrop-blur-lg
  border border-crecimiento-400/30
  text-crecimiento-700
  font-medium
  px-6 py-3
  rounded-2xl
  hover:bg-crecimiento-50/80
  transition-all duration-200
">
  Acción Secundaria
</button>

// Alerta/Peligro (Rojo Impulso)
<button className="
  bg-gradient-to-r from-impulso-400 to-impulso-500
  text-white
  font-medium
  px-6 py-3
  rounded-2xl
  shadow-glow-impulso
  hover:shadow-glow-impulso-lg
  transition-all duration-200
">
  Alerta
</button>
```

### 4. Inputs y Formularios

```tsx
<input className="
  w-full
  bg-white/60
  backdrop-blur-lg
  border border-neutro-piedra/20
  rounded-2xl
  px-4 py-3
  text-neutro-carbon
  placeholder:text-neutro-piedra
  focus:border-crecimiento-400
  focus:ring-4 focus:ring-crecimiento-400/10
  focus:outline-none
  transition-all duration-200
" />
```

### Badges y Tags

```tsx
// Estado activo/éxito
<span className="
  inline-flex items-center
  px-3 py-1
  rounded-full
  bg-sol-400/20
  text-sol-700
  text-xs font-medium
  border border-sol-400/30
">
  Activo
</span>

// En proceso
<span className="
  inline-flex items-center
  px-3 py-1
  rounded-full
  bg-crecimiento-400/20
  text-crecimiento-700
  text-xs font-medium
  border border-crecimiento-400/30
">
  En proceso
</span>

// Alerta
<span className="
  inline-flex items-center
  px-3 py-1
  rounded-full
  bg-impulso-400/20
  text-impulso-700
  text-xs font-medium
  border border-impulso-400/30
">
  Urgente
</span>
```

---

## Tipografía: Humanidad y Calidez

### Fuentes Redondeadas (Anti-Corporativo)

**Regla:** El logo de Adelante es manuscrito y cálido. Necesitamos fuentes que dialoguen con esa calidez sin ser infantiles.

**Títulos (Humanidad):**
- **Primaria:** `Quicksand` - Rounded sans, perfecta para ONG
- **Alternativa:** `Nunito`, `M PLUS Rounded 1c`
- **Import:** `@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');`
- **Uso:** Títulos principales ("Panel de Administración", "Hola Director"), nombres propios, CTAs

**Cuerpo/Datos (Claridad):**
- **Primaria:** `Outfit` - Limpia pero con bordes suaves
- **Alternativa:** `DM Sans`, `Nunito` (regular)
- **Import:** `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');`
- **Uso:** Párrafos, datos, labels, descripciones

**Por qué NO usar Inter/Roboto:** Son muy "tech startup", tienen bordes filosos. Queremos suavidad.

### Jerarquía

```css
/* Títulos principales */
h1: font-quicksand text-4xl font-bold text-neutro-carbon leading-tight
h2: font-quicksand text-3xl font-bold text-neutro-carbon
h3: font-quicksand text-2xl font-semibold text-neutro-carbon

/* Subtítulos y labels */
h4: font-quicksand text-xl font-semibold text-neutro-carbon
h5: font-outfit text-lg font-medium text-neutro-carbon

/* Cuerpo */
body: font-outfit text-base text-neutro-carbon leading-relaxed
small: font-outfit text-sm text-neutro-piedra

/* Datos numéricos (stats) */
.stat-number: font-quicksand text-3xl font-bold
```

**En Tailwind Config:**
```typescript
fontFamily: {
  'quicksand': ['Quicksand', 'sans-serif'],
  'outfit': ['Outfit', 'sans-serif'],
  'nunito': ['Nunito', 'sans-serif'], // Backup
  'dm-sans': ['DM Sans', 'sans-serif'], // Backup
}
```

---

## Background: Fondo "Vivo"

### Color Base

**Prohibido:** `bg-white` o `bg-gray-50` (demasiado frío/clínico).

**Correcto:** `bg-neutro-lienzo` (#F9F7F3) - Tono hueso/crema cálido.

```css
/* En globals.css */
:root {
  background-color: #F9F7F3; /* Lienzo cálido */
}
```

### Blobs Animados (Profundidad y Luz)

Los "blobs" son manchas de color muy difuminadas que crean sensación de profundidad y luz solar entrando. **Deben ser sutiles**, no deben competir con el contenido.

```tsx
// Componente AnimatedBackground.tsx
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  {/* Fondo base */}
  <div className="absolute inset-0 bg-neutro-lienzo" />
  
  {/* Blob 1: Luz amarilla arriba a la izquierda */}
  <div className="
    absolute -top-40 -left-40 
    w-96 h-96 
    bg-sol-400/20           /* Muy transparente */
    rounded-full 
    blur-3xl                /* Mucho blur */
    animate-blob
  " />
  
  {/* Blob 2: Luz verde abajo a la derecha */}
  <div className="
    absolute -bottom-40 -right-40 
    w-96 h-96 
    bg-crecimiento-400/15   /* Aún más sutil */
    rounded-full 
    blur-3xl
    animate-blob 
    animation-delay-2000    /* Desfasado del primero */
  " />
  
  {/* Blob 3: Luz roja centro (opcional, muy sutil) */}
  <div className="
    absolute top-1/2 left-1/2 
    -translate-x-1/2 -translate-y-1/2
    w-[500px] h-[500px] 
    bg-impulso-400/8        /* Casi imperceptible */
    rounded-full 
    blur-3xl
    animate-blob 
    animation-delay-4000
  " />
</div>
```

**Animación de Blob:**
```typescript
// En tailwind.config.ts
keyframes: {
  blob: {
    '0%, 100%': {
      transform: 'translate(0px, 0px) scale(1)',
    },
    '33%': {
      transform: 'translate(30px, -50px) scale(1.1)',
    },
    '66%': {
      transform: 'translate(-20px, 20px) scale(0.9)',
    },
  }
},
animation: {
  blob: 'blob 20s ease-in-out infinite',
}
```

**Delays:**
```css
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
```

---

## Background: "Lienzo Vivo"

```tsx
// En el layout principal
<div className="
  fixed inset-0 -z-10
  bg-neutro-lienzo
  overflow-hidden
">
  {/* Blob 1 - Amarillo */}
  <div className="
    absolute -top-40 -right-40
    w-96 h-96
    bg-sol-400/20
    rounded-full
    blur-3xl
    animate-blob
  " />
  
  {/* Blob 2 - Verde */}
  <div className="
    absolute -bottom-40 -left-40
    w-96 h-96
    bg-crecimiento-400/20
    rounded-full
    blur-3xl
    animate-blob animation-delay-2000
  " />
  
  {/* Noise Texture (opcional) */}
  <div className="
    absolute inset-0
    bg-[url('/noise.png')]
    opacity-[0.015]
    mix-blend-overlay
  " />
</div>
```

**Animación Blob (tailwind.config.ts):**
```typescript
animation: {
  blob: "blob 20s infinite",
},
keyframes: {
  blob: {
    "0%": { transform: "translate(0px, 0px) scale(1)" },
    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
    "100%": { transform: "translate(0px, 0px) scale(1)" },
  },
}
```

---

## Transiciones y Micro-interacciones

### Transiciones Líquidas

```tsx
// Al montar componentes
className="
  animate-in fade-in zoom-in-95 slide-in-from-bottom-4
  duration-500
"

// Al desmontar
className="
  animate-out fade-out zoom-out-95 slide-out-to-top-4
  duration-300
"
```

### Hover Magnético (Botones)

```tsx
onMouseMove={(e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  e.currentTarget.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translate(0, 0)';
}}
```

### Micro-interacción "Abrazo" (Completar tarea)

```tsx
// Al hacer click en botón de completar
className="
  active:scale-95
  data-[completed=true]:animate-pulse
"
```

---

## Responsive (Mobile-First)

**CRÍTICO:** Toda la plataforma DEBE funcionar perfectamente en móviles.

### Breakpoints

```typescript
screens: {
  'sm': '640px',  // Teléfonos grandes
  'md': '768px',  // Tablets
  'lg': '1024px', // Laptops
  'xl': '1280px', // Desktops
  '2xl': '1536px' // Pantallas grandes
}
```

### Reglas Mobile-First

1. **Touch targets mínimo 44x44px**
2. **Textos legibles sin zoom** (mínimo 16px en móvil)
3. **Navegación adaptable:**
   - Mobile: Bottom navigation bar
   - Desktop: Sidebar flotante
4. **Formularios optimizados:**
   - Input types correctos (tel, email, number)
   - Teclado móvil apropiado
5. **Espaciado generoso en móvil:**
   - Padding mínimo: p-4 en mobile, p-6 en desktop

---

## Logo Adelante

**Ubicación:**
- Sidebar: Top left, siempre visible
- Mobile: Center del navbar superior
- Login: Center, tamaño destacado

**Tamaños:**
- Mobile: h-12 (48px)
- Desktop: h-16 (64px)
- Login: h-24 (96px)

---

## Accesibilidad

- **Contraste:** Todos los textos deben tener contraste WCAG AA mínimo
- **Focus visible:** Anillos de foco con colores de marca
- **Aria labels:** En todos los botones de íconos
- **Keyboard navigation:** Tab order lógico

---

## NO HACER ❌

1. **NO usar negro puro (#000000)** → Usar Carbón (#2D3436)
2. **NO usar blanco puro (#FFFFFF)** → Usar Lienzo (#F9F7F3) o Vidrio
3. **NO usar sombras negras duras** → Usar sombras de color (glow)
4. **NO usar `rounded-lg` básico** → Usar `rounded-2xl` o `rounded-3xl`
5. **NO hacer componentes rígidos** → Siempre flotar, suavizar, difuminar
6. **NO ignorar mobile** → SIEMPRE diseñar mobile-first
7. **NO usar fuentes frías** (Helvetica, Arial) → Usar Nunito + DM Sans

---

## Checklist de Implementación

- [ ] Configurar colores custom en `tailwind.config.ts`
- [ ] Importar fuentes (Nunito + DM Sans)
- [ ] Crear componentes globales:
  - [ ] Card (contenedor de luz)
  - [ ] Button (primario, secundario, alerta)
  - [ ] Badge
  - [ ] Input
  - [ ] Sidebar flotante colapsable
- [ ] Implementar background con blobs animados
- [ ] Agregar logo en navbar/sidebar
- [ ] Testear responsive en todos los tamaños
- [ ] Validar contraste de colores
- [ ] Agregar transiciones líquidas

---

**Fecha de creación:** 25 de Enero, 2026  
**Estado:** 🎨 Guía de Diseño Oficial
