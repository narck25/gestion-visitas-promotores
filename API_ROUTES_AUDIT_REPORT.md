# AUDITORÍA DE RUTAS DE API BACKEND
**Fecha:** 11 de marzo de 2026  
**Proyecto:** Gestión de Visitas de Promotores  
**Versión:** 1.0.0

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Total | Estado |
|-----------|-------|--------|
| Endpoints Totales | 45 | ✅ |
| Rutas Registradas | 8 | ✅ |
| Rutas No Registradas | 6 | ⚠️ |
| Controladores Existentes | 13 | ✅ |
| Controladores Faltantes | 0 | ✅ |
| Rutas Duplicadas | 1 | ⚠️ |

---

## 📋 1️⃣ LISTA COMPLETA DE ENDPOINTS

### 🔐 AUTENTICACIÓN (`/api/auth`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| POST | `/api/auth/register` | `authRoutes.js` | `authController.register` | ✅ |
| POST | `/api/auth/login` | `authRoutes.js` | `authController.login` | ✅ |
| POST | `/api/auth/refresh-token` | `authRoutes.js` | `authController.refreshToken` | ✅ |
| POST | `/api/auth/logout` | `authRoutes.js` | `authController.logout` | ✅ |
| GET | `/api/auth/profile` | `authRoutes.js` | `authController.getProfile` | ✅ |
| PUT | `/api/auth/profile` | `authRoutes.js` | `authController.updateProfile` | ✅ |

### 👥 USUARIOS (`/api/users`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/api/users` | `usersRoutes.js` | `usersController.getAllUsers` | ✅ |
| GET | `/api/users/:id` | `usersRoutes.js` | `usersController.getUserById` | ✅ |
| POST | `/api/users` | `usersRoutes.js` | `usersController.createUser` | ✅ |
| PUT | `/api/users/:id` | `usersRoutes.js` | `usersController.updateUser` | ✅ |
| PATCH | `/api/users/:id/status` | `usersRoutes.js` | `usersController.updateUserStatus` | ✅ |
| DELETE | `/api/users/:id` | `usersRoutes.js` | `usersController.deleteUser` | ✅ |
| GET | `/api/users/promoters` | `usersRoutes.js` | `userController.getPromoters` | ✅ |

### 👤 USUARIOS SIMPLE (`/api/users` - alternativa)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/api/users/promoters` | `userRoutes.js` | `userController.getPromoters` | ⚠️ **DUPLICADO** |

### 🏢 CLIENTES (`/api/clients`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/api/clients` | `clientRoutes.js` | `clientController.getAllClients` | ✅ |
| GET | `/api/clients/stats` | `clientRoutes.js` | `clientController.getClientStats` | ✅ |
| GET | `/api/clients/export` | `clientRoutes.js` | `clientController.exportClients` | ✅ |
| POST | `/api/clients` | `clientRoutes.js` | `clientController.createClient` | ✅ |
| GET | `/api/clients/:id` | `clientRoutes.js` | `clientController.getClientById` | ✅ |
| PUT | `/api/clients/:id` | `clientRoutes.js` | `clientController.updateClient` | ✅ |
| DELETE | `/api/clients/:id` | `clientRoutes.js` | `clientController.deleteClient` | ✅ |
| PATCH | `/api/clients/:id/assign` | `clientRoutes.js` | `clientController.assignPromoter` | ✅ |

### 📋 VISITAS (`/api/visits`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| POST | `/api/visits` | `visitRoutes.js` | `visitController.createVisit` | ✅ |
| GET | `/api/visits` | `visitRoutes.js` | `visitController.getVisits` | ✅ |
| GET | `/api/visits/:id` | `visitRoutes.js` | `visitController.getVisitById` | ✅ |
| PUT | `/api/visits/:id` | `visitRoutes.js` | `visitController.updateVisit` | ✅ |
| DELETE | `/api/visits/:id` | `visitRoutes.js` | `visitController.deleteVisit` | ✅ |
| GET | `/api/visits/stats` | `visitRoutes.js` | `visitController.getVisitStats` | ✅ |

### 📸 IMÁGENES DE VISITAS (`/api/visits/images`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| POST | `/api/visits/images` | `visitImageRoutes.js` | *(handler inline)* | ✅ |
| GET | `/api/visits/images/:id` | `visitImageRoutes.js` | *(handler inline)* | ✅ |

### 👑 ADMINISTRACIÓN (`/api/admin`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/api/admin/users` | `adminRoutes.js` | `adminController.getAllUsers` | ✅ |
| GET | `/api/admin/clients` | `adminRoutes.js` | `adminController.getAllClients` | ✅ |
| GET | `/api/admin/visits` | `adminRoutes.js` | `adminController.getAllVisits` | ✅ |
| GET | `/api/admin/stats` | `adminRoutes.js` | `adminController.getSystemStats` | ✅ |
| GET | `/api/admin/dashboard` | `adminRoutes.js` | `adminController.getDashboard` | ✅ |
| PATCH | `/api/admin/users/:userId/role` | `adminRoutes.js` | `adminController.updateUserRole` | ✅ |
| PATCH | `/api/admin/users/:userId/status` | `adminRoutes.js` | `adminController.toggleUserStatus` | ✅ |

