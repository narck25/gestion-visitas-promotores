# Documentación del Administrador Global del Sistema

## Resumen
Se ha implementado un sistema de administrador global con acceso total a usuarios, clientes y visitas. El sistema incluye:
- Rol "admin" en el modelo User (ya existía como parte del enum Role)
- Usuario administrador global con email "sistemas@kram.mx"
- Protección por rol usando middleware
- Seed automático al iniciar la aplicación
- Endpoints RESTful para administración

## Credenciales del Administrador
- **Email:** sistemas@kram.mx
- **Contraseña:** Sit3masKr4m2026
- **Rol:** ADMIN
- **Nombre:** Administrador del Sistema

## Características Implementadas

### 1. Seed Automático
El usuario administrador se crea automáticamente al iniciar la aplicación si no existe:
- Verifica si el usuario con email "sistemas@kram.mx" existe
- Si existe pero no tiene rol ADMIN/SUPER_ADMIN, actualiza su rol
- Si no existe, lo crea con la contraseña hasheada (bcrypt)
- Implementado en `src/config/prismaInit.js`

### 2. Middleware de Protección por Rol
Ya existía en `src/middleware/auth.js`:
- `authenticateToken`: Verifica token JWT
- `authorizeRoles`: Verifica que el usuario tenga uno de los roles especificados
- Las rutas de admin usan `requireAdmin = authorizeRoles('ADMIN', 'SUPER_ADMIN')`

### 3. Endpoints de Administración

#### GET `/api/admin/users`
Lista todos los usuarios con paginación y filtros.
- **Query params:**
  - `page`: Número de página (default: 1)
  - `limit`: Elementos por página (default: 20)
  - `search`: Búsqueda en email o nombre
  - `role`: Filtrar por rol
- **Respuesta:** Lista de usuarios con estadísticas (visitas, clientes)

#### GET `/api/admin/clients`
Lista todos los clientes con paginación y filtros.
- **Query params:**
  - `page`, `limit`, `search`
  - `promoterId`: Filtrar por promotor
- **Respuesta:** Lista de clientes con información del promotor

#### GET `/api/admin/visits`
Lista todas las visitas con paginación y filtros.
- **Query params:**
  - `page`, `limit`, `search`
  - `promoterId`, `clientId`
  - `status`, `purpose`
- **Respuesta:** Lista de visitas con información de promotor y cliente

#### GET `/api/admin/stats`
Obtiene estadísticas del sistema.
- **Respuesta:** Totales de usuarios, clientes, visitas, promotores activos, visitas recientes, distribución por estado y propósito

#### PATCH `/api/admin/users/:userId/role`
Actualiza el rol de un usuario.
- **Body:** `{ "role": "ADMIN" }` (valores: SUPER_ADMIN, ADMIN, MANAGER, PROMOTER, VIEWER)
- **Validación:** No permite eliminar el último administrador del sistema

#### PATCH `/api/admin/users/:userId/status`
Activa/desactiva un usuario.
- **Body:** `{ "isActive": true/false }`
- **Validación:** No permite desactivar el último administrador activo

## Estructura de Archivos

### Nuevos Archivos
1. `src/controllers/adminController.js` - Controladores para funcionalidades de admin
2. `src/routes/adminRoutes.js` - Rutas protegidas para administración
3. `ADMIN_DOCUMENTATION.md` - Esta documentación

### Archivos Modificados
1. `src/config/prismaInit.js` - Agregada función `initializeAdminUser`
2. `src/config/app.js` - Agregada ruta `/api/admin`

### Archivos Existentes Utilizados
1. `prisma/schema.prisma` - Ya tenía enum Role y campo role en User
2. `src/middleware/auth.js` - Ya tenía middleware `authorizeRoles`

## Verificación de Implementación

### 1. Usuario Administrador Creado
```bash
# Verificar que el admin existe
node test-admin-init.js
```

### 2. Endpoints Disponibles
```
GET    /api/admin/users
GET    /api/admin/clients  
GET    /api/admin/visits
GET    /api/admin/stats
PATCH  /api/admin/users/:userId/role
PATCH  /api/admin/users/:userId/status
```

### 3. Protección por Rol
- Todas las rutas de `/api/admin/*` requieren autenticación
- Solo usuarios con rol ADMIN o SUPER_ADMIN pueden acceder
- Middleware `requireAdmin` aplicado a todas las rutas

## Consideraciones de Seguridad

### 1. Contraseña Hasheada
- La contraseña "Sit3masKr4m2026" se almacena hasheada con bcrypt
- Usa `BCRYPT_SALT_ROUNDS` de las variables de entorno (default: 10)

### 2. Validación de Último Administrador
- No se puede cambiar el rol del último admin a no-admin
- No se puede desactivar el último admin activo
- Previene bloqueo accidental del sistema

### 3. Middleware de Autenticación
- Tokens JWT con expiración configurable
- Refresh tokens para renovación segura
- Protección contra acceso no autorizado

## Pruebas Realizadas

### ✅ Usuario Admin Creado Automáticamente
- Cuando no existe, se crea con rol ADMIN
- Contraseña hasheada correctamente
- Información básica completa

### ✅ Actualización de Rol Existente
- Si el usuario existe pero no es admin, se actualiza su rol
- Si ya es admin, no se realizan cambios

### ✅ Protección de Rutas
- Rutas de admin requieren token válido
- Solo roles ADMIN/SUPER_ADMIN pueden acceder
- Respuestas 403 para usuarios no autorizados

### ✅ No Rompe Usuarios Existentes
- El seed solo afecta al usuario "sistemas@kram.mx"
- Usuarios existentes mantienen sus roles y datos
- No se modifican esquemas de base de datos

## Uso en Producción

### Variables de Entorno Requeridas
```env
JWT_SECRET=tu-secreto-jwt
REFRESH_TOKEN_SECRET=tu-secreto-refresh
DATABASE_URL=postgresql://...
BCRYPT_SALT_ROUNDS=10
```

### Inicialización Automática
- Al iniciar la aplicación, se verifica/crea el admin
- Logs detallados del proceso
- No bloquea el inicio si hay errores (continúa con advertencia)

### Monitoreo
- Logs de creación/actualización del admin
- Logs de cambios de rol/estado de usuarios
- Estadísticas accesibles via `/api/admin/stats`

## Notas Técnicas

### Base de Datos
- El enum `Role` ya existía: SUPER_ADMIN, ADMIN, MANAGER, PROMOTER, VIEWER
- El campo `role` en `User` ya existía con default PROMOTER
- No se requirieron migraciones de base de datos

### Compatibilidad
- Compatible con frontend existente (no se modificó)
- Compatible con autenticación existente
- Compatible con estructura de rutas existente

### Escalabilidad
- Paginación en todos los endpoints de listado
- Filtros para búsqueda eficiente
- Consultas optimizadas con Prisma

## Solución de Problemas

### El Admin No Se Crea
1. Verificar conexión a base de datos
2. Verificar logs de inicialización
3. Ejecutar `node test-admin-init.js` manualmente

### No Puedo Acceder a Rutas de Admin
1. Verificar que el token JWT sea válido
2. Verificar que el usuario tenga rol ADMIN o SUPER_ADMIN
3. Verificar headers de autorización

### Error "Último Administrador"
- No se puede cambiar/desactivar el último admin
- Crear otro usuario con rol ADMIN primero
- Luego realizar el cambio deseado

## Conclusión
El sistema de administrador global está completamente implementado y listo para producción. Cumple con todos los requisitos especificados manteniendo compatibilidad con la implementación existente.