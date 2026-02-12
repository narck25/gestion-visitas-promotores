# Arquitectura Modular Refactorizada

## 📋 Resumen de la Refactorización

Se ha implementado una arquitectura limpia y mantenible para el backend del sistema de gestión de visitas. La refactorización separa las responsabilidades en capas bien definidas, mejorando la mantenibilidad, testabilidad y escalabilidad.

## 🏗️ Estructura de Directorios

```
src/
├── controllers/           # Controladores HTTP (capa de presentación)
├── services/             # Lógica de negocio (capa de aplicación)
├── repositories/         # Acceso a datos (capa de infraestructura)
├── validators/          # Validación de datos con Zod
├── errors/              # Manejo centralizado de errores
├── utils/               # Utilidades compartidas (logger, etc.)
├── middleware/          # Middleware de Express
│   └── rateLimit/      # Rate limiting avanzado
├── routes/              # Definición de rutas
└── config/              # Configuración de la aplicación
```

## 🔄 Flujo de Datos

```
Request → Middleware → Controller → Service → Repository → Database
Response ← Controller ← Service ← Repository ← Database
```

## 🧩 Componentes Principales

### 1. **Controladores (`controllers/`)**
- Responsable de manejar requests/responses HTTP
- Usan `asyncHandler` para manejo automático de errores
- Validan datos usando validadores de Zod
- Delegan lógica de negocio a servicios

### 2. **Servicios (`services/`)**
- Contienen la lógica de negocio principal
- Validan permisos y reglas de negocio
- Coordinan múltiples repositorios
- Manejan transacciones cuando es necesario

### 3. **Repositorios (`repositories/`)**
- Encapsulan acceso a la base de datos (Prisma)
- Implementan patrones de acceso a datos
- Manejan queries complejas y paginación
- Incluyen métodos para operaciones CRUD

### 4. **Validadores (`validators/`)**
- Usan **Zod** para validación de esquemas
- Validan datos de entrada (body, query, params)
- Proporcionan mensajes de error claros
- Incluyen middleware para validación automática

### 5. **Manejo de Errores (`errors/`)**
- Sistema centralizado de errores con `AppError`
- Errores específicos por tipo (ValidationError, NotFoundError, etc.)
- Middleware para manejo automático de errores
- Logging estructurado de errores

### 6. **Logger (`utils/logger.js`)**
- Logger estructurado con **Pino**
- Diferentes configuraciones para desarrollo/producción
- Métodos específicos para diferentes tipos de logs
- Redacción automática de datos sensibles

### 7. **Rate Limiting (`middleware/rateLimit/`)**
- Sistema avanzado de rate limiting
- Soporte para Redis (opcional)
- Configuraciones por tipo de endpoint
- Métricas y monitoreo

## 🚀 Migración de Controladores Existentes

### Controlador de Clientes Refactorizado

**Archivo original:** `src/controllers/clientController.js` (~2000 líneas)
**Archivo refactorizado:** `src/controllers/clientController.refactored.js` (~150 líneas)

### Cambios Principales:

1. **Separación de responsabilidades:**
   - Lógica de negocio → `ClientService`
   - Acceso a datos → `ClientRepository`
   - Validación → `ClientValidator`

2. **Manejo de errores mejorado:**
   - Uso de `asyncHandler` para manejo automático
   - Errores específicos con mensajes claros
   - Logging estructurado

3. **Validación robusta:**
   - Esquemas Zod para todos los endpoints
   - Validación automática con middleware
   - Mensajes de error específicos por campo

4. **Control de acceso por rol:**
   - Lógica centralizada en `ClientService`
   - Validación de permisos granular
   - Filtros automáticos por rol

## 📁 Archivos Creados

### Servicios
- `src/services/clientService.js` - Servicio principal de clientes

### Repositorios
- `src/repositories/clientRepository.js` - Repositorio de clientes
- `src/repositories/userRepository.js` - Repositorio de usuarios

### Validadores
- `src/validators/clientValidator.js` - Validadores de clientes con Zod

### Manejo de Errores
- `src/errors/AppError.js` - Sistema centralizado de errores

### Logger
- `src/utils/logger.js` - Logger estructurado con Pino