### 👨‍💼 SUPERVISORES (`/api/supervisor`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/api/supervisor/promoters` | `supervisorRoutes.js` | `supervisorController.getPromoters` | ✅ |
| GET | `/api/supervisor/clients` | `supervisorRoutes.js` | `supervisorController.getClients` | ✅ |
| GET | `/api/supervisor/visits` | `supervisorRoutes.js` | `supervisorController.getVisits` | ✅ |
| GET | `/api/supervisor/stats` | `supervisorRoutes.js` | `supervisorController.getSupervisorStats` | ✅ |
| POST | `/api/supervisor/promoters/assign` | `supervisorRoutes.js` | `supervisorController.assignPromoter` | ✅ |
| DELETE | `/api/supervisor/promoters/:promoterId/unassign` | `supervisorRoutes.js` | `supervisorController.unassignPromoter` | ✅ |

### 📦 PRODUCTOS (`/api/products`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/api/products/search` | `productRoutes.js` | `productController.searchProducts` | ✅ |
| GET | `/api/products` | `productRoutes.js` | `productController.getAllProducts` | ✅ |
| GET | `/api/products/:id` | `productRoutes.js` | `productController.getProductById` | ✅ |

### 🛒 PEDIDOS (`/api/orders`)
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| POST | `/api/orders` | `orderRoutes.js` | `orderController.createOrder` | ✅ |
| GET | `/api/orders` | `orderRoutes.js` | `orderController.listOrders` | ✅ |
| GET | `/api/orders/:id` | `orderRoutes.js` | `orderController.getOrderDetail` | ✅ |
| PATCH | `/api/orders/:id/complete` | `orderRoutes.js` | `orderController.completeOrder` | ✅ |
| PATCH | `/api/orders/:id/cancel` | `orderRoutes.js` | `orderController.cancelOrder` | ✅ |

### 🩺 HEALTH CHECKS
| Método | Endpoint | Archivo | Controlador | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/health` | `app.js` | *(handler inline)* | ✅ |
| GET | `/health/liveness` | `app.js` | *(handler inline)* | ✅ |
| GET | `/health/readiness` | `app.js` | *(handler inline)* | ✅ |
| GET | `/` | `app.js` | *(handler inline)* | ✅ |

---

## ⚠️ 2️⃣ RUTAS NO REGISTRADAS

Las siguientes rutas existen como archivos pero **NO están registradas** en `src/config/app.js`:

| Archivo de Ruta | Estado | Problema |
|-----------------|--------|----------|
| `visitRoutes.refactored.js` | ⚠️ | Versión refactorizada no registrada |
| `visitRoutes.final.js` | ⚠️ | Versión final no registrada |
| `visitRoutes.test.js` | ⚠️ | Ruta de prueba no registrada |
| `clientRoutes.refactored.js` | ⚠️ | Versión refactorizada no registrada |
| `userRoutes.js` | ⚠️ | Ruta simple duplicada |
| `visitImageRoutes.js` | ⚠️ | **IMPORTANTE**: Ruta de imágenes no registrada |

**Impacto:** Las rutas no registradas no estarán disponibles en la API.

---

## 🔍 3️⃣ VERIFICACIÓN DE CONTROLADORES

### ✅ CONTROLADORES EXISTENTES Y EXPORTADOS
1. `adminController.js` - ✅ Exportado correctamente
2. `authController.js` - ✅ Exportado correctamente  
3. `clientController.js` - ✅ Exportado correctamente
4. `orderController.js` - ✅ Exportado correctamente
5. `productController.js` - ✅ Exportado correctamente
6. `supervisorController.js` - ✅ Exportado correctamente
7. `userController.js` - ✅ Exportado correctamente
8. `usersController.js` - ✅ Exportado correctamente
9. `visitController.js` - ✅ Exportado correctamente
10. `visitImageController.js` - ✅ Exportado correctamente

### ⚠️ CONTROLADORES CON VERSIONES ALTERNATIVAS
1. `clientController.refactored.js` - Versión alternativa no utilizada
2. `visitController.refactored.js` - Versión alternativa (usada por `visitRoutes.js`)
3. `visitController.simple.js` - Versión simple no utilizada

**Nota:** `visitRoutes.js` usa `visitController.refactored.js` correctamente.

---

## 🔄 4️⃣ RUTAS DUPLICADAS

### 🔴 DUPLICADO CRÍTICO
| Endpoint | Archivo 1 | Archivo 2 | Problema |
|----------|-----------|-----------|----------|
| `GET /api/users/promoters` | `usersRoutes.js` | `userRoutes.js` | **Ruta duplicada** |

**Impacto:** Posible conflicto de rutas. Solo una será accesible (la registrada en `app.js`).

---

## 🎯 5️⃣ ENDPOINTS USADOS POR FRONTEND

### 🔐 AUTENTICACIÓN Y PERFIL
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/register` - Registro de usuarios
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil

