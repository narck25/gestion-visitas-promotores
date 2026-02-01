# Documentación del Schema - Gestión de Visitas de Promotores

## 📋 Resumen del Modelo de Datos

Este schema está diseñado para una aplicación de gestión de visitas de promotores de venta, con énfasis en:
- **Gestión de usuarios** con roles jerárquicos
- **Clientes con geolocalización** avanzada usando PostGIS
- **Visitas** con seguimiento completo
- **Evidencias fotográficas** separadas (antes/después)
- **Sincronización offline** para trabajo en campo

## 🏗️ Estructura de Entidades

### 1. **User (Usuario)**
**Propósito:** Gestionar todos los usuarios del sistema con diferentes niveles de acceso.

**Campos:**
- `id` (String): Identificador único (CUID)
- `email` (String, único): Email del usuario (255 chars)
- `password` (String): Contraseña hasheada (255 chars)
- `name` (String): Nombre completo (255 chars)
- `phone` (String, opcional): Teléfono (20 chars)
- `avatar` (String, opcional): URL de imagen de perfil (500 chars)
- `role` (Role): Rol del usuario (SUPER_ADMIN, ADMIN, MANAGER, PROMOTER, VIEWER)
- `isActive` (Boolean): Estado activo/inactivo
- `lastLoginAt` (DateTime, opcional): Último login
- `createdAt` (DateTime): Fecha de creación
- `updatedAt` (DateTime): Última actualización

**Relaciones:**
- `visits` (Visit[]): Visitas realizadas por el usuario
- `refreshTokens` (RefreshToken[]): Tokens de refresh
- `clients` (Client[]): Clientes asignados al promotor

**Índices:**
- `email`: Búsqueda rápida por email
- `role`: Filtrado por rol
- `isActive`: Filtrado por estado
- `createdAt`: Ordenamiento por fecha de creación

### 2. **Client (Cliente)**
**Propósito:** Almacenar información de clientes con geolocalización avanzada.

**Campos:**
- `id` (String): Identificador único (CUID)
- `name` (String): Nombre del cliente (255 chars)
- `businessName` (String, opcional): Nombre del negocio (255 chars)
- `phone` (String, opcional): Teléfono (20 chars)
- `email` (String, opcional): Email (255 chars)
- `address` (String, opcional): Dirección completa (Text)
- `city` (String, opcional): Ciudad (100 chars)
- `state` (String, opcional): Estado (100 chars)
- `country` (String, opcional): País, default "México" (100 chars)
- `postalCode` (String, opcional): Código postal (10 chars)
- `location` (Geometry Point, opcional): **Geolocalización usando PostGIS** (SRID 4326)
- `businessType` (BusinessType, opcional): Tipo de negocio
- `category` (String, opcional): Categoría (100 chars)
- `notes` (String, opcional): Notas adicionales (Text)
- `promoterId` (String, opcional): Promotor asignado
- `isActive` (Boolean): Estado activo/inactivo
- `createdAt` (DateTime): Fecha de creación
- `updatedAt` (DateTime): Última actualización

**Relaciones:**
- `promoter` (User, opcional): Promotor asignado
- `visits` (Visit[]): Visitas realizadas al cliente

**Índices:**
- `name`: Búsqueda por nombre
- `businessName`: Búsqueda por nombre de negocio
- `promoterId`: Filtrado por promotor asignado
- `businessType`: Filtrado por tipo de negocio
- `isActive`: Filtrado por estado
- `createdAt`: Ordenamiento por fecha
- `@@fulltext([name, businessName, address])`: Búsqueda de texto completo

### 3. **Visit (Visita)**
**Propósito:** Registrar visitas de promotores a clientes con evidencias completas.

