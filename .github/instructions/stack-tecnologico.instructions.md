---
applyTo: '**'
---

# Stack Tecnológico - Plataforma APA

## Resumen del Stack

**Tipo de aplicación:** Web (PWA con capacidades offline)  
**Enfoque:** Mobile-first, Progressive Web App  
**Lenguaje base:** TypeScript  
**Backend:** Supabase (PostgreSQL + Auth + APIs + Storage)

---

## Frontend

### Framework Principal
**Next.js 14+ (App Router)**
- React 18+ con Server Components
- TypeScript estricto
- Routing basado en archivos
- API Routes para endpoints custom
- Optimización automática de imágenes

### Razones de elección:
- ✅ SSR y SSG para mejor rendimiento
- ✅ SEO optimizado
- ✅ API Routes integradas (reduce complejidad)
- ✅ Excelente developer experience
- ✅ Deploy simple en Vercel

### UI/Styling
**Tailwind CSS + shadcn/ui**
- **Mobile-first OBLIGATORIO** - TODA la plataforma debe funcionar perfectamente en celular
- Componentes accesibles (WCAG 2.1)
- Temas dark/light (opcional)
- Breakpoints: mobile (base), tablet (md:), desktop (lg:)
- Touch targets mínimo 44x44px
- Inputs con type adecuado (tel, email, number) para mejor teclado móvil

**Alternativas consideradas:**
- Material-UI / Chakra UI (más pesados)
- CSS Modules (menos productivo)

### Estado Global
**Zustand + React Query**
- Zustand: estado UI simple y ligero
- React Query (TanStack Query): manejo de data fetching, caché, sincronización
- Evitar Redux (overkill para este proyecto)

### Funcionalidades Offline
**PWA con Service Workers**
- Instalable en home screen (mobile)
- Caché de assets estáticos
- Sincronización en background
- Notificaciones push (Fase 3+)

**Librerías:**
```json
{
  "workbox-webpack-plugin": "^7.0.0",
  "idb": "^8.0.0"
}
```

**Estrategia de sincronización:**
1. Guardar sesiones offline en IndexedDB
2. Background sync cuando hay conexión
3. Indicador visual de estado (online/offline/sincronizando)
4. Manejo de conflictos: last-write-wins con timestamp

---

## Backend y Base de Datos

### Supabase
**PostgreSQL 15+ con extensiones:**
- `pgvector` - Para embeddings y RAG
- `uuid-ossp` - Generación de UUIDs
- RLS (Row Level Security) - Seguridad a nivel de fila

### Servicios de Supabase utilizados:

#### 1. **Database (PostgreSQL)**
Estructura de tablas principales:
```sql
-- Usuarios (ya viene con Supabase Auth)
auth.users

-- Perfiles extendidos
public.perfiles (
  id uuid references auth.users,
  rol text, -- 'voluntario' | 'coordinador' | 'psicopedagogia' | 'admin'
  zona text,
  metadata jsonb
)

-- Niños
public.ninos (
  id uuid primary key,
  nombre_completo text, -- encriptado
  alias text,
  fecha_nacimiento date, -- encriptado
  rango_etario text,
  nivel_alfabetizacion text,
  escolarizado boolean,
  metadata jsonb
)

-- Sesiones educativas
public.sesiones (
  id uuid primary key,
  nino_id uuid references ninos,
  voluntario_id uuid references perfiles,
  fecha timestamptz,
  duracion_minutos integer,
  items jsonb, -- array de observaciones
  observaciones_libres text,
  created_offline boolean,
  sincronizado_at timestamptz
)

-- Biblioteca psicopedagógica
public.documentos (
  id uuid primary key,
  titulo text,
  autor text,
  tipo text, -- 'paper' | 'guia' | 'manual'
  contenido text, -- texto extraído
  metadata jsonb,
  subido_por uuid references perfiles,
  subido_at timestamptz
)

-- Embeddings para RAG
public.document_chunks (
  id uuid primary key,
  documento_id uuid references documentos,
  chunk_text text,
  embedding vector(1536), -- OpenAI ada-002
  metadata jsonb
)
```

