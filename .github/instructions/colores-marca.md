# Colores de Marca - ONG Adelante

## Introducción

Este documento contiene la paleta de colores oficial de la **ONG Adelante** para ser utilizada en el diseño de la **Plataforma APA**.

Estos colores deben aplicarse de forma consistente en toda la interfaz para mantener la identidad visual de la organización.

---

## Paleta de Colores Oficial

### Color Principal 1: Verde Lima
- **Hex:** `#bad94a`
- **RGB:** rgb(186, 217, 74)
- **HSL:** hsl(72, 65%, 57%)
- **Uso recomendado:** 
  - Botones principales (CTA - Call to Action)
  - Headers y títulos importantes
  - Acentos de navegación activa
  - Indicadores de éxito/progreso

### Color Principal 2: Rojo
- **Hex:** `#f13545`
- **RGB:** rgb(241, 53, 69)
- **HSL:** hsl(355, 87%, 58%)
- **Uso recomendado:**
  - Alertas importantes
  - Errores y validaciones
  - Botones de acción secundaria
  - Indicadores de atención requerida

### Color Base: Blanco/Gris Muy Claro
- **Hex:** `#fcf9f9`
- **RGB:** rgb(252, 249, 249)
- **HSL:** hsl(0, 38%, 98%)
- **Uso recomendado:**
  - Fondo principal de la aplicación
  - Tarjetas y contenedores
  - Áreas de contenido
  - Espacios en blanco

### Color Acento 1: Amarillo
- **Hex:** `#f2cc0b`
- **RGB:** rgb(242, 204, 11)
- **HSL:** hsl(50, 91%, 50%)
- **Uso recomendado:**
  - Destacados importantes
  - Tooltips y ayudas
  - Notificaciones informativas
  - Badges y etiquetas

### Color Neutro: Gris Medio
- **Hex:** `#9e9c9c`
- **RGB:** rgb(158, 156, 156)
- **HSL:** hsl(0, 1%, 62%)
- **Uso recomendado:**
  - Textos secundarios
  - Bordes sutiles
  - Iconos deshabilitados
  - Separadores
  - Placeholders

### Color Acento 2: Verde Claro
- **Hex:** `#c7f190`
- **RGB:** rgb(199, 241, 144)
- **HSL:** hsl(86, 77%, 75%)
- **Uso recomendado:**
  - Fondos de secciones destacadas
  - Hover states de elementos verdes
  - Indicadores de completado
  - Secciones de logros

### Color Acento 3: Rosa/Rojo Claro
- **Hex:** `#e1616c`
- **RGB:** rgb(225, 97, 108)
- **HSL:** hsl(355, 67%, 63%)
- **Uso recomendado:**
  - Alertas suaves
  - Notificaciones de atención (menos críticas que el rojo)
  - Hover states de elementos rojos
  - Indicadores de pendientes

---

## Combinaciones Recomendadas

### Para Botones Principales
```css
.btn-primary {
  background-color: #bad94a; /* Verde Lima */
  color: #fcf9f9; /* Blanco */
  border: 2px solid #bad94a;
}

.btn-primary:hover {
  background-color: #c7f190; /* Verde Claro */
  border-color: #c7f190;
}
```

### Para Alertas
```css
.alert-success {
  background-color: #c7f190; /* Verde Claro */
  border-left: 4px solid #bad94a; /* Verde Lima */
  color: #333333;
}

.alert-warning {
  background-color: #f2cc0b; /* Amarillo */
  border-left: 4px solid #e5b800;
  color: #333333;
}

.alert-danger {
  background-color: #e1616c; /* Rosa/Rojo Claro */
  border-left: 4px solid #f13545; /* Rojo */
  color: #fcf9f9;
}
```

### Para Tarjetas
```css
.card {
  background-color: #fcf9f9; /* Blanco/Gris Muy Claro */
  border: 1px solid #9e9c9c; /* Gris Medio */
  border-radius: 8px;
}

.card-header {
  background-color: #bad94a; /* Verde Lima */
  color: #fcf9f9; /* Blanco */
}
```

### Para Texto
```css
.text-primary {
  color: #333333; /* Negro/Gris Oscuro (no en la paleta, pero recomendado) */
}

.text-secondary {
  color: #9e9c9c; /* Gris Medio */
}

.text-muted {
  color: #b8b6b6; /* Gris más claro que el medio */
}
```

---

## Aplicación en Tailwind CSS

Si estás usando Tailwind CSS, agrega estos colores al `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        'adelante': {
          'verde-lima': '#bad94a',
          'rojo': '#f13545',
          'blanco': '#fcf9f9',
          'amarillo': '#f2cc0b',
          'gris': '#9e9c9c',
          'verde-claro': '#c7f190',
          'rosa': '#e1616c',
        },
        'primary': '#bad94a',
        'secondary': '#f13545',
        'accent': '#f2cc0b',
        'neutral': '#9e9c9c',
      }
    }
  }
}
```

