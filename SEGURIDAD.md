# 🔐 SEGURIDAD - Plataforma APA

## ⚠️ ADVERTENCIA CRÍTICA

Este proyecto maneja **información extremadamente sensible** de menores de edad en contextos vulnerables. La seguridad no es opcional.

---

## 🚨 Reglas de Oro (NUNCA Violar)

### 1. NUNCA Subir Claves Secretas al Repositorio

❌ **Está absolutamente PROHIBIDO:**
- Claves de API (Google AI, OpenAI, Supabase Service Role, etc.)
- Tokens de autenticación
- Contraseñas
- Claves de encriptación
- URLs con tokens embebidos
- Archivos `.env.local` o `.env.production`

✅ **Siempre hacer:**
- Usar variables de entorno locales (`.env.local`)
- Verificar `.gitignore` antes de cada commit
- Usar `NEXT_PUBLIC_` solo para claves que DEBEN ser públicas
- Configurar secrets en Netlify/Vercel para producción
- Rotar claves inmediatamente si se exponen

### 2. Proteger Datos de Menores

⚠️ **Información de niños es de máxima sensibilidad:**

**OBLIGATORIO:**
- ✅ Encriptar nombres completos y fechas de nacimiento
- ✅ Validar roles y permisos en CADA operación
- ✅ Implementar Row Level Security (RLS) en Supabase
- ✅ Nunca loguear datos personales identificables
- ✅ Minimizar exposición en APIs
- ✅ Auditar accesos a datos sensibles

**PROHIBIDO:**
- ❌ Exponer datos completos sin autenticación
- ❌ Guardar datos sensibles en logs o consola
- ❌ Usar datos reales en ejemplos o tests
- ❌ Cachear datos sin protección
- ❌ Compartir datos fuera de la plataforma sin anonimizar

---

## ✅ Checklist Pre-Commit

**Antes de CADA commit, verificar:**

```
[ ] ¿Hay archivos .env* en el staging area?
[ ] ¿Hay API keys o tokens en el código?
[ ] ¿Las nuevas APIs validan roles correctamente?
[ ] ¿Los datos sensibles están encriptados?
[ ] ¿Se implementó RLS en nuevas tablas?
[ ] ¿Los logs NO contienen información personal?
[ ] ¿La documentación NO tiene valores reales?
```

**Comando para verificar:**
```bash
# Ver qué archivos estás por commitear
git status

# Revisar cambios específicos
git diff

# Verificar que .env.local NO esté incluido
git ls-files | grep -E "\.env\.local|\.env\.production"
# (debe devolver vacío)
```

---

## 🔧 Configuración de Variables de Entorno

### Desarrollo Local

1. **Copiar template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Llenar con valores reales:**
   - Obtener keys de Supabase Dashboard
   - Obtener API key de Google AI Studio
   - Generar clave de encriptación única

3. **NUNCA commitear `.env.local`**

### Producción (Netlify)

1. Ir a: `Site settings → Environment variables`
2. Agregar cada variable individualmente
3. Marcar como "sensitive" las claves privadas
4. NO usar secrets en build logs públicos

---

## 🚨 En Caso de Exposición Accidental

**Si subiste un secreto por error:**

1. **🔴 NO BORRAR EL COMMIT** (queda en historial de Git)

2. **Rotar la clave INMEDIATAMENTE:**
   - Supabase: regenerar Service Role Key
   - Google AI: revocar y crear nueva API key
   - Encriptación: generar nueva clave

3. **Revocar acceso de la clave comprometida**

4. **Limpiar historial de Git:**
   ```bash
   # Opción 1: BFG Repo Cleaner (recomendado)
   bfg --delete-files .env.local
   
   # Opción 2: git filter-branch
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push
   git push origin --force --all
   ```

5. **Notificar al equipo**

6. **Actualizar todas las instancias con nuevas claves**

---

## 📚 Referencias

- [Instrucciones Técnicas](./.github/instructions/instrucciones.instructions.md)
- [Stack Tecnológico](./.github/instructions/stack-tecnologico.instructions.md)
- [Contexto del Proyecto](./.github/instructions/contexto-proyecto.md)
- [Supabase Security](https://supabase.com/docs/guides/auth/managing-user-data)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🤝 Responsabilidad Compartida

**Todos en el equipo somos responsables de:**
- Proteger los datos de los niños
- Mantener las claves seguras
- Reportar problemas de seguridad
- Seguir las mejores prácticas

**Ante cualquier duda sobre seguridad, PREGUNTAR antes de actuar.**

---

## 📞 Contacto de Seguridad

Si detectás un problema de seguridad:
1. NO publicar en issues públicos
2. Contactar directamente al equipo de GlobalIA
3. Documentar el problema en privado
4. Esperar instrucciones antes de actuar