#### 2. **Authentication**
- Email/password (principal)
- Magic links (opcional)
- OAuth (Google) - Fase 2+
- MFA para roles sensibles (psicopedagogía, admin)

#### 3. **Storage**
- Bucket: `documentos-biblioteca` (PDFs, DOCX)
- Bucket: `exports` (reportes generados)
- Policies de acceso por rol
- Límite de tamaño: 10MB por archivo

#### 4. **Edge Functions**
Para lógica custom que requiere server:
- Procesamiento de PDFs (text extraction)
- Generación de embeddings
- Llamadas a APIs de IA (OpenAI, Anthropic)
- Generación de reportes en PDF

#### 5. **Realtime (opcional)**
- Notificaciones de sincronización
- Updates en vivo para coordinadores
- Chat de soporte (Fase 3+)

### Row Level Security (RLS)
**Políticas por tabla:**

```sql
-- Ejemplo: tabla ninos
-- Voluntarios solo ven alias y datos básicos
CREATE POLICY "voluntarios_vista_basica" ON ninos
  FOR SELECT
  USING (
    auth.jwt() ->> 'rol' = 'voluntario' 
    AND id IN (
      SELECT nino_id FROM sesiones 
      WHERE voluntario_id = auth.uid()
    )
  );

-- Psicopedagogía ve todo
CREATE POLICY "psicopedagogia_acceso_completo" ON ninos
  FOR ALL
  USING (auth.jwt() ->> 'rol' IN ('psicopedagogia', 'admin'));
```

---

## IA y Sistema RAG

### Vector Database
**Supabase Vector (pgvector)** - GRATIS
- Embeddings: Google `text-embedding-004` (768 dims) - API gratuita
- Búsqueda semántica con `<->` (distancia coseno)
- Índice HNSW para mejor performance
- Incluido en plan free de Supabase

**Alternativa si escalan:**
- OpenAI `text-embedding-3-small` (1536 dims) - ~USD 0.02/1M tokens
- Pinecone (serverless, más rápido, pero costo adicional)

### Modelo de IA Principal
**Fase 1-2: GRATUITO (ONG sin fines de lucro)**

**Opciones recomendadas:**

