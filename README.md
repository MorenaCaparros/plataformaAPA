# Plataforma APA

Sistema de seguimiento y acompañamiento educativo con IA desarrollado por GlobalIA en colaboración con la ONG Adelante.

## Stack Tecnológico

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **IA:** Google Gemini 1.5 Flash (gratuito)
- **Deploy:** Netlify

## Primeros pasos

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_AI_API_KEY=your_gemini_api_key
```

3. Ejecutar servidor de desarrollo:
```bash
npm run dev
```

4. Abrir [http://localhost:3000](http://localhost:3000)

## Documentación

- [Instrucciones técnicas](./.github/instructions/instrucciones.instructions.md)
- [Stack tecnológico](./.github/instructions/stack-tecnologico.instructions.md)
- [Contexto del proyecto](./.github/instructions/contexto-proyecto.md)
- [Migraciones de base de datos](./supabase/README.md)

## Desarrollo

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```
