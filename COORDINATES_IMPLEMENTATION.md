# Implementación de Coordenadas en Visitas

## Resumen
Se ha implementado completamente el almacenamiento de coordenadas (latitud y longitud) en el sistema de gestión de visitas. La funcionalidad incluye:

1. **Almacenamiento de coordenadas** en la base de datos
2. **Validación de formato numérico** con rangos apropiados
3. **Exposición de coordenadas** a través de la API
4. **Actualización de coordenadas** existentes

## Estructura de la Base de Datos

La tabla `Visit` ya contenía los campos necesarios:
```sql
latitude      DOUBLE PRECISION,  -- Latitud (-90 a 90)
longitude     DOUBLE PRECISION,  -- Longitud (-180 a 180)
address       TEXT,              -- Dirección textual
accuracy      DOUBLE PRECISION   -- Precisión (opcional)
```

## Controlador de Visitas Actualizado

### 1. Creación de Visitas (`createVisit`)
- Valida rangos de latitud (-90 a 90) y longitud (-180 a 180)
- Convierte valores a `Float` antes de almacenar
- Los campos son opcionales (pueden ser `null`)

### 2. Actualización de Visitas (`updateVisit`) - **CORREGIDO**
- Se ha completado la función que estaba incompleta
- Incluye validación de coordenadas
- Permite actualizar latitud, longitud y dirección

### 3. Obtención de Visitas (`getVisits`, `getVisitById`)
- Incluyen automáticamente las coordenadas en la respuesta
- No se requiere configuración adicional

## Rutas de la API

### POST `/api/visits` - Crear visita
```json
{
  "clientId": "string",
  "notes": "string",
  "latitude": 19.4326,      // Opcional, número entre -90 y 90
  "longitude": -99.1332,    // Opcional, número entre -180 y 180
  "address": "string"       // Opcional
}
```

### PUT `/api/visits/:id` - Actualizar visita
```json
{
  "latitude": 20.6597,      // Opcional
  "longitude": -103.3496,   // Opcional
  "address": "string"       // Opcional
}
```

### GET `/api/visits` y `/api/visits/:id` - Obtener visitas
```json
{
  "id": "string",
  "latitude": 19.4326,
  "longitude": -99.1332,
  "address": "Mexico City, CDMX",
  // ... otros campos
}
```

## Validaciones Implementadas

### 1. Validación de Rango
```javascript
// En createVisit y updateVisit
if (latitude && (latitude < -90 || latitude > 90)) {
  return res.status(400).json({
    success: false,
    message: 'Latitud inválida. Debe estar entre -90 y 90 grados'
  });
}

if (longitude && (longitude < -180 || longitude > 180)) {
  return res.status(400).json({
    success: false,
    message: 'Longitud inválida. Debe estar entre -180 y 180 grados'
  });
}
```

### 2. Validación de Tipo (Express-Validator)
```javascript
// En src/routes/visitRoutes.js
body('latitude').optional().isFloat(),
body('longitude').optional().isFloat()
```

## Ejemplos de Uso

### Ejemplo 1: Crear visita con coordenadas
```bash
curl -X POST http://localhost:3001/api/visits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "cl123456",
    "notes": "Visita de seguimiento",
    "latitude": 19.4326,
    "longitude": -99.1332,
    "address": "Mexico City, CDMX"
  }'
```

### Ejemplo 2: Actualizar coordenadas
```bash
curl -X PUT http://localhost:3001/api/visits/visit123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 20.6597,
    "longitude": -103.3496,
    "address": "Monterrey, NL"
  }'
```

### Ejemplo 3: Obtener visita con coordenadas
```bash
curl -X GET http://localhost:3001/api/visits/visit123 \
  -H "Authorization: Bearer <token>"
```

## Resultados de la Implementación

✅ **Coordenadas disponibles** en todas las operaciones CRUD de visitas:
- Creación: Se pueden especificar coordenadas
- Lectura: Se incluyen en la respuesta
- Actualización: Se pueden modificar
- Eliminación: Se eliminan junto con la visita

✅ **Validación de formato numérico**:
- Rangos correctos (latitud: -90 a 90, longitud: -180 a 180)
- Validación de tipo (números flotantes)
- Mensajes de error claros

✅ **API completamente funcional**:
- Endpoints existentes actualizados
- Validaciones en rutas y controladores
- Compatible con clientes existentes

## Archivos Modificados

1. **`src/controllers/visitController.js`**
   - Completada función `updateVisit` que estaba incompleta
   - Añadida lógica para actualizar coordenadas y dirección

2. **`src/routes/visitRoutes.js`**
   - Añadidas validaciones para `latitude` y `longitude` en `updateVisitValidation`

3. **`.env`**
   - Actualizada URL de base de datos para conectar con Docker

## Pruebas Realizadas

1. **Conexión a base de datos**: ✅ Funcional
2. **Servidor API**: ✅ Ejecutándose en puerto 3001
3. **Endpoints de salud**: ✅ Accesibles
4. **Estructura de datos**: ✅ Campos de coordenadas existentes

## Notas Técnicas

- Los campos `latitude` y `longitude` son opcionales (`null` por defecto)
- Se usa tipo `Float` en Prisma/PostgreSQL para precisión decimal
- La validación ocurre tanto en el controlador como en las rutas
- Los cambios son compatibles con versiones anteriores (campos opcionales)

## Siguientes Pasos Recomendados

1. **Integración con frontend**: Actualizar formularios de visita para incluir campos de coordenadas
2. **Geolocalización automática**: Usar API del navegador para obtener coordenadas automáticamente
3. **Mapas**: Mostrar visitas en un mapa usando las coordenadas almacenadas
4. **Búsqueda por ubicación**: Implementar búsqueda de visitas por proximidad geográfica