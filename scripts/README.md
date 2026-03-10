# Scripts de Importación y Mantenimiento

Esta carpeta contiene scripts utilitarios para la gestión del sistema de visitas de promotores.

## Estructura

```
scripts/
├── data/                    # Datos para importación
│   └── catalogo_productos.csv  # Catálogo de productos
├── importProducts.js        # Script para importar productos
└── README.md               # Esta documentación
```

## Scripts Disponibles

### 1. Importación de Productos (`importProducts.js`)

**Propósito:** Importar el catálogo de productos desde un archivo CSV a la base de datos.

**Archivo CSV:** `data/catalogo_productos.csv`

**Estructura del CSV:**
- `SKU`: Código único del producto (requerido)
- `Descripcion`: Descripción del producto (requerido)
- `Familia`: Familia del producto (opcional)
- `Linea`: Línea del producto (opcional)
- `Fabricante`: Fabricante del producto (opcional)
- `Precio_Lista`: Precio de lista (opcional)
- `Moneda`: Moneda (default: "Pesos")

**Uso:**
```bash
# Desde la raíz del proyecto
node scripts/importProducts.js
```

**Funcionalidades:**
1. Lee el archivo CSV y valida los datos
2. Verifica si ya existen productos en la base de datos
3. Elimina productos existentes antes de importar (con confirmación)
4. Importa productos en lotes para mejor rendimiento
5. Muestra estadísticas de importación

**Notas:**
- El script usa `csv-parser` para leer el archivo CSV
- Los valores "NULL" en el CSV se convierten a `null` en la base de datos
- Los precios se convierten de string a número (ej: "2,693.63" → 2693.63)
- Los productos duplicados por SKU se omiten automáticamente

## Preparación del CSV

### Formato Requerido:
```csv
SKU,Descripcion,Familia,Linea,Fabricante,Precio_Lista,Moneda
DEXTRO 08,DISPLAY TABLETA EFERVESCENTE 82G ZERO NARANJA 12 PZ,DEXTRO,DEXTRO,DEXTRO,2693.63,Pesos
```

### Consideraciones:
1. **Encoding:** UTF-8
2. **Separador:** Coma (`,`)
3. **Valores nulos:** Usar "NULL" o dejar vacío
4. **Precios:** Usar formato numérico con punto decimal (ej: 2693.63)

## Modelo de Datos

Los productos se importan al modelo `Product` definido en `prisma/schema.prisma`:

```prisma
model Product {
  id           String   @id @default(uuid())
  sku          String   @unique
  description  String
  family       String?
  line         String?
  manufacturer String?
  listPrice    Float?
  currency     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([sku])
  @@index([description])
}
```

## Flujo de Trabajo Recomendado

1. **Preparar datos:** Asegurar que el CSV tenga el formato correcto
2. **Verificar conexión:** Asegurar que la base de datos esté accesible
3. **Ejecutar importación:** `node scripts/importProducts.js`
4. **Verificar resultados:** Revisar estadísticas y logs
5. **Validar en Prisma Studio:** `npx prisma studio`

## Manejo de Errores

El script incluye manejo de errores para:
- Archivo CSV no encontrado
- Campos requeridos faltantes
- Errores de conexión a base de datos
- Duplicados por SKU
- Errores de formato de datos

## Personalización

Para adaptar el script a otros formatos de CSV:
1. Modificar el mapeo de columnas en `importProducts.js`
2. Ajustar las validaciones según los nuevos campos
3. Actualizar la lógica de transformación de datos

## Próximos Scripts Planeados

1. **Exportación de productos:** Exportar catálogo a CSV
2. **Sincronización con Intelisis:** Integración con sistema ERP
3. **Reportes de inventario:** Generar reportes de productos
4. **Migración de datos:** Herramientas para migración entre versiones