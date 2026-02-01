# Arquitectura de Sistema PWA para Promotores de Ventas

## 🏗️ 1. Arquitectura General

### **Visión General del Sistema**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend PWA (Next.js)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   UI/UX     │  │   Service   │  │   Workbox PWA    │   │
│  │ Components  │  │   Workers   │  │   (Offline)      │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS/API
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Node.js + Express)             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Routes    │  │ Controllers │  │   Middleware     │   │
│  │   /api/*    │  │   Logic     │  │   (Auth, Upload) │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                Base de Datos (PostgreSQL)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Users     │  │   Visits    │  │   Photos         │   │
│  │   Clients   │  │   Routes    │  │   Geolocation    │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Componentes Principales**

#### **Frontend PWA (Next.js)**
- **Framework:** Next.js 14+ con App Router
- **UI Library:** React + Tailwind CSS
- **Estado:** Zustand/Redux Toolkit
- **PWA Features:** Service Workers, Web App Manifest
- **API Client:** Axios/React Query
- **Geolocation:** Browser Geolocation API
- **Cámara:** MediaDevices API + react-webcam

#### **Backend API (Node.js + Express)**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **ORM:** Prisma con PostgreSQL
- **Autenticación:** JWT + Refresh Tokens
- **Uploads:** Multer para imágenes
- **Validación:** Joi/Zod
- **Seguridad:** Helmet, CORS, Rate Limiting

#### **Infraestructura (VPS + Coolify)**
- **Servidor:** VPS (2GB RAM, 2 vCPU mínimo)
- **Orquestación:** Coolify para despliegue
- **Base de datos:** PostgreSQL en contenedor
- **Storage:** Volúmenes Docker para uploads
- **DNS/SSL:** Cloudflare + Let's Encrypt
- **Backup:** Scripts automáticos diarios

## 📊 2. Flujo de Datos

### **Flujo de Registro de Visita con Imágenes**
```
1. Promotor abre app PWA (offline/online)
   ↓
2. Selecciona cliente o crea nuevo (sync offline)
   ↓
3. Toma fotos ANTES con cámara del dispositivo
   ↓
4. Captura coordenadas GPS automáticamente
   ↓
5. Escribe notas y calificación
   ↓
6. Toma fotos DESPUÉS (opcional)
   ↓
7. App valida datos localmente
   ↓
8. Si online → envía a backend inmediatamente
   ↓
9. Si offline → almacena en IndexedDB
   ↓
10. Service Worker sincroniza cuando hay conexión
```

### **Flujo de Sincronización Offline**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dispositivo   │     │   Service       │     │   Backend       │
│   del Promotor  │     │   Worker        │     │   API           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │ 1. Visita offline     │                       │
        │──────────────────────▶│                       │
        │                       │                       │
        │ 2. Almacena en        │                       │
        │    IndexedDB          │                       │
        │◀──────────────────────│                       │
        │                       │                       │
        │ 3. Conexión           │                       │
        │    restaurada         │                       │
        │──────────────────────▶│                       │
        │                       │                       │
        │                       │ 4. Sincroniza         │
        │                       │──────────────────────▶│
        │                       │                       │
        │                       │ 5. Respuesta éxito    │
        │                       │◀──────────────────────│
        │                       │                       │
        │ 6. Limpia cache       │                       │
        │◀──────────────────────│                       │
```

### **Flujo de Autenticación**
```
1. Login con email/contraseña
   ↓
2. Backend valida credenciales
   ↓
3. Genera JWT (24h) + Refresh Token (7d)
   ↓
4. Frontend almacena tokens en Secure Storage
   ↓
5. Cada request incluye Authorization header
   ↓
6. Middleware valida token en cada endpoint
   ↓
7. Si token expira → usar refresh token
   ↓
8. Si refresh expira → logout forzado
```

## 🎯 3. Responsabilidades Frontend vs Backend

### **Frontend PWA (Next.js) - Responsabilidades**
```
✅ Interfaz de usuario responsive
✅ Gestión de estado de la aplicación
✅ Navegación entre vistas
✅ Captura de imágenes con cámara
✅ Geolocalización en tiempo real
✅ Almacenamiento offline (IndexedDB)
✅ Sincronización con Service Workers
✅ Validación de formularios en cliente
✅ Gestión de tokens JWT
✅ Notificaciones push
✅ Optimización de imágenes (compresión)
✅ Cache de recursos estáticos
✅ Detección de conexión de red
✅ Manejo de errores de usuario
```

### **Backend API (Express) - Responsabilidades**
```
✅ Autenticación y autorización
✅ Validación de datos del servidor
✅ Lógica de negocio centralizada
✅ Gestión de base de datos (CRUD)
✅ Upload y almacenamiento de archivos
✅ Generación de reportes y estadísticas
✅ Envío de notificaciones push
✅ Rate limiting y seguridad
✅ Logging y monitoreo
✅ Backup de datos
✅ API documentation (Swagger/OpenAPI)
✅ Webhooks para integraciones
✅ Queue management para tareas pesadas
✅ Cache de consultas frecuentes
```

### **Base de Datos (PostgreSQL) - Esquema Principal**
```sql
-- Usuarios del sistema
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'PROMOTER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clientes de los promotores
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  promoter_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Visitas registradas
CREATE TABLE visits (
  id UUID PRIMARY KEY,
  promoter_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT NOT NULL,
  purpose VARCHAR(50) DEFAULT 'SALES',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(50) DEFAULT 'COMPLETED',
  date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fotos de las visitas
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  visit_id UUID REFERENCES visits(id),
  url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  type VARCHAR(50) CHECK (type IN ('BEFORE', 'AFTER')),
  caption TEXT,
  taken_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📱 4. Buenas Prácticas para PWA con Cámara y GPS

### **Buenas Prácticas de PWA**

#### **1. Performance y Carga Rápida**
- **Lazy loading** de componentes y rutas
- **Image optimization** con next/image
- **Code splitting** automático
- **Precaching** de recursos críticos
- **Compression** gzip/brotli

#### **2. Experiencia Offline**
- **Service Worker** con estrategias cache-first para assets
- **IndexedDB** para datos de formularios
- **Background Sync** para operaciones pendientes
- **Fallback UI** cuando no hay conexión
- **Retry logic** con exponential backoff

#### **3. Instalación y Discoverability**
- **Web App Manifest** configurado correctamente
- **Add to Home Screen** prompts
- **Splash screen** personalizado
- **Theme color** matching brand
- **Shortcuts** para acciones frecuentes

### **Buenas Prácticas con Cámara**

#### **1. Permisos y UX**
```javascript
// Mejor práctica: Solicitar permisos progresivamente
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Cámara trasera
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    return { success: true, stream };
  } catch (error) {
    // Manejo educativo de errores
    if (error.name === 'NotAllowedError') {
      showPermissionGuide();
    }
    return { success: false, error };
  }
}
```

#### **2. Optimización de Imágenes**
- **Compresión en cliente** antes de upload
- **Resize automático** según necesidad
- **Formato WebP** para mejor compresión
- **EXIF data stripping** por privacidad
- **Preview en tiempo real**

#### **3. Manejo de Storage**
- **Cache local** de fotos recientes
- **Cleanup automático** de fotos viejas
- **Upload progresivo** con retry
- **Validación de tipo/size** antes de enviar
- **Metadata extraction** (timestamp, GPS)

### **Buenas Prácticas con GPS**

#### **1. Precisión y Consumo de Batería**
```javascript
// Configuración balanceada para aplicaciones móviles
const gpsOptions = {
  enableHighAccuracy: true,    // Mayor precisión
  timeout: 10000,              // 10 segundos máximo
  maximumAge: 30000            // Cache de 30 segundos
};

// Monitoreo continuo para tracking
let watchId = null;
function startLocationTracking() {
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      // Validar precisión aceptable (> 50m)
      if (accuracy < 50) {
        saveLocation(latitude, longitude, accuracy);
      }
    },
    (error) => handleGeoError(error),
    gpsOptions
  );
}

// Detener cuando no se necesita
function stopLocationTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
}
```

#### **2. Validación de Ubicación**
- **Verificar precisión** (rechazar > 100m)
- **Comparar con ubicaciones anteriores**
- **Detección de spoofing** (cambios bruscos)
- **Fallback a IP geolocation** si GPS falla
- **Cache inteligente** de ubicaciones frecuentes

#### **3. Privacidad y Compliance**
- **Explicar claramente** por qué se necesita GPS
- **Permitir uso aproximado** como opción
- **No almacenar** ubicación cuando app está en background
- **GDPR compliance** con consentimiento explícito
- **Data minimization** (solo lo necesario)

### **Patrones de Diseño para Aplicaciones de Campo**

#### **1. Offline-First Architecture**
```
┌─────────────────────────────────────────┐
│         Componente de Formulario        │
├─────────────────────────────────────────┤
│  • Validación local inmediata           │
│  • Auto-guardado en IndexedDB           │
│  • Indicador de estado (online/offline) │
│  • Botón de sincronización manual       │
└─────────────────────────────────────────┘
```

#### **2. Background Sync Pattern**
```javascript
// Service Worker - Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-visits') {
    event.waitUntil(syncPendingVisits());
  }
});

// Función de sincronización
async function syncPendingVisits() {
  const pendingVisits = await getPendingVisitsFromIndexedDB();
  
  for (const visit of pendingVisits) {
    try {
      await api.post('/visits', visit);
      await markVisitAsSynced(visit.id);
    } catch (error) {
      // Reintentar en próximo sync event
      console.error('Sync failed:', error);
    }
  }
}
```

#### **3. Progressive Enhancement**
```javascript
// Detectar capacidades del dispositivo
const deviceCapabilities = {
  hasCamera: 'mediaDevices' in navigator,
  hasGPS: 'geolocation' in navigator,
  hasOfflineStorage: 'indexedDB' in window,
  isPWA: window.matchMedia('(display-mode: standalone)').matches
};

// Adaptar UI según capacidades
if (!deviceCapabilities.hasCamera) {
  showImageUploadAlternative();
}

if (!deviceCapabilities.hasGPS) {
  showManualLocationInput();
}
```

### **Consideraciones de Seguridad**

#### **1. Frontend Security**
- **Content Security Policy** (CSP) headers
- **Subresource Integrity** (SRI) para CDN
- **XSS prevention** con sanitización
- **Secure token storage** (no localStorage)
- **Certificate pinning** para producción

#### **2. Backend Security**
- **Input validation** en todos los endpoints
- **SQL injection prevention** (Prisma ayuda)
- **File upload validation** (type, size, content)
- **Rate limiting** por IP/usuario
- **Security headers** (HSTS, X-Frame-Options)

#### **3. Data Protection**
- **Encryption at rest** para datos sensibles
- **Encryption in transit** (HTTPS siempre)
- **GDPR compliance** para datos personales
- **Data retention policies** automáticas
- **Backup encryption** para copias de seguridad

### **Estrategias de Despliegue (Coolify + VPS)**

#### **1. Configuración de Coolify**
```yaml
# coolify.yml
version: 1
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=gestion_visitas
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
```

#### **2. Monitoreo y Alertas**
- **Health checks** automáticos
- **Log aggregation** con ELK stack
- **Performance monitoring** (New Relic/Datadog)
- **Error tracking** (Sentry)
- **Uptime monitoring** (UptimeRobot)

#### **3. Backup y Recovery**
- **Backup diario** automático de base de datos
- **Versioned backups** con ret