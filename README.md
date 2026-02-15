# 🎓 Plataforma APA

**Sistema de gestión y seguimiento educativo con IA**  
Desarrollado por GlobalIA en colaboración con la ONG Adelante

Plataforma web progresiva (PWA) para el seguimiento continuo del proceso educativo de niños en contextos vulnerables, con capacidades offline y análisis inteligente de datos.

---

## 🚀 Estado del Proyecto

✅ **Base de datos:** Reestructuración completa aplicada (31 tablas relacionales)  
✅ **Backend:** Supabase con PostgreSQL + Auth + Storage  
🔄 **Frontend:** Next.js 14 + TypeScript + Tailwind CSS  
🔄 **IA/RAG:** Sistema de análisis con Google Gemini (en desarrollo)

---

## 📋 Documentación

- **[GUIA_REESTRUCTURACION_RELACIONAL.md](./GUIA_REESTRUCTURACION_RELACIONAL.md)** - Arquitectura de base de datos (31 tablas)
- **[.github/instructions/](../.github/instructions/)** - Instrucciones técnicas
  - `contexto-proyecto.md` - Objetivos y funcionalidades
  - `stack-tecnologico.md` - Stack completo
  - `instrucciones.md` - Reglas de seguridad y workflow

---

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

---

## 🔐 Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas
- **Encriptación** de datos sensibles (PII)
- **Control de acceso por roles:** voluntario, coordinador, psicopedagogía, director, admin

⚠️ **IMPORTANTE:** Nunca commitear archivos `.env*` ni exponer API keys

---

## 📚 Scripts Disponibles

```bash
npm run dev              # Desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linter
```

**Scripts de base de datos:**
```bash
npm run db:check         # Verificar salud de la BD
npm run db:verify        # Verificar migración aplicada
npm run create:coord     # Crear usuario coordinador
```

---

## 📞 Contacto

- **GlobalIA:** [contacto]
- **ONG Adelante:** [contacto]

---

**Última actualización:** Febrero 2026
