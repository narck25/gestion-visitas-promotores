# Guía de Despliegue en Coolify - Sistema de Gestión de Visitas

## 📋 Introducción

Esta guía proporciona instrucciones paso a paso para desplegar el sistema de gestión de visitas para promotores en **Coolify**, una plataforma de despliegue y hosting auto-alojado.

## 🎯 Prerrequisitos

### 1. Cuentas Necesarias
- [x] **GitHub Account**: Para alojar el código
- [x] **Coolify Instance**: Instancia auto-alojada o cuenta en coolify.io
- [x] **Dominio**: Dominio personalizado (opcional pero recomendado)

### 2. Recursos del Sistema
- **RAM mínima**: 2GB (recomendado 4GB)
- **CPU**: 2 núcleos
- **Almacenamiento**: 10GB mínimo
- **Conexión a internet**: Estable

## 🚀 Paso 1: Preparación del Repositorio

### 1.1 Verificar Estructura del Proyecto
```
gestion-visitas-promotores/
├── docker-compose.yml          # Configuración Docker
├── Dockerfile                  # Dockerfile del backend
├── coolify-deployment.yml      # Configuración Coolify
├── frontend-pwa/              # Aplicación Next.js PWA
├── prisma/                    # Esquema y migraciones de BD
├── src/                       # Backend Node.js/Express
└── uploads/                   # Directorio para imágenes
```

### 1.2 Configurar Variables de Entorno
Crear archivo `.env.production` en la raíz del proyecto:

```env
# ==============================================================================
# DATABASE
# ==============================================================================
DATABASE_URL="postgresql://usuario:contraseña@postgres:5432/gestion_visitas?schema=public"

# ==============================================================================
# BACKEND - Express
# ==============================================================================
NODE_ENV=production
PORT=3001
JWT_SECRET="tu_jwt_secreto_muy_largo_y_complejo_aqui"
JWT_REFRESH_SECRET="tu_refresh_secreto_muy_largo_y_complejo_aqui"
JWT_ACCESS_EXPIRATION="1h"
JWT_REFRESH_EXPIRATION="7d"

# ==============================================================================
# FRONTEND - Next.js
# ==============================================================================
NEXT_PUBLIC_API_URL="https://api.tudominio.com"
NEXT_PUBLIC_APP_URL="https://app.tudominio.com"

# ==============================================================================
# UPLOADS
# ==============================================================================
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB

# ==============================================================================
# CORS
# ==============================================================================
CORS_ORIGIN="https://app.tudominio.com"
```

### 1.3 Configurar GitHub Secrets (Opcional)
Para CI/CD automático, configurar secrets en GitHub:
- `COOLIFY_API_KEY`
- `COOLIFY_SERVER_ID`
- `PRODUCTION_DATABASE_URL`

## 🐳 Paso 2: Configuración de Docker

### 2.1 Verificar Dockerfile
El proyecto ya incluye un `Dockerfile` configurado:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "src/index.js"]
```

### 2.2 Verificar docker-compose.yml
El archivo `docker-compose.yml` está configurado para desarrollo/producción:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: app_password
      POSTGRES_DB: gestion_visitas
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://app_user:app_password@postgres:5432/gestion_visitas?schema=public
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"
    volumes:
      - ./uploads:/app/uploads
      - ./prisma:/app/prisma

  frontend:
    build: ./frontend-pwa
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

## ☁️ Paso 3: Configuración de Coolify

### 3.1 Crear Proyecto en Coolify
1. **Iniciar sesión** en tu instancia de Coolify
2. **Crear nuevo proyecto** → "Import from Git"
3. **Seleccionar proveedor**: GitHub
4. **Autorizar** acceso al repositorio
5. **Seleccionar repositorio**: `narck25/gestion-visitas-promotores`

### 3.2 Configurar Aplicación
#### Backend (API)
```
Nombre: gestion-visitas-backend
Rama: main
Ruta de construcción: .
Puerto: 3001
Variables de entorno: Usar archivo .env.production
```

#### Frontend (PWA)
```
Nombre: gestion-visitas-frontend
Rama: main
Ruta de construcción: ./frontend-pwa
Puerto: 3000
Variables de entorno:
  NEXT_PUBLIC_API_URL: https://api.tudominio.com
  NODE_ENV: production