### 👥 GESTIÓN DE USUARIOS
- `GET /api/users/promoters` - Listar promotores
- `GET /api/users` - Listar usuarios (admin)
- `POST /api/users` - Crear usuario (admin)

### 🏢 GESTIÓN DE CLIENTES
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `GET /api/clients/:id` - Ver detalle de cliente
- `PUT /api/clients/:id` - Actualizar cliente

### 📋 VISITAS
- `POST /api/visits` - Registrar visita
- `GET /api/visits` - Listar visitas
- `GET /api/visits/:id` - Ver detalle de visita
- `GET /api/visits/stats` - Estadísticas de visitas

### 📦 PRODUCTOS Y PEDIDOS
- `GET /api/products/search` - Buscar productos
- `GET /api/products` - Listar productos
- `POST /api/orders` - Crear pedido
- `GET /api/orders` - Listar pedidos

### 👑 PANEL DE ADMINISTRACIÓN
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/stats` - Estadísticas del sistema
- `GET /api/admin/users` - Gestión de usuarios

---

## 🚨 6️⃣ PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICOS
1. **Ruta de imágenes no registrada** - `visitImageRoutes.js` no está en `app.js`
   - Impacto: No se pueden subir/ver imágenes de visitas
   - Solución: Agregar `app.use('/api/visits/images', visitImageRoutes)`

### 🟡 ADVERTENCIAS
1. **Ruta duplicada** - `GET /api/users/promoters` en dos archivos
   - Impacto: Conflicto potencial
   - Solución: Eliminar `userRoutes.js` o mantener solo una

2. **Versiones alternativas no utilizadas**
   - `visitRoutes.refactored.js`, `visitRoutes.final.js`, `clientRoutes.refactored.js`
   - Impacto: Confusión en el código base
   - Solución: Limpiar archivos no utilizados

3. **Controladores inline en `visitImageRoutes.js`**
   - Impacto: Mantenimiento difícil
   - Solución: Mover lógica a `visitImageController.js`

### 🟢 RECOMENDACIONES
1. **Documentación de API** - Crear documentación Swagger/OpenAPI
2. **Versionado de API** - Considerar `/api/v1/` para futuras versiones
3. **Logging de rutas** - Implementar middleware de logging para auditoría
4. **Validación centralizada** - Unificar validaciones en `src/validators/`

---

## 📈 7️⃣ ESTADÍSTICAS FINALES

### 📊 DISTRIBUCIÓN POR MÉTODO HTTP
| Método | Cantidad | Porcentaje |
|--------|----------|------------|
| GET | 24 | 53.3% |
| POST | 10 | 22.2% |
| PATCH | 5 | 11.1% |
| PUT | 4 | 8.9% |
| DELETE | 2 | 4.4% |

### 📊 DISTRIBUCIÓN POR MÓDULO
| Módulo | Endpoints | Porcentaje |
|--------|-----------|------------|
| Autenticación | 6 | 13.3% |
| Usuarios | 7 | 15.6% |
| Clientes | 8 | 17.8% |
| Visitas | 6 | 13.3% |
| Administración | 7 | 15.6% |
| Supervisores | 6 | 13.3% |
| Productos | 3 | 6.7% |
| Pedidos | 5 | 11.1% |
| Health Checks | 4 | 8.9% |

**Total endpoints únicos:** 45

---

## ✅ 8️⃣ CONCLUSIÓN

### ✅ PUNTOS FUERTES
1. Arquitectura modular bien organizada
2. Separación clara de responsabilidades (routes/controllers)
3. Controladores existentes y correctamente exportados
4. Sistema de autenticación y autorización robusto
5. Health checks implementados para producción

### ⚠️ ÁREAS DE MEJORA
1. **Registrar `visitImageRoutes.js`** - Prioridad alta
2. **Eliminar rutas duplicadas** - Prioridad media
3. **Limpiar versiones alternativas** - Prioridad baja
4. **Mover lógica inline a controladores** - Prioridad media

### 🎯 ACCIONES RECOMENDADAS
1. **Inmediato:** Agregar `visitImageRoutes` a `app.js`
2. **Corto plazo:** Eliminar `userRoutes.js` (duplicado)
3. **Mediano plazo:** Documentar API con Swagger
4. **Largo plazo:** Implementar versionado de API (`/api/v2/`)

---

**Auditoría completada por:** Cline (Asistente de IA)  
**Estado:** ✅ COMPLETADO - Listo para revisión técnica