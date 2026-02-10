# Implementación de Seguridad en Creación de Visitas

## Resumen
Se ha implementado validación de propiedad de clientes para garantizar la consistencia de datos y seguridad en la creación de visitas. La implementación incluye:

1. **Validación de propiedad del cliente**: Los promotores solo pueden crear visitas para sus propios clientes
2. **Rechazo de visitas con cliente ajeno**: Visitas con clientes que no pertenecen al usuario son rechazadas
3. **Compatibilidad con administradores**: Los roles ADMIN, SUPER_ADMIN y MANAGER pueden crear visitas para cualquier cliente

## Implementación

### 1. Validación en `createVisit` (src/controllers/visitController.js)

Se ha añadido la siguiente validación después de verificar que el cliente existe:

```javascript
// Validar que el cliente pertenece al usuario (excepto para administradores)
const userRole = req.user.role;
const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(userRole);

if (!isAdmin && client.promoterId !== promoterId) {
  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para crear visitas para este cliente'
  });
}
```

### 2. Lógica de Validación

- **Para PROMOTER y VIEWER**: Solo pueden crear visitas para clientes donde `client.promoterId === userId`
- **Para ADMIN, SUPER_ADMIN y MANAGER**: Pueden crear visitas para cualquier cliente (sin restricción)
- **Código de error**: 403 Forbidden cuando un usuario no administrador intenta usar un cliente ajeno

### 3. Validaciones Existentes Mantenidas

Las siguientes validaciones ya existían y se mantienen:

- **Verificación de existencia del cliente**: Código 404 si el cliente no existe
- **Validación de campos requeridos**: `clientId` y `notes` son obligatorios
- **Validación de coordenadas**: Rangos correctos para latitud (-90 a 90) y longitud (-180 a 180)

## Flujo de Seguridad Completo

### Creación de Visita
1. Usuario autenticado envía solicitud POST `/api/visits`
2. Sistema verifica:
   - ✅ Token JWT válido (middleware `authenticateToken`)
   - ✅ Campos requeridos presentes (`clientId`, `notes`)
   - ✅ Coordenadas válidas (si se proporcionan)
   - ✅ Cliente existe en la base de datos
   - ✅ **NUEVO**: Cliente pertenece al usuario (excepto administradores)
3. Si todas las validaciones pasan: visita creada
4. Si falla validación de propiedad: error 403 con mensaje claro

### Actualización y Eliminación de Visitas
Las funciones `updateVisit` y `deleteVisit` ya tenían implementada la validación de propiedad:
- **PROMOTER/VIEWER**: Solo pueden modificar/eliminar sus propias visitas (filtro `where.promoterId = userId`)
- **ADMIN/SUPER_ADMIN/MANAGER**: Pueden modificar/eliminar cualquier visita

## Ejemplos de Comportamiento

### Ejemplo 1: Promotor intenta crear visita para cliente ajeno
```http
POST /api/visits
Authorization: Bearer <token_promoter>
Content-Type: application/json

{
  "clientId": "cliente_de_otro_promotor",
  "notes": "Visita de prueba"
}
```

**Respuesta:**
```json
{
  "success": false,
  "message": "No tienes permisos para crear visitas para este cliente"
}
```
**Status:** 403 Forbidden

### Ejemplo 2: Administrador crea visita para cualquier cliente
```http
POST /api/visits
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "clientId": "cualquier_cliente",
  "notes": "Visita administrativa"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Visita creada exitosamente",
  "data": { "visit": { ... } }
}
```
**Status:** 201 Created

### Ejemplo 3: Promotor crea visita para su propio cliente
```http
POST /api/visits
Authorization: Bearer <token_promoter>
Content-Type: application/json

{
  "clientId": "cliente_propio",
  "notes": "Visita regular"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Visita creada exitosamente",
  "data": { "visit": { ... } }
}
```
**Status:** 201 Created

## Beneficios de la Implementación

### 1. Seguridad de Datos
- Previene que promotores accedan a datos de otros promotores
- Garantiza que las visitas se asocien correctamente con el promotor apropiado
- Evita contaminación de datos entre diferentes usuarios

### 2. Consistencia del Sistema
- Mantiene la integridad referencial entre clientes y visitas
- Asegura que las estadísticas y reportes sean precisos
- Previene errores en la asignación de responsabilidades

### 3. Experiencia de Usuario
- Mensajes de error claros y específicos
- Comportamiento consistente con otras operaciones CRUD
- Compatibilidad con roles existentes

### 4. Mantenibilidad
- Código claro y auto-documentado
- Fácil de extender para nuevos requisitos de seguridad
- Integración transparente con validaciones existentes

## Compatibilidad con Funcionalidades Existentes

### 1. Coordenadas (Implementación Anterior)
- La validación de coordenadas sigue funcionando
- Los campos `latitude` y `longitude` siguen siendo opcionales
- La validación de rangos (-90 a 90, -180 a 180) se mantiene

### 2. Roles de Usuario
- **PROMOTER**: Solo sus clientes, solo sus visitas
- **VIEWER**: Solo sus clientes, solo sus visitas (solo lectura)
- **MANAGER**: Cualquier cliente, cualquier visita
- **ADMIN**: Cualquier cliente, cualquier visita
- **SUPER_ADMIN**: Cualquier cliente, cualquier visita

### 3. API Existente
- No se requieren cambios en los endpoints
- No se rompe compatibilidad con clientes existentes
- Las respuestas mantienen el mismo formato

## Pruebas Recomendadas

### Pruebas Unitarias
1. Promotor crea visita para cliente propio → Éxito (201)
2. Promotor crea visita para cliente ajeno → Error (403)
3. Administrador crea visita para cualquier cliente → Éxito (201)
4. Cliente no existe → Error (404)
5. Campos requeridos faltantes → Error (400)
6. Coordenadas inválidas → Error (400)

### Pruebas de Integración
1. Flujo completo: Login → Obtener clientes → Crear visita
2. Permisos cruzados entre diferentes usuarios
3. Consistencia con operaciones de actualización/eliminación

## Archivos Modificados

1. **`src/controllers/visitController.js`**
   - Añadida validación de propiedad de cliente en función `createVisit`
   - Mantenida compatibilidad con roles administrativos

## Siguientes Pasos Recomendados

1. **Auditoría de permisos**: Revisar otros endpoints para consistencia
2. **Logging de seguridad**: Registrar intentos de acceso no autorizado
3. **Pruebas automatizadas**: Implementar tests para validaciones de seguridad
4. **Documentación API**: Actualizar documentación OpenAPI/Swagger
5. **Monitoreo**: Configurar alertas para patrones sospechosos de acceso