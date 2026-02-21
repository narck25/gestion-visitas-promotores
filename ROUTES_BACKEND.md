# 📘 BACKEND ROUTES DOCUMENTATION

## 🌍 Base URL
Base URL: `/api`
Ejemplo: `http://localhost:3001/api`

**Nota**: Todas las rutas de API están prefijadas con `/api`. Rutas adicionales como `/health`, `/health/liveness`, `/health/readiness` y `/` están disponibles directamente en la raíz.

---

## 🔐 AUTH ROUTES (`/api/auth`)

| Method | Full Path | Middleware | Roles | Controller | Descripción |
|--------|----------|------------|-------|------------|-------------|
| POST | `/api/auth/register` | `registerValidation` | Public | `authController.register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | `loginValidation` | Public | `authController.login` | Iniciar sesión |
| POST | `/api/auth/refresh-token` | `refreshTokenValidation` | Public | `authController.refreshToken` | Refrescar token de acceso |
| POST | `/api/auth/logout` | none | Public | `authController.logout` | Cerrar sesión |
| GET | `/api/auth/profile` | `authenticateToken` | Private | `authController.getProfile` | Obtener perfil del usuario autenticado |
| PUT | `/api/auth/profile` | `authenticateToken`, `updateProfileValidation` | Private | `authController.updateProfile` | Actualizar perfil del usuario autenticado |

---

## 👥 CLIENT ROUTES (`/api/clients`)

| Method | Full Path | Middleware | Roles | Controller | Descripción |
|--------|----------|------------|-------|------------|-------------|
| GET | `/api/clients` | `authenticateToken`, `getClientsValidation` | Todos los roles autenticados | `clientController.getAllClients` | Obtener todos los clientes (con filtros por rol) |
| GET | `/api/clients/stats` | `authenticateToken` | Todos los roles autenticados | `clientController.getClientStats` | Obtener estadísticas de clientes |
| POST | `/api/clients` | `authenticateToken`, `authorizeRoles('PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN')`, `createClientValidation` | PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN | `clientController.createClient` | Crear un nuevo cliente |
| GET | `/api/clients/:id` | `authenticateToken` | Todos los roles autenticados con permisos | `clientController.getClientById` | Obtener un cliente específico |
| PUT | `/api/clients/:id` | `authenticateToken`, `authorizeRoles('PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN')`, `updateClientValidation` | PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN | `clientController.updateClient` | Actualizar un cliente |
| DELETE | `/api/clients/:id` | `authenticateToken`, `authorizeRoles('PROMOTER', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN')` | PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN | `clientController.deleteClient` | Eliminar un cliente |

---

## 📊 VISIT ROUTES (`/api/visits`)

| Method | Full Path | Middleware | Roles | Controller | Descripción |
|--------|----------|------------|-------|------------|-------------|
| POST | `/api/visits` | `authenticateToken`, `createVisitValidation` | Private (Promotor) | `visitController.createVisit` | Crear una nueva visita |
| GET | `/api/visits` | `authenticateToken`, `getVisitsValidation` | Private (Promotor) | `visitController.getVisits` | Obtener todas las visitas del promotor (con paginación) |
| GET | `/api/visits/stats` | `authenticateToken` | Private (Promotor) | `visitController.getVisitStats` | Obtener estadísticas de visitas |
| GET | `/api/visits/:id` | `authenticateToken` | Private (Promotor) | `visitController.getVisitById` | Obtener una visita específica |
| PUT | `/api/visits/:id` | `authenticateToken`, `updateVisitValidation` | Private (Promotor) | `visitController.updateVisit` | Actualizar una visita |
| DELETE | `/api/visits/:id` | `authenticateToken` | Private (Promotor) | `visitController.deleteVisit` | Eliminar una visita |

---

## 🖼 VISIT IMAGE ROUTES (`/api/visits/images`)

| Method | Full Path | Middleware | Roles | Controller | Descripción |
|--------|----------|------------|-------|------------|-------------|
| POST | `/api/visits/images` | `authenticateToken`, `isPromoter`, `uploadVisitImages` | Private (Promotor) | Inline handler | Registrar visita con imágenes (múltiples archivos) |
| GET | `/api/visits/images/:id` | `authenticateToken`, `isPromoter` | Private (Promotor) | Inline handler | Obtener visita con imágenes |

**Nota**: Las rutas de imágenes usan handlers inline en lugar de controladores separados. El middleware `isPromoter` valida que el usuario tenga rol `PROMOTER`.

---

## 👨‍💼 SUPERVISOR ROUTES (`/api/supervisor`)

| Method | Full Path | Middleware | Roles | Controller | Descripción |
|--------|----------|------------|-------|------------|-------------|
| GET | `/api/supervisor/promoters` | `authenticateToken`, `authorizeRoles('SUPERVISOR')`, `getPromotersValidation` | SUPERVISOR | `supervisorController.getPromoters` | Obtener todos los promotores asignados a un supervisor |
| GET | `/api/supervisor/clients` | `authenticateToken`, `authorizeRoles('SUPERVISOR')`, `getClientsValidation` | SUPERVISOR | `supervisorController.getClients` | Obtener todos los clientes de los promotores asignados a un supervisor |
| GET | `/api/supervisor/visits` | `authenticateToken`, `authorizeRoles('SUPERVISOR')`, `getVisitsValidation` | SUPERVISOR | `supervisorController.getVisits` | Obtener todas las visitas de los promotores asignados a un supervisor |
| GET | `/api/supervisor/stats` | `authenticateToken`, `authorizeRoles('SUPERVISOR')` | SUPERVISOR | `supervisorController.getSupervisorStats` | Obtener estadísticas de supervisión |
| POST | `/api/supervisor/promoters/assign` | `authenticateToken`, `authorizeRoles('SUPERVISOR')`, `assignPromoterValidation` | SUPERVISOR | `supervisorController.assignPromoter` | Asignar un promotor a un supervisor |
| DELETE | `/api/supervisor/promoters/:promoterId/unassign` | `authenticateToken`, `authorizeRoles('SUPERVISOR')` | SUPERVISOR | `supervisorController.unassignPromoter` | Desasignar un promotor de un supervisor |

---

## 🛡 ADMIN ROUTES (`/api/admin`)

| Method | Full Path | Middleware | Roles | Controller | Descripción |
|--------|----------|------------|-------|------------|-------------|
| GET | `/api/admin/users` | `authenticateToken`, `requireAdmin` | ADMIN, SUPER_ADMIN | `adminController.getAllUsers` | Obtener todos los usuarios (solo admin) |
| GET | `/api/admin/clients` | `authenticateToken`, `requireAdmin` | ADMIN, SUPER_ADMIN | `adminController.getAllClients` | Obtener todos los clientes (solo admin) |
| GET | `/api/admin/visits` | `authenticateToken`, `requireAdmin` | ADMIN, SUPER_ADMIN | `adminController.getAllVisits` | Obtener todas las visitas (solo admin) |
| GET | `/api/admin/stats` | `authenticateToken`, `requireAdmin` | ADMIN, SUPER_ADMIN | `adminController.getSystemStats` | Obtener estadísticas del sistema (solo admin) |
| PATCH | `/api/admin/users/:userId/role` | `authenticateToken`, `requireAdmin` | ADMIN, SUPER_ADMIN | `adminController.updateUserRole` | Actualizar rol de usuario (solo admin) |
| PATCH | `/api/admin/users/:userId/status` | `authenticateToken`, `requireAdmin` | ADMIN, SUPER_ADMIN | `adminController.toggleUserStatus` | Activar/desactivar usuario (solo admin) |

**Nota**: `requireAdmin` es un middleware que verifica que el usuario tenga rol `ADMIN` o `SUPER_ADMIN`.

---

## 🏥 HEALTH & SYSTEM ROUTES (Raíz)

| Method | Full Path | Middleware | Roles | Controller | Descripción |
|--------|----------|------------|-------|------------|-------------|
| GET | `/health` | none | Public | Inline handler | Healthcheck completo del sistema |
| GET | `/health/liveness` | none | Public | Inline handler | Liveness probe (verifica que el proceso está vivo) |
| GET | `/health/readiness` | none | Public | Inline handler | Readiness probe (verifica que la app está lista para recibir tráfico) |
| GET | `/` | none | Public | Inline handler | Ruta raíz - información de la API |
| GET | `/uploads/*` | `express.static` | Public | Static files | Servir archivos subidos |

---

## 🔍 ANÁLISIS Y OBSERVACIONES

### ✅ Rutas Correctamente Registradas
Todas las rutas documentadas están correctamente registradas en `src/config/app.js` con los prefijos correspondientes.

### ⚠️ Rutas No Registradas (Archivos Existentes)
- `src/routes/clientRoutes.refactored.js` - Este archivo existe pero **NO** está siendo utilizado por la aplicación. La aplicación usa `src/routes/clientRoutes.js` en su lugar.

### 🔄 Rutas Duplicadas o Solapadas
No se detectaron rutas duplicadas. Cada ruta tiene un path único dentro de su namespace.

### 📝 Inconsistencias de Prefijo
No se detectaron inconsistencias. Todos los prefijos son consistentes:
- `/api/auth` - Autenticación
- `/api/clients` - Clientes  
- `/api/visits` - Visitas
- `/api/visits/images` - Imágenes de visitas
- `/api/admin` - Administración
- `/api/supervisor` - Supervisión

### 🛡️ Middleware Comunes
1. **`authenticateToken`**: Verifica token JWT en la mayoría de rutas privadas
2. **`authorizeRoles(...)`**: Restringe acceso por roles específicos
3. **Validaciones**: Cada ruta tiene validaciones específicas usando `express-validator`
4. **Rate Limiting**: Aplicado globalmente en `app.js` a todas las rutas

### 👥 Roles del Sistema
- **PUBLIC**: Acceso sin autenticación
- **PROMOTER**: Usuarios que realizan visitas
- **SUPERVISOR**: Supervisores que gestionan promotores
- **ADMIN**: Administradores del sistema
- **SUPER_ADMIN**: Administradores con todos los permisos

---

## 📊 RESUMEN DE RUTAS POR CATEGORÍA

| Categoría | Total Rutas | Métodos HTTP | Roles Principales |
|-----------|-------------|--------------|-------------------|
| Auth | 6 | POST (4), GET (1), PUT (1) | Public/Private |
| Clients | 6 | GET (3), POST (1), PUT (1), DELETE (1) | PROMOTER, SUPERVISOR, ADMIN, SUPER_ADMIN |
| Visits | 6 | GET (3), POST (1), PUT (1), DELETE (1) | PROMOTER |
| Visit Images | 2 | POST (1), GET (1) | PROMOTER |
| Supervisor | 6 | GET (4), POST (1), DELETE (1) | SUPERVISOR |
| Admin | 6 | GET (4), PATCH (2) | ADMIN, SUPER_ADMIN |
| Health/System | 5 | GET (5) | Public |
| **TOTAL** | **37** | **GET (17), POST (7), PUT (2), DELETE (2), PATCH (2)** | |

---

## 🚀 ENDPOINTS DE EJEMPLO

```bash
# Autenticación
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"contraseña"}'

# Obtener clientes (requiere token)
curl -X GET http://localhost:3001/api/clients \
  -H "Authorization: Bearer <token>"

# Healthcheck
curl -X GET http://localhost:3001/health

# Información de la API
curl -X GET http://localhost:3001/
```

---

*Documentación generada automáticamente basada en el código fuente. Última actualización: 2026-02-12*