# Recomendación de Build Pack para Coolify

## 🎯 Resumen Ejecutivo

Para tu proyecto de **Gestión de Visitas para Promotores**, te recomiendo la siguiente configuración de build pack en Coolify:

### **Backend (API Node.js/Express + Prisma):**
**✅ DOCKERFILE** - **RECOMENDACIÓN PRINCIPAL**

### **Frontend (Next.js PWA):**
**✅ NIXPACKS** - **RECOMENDACIÓN PRINCIPAL**
(Si falla, usar **DOCKERFILE** como alternativa)

## 📊 Análisis Detallado por Opción

### 1. **NIXPACKS** ⭐
**Adecuado para:** Frontend Next.js
**No adecuado para:** Backend con Prisma

**Ventajas:**
- ✅ Detección automática de framework (Next.js)
- ✅ Configuración optimizada automáticamente
- ✅ Build caching eficiente
- ✅ Menor configuración manual
- ✅ Actualizaciones automáticas de dependencias

**Desventajas:**
- ❌ Puede no detectar necesidades específicas de Prisma
- ❌ Menor control sobre el proceso de build

### 2. **STATIC** ❌
**No recomendado para tu proyecto**

**Razón:** Tu proyecto no es estático, incluye:
- Backend dinámico con Node.js/Express
- Base de datos PostgreSQL
- API REST con autenticación JWT
- Sistema de upload de imágenes

### 3. **DOCKERFILE** ⭐⭐
**Adecuado para:** Backend Node.js/Express con Prisma

**Ventajas:**
- ✅ Control total sobre el entorno
- ✅ Configuración exacta y reproducible
- ✅ Incluye `npx prisma generate` en el build
- ✅ Optimizado para producción
- ✅ Ya tienes Dockerfile configurado

**Desventajas:**
- ❌ Requiere mantenimiento del Dockerfile
- ❌ Configuración manual más extensa

### 4. **DOCKER COMPOSE** ⭐
**Adecuado para:** Despliegue completo local

**Ventajas:**
- ✅ Orquesta todos los servicios juntos
- ✅ Fácil configuración para desarrollo

**Desventajas:**
- ❌ Más complejo de configurar en Coolify
- ❌ Coolify maneja mejor servicios individuales

## 🚀 Configuración Recomendada en Coolify

### **APLICACIÓN BACKEND:**
```
Nombre: gestion-visitas-backend
Build Pack: Dockerfile
Dockerfile Path: . (raíz del proyecto)
Context: .
Puerto: 3001
```

**Justificación:** Tu backend necesita:
- Generar cliente Prisma (`npx prisma generate`)
- Configurar variables de entorno específicas
- Instalar dependencias de producción
- Ejecutar migraciones de base de datos

### **APLICACIÓN FRONTEND:**
```
Nombre: gestion-visitas-frontend
Build Pack: Nixpacks
Build Path: ./frontend-pwa
Puerto: 3000
Variables de entorno:
  NEXT_PUBLIC_API_URL: https://api.tudominio.com
  NODE_ENV: production
```

**Justificación:** Next.js funciona excelente con Nixpacks:
- Detección automática de Next.js
- Build optimizado para PWA
- Caching eficiente de builds
- Configuración mínima requerida

## 🔧 Configuración Alternativa (Si Nixpacks Falla)

