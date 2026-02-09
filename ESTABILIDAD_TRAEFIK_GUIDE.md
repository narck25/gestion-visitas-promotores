# Guía de Estabilidad para Coolify + Traefik

## 📋 Resumen de Mejoras Implementadas

### 1. **Servidor HTTP Robusto**
- ✅ Escucha en `0.0.0.0` (requerido para contenedores Docker)
- ✅ Usa `process.env.PORT` (configurable por entorno)
- ✅ Eliminado cualquier hardcode de `localhost`

### 2. **Healthcheck Robusto**
- ✅ Endpoint `/health` responde SIEMPRE 200
- ✅ **NO** depende de base de datos
- ✅ **NO** lanza excepciones (try-catch con fallback)
- ✅ Respuesta JSON estructurada:
  ```json
  {
    "success": true,
    "status": "ok",
    "uptime": 123.45,
    "timestamp": "2026-02-09T01:23:29.255Z",
    "env": "production",
    "memory": { ... },
    "nodeVersion": "v24.11.1"
  }
  ```
- ✅ Endpoints adicionales:
  - `/health/liveness` - Solo verifica que el proceso está vivo
  - `/health/readiness` - Verifica que la app está lista para tráfico

### 3. **CORS Dinámico y Seguro**
- ✅ Eliminadas referencias a `sslip.io`
- ✅ Whitelist por variable de entorno: `CORS_ALLOWED_ORIGINS`
- ✅ Orígenes permitidos por defecto:
  - `https://app.prodevfabian.cloud`
  - `https://api.prodevfabian.cloud`
  - `http://localhost:3000` (solo desarrollo)
- ✅ Bloqueo automático de orígenes no permitidos
- ✅ Manejo correcto de preflight OPTIONS

### 4. **Manejo de Errores Global**
- ✅ Middleware final de errores Express
- ✅ **NUNCA** permite que errores no controlados apaguen el proceso
- ✅ Logging estructurado de errores en `/app/logs/errors.log`
- ✅ Respuestas JSON consistentes con timestamp

### 5. **Estabilidad del Proceso**
- ✅ Captura de `uncaughtException` (sin cerrar proceso)
- ✅ Captura de `unhandledRejection` (sin cerrar proceso)
- ✅ **NO** llama `process.exit()` salvo fallo crítico real
- ✅ Graceful shutdown para señales SIGTERM/SIGINT

### 6. **Gestión de Directorios**
- ✅ Verificación automática de:
  - `/app/uploads`
  - `/app/tmp`
  - `/app/logs`
- ✅ Creación automática si no existen
- ✅ Uso de rutas relativas (`uploads/`, `tmp/`)

### 7. **Logging Mejorado**
- ✅ Logger estructurado en producción
- ✅ Logs escritos en `/app/logs/`:
  - `app.log` - Logs generales
  - `errors.log` - Solo errores
  - `http.log` - Peticiones HTTP (producción)
- ✅ Información clara al inicio:
  - Puerto
  - Entorno
  - Orígenes CORS permitidos
  - Estado del healthcheck

## 🚀 Configuración para Coolify

### Variables de Entorno Requeridas

```env
# Database (proporcionada por Coolify PostgreSQL)
DATABASE_URL="postgresql://username:password@postgres:5432/gestion_visitas"

# JWT (generar valores seguros)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-this-too"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="production"

# CORS (CRÍTICO para frontend)
CORS_ALLOWED_ORIGINS="https://app.prodevfabian.cloud,https://api.prodevfabian.cloud"

# Security
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100
```

### Directory Mounts en Coolify

**Configurar estos mounts ABSOLUTAMENTE NECESARIOS:**

1. **`/app/uploads`** - Archivos subidos por usuarios
2. **`/app/tmp`** - Archivos temporales
3. **`/app/logs`** - Logs de la aplicación

### Healthcheck Configuration en Coolify

