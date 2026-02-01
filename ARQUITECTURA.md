# Arquitectura de Sistema - PWA para Gestión de Visitas de Promotores

## 1. Arquitectura General

### 1.1 Visión de Alto Nivel
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (PWA - Next.js)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │   UI/UX     │  │   Estado    │  │  Service Worker  │    │
│  │  Componentes│  │  (Redux)    │  │  (Offline Sync)  │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS/API
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Node.js + Express)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ Controladores│  │   Servicios │  │   Middleware     │    │
│  │   (Rutas)    │  │  (Lógica)   │  │ (Auth, Validación)│    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                 BASE DE DATOS (PostgreSQL)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │   Usuarios  │  │   Visitas   │  │   Geolocalización│    │
│  │   Promotores│  │   Clientes  │  │   Multimedia     │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Stack Tecnológico
- **Frontend**: Next.js 14+ (App Router) con TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT + Refresh Tokens
- **Cache/Estado**: Redux Toolkit + RTK Query
- **PWA**: Service Workers, Web App Manifest, Cache API
- **Geolocalización**: Geolocation API + Background Sync
- **Multimedia**: MediaDevices API + Image Compression
- **Infraestructura**: VPS con Coolify (Docker + Nginx)

### 1.3 Estructura de Proyecto
```
gestion-visitas-promotores/
├── apps/
│   ├── frontend/          # Next.js PWA
│   │   ├── app/           # App Router
│   │   ├── components/    # Componentes reutilizables
│   │   ├── lib/           # Utilidades, hooks
│   │   ├── store/         # Redux store
│   │   └── public/        # Manifest, icons, assets
│   │
│   └── backend/           # Express API
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   ├── models/     # Prisma schema
│       │   ├── routes/
│       │   └── utils/
│       └── prisma/
│
├── packages/              # Shared code (opcional)
├── docker-compose.yml
├── .env.example
└── README.md
```

## 2. Flujo de Datos

### 2.1 Flujo Principal - Registro de Visita
```
1. Promotor inicia sesión (JWT almacenado en Secure Storage)
2. App solicita permisos: GPS + Cámara
3. Promotor selecciona cliente o crea nuevo
4. Sistema captura:
   - Ubicación automática (GPS)
   - Fecha/hora automática
   - Fotos (opcional)
   - Notas/observaciones
5. Datos se almacenan localmente (IndexedDB/Redux Persist)
6. Service Worker intenta sincronización:
   - Online: Envía inmediatamente a API
   - Offline: Queue en Background Sync
7. API valida, procesa y almacena en PostgreSQL
8. Respuesta confirma éxito/error
9. Estado local se actualiza
```

### 2.2 Sincronización Offline
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Acción Usuario│────▶│   Redux Store   │────▶│   IndexedDB     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                 │                        │
                                 ▼                        ▼
                         ┌─────────────────┐     ┌─────────────────┐
                         │ Service Worker  │────▶│   Sync Queue    │
                         └─────────────────┘     └─────────────────┘
                                 │
                                 ▼ (cuando hay conexión)
                         ┌─────────────────┐
                         │   API Backend   │
                         └─────────────────┘
```

### 2.3 Modelo de Datos (Esquema Prisma)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          Role      @default(PROMOTER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  visits        Visit[]
}

model Client {
  id            String    @id @default(cuid())
  name          String
  phone         String?
  email         String?
  address       String?
  businessType  String?
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  visits        Visit[]
}

model Visit {
  id            String    @id @default(cuid())
  promoterId    String
  clientId      String
  date          DateTime  @default(now())
  latitude      Float?
  longitude     Float?
  address       String?
  notes         String
  status        VisitStatus @default(COMPLETED)
  photos        String[]  // URLs o paths
  signature     String?   // Base64 de firma
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  promoter      User      @relation(fields: [promoterId], references: [id])
  client        Client    @relation(fields: [clientId], references: [id])
}

enum Role {
  ADMIN
  MANAGER
  PROMOTER
}

enum VisitStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## 3. Responsabilidades Frontend vs Backend

### 3.1 Frontend (Next.js PWA)
**Responsabilidades:**
- Interfaz de usuario responsive y accesible
- Gestión de estado local (Redux)
- Cache y sincronización offline
- Captura de multimedia (cámara, GPS)
- Validación de formularios en cliente
- Autenticación persistente (JWT storage)
- Service Worker para funcionalidad offline
- Web App Manifest para instalación
- Push notifications (si aplica)

**Tecnologías clave:**
- Next.js 14 (App Router, Server Components opcionales)
- TypeScript para type safety
- Redux Toolkit + RTK Query
- React Hook Form + Zod
- Tailwind CSS o similar
- PWA plugins (next-pwa)
- Geolocation API
- MediaDevices API

### 3.2 Backend (Node.js + Express)
**Responsabilidades:**
- API RESTful/GraphQL
- Autenticación y autorización
- Validación de datos de entrada
- Lógica de negocio
- Integración con base de datos
- Manejo de archivos (imágenes)
- Logging y monitoreo
- Rate limiting y seguridad
- WebSockets para real-time (opcional)

**Tecnologías clave:**
- Express.js con TypeScript
- Prisma ORM para PostgreSQL
- JWT para autenticación
- Bcrypt para hashing
- Multer para upload de archivos
- Zod para validación
- Winston para logging
- Helmet para seguridad

## 4. Buenas Prácticas para PWA con Cámara y GPS

### 4.1 Permisos y UX
1. **Solicitud progresiva de permisos:**
   - GPS: Solo cuando se inicia registro de visita
   - Cámara: Solo cuando usuario presiona "Tomar foto"
   - Explicar claramente el propósito

2. **Manejo de denegación:**
   - Permitir continuar sin GPS (ingreso manual)
   - Permitir continuar sin cámara (sin fotos)
   - Mostrar instrucciones para habilitar después

### 4.2 Geolocalización
```typescript
// Estrategia recomendada:
interface LocationStrategy {
  // 1. Intentar GPS de alta precisión
  tryHighAccuracy(): Promise<Position>
  