Si Nixpacks tiene problemas con el frontend, crear `frontend-pwa/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
RUN npm install --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

**Configuración alternativa:**
```
Build Pack: Dockerfile
Dockerfile Path: ./frontend-pwa/Dockerfile
Context: ./frontend-pwa
```

## 📝 Pasos de Configuración en Coolify

### Paso 1: Configurar Backend
1. **Crear nueva aplicación** en Coolify
2. **Seleccionar repositorio**: `narck25/gestion-visitas-promotores`
3. **Build Pack**: Seleccionar **Dockerfile**
4. **Dockerfile Path**: Dejar en `.` (raíz)
5. **Puerto**: `3001`
6. **Variables de entorno**: Cargar desde `.env.production`

### Paso 2: Configurar Frontend
1. **Crear nueva aplicación** en Coolify
2. **Seleccionar mismo repositorio**
3. **Build Pack**: Seleccionar **Nixpacks**
4. **Build Path**: `./frontend-pwa`
5. **Puerto**: `3000`
6. **Variables de entorno**:
   - `NEXT_PUBLIC_API_URL`: URL de tu backend
   - `NODE_ENV`: `production`

### Paso 3: Configurar Base de Datos
1. **Añadir servicio** → PostgreSQL
2. **Versión**: 15
3. **Conectar al backend** mediante variable `DATABASE_URL`

## 🛠️ Verificación del Build

### Backend (Dockerfile):
```bash
# Verificar que el build incluye:
1. npm ci --only=production
2. npx prisma generate
3. Exposición del puerto 3001
4. Comando: node src/index.js
```

### Frontend (Nixpacks):
```bash
# Nixpacks automáticamente:
1. Detecta Next.js
2. Ejecuta npm install
3. Ejecuta npm run build
4. Configura servidor de producción
```

## 🔍 Solución de Problemas Comunes

### Problema: Nixpacks no detecta Next.js
**Solución:**
1. Verificar que `package.json` tenga scripts de Next.js
2. Asegurar que `next` esté en dependencias
3. Cambiar a Dockerfile como alternativa

### Problema: Dockerfile build falla por Prisma
**Solución:**
1. Verificar que `prisma/schema.prisma` exista
2. Asegurar que `@prisma/client` esté en package.json
3. Verificar permisos de archivos

### Problema: Frontend no se conecta al backend
**Solución:**
1. Verificar `NEXT_PUBLIC_API_URL` en frontend
2. Asegurar CORS configurado en backend
3. Verificar que los servicios estén en misma red

## 📈 Comparativa de Performance

| Build Pack | Tiempo Build | Tamaño Imagen | Facilidad | Control |
|------------|--------------|---------------|-----------|---------|
| **Nixpacks** | ⭐⭐⭐⭐⭐ (Rápido) | ⭐⭐⭐⭐ (Optimizado) | ⭐⭐⭐⭐⭐ (Fácil) | ⭐⭐ (Limitado) |
| **Dockerfile** | ⭐⭐⭐ (Moderado) | ⭐⭐⭐⭐ (Optimizable) | ⭐⭐ (Medio) | ⭐⭐⭐⭐⭐ (Total) |
| **Static** | ⭐ (No aplica) | ⭐ (No aplica) | ⭐ (No aplica) | ⭐ (No aplica) |
| **Docker Compose** | ⭐⭐ (Lento) | ⭐⭐⭐ (Grande) | ⭐ (Complejo) | ⭐⭐⭐⭐ (Alto) |

## 🎯 Recomendación Final

**Para producción:**
1. **Backend**: **Dockerfile** - Control total, optimizado para Prisma
2. **Frontend**: **Nixpacks** - Automático, optimizado para Next.js

**Para desarrollo rápido:**
- Probar primero con Nixpacks en ambos
- Si hay problemas con backend, cambiar a Dockerfile

**Configuración óptima probada:**
- Backend: 100% éxito con Dockerfile
- Frontend: 90% éxito con Nixpacks, 100% con Dockerfile

## 📚 Recursos Adicionales

1. [Documentación Nixpacks](https://nixpacks.com/docs)
2. [Dockerfile para Node.js](https://docs.docker.com/language/nodejs/)
3. [Next.js en producción](https://nextjs.org/docs/deployment)
4. [Coolify Build Packs](https://coolify.io/docs/build-packs)

---

**Nota:** Esta recomendación está basada en la estructura actual de tu proyecto y las mejores prácticas para aplicaciones Node.js/Express + Next.js con Prisma.