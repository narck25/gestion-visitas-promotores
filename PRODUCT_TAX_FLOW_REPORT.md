# REPORTE: FLUJO DE IMPUESTOS EN PRODUCTOS

**Fecha:** 11 de marzo de 2026  
**Hora:** 23:45  
**Estado:** ✅ **RESUELTO**

## 📋 RESUMEN EJECUTIVO

Se identificó y corrigió el problema que impedía que los campos de impuestos (`porcentajeIVA` y `porcentajeIEPS`) llegaran al frontend. El problema estaba en las consultas Prisma que no incluían estos campos en el `SELECT`.

## 🔍 ANÁLISIS DETALLADO

### FASE 1: Verificación del modelo Prisma ✅
- **Archivo:** `prisma/schema.prisma`
- **Modelo:** `Product`
- **Campos verificados:**
  - `porcentajeIEPS Float? @default(0)` ✅ **PRESENTE**
  - `porcentajeIVA  Float? @default(0)` ✅ **PRESENTE**
- **Estado:** ✅ **CORRECTO** - Los campos existen en el schema

### FASE 2: Localización del endpoint usado por frontend ✅
- **Endpoint principal:** `GET /api/products/search`
- **Archivo de rutas:** `src/routes/productRoutes.js`
- **Controlador:** `productController.searchProducts`
- **Uso:** Autocomplete para selección de productos en pedidos
- **Estado:** ✅ **IDENTIFICADO**

### FASE 3: Verificación de consultas Prisma ✅
- **Archivo:** `src/controllers/productController.js`
- **Problema identificado:** ❌ **SELECT INCOMPLETO**
- **Consultas afectadas:**
  1. `searchProducts` - SELECT limitado sin campos de impuestos
  2. `getProductById` - SELECT limitado sin campos de impuestos  
  3. `getAllProducts` - SELECT limitado sin campos de impuestos

**SELECT original (incorrecto):**
```javascript
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true
  // FALTAN: porcentajeIVA, porcentajeIEPS
}
```

### FASE 4: Corrección de consultas Prisma ✅
- **Archivo modificado:** `src/controllers/productController.js`
- **Cambios aplicados:** Se agregaron `porcentajeIVA` y `porcentajeIEPS` a todos los SELECT

**SELECT corregido (correcto):**
```javascript
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true,
  porcentajeIVA: true,    // ← NUEVO
  porcentajeIEPS: true    // ← NUEVO
}
```

### FASE 5: Verificación de mapeo/transformación ✅
- **Búsqueda realizada:** `mapProduct`, `formatProduct`, `transformProduct`
- **Resultado:** ✅ **NO HAY MAPEO** - Los productos se devuelven directamente desde Prisma
- **Implicación:** No hay funciones intermedias que puedan filtrar los campos

### FASE 6: Prueba del endpoint funcionando ✅
- **URL probada:** `GET http://localhost:3001/api/products/search?q=USCL`
- **Resultado esperado:** Respuesta JSON con campos de impuestos
- **Resultado obtenido:** ✅ **CORRECTO**

**Ejemplo de respuesta verificada:**
```json
{
  "id": "b594d122-91ee-45e1-8775-4cd95e332034",
  "sku": "USCL1003X4",
  "description": "CHOCOLATE MR BEAST CON LECHE  240 GR",
  "family": "CHOCOLATES",
  "line": "FEASTABLES",
  "manufacturer": "FEASTABLES",
  "listPrice": 387.9629,
  "currency": "Pesos",
  "porcentajeIVA": 0,
  "porcentajeIEPS": 8
}
```

## 🛠️ CORRECCIONES APLICADAS

### 1. **Función `searchProducts`** (líneas 25-38)
```javascript
// ANTES (sin impuestos):
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true
}

// DESPUÉS (con impuestos):
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true,
  porcentajeIVA: true,
  porcentajeIEPS: true
}
```

### 2. **Función `getProductById`** (líneas 56-69)
```javascript
// ANTES (sin impuestos):
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true,
  createdAt: true,
  updatedAt: true
}

// DESPUÉS (con impuestos):
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true,
  porcentajeIVA: true,
  porcentajeIEPS: true,
  createdAt: true,
  updatedAt: true
}
```

### 3. **Función `getAllProducts`** (líneas 103-116)
```javascript
// ANTES (sin impuestos):
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true
}

// DESPUÉS (con impuestos):
select: {
  id: true,
  sku: true,
  description: true,
  family: true,
  line: true,
  manufacturer: true,
  listPrice: true,
  currency: true,
  porcentajeIVA: true,
  porcentajeIEPS: true
}
```

## 📊 IMPACTO EN EL SISTEMA

### ✅ **Frontend ahora recibe:**
```javascript
product = {
  sku: "USCL1003X4",
  description: "CHOCOLATE MR BEAST CON LECHE 240 GR",
  listPrice: 387.9629,
  porcentajeIVA: 0,      // ← AHORA DISPONIBLE
  porcentajeIEPS: 8      // ← AHORA DISPONIBLE
}
```

### ✅ **Cálculo de impuestos posible:**
El frontend puede ahora calcular correctamente:
- **IEPS:** `listPrice * (porcentajeIEPS / 100)`
- **IVA:** `(listPrice + IEPS) * (porcentajeIVA / 100)`
- **Precio final:** `listPrice + IEPS + IVA`

### ✅ **Compatibilidad con calculadora existente:**
La función `calcularPrecioConImpuestos` en `src/utils/taxCalculator.js` puede ser utilizada directamente con los datos recibidos.

## 🎯 RESULTADO FINAL

**PROBLEMA:** El frontend no recibía los campos `porcentajeIVA` y `porcentajeIEPS` aunque existían en la base de datos.

**CAUSA:** Las consultas Prisma en `productController.js` tenían SELECT limitados que excluían los campos de impuestos.

**SOLUCIÓN:** Actualizar todas las consultas Prisma para incluir `porcentajeIVA` y `porcentajeIEPS` en el SELECT.

**RESULTADO:** ✅ **FLUJO DE IMPUESTOS RESTAURADO** - El frontend ahora recibe todos los datos necesarios para calcular impuestos correctamente.

## 📝 RECOMENDACIONES

1. **Testing:** Verificar que el cálculo de impuestos funcione correctamente en el frontend
2. **Documentación:** Actualizar documentación de API para incluir los nuevos campos
3. **Monitoreo:** Verificar que otros endpoints relacionados con productos también incluyan los campos de impuestos
4. **Consistencia:** Asegurar que todos los módulos que consumen productos usen la misma estructura

---
**Auditoría completada por:** Cline  
**Estado:** ✅ **FLUJO DE IMPUESTOS RESTAURADO**  
**Impacto:** Frontend puede ahora calcular correctamente IVA e IEPS en pedidos