  // 2. Fallback a IP geolocation
  fallbackToIP(): Promise<ApproximateLocation>
  
  // 3. Permitir ingreso manual
  allowManualEntry(): UserEnteredLocation
  
  // 4. Cache de última ubicación conocida
  cacheLastKnownLocation(): void
}

// Consideraciones:
// - Timeout razonable (10-30 segundos)
// - Batería: usar watchPosition solo cuando necesario
// - Precisión: balance entre accuracy y consumo
```

### 4.3 Captura de Imágenes
```typescript
// Mejores prácticas:
interface CameraBestPractices {
  // 1. Compresión en cliente
  compressImage(file: File, maxSizeKB: number): Promise<Blob>
  
  // 2. Metadatos EXIF
  stripExifData(image: Blob): Promise<Blob> // Privacidad
  
  // 3. Formatos optimizados
  preferWebP: boolean // Mejor compresión
  
  // 4. Preview en tiempo real
  showPreviewBeforeUpload: boolean
  
  // 5. Límites razonables
  maxPhotosPerVisit: 5
  maxFileSize: 2 * 1024 * 1024 // 2MB
}
```

### 4.4 Offline First
1. **Service Worker Strategy:**
   ```javascript
   // Cache estratégico:
   // - App Shell: Cache-first
   // - Datos dinámicos: Network-first, fallback cache
   // - Imágenes: Cache-first con expiration
   
   // Background Sync:
   // - Registrar sync events para datos pendientes
   // - Reintentar con exponential backoff
   ```

2. **Almacenamiento Local:**
   - IndexedDB para datos estructurados
   - localStorage para configuraciones pequeñas
   - Redux Persist para estado de UI

### 4.5 Seguridad y Privacidad
1. **Datos sensibles:**
   - GPS: Anonimizar o agregar en reports
   - Fotos: No almacenar metadata EXIF
   - Comunicación: HTTPS obligatorio

2. **Protección de datos:**
   - Cifrado en tránsito (TLS 1.3)
   - Cifrado en reposo (database)
   - Sanitización de inputs
   - Rate limiting en API

### 4.6 Performance
1. **Optimizaciones PWA:**
   - Lazy loading de componentes
   - Code splitting por rutas
   - Precache de assets críticos
   - Compression de imágenes

2. **Métricas Core Web Vitals:**
   - LCP: < 2.5s
   - FID: < 100ms
   - CLS: < 0.1

## 5. Consideraciones de Infraestructura (Coolify/VPS)

### 5.1 Dockerización
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Frontend Dockerfile (separado o multi-stage)
```

### 5.2 Configuración Coolify
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gestion_visitas
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  backend:
    build: ./apps/backend
    ports:
      - "3001:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
  
  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 5.3 Variables de Entorno
```bash
# .env.example
# Database
DATABASE_URL="postgresql://user:password@postgres:5432/gestion_visitas"
DB_USER="app_user"
DB_PASSWORD="secure_password"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# API
API_URL="http://backend:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Storage (si usas S3 o similar)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME=""
```

## 6. Roadmap de Implementación

### Fase 1: Setup y Core
- [ ] Configurar monorepo (Turborepo opcional)
- [ ] Inicializar Next.js con TypeScript
- [ ] Configurar Express backend
- [ ] Dockerizar servicios
- [ ] Configurar PostgreSQL + Prisma
- [ ] Implementar autenticación JWT

### Fase 2: Funcionalidad Base
- [ ] CRUD de promotores/clientes
- [ ] Formulario de visita básico
- [ ] Integración GPS
- [ ] Captura de fotos
- [ ] Estado offline básico

### Fase 3: PWA Avanzado
- [ ] Service Worker completo
- [ ] Background Sync
- [ ] Push notifications
- [ ] Install prompt
- [ ] Performance optimizations

### Fase 4: Features Avanzados
- [ ] Reportes y dashboards
- [ ] Sincronización en tiempo real
- [ ] Firmas digitales
- [ ] Integración con mapas
- [ ] Analytics

## 7. Conclusión

Esta arquitectura proporciona:
- **Escalabilidad**: Separación clara frontend/backend
- **Resiliencia**: Offline-first con sync robusto
- **Performance**: PWA optimizado para móviles
- **Mantenibilidad**: TypeScript + buenas prácticas
- **Seguridad**: JWT, HTTPS, validaciones múltiples

La combinación Next.js + Express + PostgreSQL en VPS con Coolify ofrece un balance ideal entre productividad, performance y control de infraestructura.

**Próximos pasos recomendados:**
1. Validar requisitos específicos de negocio
2. Ajustar modelo de datos según necesidades
3. Definir MVP para iteración rápida
4. Establecer métricas de éxito
5. Planificar testing (unit, integration, e2e)