```

### 3.3 Configurar Base de Datos
1. **Añadir servicio** → PostgreSQL
2. **Configuración**:
   ```
   Nombre: gestion-visitas-db
   Versión: 15
   Usuario: app_user
   Contraseña: [generar segura]
   Base de datos: gestion_visitas
   ```
3. **Conectar al backend**: Agregar variable `DATABASE_URL`

### 3.4 Configurar Almacenamiento
1. **Volúmenes persistentes**:
   - `uploads`: Para imágenes de visitas
   - `postgres_data`: Para datos de PostgreSQL

2. **Configurar backup automático** (opcional)

## 🔧 Paso 4: Configuración de Dominio y SSL

### 4.1 Configurar Dominios
```
Backend (API): api.tudominio.com
Frontend (App): app.tudominio.com
```

### 4.2 Configurar SSL/TLS
1. **Coolify** → Aplicación → Settings
2. **SSL/TLS** → "Enable SSL"
3. **Seleccionar**: Let's Encrypt
4. **Configurar renovación automática**

### 4.3 Configurar CORS
En el backend, actualizar `CORS_ORIGIN`:
```env
CORS_ORIGIN=https://app.tudominio.com
```

## 🚀 Paso 5: Despliegue

### 5.1 Despliegue Manual
1. **Coolify** → Proyecto → Aplicación
2. **Deploy** → "Deploy now"
3. **Monitorear logs** en tiempo real

### 5.2 Verificar Despliegue
```bash
# Verificar backend
curl https://api.tudominio.com/health
# Respuesta esperada: {"success":true,"message":"API funcionando correctamente"}

# Verificar frontend
curl -I https://app.tudominio.com
# Respuesta esperada: HTTP/2 200
```

### 5.3 Ejecutar Migraciones de Base de Datos
```bash
# Conectarse al contenedor del backend
docker exec -it gestion-visitas-backend sh

# Ejecutar migraciones
npx prisma migrate deploy
npx prisma generate

# Verificar tablas
npx prisma db execute --file ./prisma/init-db.sql
```

## 📊 Paso 6: Post-Despliegue

### 6.1 Configurar Monitoreo
1. **Health checks** automáticos
2. **Alertas** por email/telegram
3. **Logs centralizados** (opcional)

### 6.2 Configurar Backup
1. **Base de datos**: Backup diario automático
2. **Uploads**: Backup semanal
3. **Configuración**: Backup en cada cambio

### 6.3 Configurar Escalado
```
Backend: 1-3 réplicas (dependiendo de carga)
Base de datos: 1 réplica (alta disponibilidad)
Almacenamiento: Escalado automático
```

## 🛠️ Paso 7: Mantenimiento

### 7.1 Actualizaciones
```bash
# Actualizar código
git pull origin main

# Re-desplegar en Coolify
# Coolify detectará cambios automáticamente y desplegará
```

### 7.2 Monitoreo de Recursos
- **CPU**: Alertar >80% uso
- **RAM**: Alertar >85% uso
- **Disco**: Alertar >90% uso
- **Red**: Monitorear tráfico entrante/saliente

### 7.3 Logs y Debugging
```bash
# Ver logs del backend
coolify logs gestion-visitas-backend

# Ver logs del frontend
coolify logs gestion-visitas-frontend

# Ver logs de la base de datos
coolify logs gestion-visitas-db
```

## 🔍 Solución de Problemas Comunes

### Problema 1: Error de conexión a base de datos
**Solución**:
1. Verificar variable `DATABASE_URL`
2. Verificar que PostgreSQL esté ejecutándose
3. Verificar credenciales

### Problema 2: Error de CORS
**Solución**:
1. Verificar `CORS_ORIGIN` en backend
2. Verificar que los dominios coincidan
3. Reiniciar backend después de cambios

### Problema 3: Imágenes no se suben
**Solución**:
1. Verificar permisos del volumen `uploads`
2. Verificar variable `UPLOAD_DIR`
3. Verificar límite `MAX_FILE_SIZE`

### Problema 4: Frontend no carga
**Solución**:
1. Verificar `NEXT_PUBLIC_API_URL`
2. Verificar build de Next.js
3. Verificar recursos estáticos

## 📈 Optimizaciones Recomendadas

### 1. Cache
```nginx
# Configurar CDN para imágenes
location /uploads/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Cache para assets estáticos
location /_next/static/ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

### 2. Compresión
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. Seguridad
```nginx
# Headers de seguridad
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## 🎉 Conclusión

### Estado Final Esperado
- ✅ **Backend**: `https://api.tudominio.com` (API REST)
- ✅ **Frontend**: `https://app.tudominio.com` (PWA)
- ✅ **Base de datos**: PostgreSQL con réplica
- ✅ **Almacenamiento**: Volúmenes persistentes
- ✅ **SSL/TLS**: Certificados Let's Encrypt
- ✅ **Monitoreo**: Health checks y alertas

### Próximos Pasos
1. **Configurar CI/CD** automático con GitHub Actions
2. **Implementar testing** automatizado pre-despliegue
3. **Configurar analytics** para monitoreo de uso
4. **Planificar escalado** horizontal según crecimiento

### Recursos Adicionales
- [Documentación de Coolify](https://coolify.io/docs)
- [Guía de Docker](https://docs.docker.com/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Guía de PostgreSQL](https://www.postgresql.org/docs/)

---

**Nota**: Esta guía asume que ya tienes una instancia de Coolify funcionando. Si necesitas ayuda con la instalación de Coolify, consulta la [documentación oficial](https://coolify.io/docs/installation).