**Configuración recomendada:**
- **Path:** `/health`
- **Interval:** 30 segundos
- **Timeout:** 5 segundos
- **Initial Delay:** 10 segundos

**Endpoints disponibles para monitoreo:**
- `https://api.prodevfabian.cloud/health` - Healthcheck principal
- `https://api.prodevfabian.cloud/health/liveness` - Liveness probe
- `https://api.prodevfabian.cloud/health/readiness` - Readiness probe

## 🔧 Verificación Post-Despliegue

### 1. Verificar Healthcheck
```bash
curl -s https://api.prodevfabian.cloud/health | jq .
```

**Respuesta esperada:**
```json
{
  "success": true,
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "...",
  "env": "production",
  "memory": { ... },
  "nodeVersion": "..."
}
```

### 2. Verificar CORS
```bash
curl -v -H "Origin: https://app.prodevfabian.cloud" \
  https://api.prodevfabian.cloud/health
```

**Verificar headers de respuesta:**
```
Access-Control-Allow-Origin: https://app.prodevfabian.cloud
Access-Control-Allow-Credentials: true
```

### 3. Verificar Logs
```bash
# En Coolify, revisar logs del contenedor
# Deberías ver:
# - Inicio exitoso del servidor
# - Conexión a base de datos
# - Health checks periódicos de Traefik
```

### 4. Verificar Estabilidad
- Monitorear que Traefik marque el servicio como **HEALTHY**
- Verificar que no haya caídas intermitentes
- Confirmar que frontend puede consumir API sin errores CORS

## 🐛 Solución de Problemas Comunes

### Problema: Traefik marca "no available server"
**Causas posibles:**
1. Healthcheck no responde 200
2. Servidor no escucha en `0.0.0.0`
3. Puerto incorrecto

**Solución:**
1. Verificar que `/health` responde 200
2. Confirmar variables de entorno `PORT` y `NODE_ENV`
3. Revisar logs de error en `/app/logs/errors.log`

### Problema: Errores CORS en frontend
**Causas posibles:**
1. Origen no incluido en `CORS_ALLOWED_ORIGINS`
2. Headers CORS incorrectos

**Solución:**
1. Verificar variable `CORS_ALLOWED_ORIGINS`
2. Incluir `https://app.prodevfabian.cloud`
3. Reiniciar servicio después de cambios

### Problema: Servidor se cae intermitentemente
**Causas posibles:**
1. Errores no capturados
2. Memory leaks
3. Conexión a DB inestable

**Solución:**
1. Revisar `/app/logs/errors.log`
2. Verificar configuración de memoria
3. Monitorear conexión a base de datos

## 📊 Monitoreo Recomendado

### Métricas a monitorear:
1. **Uptime** - Debe ser estable
2. **Memory usage** - Alertar si >80%
3. **Health check success rate** - Debe ser 100%
4. **Response time** - Alertar si >500ms

### Alertas configurar:
- Health check failures > 3 consecutivos
- Memory usage > 80% por más de 5 minutos
- Uptime interruptions

## ✅ Resultado Esperado

- ✅ Backend estable 24/7
- ✅ Coolify muestra estado **HEALTHY**
- ✅ `https://api.prodevfabian.cloud/health` responde siempre
- ✅ Frontend puede consumir API sin errores CORS
- ✅ Traefik mantiene conexión estable
- ✅ Logs estructurados para debugging

## 🔄 Actualizaciones Futuras

Para mantener la estabilidad:

1. **Antes de cada deploy:**
   - Probar healthcheck localmente
   - Verificar variables de entorno
   - Confirmar mounts de directorios

2. **Después de cada deploy:**
   - Verificar healthcheck en producción
   - Confirmar logs de inicio
   - Probar endpoints críticos

3. **Monitoreo continuo:**
   - Revisar logs diariamente
   - Monitorear métricas de performance
   - Actualizar dependencias regularmente