**Campos:**
- `id` (String): Identificador único (CUID)
- `promoterId` (String): ID del promotor
- `clientId` (String): ID del cliente
- `date` (DateTime): Fecha/hora de la visita
- `scheduledDate` (DateTime, opcional): Fecha programada
- `duration` (Int, opcional): Duración en minutos
- `location` (Geometry Point, opcional): **Geolocalización al momento de la visita** (PostGIS)
- `address` (String, opcional): Dirección capturada (Text)
- `accuracy` (Float, opcional): Precisión del GPS en metros
- `status` (VisitStatus): Estado (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
- `purpose` (VisitPurpose): Propósito (SALES, FOLLOW_UP, DELIVERY, TRAINING, COMPLAINT, OTHER)
- `notes` (String): Notas de la visita (Text)
- `rating` (Int, opcional): Calificación 1-5
- `signature` (String, opcional): Firma digital en Base64 (Text)
- `signedAt` (DateTime, opcional): Fecha/hora de la firma
- `isSynced` (Boolean): Estado de sincronización offline
- `createdAt` (DateTime): Fecha de creación
- `updatedAt` (DateTime): Última actualización

**Relaciones:**
- `promoter` (User): Promotor que realizó la visita
- `client` (Client): Cliente visitado
- `beforePhotos` (Photo[]): **Fotos ANTES** (relación separada)
- `afterPhotos` (Photo[]): **Fotos DESPUÉS** (relación separada)

**Índices:**
- `promoterId`: Filtrado por promotor
- `clientId`: Filtrado por cliente
- `date`: Ordenamiento por fecha
- `status`: Filtrado por estado
- `purpose`: Filtrado por propósito
- `isSynced`: Para sincronización offline
- `createdAt`: Ordenamiento por creación

### 4. **Photo (Foto)**
**Propósito:** Almacenar evidencias fotográficas con metadatos EXIF.

**Campos:**
- `id` (String): Identificador único (CUID)
- `visitId` (String): ID de la visita relacionada
- `url` (String): URL o path del archivo (500 chars)
- `thumbnailUrl` (String, opcional): URL de miniatura (500 chars)
- `type` (PhotoType): Tipo (BEFORE, AFTER, OTHER)
- `caption` (String, opcional): Descripción (255 chars)
- `latitude` (Float, opcional): Latitud EXIF
- `longitude` (Float, opcional): Longitud EXIF
- `altitude` (Float, opcional): Altitud EXIF
- `accuracy` (Float, opcional): Precisión GPS
- `takenAt` (DateTime, opcional): Fecha/hora de captura
- `fileName` (String): Nombre del archivo (255 chars)
- `fileSize` (Int, opcional): Tamaño en bytes
- `mimeType` (String, opcional): Tipo MIME (100 chars)
- `isSynced` (Boolean): Estado de sincronización offline
- `createdAt` (DateTime): Fecha de creación
- `updatedAt` (DateTime): Última actualización

**Relaciones:**
- `visit` (Visit): Visita relacionada (onDelete: Cascade)

**Índices:**
- `visitId`: Filtrado por visita
- `type`: Separación antes/después
- `takenAt`: Ordenamiento por fecha de captura
- `isSynced`: Para sincronización offline
- `createdAt`: Ordenamiento por creación

### 5. **RefreshToken (Token de Refresh)**
**Propósito:** Gestionar tokens de refresh para autenticación JWT.

**Campos:**
- `id` (String): Identificador único (CUID)
- `token` (String, único): Token de refresh (500 chars)
- `userId` (String): ID del usuario
- `deviceInfo` (String, opcional): Información del dispositivo (255 chars)
- `expiresAt` (DateTime): Fecha de expiración
- `revokedAt` (DateTime, opcional): Fecha de revocación
- `createdAt` (DateTime): Fecha de creación

**Relaciones:**
- `user` (User): Usuario relacionado (onDelete: Cascade)

**Índices:**
- `userId`: Búsqueda por usuario
- `token`: Búsqueda por token
- `expiresAt`: Para limpieza de tokens expirados

## 🗺️ Enumeraciones (Enums)

### **Role (Rol)**
```prisma
SUPER_ADMIN   // Acceso total al sistema
ADMIN         // Administración completa
MANAGER       // Gestión de promotores y reportes
PROMOTER      // Promotor de ventas (usuario principal)
VIEWER        // Solo lectura (para supervisores)
```

### **BusinessType (Tipo de Negocio)**
```prisma
RETAIL        // Minorista (tiendas)
WHOLESALE     // Mayorista (distribuidores)
SERVICE       // Servicios
MANUFACTURING // Manufactura
FOOD          // Alimentos y bebidas
OTHER         // Otro tipo
```

### **VisitStatus (Estado de Visita)**
```prisma
SCHEDULED     // Programada
IN_PROGRESS   // En progreso (capturando datos)
COMPLETED     // Completada exitosamente
CANCELLED     // Cancelada por el promotor
NO_SHOW       // Cliente no se presentó
```

### **VisitPurpose (Propósito de Visita)**
```prisma
SALES         // Venta de productos
FOLLOW_UP     // Seguimiento de venta anterior
DELIVERY      // Entrega de productos
TRAINING      // Capacitación al cliente
COMPLAINT     // Manejo de quejas/reclamos
OTHER         // Otro propósito
```

### **PhotoType (Tipo de Foto)**
```prisma
BEFORE        // Foto ANTES (evidencia inicial)
AFTER         // Foto DESPUÉS (evidencia final)
OTHER         // Otra foto relacionada
```

## 🔗 Relaciones Clave

### **1. Usuario ↔ Cliente (Many-to-One)**
```
User (1) ── (Many) Client
```
- Un promotor puede tener muchos clientes asignados
- Un cliente puede estar asignado a un solo promotor (opcional)

### **2. Usuario ↔ Visita (One-to-Many)**
```
User (1) ── (Many) Visit
```
- Un promotor realiza muchas visitas
- Cada visita pertenece a un solo promotor

### **3. Cliente ↔ Visita (One-to-Many)**
```
Client (1) ── (Many) Visit
```
- Un cliente recibe muchas visitas
- Cada visita es a un solo cliente

### **4. Visita ↔ Foto (One-to-Many)**
```
Visit (1) ── (Many) Photo
```
- Una visita puede tener muchas fotos
- Cada foto pertenece a una sola visita
- **Relación separada:** `beforePhotos` y `afterPhotos`

### **5. Usuario ↔ RefreshToken (One-to-Many)**
```
User (1) ── (Many) RefreshToken
```
- Un usuario puede tener muchos tokens de refresh
- Cada token pertenece a un solo usuario

## 📊 Índices y Optimizaciones

### **Índices Compuestos Recomendados:**
```sql
-- Para búsquedas frecuentes de visitas por promotor y fecha
CREATE INDEX idx_visit_promoter_date ON "Visit"("promoterId", "date" DESC);

-- Para búsquedas de clientes por ubicación geográfica
CREATE INDEX idx_client_location ON "Client" USING GIST("location");

-- Para búsquedas de visitas por ubicación
CREATE INDEX idx_visit_location ON "Visit" USING GIST("location");
```

### **Full-Text Search:**
- Clientes: `name`, `businessName`, `address`
- Visitas: `notes` (podría agregarse si es necesario)

## 🗺️ Geolocalización con PostGIS

### **Configuración Requerida:**
```sql
-- Habilitar extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ejemplo de consultas espaciales:

-- 1. Buscar clientes dentro de un radio (10km)
SELECT * FROM "Client" 
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(-99.1332, 19.4326)::geography,
  10000  -- 10km en metros
);

-- 2. Calcular distancia entre visitas
SELECT 
  v1.id as visita1,
  v2.id as visita2,
  ST_Distance(
    v1.location::geography,
    v2.location::geography
  ) as distancia_metros
FROM "Visit" v1, "Visit" v2
WHERE v1.id != v2.id;

-- 3. Agrupar visitas por área geográfica
SELECT 
  ST_ClusterDBSCAN(location, 1000, 1) OVER() as cluster_id,
  COUNT(*) as visitas_en_area
FROM "Visit"
GROUP BY cluster_id;
```

### **Tipos de Datos Espaciales:**
- `location` (Geometry Point, SRID 4326): Coordenadas WGS84 (lat/lon)
- **SRID 4326**: Sistema de coordenadas estándar para GPS

## 🔄 Sincronización Offline

### **Campos de Sincronización:**
- `Visit.isSynced`: Indica si la visita está sincronizada con el servidor
- `Photo.isSynced`: Indica si la foto está sincronizada

### **Flujo de Sincronización:**
1. Promotor trabaja offline en campo
2. Datos se almacenan localmente con `isSynced = false`
3. Al recuperar conexión, se sincronizan datos pendientes
4. Servidor actualiza `isSynced = true` después de procesar

## 🛡️ Consideraciones de Seguridad

### **Protección de Datos:**
1. **Contraseñas:** Siempre almacenar hasheadas con bcrypt
2. **Fotos:** Almacenar en storage seguro (S3, Cloud Storage)
3. **Geolocalización:** Considerar privacidad, anonimizar si es necesario
4. **Tokens:** JWT con expiración corta + refresh tokens

### **Validaciones:**
1. **Email:** Formato válido y único
2. **Teléfono:** Formato internacional si aplica
3. **Coordenadas:** Rango válido (-90 a 90 lat, -180 a 180 lon)
4. **Rating:** 1-5 inclusive

## 🚀 Migraciones y Despliegue

### **Migración Inicial:**
```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init

# Aplicar migración a producción
npx prisma migrate deploy
```

### **Habilitar PostGIS:**
```sql
-- Ejecutar en PostgreSQL antes de migraciones
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Backup y Restauración:**
```bash
# Backup de schema
npx prisma db pull

# Backup de datos
pg_dump -U usuario -d base_datos > backup.sql

# Restaurar
psql -U usuario -d base_datos < backup.sql
```

## 📈 Escalabilidad

### **Particionamiento Recomendado:**
```sql
-- Particionar visitas por fecha (para grandes volúmenes)
CREATE TABLE "Visit_2024" PARTITION OF "Visit"
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE "Visit_2025" PARTITION OF "Visit"
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### **Archivado de Datos:**
- Visitas mayores a 2 años: Mover a tabla de archivado
- Fotos: Implementar lifecycle policies en storage

## 🔍 Consultas Comunes

### **1. Reporte de Visitas por Promotor:**
```prisma
const visits = await prisma.visit.findMany({
  where: {
    promoterId: "promoter-123",
    date: {
      gte: startDate,
      lte: endDate
    }
  },
  include: {
    client: true,
    beforePhotos: true,
    afterPhotos: true
  },
  orderBy: {
    date: 'desc'
  }
});
```

### **2. Clientes Cercanos:**
```prisma
// Usando funciones espaciales de PostGIS
const nearbyClients = await prisma.$queryRaw`
  SELECT * FROM "Client"
  WHERE ST_DWithin(
    location::geography,
    ST_MakePoint(${longitude}, ${latitude})::geography,
    ${radiusInMeters}
  )
 