### Rate Limiting
- `src/middleware/rateLimit/rateLimiter.js` - Sistema avanzado de rate limiting

### Controladores Refactorizados
- `src/controllers/clientController.refactored.js` - Controlador de clientes refactorizado

### Rutas Actualizadas
- `src/routes/clientRoutes.refactored.js` - Rutas de clientes con nueva arquitectura

## 🔧 Configuración Requerida

### Dependencias Agregadas
```json
{
  "dependencies": {
    "ioredis": "^5.3.2",
    "pino": "^8.19.0",
    "pino-pretty": "^10.3.1",
    "rate-limit-redis": "^3.0.1",
    "zod": "^3.22.4"
  }
}
```

### Variables de Entorno
```env
# Logger
LOG_LEVEL=info

# Rate Limiting
ENABLE_REDIS_RATE_LIMIT=false
REDIS_URL=redis://localhost:6379

# CORS
CORS_ALLOWED_ORIGINS=https://app.prodevfabian.cloud,https://api.prodevfabian.cloud,http://localhost:3000
```

## 🧪 Testing de la Nueva Arquitectura

### Health Check
```bash
curl http://localhost:3001/health
```

### Endpoints de Clientes (Ejemplos)
```bash
# Obtener todos los clientes
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/clients

# Crear cliente
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"name": "Cliente Ejemplo", "email": "cliente@ejemplo.com"}' \
  http://localhost:3001/api/clients

# Obtener estadísticas
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/clients/stats
```

## 📈 Beneficios de la Nueva Arquitectura

### 1. **Separación de Responsabilidades**
- Cada capa tiene una responsabilidad clara
- Facilita el testing unitario
- Mejora la mantenibilidad

### 2. **Testabilidad Mejorada**
- Servicios y repositorios fácilmente testables
- Mocking simplificado
- Tests más rápidos y confiables

### 3. **Escalabilidad**
- Arquitectura preparada para crecimiento
- Facilita la adición de nuevas funcionalidades
- Soporte para microservicios

### 4. **Seguridad Mejorada**
- Validación robusta con Zod
- Rate limiting avanzado
- Logging estructurado con redacción de datos sensibles

### 5. **Mantenibilidad**
- Código más limpio y organizado
- Documentación automática con JSDoc
- Errores más claros y específicos

### 6. **Performance**
- Queries optimizadas en repositorios
- Cache con Redis (opcional)
- Logging asíncrono

## 🔄 Migración de Otros Controladores

Para migrar otros controladores (visitas, usuarios, etc.), seguir estos pasos:

1. **Crear repositorio** para la entidad
2. **Crear servicio** con lógica de negocio
3. **Crear validadores** con esquemas Zod
4. **Refactorizar controlador** usando la nueva arquitectura
5. **Actualizar rutas** con middleware de validación

## 🚨 Consideraciones de Producción

### 1. **Monitoreo**
- Configurar alertas basadas en logs
- Monitorear métricas de rate limiting
- Seguimiento de errores en producción

### 2. **Performance**
- Ajustar límites de rate limiting según carga
- Configurar Redis para rate limiting distribuido
- Optimizar queries en repositorios

### 3. **Seguridad**
- Revisar esquemas de validación regularmente
- Actualizar dependencias de seguridad
- Auditar logs periódicamente

### 4. **Backward Compatibility**
- La API mantiene compatibilidad con versiones anteriores
- Endpoints existentes funcionan sin cambios
- Nuevas funcionalidades son aditivas

## 📚 Documentación Adicional

- [Documentación de Zod](https://zod.dev/)
- [Documentación de Pino](https://getpino.io/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Patrones de Arquitectura Limpia](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🏁 Conclusión

La refactorización ha transformado un controlador monolítico de ~2000 líneas en una arquitectura modular y mantenible. La nueva estructura:

1. **Separa responsabilidades** en capas claras
2. **Mejora la testabilidad** de cada componente
3. **Aumenta la seguridad** con validación robusta
4. **Facilita el mantenimiento** y escalabilidad
5. **Mantiene compatibilidad** con la API existente

El sistema está listo para producción y preparado para futuras expansiones.