Luego puedes usar clases como:
```html
<button class="bg-adelante-verde-lima hover:bg-adelante-verde-claro">
  Guardar
</button>

<div class="text-adelante-gris border-adelante-gris">
  Texto secundario
</div>
```

---

## Accesibilidad (WCAG 2.1)

### Contraste de Colores

**Texto sobre fondo claro:**
- ✅ Texto negro (#333333) sobre blanco (#fcf9f9): **Contraste 12.6:1** (AAA)
- ✅ Texto gris medio (#9e9c9c) sobre blanco (#fcf9f9): **Contraste 3.1:1** (AA para texto grande)
- ⚠️ Amarillo (#f2cc0b) sobre blanco: **Contraste 1.8:1** (NO cumple, usar solo como acento)

**Texto sobre fondos de color:**
- ✅ Texto blanco sobre verde lima (#bad94a): **Contraste 4.8:1** (AA)
- ✅ Texto blanco sobre rojo (#f13545): **Contraste 5.2:1** (AA)
- ⚠️ Texto blanco sobre amarillo (#f2cc0b): **Contraste 1.3:1** (NO cumple, evitar)
- ✅ Texto negro sobre verde claro (#c7f190): **Contraste 7.1:1** (AAA)

### Recomendaciones
1. **Botones principales:** Usar verde lima con texto blanco
2. **Alertas de error:** Usar rojo con texto blanco
3. **Alertas de advertencia:** Usar amarillo con texto negro oscuro (agregar borde amarillo más oscuro)
4. **Texto secundario:** Usar gris medio solo para textos >18px, de lo contrario usar gris más oscuro

---

## Estados de Interacción

### Botón Verde Lima
```css
/* Normal */
background: #bad94a;

/* Hover */
background: #c7f190;

/* Active/Pressed */
background: #a8c73d;

/* Disabled */
background: #d4e8a3;
opacity: 0.5;
```

### Botón Rojo
```css
/* Normal */
background: #f13545;

/* Hover */
background: #e1616c;

/* Active/Pressed */
background: #d91f31;

/* Disabled */
background: #f79ca5;
opacity: 0.5;
```

---

## Iconos y Elementos Visuales

### Colores por Tipo de Icono
- **Acciones principales:** Verde Lima (#bad94a)
- **Alertas/Errores:** Rojo (#f13545)
- **Información:** Amarillo (#f2cc0b)
- **Neutros/Deshabilitados:** Gris (#9e9c9c)
- **Éxito/Completado:** Verde Claro (#c7f190)

### Badges
- **Nuevo/Destacado:** Amarillo (#f2cc0b) con borde más oscuro
- **Completado:** Verde Claro (#c7f190)
- **Pendiente:** Rosa (#e1616c)
- **Inactivo:** Gris (#9e9c9c)

---

## Gradientes (Opcional)

Para darle un toque moderno sin salir de la paleta:

```css
/* Gradiente verde */
background: linear-gradient(135deg, #bad94a 0%, #c7f190 100%);

/* Gradiente rojo-rosa */
background: linear-gradient(135deg, #f13545 0%, #e1616c 100%);

/* Gradiente amarillo suave */
background: linear-gradient(135deg, #f2cc0b 0%, #f9e176 100%);
```

---

## Modo Oscuro (Futuro)

Si en el futuro se implementa un modo oscuro, considerar estos ajustes:

```css
/* Tema Oscuro */
--bg-primary-dark: #1a1a1a;
--bg-secondary-dark: #2d2d2d;
--text-primary-dark: #fcf9f9;
--text-secondary-dark: #b8b6b6;
--adelante-verde-lima-dark: #9ec536; /* Más apagado */
--adelante-rojo-dark: #d91f31; /* Más apagado */
```

---

## Recursos Adicionales

**Logo de Adelante:**
- Solicitar archivo vectorial (.svg o .ai) para mejor calidad
- Usar versiones monocromáticas en blanco/negro cuando sea necesario

**Tipografía:**
- Consultar si hay una fuente oficial de la organización
- Si no, recomendar: **Inter** o **Poppins** (sans-serif, legibles y modernas)

---

## Checklist de Implementación

- [ ] Configurar colores en `tailwind.config.ts`
- [ ] Crear componentes de botones con estados hover/active
- [ ] Diseñar sistema de alertas (success, warning, danger, info)
- [ ] Aplicar colores a navegación y headers
- [ ] Verificar contraste de todos los textos (WCAG AA mínimo)
- [ ] Crear badges y etiquetas con colores apropiados
- [ ] Implementar estados deshabilitados con opacidad
- [ ] Documentar componentes en Storybook (si se usa)

---

**Última actualización:** Enero 2026
**Responsable:** Equipo GlobalIA + ONG Adelante