1. **Google Gemini 1.5 Flash (GRATIS)** ⭐ Recomendado
   - Plan gratuito: 15 requests/minuto
   - Context window: 1M tokens
   - Muy bueno para RAG y resúmenes
   - [https://ai.google.dev/pricing](https://ai.google.dev/pricing)

2. **Groq + Llama 3.3 (GRATIS)**
   - API gratuita con rate limits generosos
   - Muy rápido (inferencia optimizada)
   - [https://groq.com](https://groq.com)

3. **Hugging Face (modelos open-source)**
   - Mistral, Llama 3, Phi-3
   - Free tier o self-hosted

**Cuando escalen (con presupuesto):**
- OpenAI GPT-4o (mejor calidad)
- Anthropic Claude 3.5 Sonnet (mejor razonamiento)

### Orquestaci con Gemini (GRATIS)**
```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createRetrievalChain } from "langchain/chains/retrieval";

// Embeddings gratuitos de Google
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_AI_API_KEY,
  modelName: "text-embedding-004"
});

// Configuración del retriever
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "document_chunks",
  queryName: "match_documents"
});

// Chain para Q&A con citaciones (usando Gemini gratis)
const chain = createRetrievalChain({
  retriever: vectorStore.asRetriever(),
  combineDocsChain: createStuffDocumentsChain({
    llm: new ChatGoogleGenerativeAI({ 
      model: "gemini-1.5-flash",
      apiKey: process.env.GOOGLE_AI_API_KEY
   hain({
    llm: new ChatOpenAI({ model: "gpt-4o" }),
    prompt: SYSTEM_PROMPT_WITH_SOURCES
  })
});
```

### Prompts Estructurados
Almacenar en `/lib/prompts/`:
- `resumen-semanal.ts`
- `deteccion-patrones.ts`
- `sugerencias-intervencion.ts`
- `analisis-bibliografia.ts`

**Versionado de prompts:**
```typescript
export const RESUMEN_SEMANAL_V1 = {
  version: "1.0.0",
  template: `Eres un asistente psicopedagógico...`,
  variables: ["perfil_nino", "sesiones", "bibliografia"]
};
```

---

## Procesamiento de Documentos

### Ingesta de PDFs
**Librería:** `pdf-parse` o `pdf.js`

**Pipeline:**
1. Upload a Supabase Storage
2. Edge Function extrae texto
3. Chunking inteligente (RecursiveCharacterTextSplitter)
4. Generación de embeddings
5. Guardado en `document_chunks`

### OCR (si es necesario)
**Fase 2+:** Integración con Tesseract.js o Google Vision API
**Plan Free** para comenzar (suficiente para MVP)
  - 500 MB database
  - 1 GB storage
  - 50k usuarios activos/mes
  - 2 GB bandwidth
- Upgrade a Pro cuando sea necesario (USD 25/mes)
## Deployment

### Hosting
**Frontend: Netlify o Vercel (ambos gratuitos)**

**Netlify (Recomendado si ya lo conocés):**
- Deploy automático desde GitHub
- Edge Network global (Netlify Edge)
- Environment variables por entorno
- Preview deploys automáticos
- Split testing A/B (gratis)
- Forms y Functions integradas

**Vercel (alternativa):**
- Mejor integración con Next.js (mismos creadores)
- Edge Network global
- Serverless functions automáticas

**Backend: Supabase Cloud**
- Plan Pro (mínimo para producción)
- Backups automáticos diarios
- Point-in-time recovery

### CI/CD
**GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
- Lint (ESLint + Prettier)
- Type check (tsc)
- Tests (Vitest)
- Build
- Deploy to Netlify/Vercel (main → production)
```

**Netlify se conecta automáticamente a tu repo de GitHub, no necesitás GitHub Actions.**
 (plan gratuito)
- **Netlify Analytics** o **Vercel Analytics** - Web Vitals
- **Supabase Dashboard** - Database metrics
- **LogRocket** (opcional, Fase 3+Web Vitals
- **Supabase Dashboard** - Database metrics
- **LogRocket** (opcional) - Session replay

---

## Seguridad

### Encriptación de Datos Sensibles
**Campo `nombre_completo` y `fecha_nacimiento`:**

```typescript
import { encrypt, decrypt } from '@/lib/crypto';

// Antes de guardar en DB
const encryptedNombre = encrypt(nombreCompleto, process.env.ENCRYPTION_KEY);

// Al leer (solo roles autorizados)
GOOGLE_AI_API_KEY= # Gemini API (gratis en https://aistudio.google.com)pleto = decrypt(nino.nombre_completo, process.env.ENCRYPTION_KEY);
```

**Librería:** `crypto-js` o `tweetnacl`

### Variables de Entorno
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # Solo backend
GOOGLE_AI_API_KEY= # Gemini API (gratis en https://aistudio.google.com)
ENCRYPTION_KEY= # Para datos sensibles
```

**🔴 SEGURIDAD CRÍTICA:**

❌ **NUNCA commitear archivos con secretos:**
```bash
# Verificar que .gitignore incluya:
.env*
.env.local
.env.production
!.env.example
```

✅ **Buenas prácticas:**
- Crear `.env.example` SIN valores reales (solo nombres de variables)
- Usar `NEXT_PUBLIC_` SOLO para keys que pueden ser públicas (anon key de Supabase)
- Rotar claves si se exponen accidentalmente
- Documentar qué variables son obligatorias
- Nunca loguear valores de variables de entorno
- En Netlify: configurar variables en dashboard, NO en código

✅ **Para desarrollo local:**
1. Copiar `.env.example` a `.env.local`
2. Llenar con claves reales del dashboard de Supabase/Google AI
3. NUNCA commitear `.env.local`

✅ **Para producción (Netlify):**
1. Site settings → Environment variables
2. Agregar todas las variables necesarias
3. Marcar como "sensitive" las claves privadas
4. NO usar secrets en build logs

**NUNCA** commitear `.env.local`

### Headers de Seguridad
```typescript
// next.config.js
headers: [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
    ]
  }
]
```

---

## Testing

### Unit Tests
**Vitest + Testing Library**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### E2E Tests
**Playwright (Fase 2+)**
- Flujo de registro de sesión
- Login/logout
- Sincronización offline→online

### Coverage mínimo
- Lógica de negocio: 80%+
- Componentes críticos: 70%+
- Utils: 90%+

---

## Estructura del Proyecto

```
plataformaAPA/
├── .github/
│   ├── workflows/          # CI/CD
│   └── instructions/       # Docs de proyecto
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── registro/
│   ├── (dashboard)/
│   │   ├── sesiones/
│   │   ├── ninos/
│   │   └── reportes/
│   ├── api/                # API Routes
│   │   ├── sesiones/
│   │   ├── ia/
│   │   └── sync/
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── forms/
│   └── layouts/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── database.types.ts
│   ├── ia/
│   │   ├── rag.ts
│   │   ├── prompts/
│   │   └── embeddings.ts
│   ├── sync/               # Offline sync logic
│   └── utils/
├── supabase/
│   ├── migrations/         # SQL migrations
│   ├── functions/          # Edge Functions
│   └── seed.sql           # Datos de prueba
├── public/
├── tests/
└── types/
```

---

## Dependencias google-genai": "^0.0.19

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "typescript": "^5.4.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "langchain": "^0.2.0",
    "@langchain/openai": "^0.1.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.35.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.51.0",
    "date-fns": "^3.6.0",
    "pdf-parse": "^1.1.1",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "@testing-library/react": "^15.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0"
  }
}
```

---

## Roadmap de Implementación

### Fase 1 - MVP Core (4-6 semanas)
1. Setup Next.js + Supabase
2. Auth y roles
3. CRUD sesiones (con offline)
4. Vista básica de niños
5. Deploy a Vercel

### Fase 2 - IA y RAG (3-4 semanas)
1. Integración OpenAI
2. Upload de documentos
3. Pipeline de embeddings
4. Chat Q&A con citas
5. Resúmenes semanales

### Fase 3 - Features Avanzados (4-6 semanas)
1. Dashboards para coordinadores
2. Generación de reportes PDF
3. Sistema de alertas
4. Optimizaciones de performance
5. Testing completo

---
### 🎉 Fase MVP (Primeros 6-12 meses): **USD 0/mes**

**Supabase Free:**
- ✅ 500 MB database (suficiente para ~10,000 sesiones)
- ✅ 1 GB storage (para documentos)
- ✅ 50k usuarios activos/mes
- ✅ Gratis para siempre

**Netlify Free / Vercel Hobby:**
- ✅ Deploy automático desde GitHub
- ✅ 100 GB bandwidth/mes
- ✅ SSL automáticoe contexto
- ✅ Gratis hasta 1,500 requests/día

**Embeddings con Gemini:**
- ✅ API de embeddings gratuita
- ✅ text-embedding-004 (768 dims)

**Vercel Hobby:**
- ✅ Deploy automático
- ✅ 100 GB bandwidth/mes
- ✅ Gratis para siempre

**Total Fase MVP:** 🎁 **USD 0/mes**

---

### 💰 Cuando escalen (>50 voluntarios, >100 niños):

**Supabase Pro:** USD 25/mes
- 8 GB database
- 100 GB bandwidth
- Backups point-in-time

**OpenAI/Claude (opcional):** USD 50-100/mes
- Si necesitan mejor calidad de análisis

**Total con escala:** USD 25-12D 20/mes
- Plan Hobby gratuito suficiente para MVP

**Total estimado:** USD 85-155/mes

---

## Consideraciones de Escalabilidad

**Base de datos:**
- Particionamiento de tabla `sesiones` por fecha (>100k registros)
- Índices en campos de búsqueda frecuente
- Read replicas (Supabase Enterprise)

**Caché:**
- Edge caching en Vercel
- Redis si necesitamos caché custom (Upstash)

**CDN:**
- Vercel Edge Network (incluido)
- Cloudflare (si necesitamos más control)

---

## Referencias Técnicas

**Documentación oficial:**
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [LangChain.js Docs](https://js.langchain.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)

**Tutoriales relevantes:**
- [Building a RAG with Supabase Vector](https://supabase.com/docs/guides/ai/vector-columns)
- [Next.js + Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Offline-first with IndexedDB](https://web.dev/indexeddb/)
